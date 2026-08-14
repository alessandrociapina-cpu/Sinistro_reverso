window.SabespCalculos = Object.freeze({
  GRAVIDADE: 9.81,

  calcularVazaoOrificio(cd, areaM2, pressaoMca) {
    if (pressaoMca <= 0 || areaM2 <= 0 || cd <= 0) return 0;
    return (cd * areaM2 * Math.sqrt(2 * this.GRAVIDADE * pressaoMca)) * 1000;
  },

  // Seção Plena: Cd = 0,82 (ruptura limpa de tubo)
  calcularVazaoSecaoPlena(diamNominalMm, pressaoMca) {
    const rM = (diamNominalMm / 1000) / 2;
    const areaM2 = Math.PI * rM * rM;
    return this.calcularVazaoOrificio(0.82, areaM2, pressaoMca);
  },

  // Tempo efetivo de vazamento (segundos).
  // O vazamento cessa quando os registros sao fechados e a rede local e
  // isolada. Esse instante limita o periodo faturavel: mesmo que a ocorrencia
  // (abertura ate encerramento do servico) se estenda por mais tempo, so ha
  // perda de agua ate o fechamento.
  calcularTempoEfetivoVazamento(totalIncidenteS, tempoFechamentoS) {
    const tTotal = Math.max(0, totalIncidenteS);
    const tFechamento = Math.max(0, tempoFechamentoS);
    if (tFechamento <= 0) return tTotal;
    return Math.min(tTotal, tFechamento);
  },

  // Decaimento linear de pressao ao longo do vazamento.
  // Rompida a secao plena, a pressao no ponto nao se mantem em P0: cai
  // progressivamente ate o fechamento dos registros.
  //   P(t) = P0·(1 – t/T)         com T = tempo efetivo de vazamento
  //   Q(t) = Cd·A·√(2g·P(t)) = Q0·√(1 – t/T)
  //   V    = ∫0..T Q(t) dt = (2/3)·Q0·T        (litros)
  // A vazao media resulta 2/3 de Q0 — nao a vazao inicial de pico.
  calcularVolumeDecaimentoLinear(vazaoInicialLs, tempoVazamentoS) {
    const q0 = Math.max(0, vazaoInicialLs);
    const t = Math.max(0, tempoVazamentoS);
    if (q0 <= 0 || t <= 0) return 0;
    return (2 / 3) * q0 * t;
  },

  // Volume perdido em Secao Plena (litros): decaimento de pressao aplicado
  // sobre o tempo efetivo de vazamento (limitado pelo fechamento da rede).
  calcularVolumeSecaoPlena(vazaoInicialLs, tempoFechamentoS, totalIncidenteS) {
    const tEfetivo = this.calcularTempoEfetivoVazamento(totalIncidenteS, tempoFechamentoS);
    return this.calcularVolumeDecaimentoLinear(vazaoInicialLs, tEfetivo);
  },

  calcularTempoSegundos(dataInicio, horaInicio, dataFim, horaFim) {
    if (!dataInicio || !horaInicio || !dataFim || !horaFim) {
      return { segundos: 0, valido: false, motivo: 'periodo-incompleto' };
    }
    const inicio = new Date(`${dataInicio}T${horaInicio}`);
    const fim = new Date(`${dataFim}T${horaFim}`);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return { segundos: 0, valido: false, motivo: 'periodo-invalido' };
    }
    const diferencaSegundos = (fim - inicio) / 1000;
    if (diferencaSegundos < 0) {
      return { segundos: 0, valido: false, motivo: 'periodo-negativo' };
    }
    return { segundos: diferencaSegundos, valido: true, motivo: '' };
  },

  calcularPerdaAgua(vazaoLs, segundos, precoM3) {
    const volumeM3 = (Math.max(0, vazaoLs) * Math.max(0, segundos)) / 1000;
    const total = volumeM3 * Math.max(0, precoM3);
    return { volumeM3, total };
  }
});
