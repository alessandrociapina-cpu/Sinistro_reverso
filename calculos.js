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

  // Decaimento linear de pressão: P(t) = P0·(1 – t/T)
  // Integrando Q(t) = Q0·√(1 – t/T) de 0 a T: V = (2/3)·Q0·T (litros)
  calcularVolumeDecaimentoLinear(vazaoInicialLs, tempoManobraS, totalIncidenteS) {
    if (vazaoInicialLs <= 0 || tempoManobraS <= 0) return 0;
    const tEfetivo = Math.min(Math.max(0, totalIncidenteS), tempoManobraS);
    return (2 / 3) * vazaoInicialLs * tEfetivo;
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
