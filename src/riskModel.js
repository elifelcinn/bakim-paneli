// Arıza risk kuralları
// Bu kurallar, AI4I 2020 veri seti üzerinde yaptığım makine öğrenmesi analizinde
// arızaları ayıran fiziksel koşullardan alındı (güç aralığı, sıcaklık farkı,
// aşınma x tork eşiği, takım aşınma süresi).

const ASIRI_YUK_ESIGI = { L: 11000, M: 12000, H: 13000 } // dk·Nm

export function hesapla(okuma) {
  const hava = Number(okuma.hava)
  const islem = Number(okuma.islem)
  const devir = Number(okuma.devir)
  const tork = Number(okuma.tork)
  const asinma = Number(okuma.asinma)
  const esik = ASIRI_YUK_ESIGI[okuma.tip] ?? 11000

  const guc = (tork * devir * 2 * Math.PI) / 60 // W
  const sicaklikFarki = islem - hava // K
  const asinmaTork = asinma * tork // dk·Nm

  const riskler = []
  const uyarilar = []

  if (guc < 3500 || guc > 9000) {
    riskler.push(`Güç arızası: güç ${Math.round(guc)} W, güvenli aralık 3.500–9.000 W`)
  } else if (guc < 3800 || guc > 8600) {
    uyarilar.push(`Güç güvenli aralığın sınırına yakın (${Math.round(guc)} W)`)
  }

  if (sicaklikFarki < 8.6 && devir < 1380) {
    riskler.push(`Isı dağılımı arızası: sıcaklık farkı ${sicaklikFarki.toFixed(1)} K ve devir ${devir} rpm çok düşük`)
  } else if (sicaklikFarki < 9 && devir < 1450) {
    uyarilar.push(`Isı dağılımı sınıra yakın (fark ${sicaklikFarki.toFixed(1)} K, devir ${devir} rpm)`)
  }

  if (asinmaTork > esik) {
    riskler.push(`Aşırı yük arızası: aşınma × tork ${Math.round(asinmaTork)}, ${okuma.tip} tipi için sınır ${esik}`)
  } else if (asinmaTork > esik * 0.9) {
    uyarilar.push(`Aşırı yük sınırına yakın (aşınma × tork ${Math.round(asinmaTork)} / ${esik})`)
  }

  if (asinma >= 200) {
    uyarilar.push(`Takım ${asinma} dakikadır kullanılıyor: değişim önerilir (200–240 dk arası arıza riski)`)
  }

  let seviye = 'normal'
  if (riskler.length > 0) seviye = 'yuksek'
  else if (uyarilar.length > 0) seviye = 'uyari'

  return { guc, sicaklikFarki, asinmaTork, riskler, uyarilar, seviye }
}

export const SEVIYE_ETIKETI = {
  yuksek: 'Yüksek risk',
  uyari: 'Dikkat',
  normal: 'Normal',
}

export const ORNEK_VERI = [
  { makine: 'CNC-01', tip: 'M', hava: 298.5, islem: 308.9, devir: 1500, tork: 40, asinma: 30 },
  { makine: 'CNC-02', tip: 'L', hava: 300.0, islem: 310.5, devir: 1300, tork: 65, asinma: 200 },
  { makine: 'CNC-03', tip: 'H', hava: 302.5, islem: 310.8, devir: 1350, tork: 50, asinma: 100 },
  { makine: 'Freze-A', tip: 'L', hava: 299.1, islem: 309.6, devir: 2750, tork: 9.5, asinma: 12 },
  { makine: 'Freze-B', tip: 'M', hava: 297.8, islem: 308.4, devir: 1420, tork: 46, asinma: 215 },
  { makine: 'Torna-1', tip: 'L', hava: 301.2, islem: 310.4, devir: 1560, tork: 36.5, asinma: 140 },
]
