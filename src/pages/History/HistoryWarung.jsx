import { useState } from 'react';
import styles from './HistoryWarung.module.css';

function HistoryWarung({ historyBelanja = [], logPerubahanHarga = [], onKoreksiNota }) {
  const [tabAktif, setTabAktif] = useState('rekap'); // 'rekap' atau 'log'
  
  // State untuk melacak nota mana yang sedang berada di dalam "Mode Edit/Koreksi Halaman Baru"
  const [notaSedangDiedit, setNotaSedangDiedit] = useState(null);
  const [itemsKoreksi, setItemsKoreksi] = useState([]);

  // Pemicu masuk ke halaman edit khusus (VERSI FIX PEMUTUS MEMORI REFERENSI 🎯)
  const handleBukaKoreksiHalaman = (nota) => {
    setNotaSedangDiedit(nota.id);
     
    // Pecah total semua referensi objek item menggunakan map + spread operator (...)
    // Ini menjamin setiap baris barang punya independent memory sendiri-sendiri!
    const itemsPecahReferensi = nota.items.map((item, idx) => ({
      ...item,
      idUnik: item.idUnik || `item-${nota.id}-${idx}`, // Pastikan setiap item punya idUnik unik
      hargaBaru: item.modalBaru || 0 // Inisialisasi hargaBaru dari modalBaru yang ada
    }));

    setItemsKoreksi(itemsPecahReferensi);
  };

  // Mengubah Qty di baris halaman koreksi (Aman dari Bug NaN)
  const handleUbahQtyKoreksi = (idUnik, newQty) => {
    setItemsKoreksi((prev) =>
      prev.map((item) => {
        if (item.idUnik === idUnik) {
          // Biarkan string kosong dulu pas dihapus, biar ketikannya gak macet
          const qtyAman = newQty === '' ? '' : Math.max(1, Number(newQty));
          return { ...item, qty: qtyAman };
        }
        return item;
      })
    );
  };

  // Mengubah Harga Modal Agen di baris halaman koreksi
  const handleUbahHargaKoreksi = (idUnik, newHarga) => {
    setItemsKoreksi((prev) =>
      prev.map((item) => {
        if (item.idUnik === idUnik) {
          // Jika input kosong (pas kamu hapus total angkanya), biarkan string kosong '' dulu biar gak mental NaN
          return { ...item, hargaBaru: newHarga === '' ? '' : Number(newHarga) };
        }
        return item;
      })
    );
  };

  // Eksekusi final simpan hasil koreksi
  const handleEksekusiSimpan = () => {
    // Validasi pembersih: Ubah sisa string kosong menjadi angka resmi sebelum disave ke gudang
    const dataValid = itemsKoreksi.map(item => ({
      ...item,
      qty: item.qty === '' ? 1 : Number(item.qty),
      hargaBaru: item.hargaBaru === '' ? 0 : Number(item.hargaBaru)
    }));

    if (window.confirm("Simpan perubahan nota ini Fi? Data modal barang di gudang bakal ikut ter-update otomatis!")) {
      onKoreksiNota(notaSedangDiedit, dataValid);
      setNotaSedangDiedit(null);
      setItemsKoreksi([]);
    }
  };

  // ── 📝 TAMPILAN JIKA SEDANG MASUK HALAMAN EDIT NOTA KHUSUS (OPSI 2) ──
 if (notaSedangDiedit) {
  const totalKoreksiBerjalan = itemsKoreksi.reduce((sum, item) => sum + (item.qty * (typeof item.hargaBaru === 'number' ? item.hargaBaru : 0)), 0);

  return (
    <div className={styles.container}>
      <div className={styles.boxKoreksiTitle}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>✏️ Menu Koreksi {notaSedangDiedit}</h3>
        <button type="button" onClick={() => setNotaSedangDiedit(null)} style={{ background: 'none', border: 'none', color: '#dc3545', fontWeight: '700', cursor: 'pointer' }}>Kembali</button>
      </div>

      <div>
        {itemsKoreksi.map((item) => (
          <div key={item.idUnik} className={styles.itemKoreksiRow}>
            <strong style={{ fontSize: '0.9rem' }}>{item.nama}</strong>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              {/* Isian Edit Kuantitas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#666' }}>Qty ({item.satuanModal || 'Pcs'}):</span>
                <input 
                  type="number" 
                  value={item.qty} 
                  onChange={(e) => handleUbahQtyKoreksi(item.idUnik, e.target.value)} 
                  className={styles.inputKoreksi} 
                  style={{ width: '55px' }}
                />
              </div>

              {/* Isian Edit Harga Modal Agen (DI SINI FIX-NYA 🎯) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: '#666' }}>Harga Agen:</span>
                <input 
                  type="number" 
                  value={item.hargaBaru} // 👈 Diikat langsung ke nilai spesifik barang ini, bukan state luar tunggal!
                  onChange={(e) => handleUbahHargaKoreksi(item.idUnik, e.target.value)} // 👈 Mengubah spesifik idUnik barang ini
                  className={styles.inputKoreksi} 
                />
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: '#0a8168', marginTop: '2px' }}>
              Subtotal: Rp {(item.qty * (typeof item.hargaBaru === 'number' ? item.hargaBaru : 0)).toLocaleString('id-ID')}
            </div>
          </div>
        ))}
      </div>

      {/* Ringkasan Total Koreksi */}
      <div className={styles.cardNota} style={{ marginTop: '14px', backgroundColor: 'var(--bg-toggle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
          <span>Estimasi Nota Baru:</span>
          <span style={{ color: '#0a8168', fontSize: '1.1rem' }}>Rp {totalKoreksiBerjalan.toLocaleString('id-ID')}</span>
        </div>
        <button type="button" onClick={handleEksekusiSimpan} className={styles.btnSimpanKoreksi}>
          💾 Simpan & Sinkronisasi Semua Data
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
        <div>
          {historyBelanja.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '24px', fontSize: '0.85rem' }}>Belum ada riwayat nota kulakan masuk, Fi.</p>
          ) : (
            historyBelanja.map((nota) => (
              <div key={nota.id} className={styles.cardNota}>
                <div className={styles.notaHeader}>
                  <div>
                    <h4 className={styles.notaTitle}>📄 {nota.id}</h4>
                    <span className={styles.notaTanggal}>{nota.tanggal}</span>
                  </div>
                  {/* TOMBOL PANDUAN MENUJU HALAMAN EDIT KHUSUS (OPSI 2 MATCH!) */}
                  <button type="button" onClick={() => handleBukaKoreksiHalaman(nota)} className={styles.btnKoreksi}>
                    ✏️ Koreksi Nota
                  </button>
                </div>

                {/* List Item Teks di Dalam Nota */}
                <div style={{ margin: '8px 0' }}>
                  {nota.items.map((item, idx) => (
                    <div key={item.idUnik || idx} className={styles.itemRow}>
                      <span style={{ color: 'var(--text-main)' }}>
                        {item.nama} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({item.qty} {item.satuanModal})</span>
                      </span>
                      <span style={{ fontWeight: '600' }}>
                        Rp {(item.qty * item.modalBaru).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.totalRow}>
                  <span style={{ color: '#0a8168' }}>Total Pengeluaran:</span>
                  <span style={{ color: '#0a8168', fontSize: '1rem' }}>Rp {(nota.totalPengeluarannya || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 📉 KONDISI 2: TAB LOG PERUBAHAN HARGA INDUK GUDANG */}
      {tabAktif === 'log' && (
        <div>
          {logPerubahanHarga.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '24px', fontSize: '0.85rem' }}>Gudang aman, belum ada pergerakan naik-turun harga modal agen, Fi.</p>
          ) : (
            logPerubahanHarga.map((log) => {
              const apakahNaik = log.modalBaru > log.modalLama;
              return (
                <div key={log.idLog} className={styles.cardLog}>
                  <div className={styles.logKiri}>
                    <h4 style={{ color: 'var(--text-main)' }}>{log.namaBarang}</h4>
                    <span>⏰ {log.tanggal}</span>
                  </div>
                  <div className={styles.logAnan || styles.logKanan}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perubahan Modal:</div>
                    <span style={{ color: apakahNaik ? '#eb5757' : '#0a8168', fontWeight: '800' }}>
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