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
  // Integrando Q(t) = Q0·√(1 – t/T) de 0 a t:
  //   V(t) = (2/3)·Q0·T·[1 – (1 – t/T)^(3/2)]   (litros)
  // Para t = T (manobra concluída) reduz-se a V = (2/3)·Q0·T.
  calcularVolumeDecaimentoLinear(vazaoInicialLs, tempoManobraS, totalIncidenteS) {
    const q0 = Math.max(0, vazaoInicialLs);
    const tManobra = Math.max(0, tempoManobraS);
    const tDecorrido = Math.min(Math.max(0, totalIncidenteS), tManobra);
    if (q0 <= 0 || tManobra <= 0) return 0;
    const fracaoRestante = 1 - (tDecorrido / tManobra);
    return (2 / 3) * q0 * tManobra * (1 - Math.pow(fracaoRestante, 1.5));
  },

  // Volume total perdido em Seção Plena (litros), somando as duas fases:
  //   1) Regime permanente: rede ainda pressurizada, vazão constante Q0
  //      dura (T_total – T_manobra), pois a manobra ocorre no fim da ocorrência
  //   2) Manobra de fechamento: pressão decai linearmente até zero
  // Quando a ocorrência termina antes de a manobra completar, só existe a
  // fase 2, truncada — tratada pela integral parcial acima.
  calcularVolumeSecaoPlena(vazaoInicialLs, tempoManobraS, totalIncidenteS) {
    const q0 = Math.max(0, vazaoInicialLs);
    const tTotal = Math.max(0, totalIncidenteS);
    const tManobra = Math.max(0, tempoManobraS);
    if (q0 <= 0 || tTotal <= 0) return 0;
    if (tManobra <= 0) return q0 * tTotal;

    const tPermanente = Math.max(0, tTotal - tManobra);
    const volPermanente = q0 * tPermanente;
    const volManobra = this.calcularVolumeDecaimentoLinear(q0, tManobra, tTotal);
    return volPermanente + volManobra;
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
