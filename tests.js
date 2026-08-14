// Suíte de testes — ativada apenas com ?tests=true na URL
// Exemplo: file:///index.html?tests=true
(function () {
    if (!new URLSearchParams(window.location.search).has('tests')) return;

    let passou = 0, falhou = 0;
    window.__SABESP_TEST_RESULTS__ = { passou, falhou, done: false };

    function registrarResultado() {
        window.__SABESP_TEST_RESULTS__ = { passou, falhou, done: true };
    }

    function assert(condicao, mensagem) {
        if (condicao) {
            console.log('%c✅ ' + mensagem, 'color: green');
            passou++;
        } else {
            console.error('❌ FALHOU: ' + mensagem);
            falhou++;
        }
    }

    // parseValor
    assert(parseValor('142,94') === 142.94,     'parseValor: vírgula decimal BR');
    assert(parseValor('6.985,91') === 6985.91,  'parseValor: ponto de milhar + vírgula decimal');
    assert(parseValor('') === 0,                'parseValor: string vazia → 0');
    assert(parseValor(null) === 0,              'parseValor: null → 0');
    assert(parseValor('R$ 20,52') === 20.52,    'parseValor: prefixo R$ removido');

    // removerAcentos
    assert(removerAcentos('Válvula') === 'valvula', 'removerAcentos: acento e maiúscula');
    assert(removerAcentos('') === '',               'removerAcentos: string vazia');
    assert(removerAcentos(null) === '',             'removerAcentos: null → string vazia');
    assert(removerAcentos('ESGOTO') === 'esgoto',  'removerAcentos: só maiúscula');

    // versionamento — comparado contra a própria fonte para não desatualizar
    const infoVersao = window.SABESP_APP_INFO;
    assert(infoVersao?.version === infoVersao?.releaseNotes?.[0]?.version,
        'version.js: versão técnica igual à primeira nota de release');
    assert(document.querySelector('.version-badge')?.textContent.includes(infoVersao?.displayVersion),
        `interface: badge exibe ${infoVersao?.displayVersion}`);

    // formatarBR
    assert(formatarBR(0) === '0,00',          'formatarBR: zero → 0,00');
    assert(formatarBR(1234.5) === '1.234,50', 'formatarBR: ponto de milhar + duas casas');
    assert(formatarBR(2.684, 3) === '2,684',  'formatarBR: 3 casas para vazão');
    assert(parseValor('1.234,50') === 1234.5, 'parseValor: BR com milhar');
    assert(parseValor('1072.05') === 1072.05, 'parseValor: retrocompat formato US sem vírgula');

    // calcularVazaoOrificio
    // Furo circular Cd=0.61, diam=2cm → área=π*(0.01)²≈3.1416e-4 m², pressão=10mca
    // Q = 0.61 × 3.1416e-4 × √(2×9.81×10) × 1000 ≈ 2.684 L/s
    const areaCirc = Math.PI * Math.pow(0.01, 2);
    const q = calcularVazaoOrificio(0.61, areaCirc, 10);
    assert(Math.abs(q - 2.684) < 0.01,
        `calcularVazaoOrificio: Cd=0.61 d=2cm p=10mca ≈ 2.684 L/s (obtido ${q.toFixed(3)})`);
    assert(calcularVazaoOrificio(0, 1, 10) === 0,    'calcularVazaoOrificio: Cd=0 → 0');
    assert(calcularVazaoOrificio(0.61, 0, 10) === 0, 'calcularVazaoOrificio: área=0 → 0');
    assert(calcularVazaoOrificio(0.61, 1, 0) === 0,  'calcularVazaoOrificio: pressão=0 → 0');
    assert(calcularVazaoOrificio(0.61, 1, -5) === 0, 'calcularVazaoOrificio: pressão negativa → 0');

    const periodoValido = window.SabespCalculos.calcularTempoSegundos('2026-01-01', '08:00', '2026-01-01', '09:00');
    assert(periodoValido.valido && periodoValido.segundos === 3600, 'calcularTempoSegundos: uma hora → 3600s');
    const periodoNegativo = window.SabespCalculos.calcularTempoSegundos('2026-01-01', '09:00', '2026-01-01', '08:00');
    assert(!periodoNegativo.valido && periodoNegativo.segundos === 0, 'calcularTempoSegundos: periodo negativo bloqueado');

    // Seção Plena — vazão inicial pela equação de orifício (Cd = 0,82)
    // DN 50 mm @ 10 mca: A = π×(0,025)² = 1,9635e-3 m²
    // Q0 = 0,82 × 1,9635e-3 × √(2×9,81×10) × 1000 ≈ 22,552 L/s
    const q0Plena = window.SabespCalculos.calcularVazaoSecaoPlena(50, 10);
    assert(Math.abs(q0Plena - 22.552) < 0.01,
        `calcularVazaoSecaoPlena: DN50 @ 10mca ≈ 22,552 L/s (obtido ${q0Plena.toFixed(3)})`);

    // Tempo efetivo: o fechamento dos registros limita o período faturável
    assert(window.SabespCalculos.calcularTempoEfetivoVazamento(12180, 3600) === 3600,
        'calcularTempoEfetivoVazamento: fechamento antes do fim da ocorrência limita o tempo');
    assert(window.SabespCalculos.calcularTempoEfetivoVazamento(1800, 3600) === 1800,
        'calcularTempoEfetivoVazamento: ocorrência mais curta que o fechamento não é estendida');
    assert(window.SabespCalculos.calcularTempoEfetivoVazamento(12180, 0) === 12180,
        'calcularTempoEfetivoVazamento: sem tempo de fechamento usa a ocorrência inteira');

    // Decaimento de pressão: P0 → 0 ao longo do vazamento ⇒ vazão média = (2/3)·Q0
    const volDecaimento = window.SabespCalculos.calcularVolumeDecaimentoLinear(q0Plena, 3600);
    assert(Math.abs(volDecaimento / 3600 - (2 / 3) * q0Plena) < 1e-6,
        'calcularVolumeDecaimentoLinear: vazão média equivale a 2/3 da vazão inicial');
    assert(volDecaimento < q0Plena * 3600,
        'calcularVolumeDecaimentoLinear: decaimento resulta em volume menor que vazão constante');

    // Ocorrência de 12180 s com fechamento em 3600 s:
    //   V = (2/3) × 22,552 L/s × 3600 s = 54.126 L
    const volPlena = window.SabespCalculos.calcularVolumeSecaoPlena(q0Plena, 3600, 12180);
    assert(Math.abs(volPlena - 54126) < 20,
        `calcularVolumeSecaoPlena: vazamento limitado pelo fechamento ≈ 54.126 L (obtido ${volPlena.toFixed(0)})`);
    assert(volPlena === window.SabespCalculos.calcularVolumeSecaoPlena(q0Plena, 3600, 99999),
        'calcularVolumeSecaoPlena: prolongar a ocorrência não aumenta o volume após o fechamento');

    // Sem limitação: o vazamento dura toda a ocorrência
    const volSemLimite = window.SabespCalculos.calcularVolumeSecaoPlena(q0Plena, 3600, 1800);
    assert(Math.abs(volSemLimite - (2 / 3) * q0Plena * 1800) < 1,
        'calcularVolumeSecaoPlena: ocorrência menor que o fechamento usa a própria duração');

    assert(window.SabespCalculos.calcularVolumeSecaoPlena(q0Plena, 3600, 0) === 0,
        'calcularVolumeSecaoPlena: ocorrência de duração zero → 0');
    assert(window.SabespCalculos.calcularVolumeSecaoPlena(0, 3600, 12180) === 0,
        'calcularVolumeSecaoPlena: vazão zero → 0');

    registrarResultado();

    console.log(
        `%c── ${passou} passou  ${falhou} falhou ──`,
        falhou ? 'color: red; font-weight: bold' : 'color: green; font-weight: bold'
    );
})();
