import { useEffect, useMemo, useState } from 'react'
import { hesapla, SEVIYE_ETIKETI, ORNEK_VERI } from './riskModel'

const DEPO_ANAHTARI = 'bakim-paneli-kayitlar'

const BOS_FORM = { makine: '', tip: 'L', hava: '300', islem: '310', devir: '1500', tork: '40', asinma: '100' }

function kayitlariYukle() {
  try {
    const veri = localStorage.getItem(DEPO_ANAHTARI)
    return veri ? JSON.parse(veri) : []
  } catch {
    return []
  }
}

function App() {
  const [kayitlar, setKayitlar] = useState(kayitlariYukle)
  const [form, setForm] = useState(BOS_FORM)
  const [filtre, setFiltre] = useState('hepsi')
  const [hata, setHata] = useState('')

  // Her değişiklikte kayıtları tarayıcıya kaydet
  useEffect(() => {
    try {
      localStorage.setItem(DEPO_ANAHTARI, JSON.stringify(kayitlar))
    } catch {
      // depolama kapalıysa uygulama yine çalışır, sadece kayıt tutulmaz
    }
  }, [kayitlar])

  const onizleme = useMemo(() => hesapla(form), [form])

  const ozet = useMemo(() => {
    const sonuc = { toplam: kayitlar.length, yuksek: 0, uyari: 0, normal: 0 }
    kayitlar.forEach((k) => { sonuc[hesapla(k).seviye] += 1 })
    return sonuc
  }, [kayitlar])

  const gorunenler = kayitlar
    .map((k) => ({ ...k, sonuc: hesapla(k) }))
    .filter((k) => filtre === 'hepsi' || k.sonuc.seviye === filtre)

  function alanDegisti(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function kaydet(e) {
    e.preventDefault()
    const sayisal = ['hava', 'islem', 'devir', 'tork', 'asinma']
    if (!form.makine.trim()) return setHata('Makine adı boş olamaz.')
    if (sayisal.some((a) => form[a] === '' || Number.isNaN(Number(form[a])) || Number(form[a]) < 0)) {
      return setHata('Tüm ölçümler sıfır veya pozitif bir sayı olmalı.')
    }
    setHata('')
    const yeni = {
      id: Date.now(),
      tarih: new Date().toLocaleString('tr-TR'),
      makine: form.makine.trim(),
      tip: form.tip,
      ...Object.fromEntries(sayisal.map((a) => [a, Number(form[a])])),
    }
    setKayitlar([yeni, ...kayitlar])
    setForm({ ...BOS_FORM, tip: form.tip })
  }

  function sil(id) {
    setKayitlar(kayitlar.filter((k) => k.id !== id))
  }

  function ornekYukle() {
    const simdi = Date.now()
    const ornekler = ORNEK_VERI.map((o, i) => ({ ...o, id: simdi + i, tarih: new Date().toLocaleString('tr-TR') }))
    setKayitlar([...ornekler, ...kayitlar])
  }

  function hepsiniSil() {
    if (kayitlar.length && window.confirm('Tüm kayıtlar silinsin mi?')) setKayitlar([])
  }

  return (
    <div className="sayfa">
      <header className="ust">
        <div>
          <p className="ust-etiket">Kestirimci Bakım</p>
          <h1>Makine Bakım Takip Paneli</h1>
          <p className="ust-aciklama">
            Sensör ölçümlerini girin, panel arıza riskini anında hesaplasın. Kayıtlar tarayıcınızda saklanır.
          </p>
        </div>
      </header>

      <section className="ozet">
        <div className="kart"><span className="sayi">{ozet.toplam}</span><span>Toplam kayıt</span></div>
        <div className="kart yuksek"><span className="sayi">{ozet.yuksek}</span><span>Yüksek risk</span></div>
        <div className="kart uyari"><span className="sayi">{ozet.uyari}</span><span>Dikkat</span></div>
        <div className="kart normal"><span className="sayi">{ozet.normal}</span><span>Normal</span></div>
      </section>

      <main className="izgara">
        <form className="panel" onSubmit={kaydet}>
          <h2>Yeni ölçüm</h2>
          <label>Makine adı
            <input name="makine" value={form.makine} onChange={alanDegisti} placeholder="ör. CNC-04" />
          </label>
          <label>Ürün tipi
            <select name="tip" value={form.tip} onChange={alanDegisti}>
              <option value="L">L (düşük kalite)</option>
              <option value="M">M (orta kalite)</option>
              <option value="H">H (yüksek kalite)</option>
            </select>
          </label>
          <div className="ikili">
            <label>Hava sıcaklığı (K)<input name="hava" type="number" step="0.1" value={form.hava} onChange={alanDegisti} /></label>
            <label>İşlem sıcaklığı (K)<input name="islem" type="number" step="0.1" value={form.islem} onChange={alanDegisti} /></label>
          </div>
          <div className="ikili">
            <label>Devir (rpm)<input name="devir" type="number" value={form.devir} onChange={alanDegisti} /></label>
            <label>Tork (Nm)<input name="tork" type="number" step="0.1" value={form.tork} onChange={alanDegisti} /></label>
          </div>
          <label>Takım aşınması (dakika)<input name="asinma" type="number" value={form.asinma} onChange={alanDegisti} /></label>

          <div className={`onizleme ${onizleme.seviye}`}>
            <strong>{SEVIYE_ETIKETI[onizleme.seviye]}</strong>
            <span>Güç {Math.round(onizleme.guc)} W · Sıcaklık farkı {onizleme.sicaklikFarki.toFixed(1)} K</span>
          </div>

          {hata && <p className="hata">{hata}</p>}
          <button type="submit" className="birincil">Kaydet</button>
        </form>

        <section className="panel">
          <div className="liste-ust">
            <h2>Kayıtlar</h2>
            <div className="filtreler">
              {['hepsi', 'yuksek', 'uyari', 'normal'].map((f) => (
                <button key={f} className={filtre === f ? 'secili' : ''} onClick={() => setFiltre(f)}>
                  {f === 'hepsi' ? 'Tümü' : SEVIYE_ETIKETI[f]}
                </button>
              ))}
            </div>
          </div>

          {kayitlar.length === 0 ? (
            <div className="bos">
              <p>Henüz kayıt yok. Soldan bir ölçüm ekleyin veya örnek verilerle deneyin.</p>
              <button className="ikincil" onClick={ornekYukle}>Örnek veri yükle</button>
            </div>
          ) : (
            <>
              <ul className="kayitlar">
                {gorunenler.map((k) => (
                  <li key={k.id} className={`kayit ${k.sonuc.seviye}`}>
                    <div className="kayit-ust">
                      <div>
                        <h3>{k.makine} <small>Tip {k.tip}</small></h3>
                        <p className="olcum">
                          {k.devir} rpm · {k.tork} Nm · {k.asinma} dk · ΔT {k.sonuc.sicaklikFarki.toFixed(1)} K · {Math.round(k.sonuc.guc)} W
                        </p>
                      </div>
                      <div className="sag">
                        <span className={`rozet ${k.sonuc.seviye}`}>{SEVIYE_ETIKETI[k.sonuc.seviye]}</span>
                        <button className="sil" onClick={() => sil(k.id)} aria-label={`${k.makine} kaydını sil`}>Sil</button>
                      </div>
                    </div>
                    {(k.sonuc.riskler.length > 0 || k.sonuc.uyarilar.length > 0) && (
                      <ul className="nedenler">
                        {k.sonuc.riskler.map((r) => <li key={r} className="neden-risk">{r}</li>)}
                        {k.sonuc.uyarilar.map((u) => <li key={u} className="neden-uyari">{u}</li>)}
                      </ul>
                    )}
                    <p className="tarih">{k.tarih}</p>
                  </li>
                ))}
              </ul>
              {gorunenler.length === 0 && <p className="bos">Bu filtrede kayıt yok.</p>}
              <div className="alt-butonlar">
                <button className="ikincil" onClick={ornekYukle}>Örnek veri ekle</button>
                <button className="ikincil tehlike" onClick={hepsiniSil}>Tümünü sil</button>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="alt">
        Risk kuralları AI4I 2020 Predictive Maintenance veri seti (UCI) üzerinde yapılan makine öğrenmesi analizinden alınmıştır.
        Eğitim amaçlı bir projedir.
      </footer>
    </div>
  )
}

export default App
