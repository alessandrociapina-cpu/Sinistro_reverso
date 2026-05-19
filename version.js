window.SABESP_APP_INFO = Object.freeze({
  version: '5.5.0',
  displayVersion: 'v5.5',
  releaseNotes: [
    {
      version: '5.5.0',
      displayVersion: 'v5.5',
      summary: 'Secao Plena: Q0 agora calculado pela equacao de orificio (Cd=0,82) com pressao real da rede informada pelo usuario, substituindo tabela com valores incorretos. Formula completa: V = (2/3) x Cd x A x sqrt(2gH) x T_manobra.'
    },
    {
      version: '5.4.0',
      displayVersion: 'v5.4',
      summary: 'Secao Plena: calculo de agua perdida agora usa modelo de decaimento linear de pressao: V = (2/3) x Q0 x T_manobra, com campo Tempo ate fechamento da rede informado pelo usuario. Resultado fisicamente mais realista para tubos rompidos.'
    },
    {
      version: '5.3.0',
      displayVersion: 'v5.3',
      summary: 'Destaque visual de campos editaveis: fundo azul-claro e borda inferior nos inputs de tabela, BDI, nomes/cargos dos responsaveis e campos do rodape (contenteditable). Todos os destaques sao suprimidos na impressao.'
    },
    {
      version: '5.2.0',
      displayVersion: 'v5.2',
      summary: 'Versao unica do aplicativo, calculos puros separados, validacoes antes de salvar/imprimir, service worker mais robusto, metadados das bases e testes ampliados.'
    }
  ]
});
