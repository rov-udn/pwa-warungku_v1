import { useState } from 'react';
import styles from './HistoryWarung.module.css';

function HistoryWarung({ historyBelanja = [], logPerubahanHarga = [], onKoreksiNota }) {
  const [tabAktif, setTabAktif] = useState('rekap'); // 'rekap' atau 'log'
  
  // State untuk melacak nota mana yang sedang dikoreksi
  const [notaSedangDiedit, setNotaSedangDiedit] = useState(null);
  const [itemsKoreksi, setItemsKoreksi] = useState([]);

  // Pemicu masuk ke halaman edit khusus (🎯 MENGIKAT ISI ECERAN MASTER AGAR BISA AUTO-DIVIDE)
  const handleBukaKoreksiHalaman = (nota) => {
    setNotaSedangDiedit(nota.id);
     
    const itemsPecahReferensi = nota.items.map((item, idx) => ({
      ...item,
      idUnik: item.idUnik || `item-${nota.id}-${idx}`, 
      modalBaru: item.modalBaru || 0, // Ini harga skala nota agen (Msl: 145000 per Slop)
      // Ambil back-up isiKeEceran bawaan barang agar pas dikoreksi, pembagian modal ecerannya tetep presisi
      isiKeEceran: item.isiKeEceran || 10 
    }));

    setItemsKoreksi(itemsPecahReferensi);
  };

  // Mengubah Qty di baris halaman koreksi
  const handleUbahQtyKoreksi = (idUnik, newQty) => {
    setItemsKoreksi((prev) =>
      prev.map((item) => {
        if (item.idUnik === idUnik) {
          return { ...item, qty: newQty === '' ? '' : Math.max(1, Number(newQty)) };
        }
        return item;
      })
    );
  };

  // Mengubah Harga Modal Agen di baris halaman koreksi (Msl: Slop/Dus)
  const handleUbahHargaKoreksi = (idUnik, newHarga) => {
    setItemsKoreksi((prev) =>
      prev.map((item) => {
        if (item.idUnik === idUnik) {
          return { ...item, modalBaru: newHarga === '' ? '' : Number(newHarga) };
        }
        return item;
      })
    );
  };

  // Eksekusi final simpan hasil koreksi
  const handleEksekusiSimpan = () => {
    // Validasi pembersih string kosong
    const dataValid = itemsKoreksi.map(item => ({
      ...item,
      qty: item.qty === '' ? 1 : Number(item.qty),
      modalBaru: item.modalBaru === '' ? 0 : Number(item.modalBaru)
    }));

    const totalPengeluaranBaru = dataValid.reduce((sum, item) => sum + (item.qty * item.modalBaru), 0);

    if (window.confirm("Simpan perubahan nota ini Fi? Harga modal eceran di menu DATA BARANG (Gudang) dan menu BELANJA AGEN otomatis ter-update mengikuti hitungan pembagian nota baru ini!")) {
      
      // 🎯 LOGIKA REVOLUSI: Kita kirim data yang sudah di-mapping ulang agar App.jsx tahu modal eceran terkecilnya berapa
      const dataSinkronGudang = dataValid.map(item => {
        const totalIsi = Number(item.isiKeEceran) || 1;
        const hargaNotaAgen = Number(item.modalBaru) || 0;
        
        // Hitung otomatis modal eceran terkecil (Msl: 145000 / 10 = 14500)
        const modalEceranTerkecil = Number((hargaNotaAgen / totalIsi).toFixed(4));

        return {
          ...item,
          modalEceranTerhitung: modalEceranTerkecil // Jembatan sakti ke master data barang App.jsx
        };
      });

      onKoreksiNota(notaSedangDiedit, dataSinkronGudang, totalPengeluaranBaru);
      setNotaSedangDiedit(null);
      setItemsKoreksi([]);
    }
  };

  // ── 📝 TAMPILAN JIKA SEDANG MASUK HALAMAN EDIT NOTA KHUSUS ──
  if (notaSedangDiedit) {
    const totalKoreksiBerjalan = itemsKoreksi.reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const m = Number(item.modalBaru) || 0;
      return sum + (q * m);
    }, 0);

    return (
      <div className={styles.container}>
        <div className={styles.boxKoreksiTitle}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>✏️ Koreksi Nota Belanja</h3>
          <button type="button" onClick={() => setNotaSedangDiedit(null)} style={{ background: 'none', border: 'none', color: '#dc3545', fontWeight: '700', cursor: 'pointer' }}>Batal</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {itemsKoreksi.map((item) => {
            const currentQty = item.qty === '' ? 0 : Number(item.qty);
            const currentModal = item.modalBaru === '' ? 0 : Number(item.modalBaru);

            return (
              <div key={item.idUnik} className={styles.itemKoreksiRow} style={{ padding: '12px', backgroundColor: 'var(--bg-header, #ffffff)', borderRadius: '8px', border: '1px solid var(--border-color, #eef0f3)' }}>
                <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-main)' }}>{item.nama}</strong>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', gap: '10px' }}>
                  {/* Isian Edit Kuantitas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty ({item.satuanModal || 'Slop'}):</span>
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => handleUbahQtyKoreksi(item.idUnik, e.target.value)} 
                      style={{ width: '55px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.85rem', textAlign: 'center' }}
                    />
                  </div>

                  {/* Isian Edit Harga Modal Agen */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexGrow: 1, justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Harga {item.satuanModal || 'Slop'}: Rp</span>
                    <input 
                      type="number" 
                      value={item.modalBaru} 
                      onChange={(e) => handleUbahHargaKoreksi(item.idUnik, e.target.value)} 
                      style={{ width: '90px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.85rem', fontWeight: '700' }}
                    />
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: '800', color: '#0a8168', marginTop: '6px' }}>
                  Subtotal: Rp {(currentQty * currentModal).toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ringkasan Total Koreksi */}
        <div className={styles.cardNota} style={{ marginTop: '14px', backgroundColor: 'var(--bg-toggle, #f2f2f7)', padding: '12px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Estimasi Nota Baru:</span>
            <span style={{ color: '#0a8168', fontSize: '1.1rem' }}>Rp {totalKoreksiBerjalan.toLocaleString('id-ID')}</span>
          </div>
          <button type="button" onClick={handleEksekusiSimpan} style={{ width: '100%', padding: '10px', backgroundColor: '#0a8168', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer' }}>
            💾 Simpan & Sinkronisasi Ke Gudang Induk
          </button>
        </div>
      </div>
    );
  }

  // ── 📊 TAMPILAN NORMAL UTAMA HISTORY WARUNG ──
  return (
    <div className={styles.container}>
      
      {/* Tab Navigasi Atas History */}
      <div className={styles.tabHeader}>
        <button 
          type="button" 
          onClick={() => setTabAktif('rekap')} 
          className={`${styles.tabBtn} ${tabAktif === 'rekap' ? styles.tabBtnActive : ''}`}
        >
          📋 1. Rekap Belanja (15 Hari)
        </button>
        <button 
          type="button" 
          onClick={() => setTabAktif('log')} 
          className={`${styles.tabBtn} ${tabAktif === 'log' ? styles.tabBtnActive : ''}`}
        >
          📉 2. Log Perubahan Harga
        </button>
      </div>

      {/* 📋 KONDISI 1: TAB REKAP NOTA NOTA BELANJAAN */}
      {tabAktif === 'rekap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historyBelanja.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '24px', fontSize: '0.85rem' }}>Belum ada riwayat nota kulakan masuk, Fi.</p>
          ) : (
            historyBelanja.map((nota) => (
              <div key={nota.id} className={styles.cardNota}>
                <div className={styles.notaHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 className={styles.notaTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>📄 {nota.id}</h4>
                    <span className={styles.notaTanggal} style={{ fontSize: '0.75rem', color: '#888' }}>{nota.tanggal}</span>
                  </div>
                  <button type="button" onClick={() => handleBukaKoreksiHalaman(nota)} className={styles.btnKoreksi}>
                    ✏️ Koreksi Nota
                  </button>
                </div>

                {/* List Item Teks di Dalam Nota */}
                <div style={{ margin: '8px 0', borderTop: '1px dashed var(--border-color, #eef0f3)', borderBottom: '1px dashed var(--border-color, #eef0f3)', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {nota.items.map((item, idx) => (
                    <div key={item.idUnik || idx} className={styles.itemRow} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-main)' }}>
                        {item.nama} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({item.qty} {item.satuanModal})</span>
                      </span>
                      <span style={{ fontWeight: '600' }}>
                        Rp {(item.qty * item.modalBaru).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.totalRow} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span style={{ color: '#0a8168', fontSize: '0.85rem' }}>Total Pengeluaran:</span>
                  <span style={{ color: '#0a8168', fontSize: '1rem', fontWeight: '800' }}>Rp {(nota.totalPengeluarannya || nota.items.reduce((s,i)=>s+(i.qty*i.modalBaru),0)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 📉 KONDISI 2: TAB LOG PERUBAHAN HARGA INDUK GUDANG */}
      {tabAktif === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logPerubahanHarga.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '24px', fontSize: '0.85rem' }}>Gudang aman, belum ada pergerakan naik-turun harga modal agen, Fi.</p>
          ) : (
            logPerubahanHarga.map((log) => {
              const apakahNaik = log.modalBaru > log.modalLama;
              return (
                <div key={log.idLog} className={styles.cardLog}>
                  <div className={styles.logKiri}>
                    <h4 style={{ color: 'var(--text-main)', margin: '0 0 2px 0', fontSize: '0.9rem' }}>{log.namaBarang}</h4>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>⏰ {log.tanggal}</span>
                  </div>
                  <div className={styles.logKanan} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Perubahan Modal:</div>
                    <span style={{ color: apakahNaik ? '#eb5757' : '#0a8168', fontWeight: '800', fontSize: '0.85rem' }}>
                      Rp {log.modalLama.toLocaleString('id-ID')} ➔ Rp {log.modalBaru.toLocaleString('id-ID')}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: apakahNaik ? '#eb5757' : '#0a8168' }}>
                      {apakahNaik ? '🔺 MODAL NAIK' : '📉 MODAL TURUN'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}

export default HistoryWarung;