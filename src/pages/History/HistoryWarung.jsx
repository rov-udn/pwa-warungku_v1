import { useState } from 'react';
import styles from './HistoryWarung.module.css';

function HistoryWarung({ historyBelanja = [], logPerubahanHarga = [], onKoreksiNota, daftarBarang = [] }) {
  const [tabAktif, setTabAktif] = useState('rekap'); // 'rekap' atau 'log'
  
  // State untuk melacak nota mana yang sedang dikoreksi
  const [notaSedangDiedit, setNotaSedangDiedit] = useState(null);
  const [itemsKoreksi, setItemsKoreksi] = useState([]);

  // ── 🎯 1. PEMICU MASUK HALAMAN KOREKSI (MENGIKAT REFERENSI GUDANG ASLI) ──
  const handleBukaKoreksiHalaman = (nota) => {
    setNotaSedangDiedit(nota.id);
     
    const itemsPecahReferensi = nota.items.map((item, idx) => {
      // Cari data barang asli di database gudang untuk mendapatkan isiKeEceran riil
      const barangAsli = daftarBarang.find(b => b.id === item.id);
      
      // Amankan pembagi: Jika belanjanya pakai satuan terkecil (Pcs/Bungkus), pembagi = 1
      // Jika belanjanya Dus/Slop, ambil nilai isi dari database gudang
      let isiPembagi = 1;
      const satuanNotaKecil = (item.satuanModal || '').toLowerCase();
      
      if (satuanNotaKecil !== 'pcs' && satuanNotaKecil !== 'bungkus' && satuanNotaKecil !== 'renteng' && barangAsli) {
        isiPembagi = Number(barangAsli.isiKeEceran) || Number(barangAsli.jumlahIsi) || 1;
      }

      return {
        ...item,
        idUnik: item.idUnik || `item-${nota.id}-${idx}`, 
        modalBaru: item.modalBaru ?? item.hargaModalAgen ?? 0, 
        isiKeEceran: isiPembagi // 👈 Sudah dijamin presisi menyesuaikan satuan saat kulakan
      };
    });

    setItemsKoreksi(itemsPecahReferensi);
  };

  // ── 🎯 2. INPUT HANDLER (HANYA MENGUBAH HARGA MODAL AGEN, QTY TETAP AMAN DI STATE) ──
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

  // ── 🎯 3. EKSEKUSI SIMPAN (HITUNG ULANG OTOMATIS & SINKRON GUDANG) ──
  const handleEksekusiSimpan = () => {
    // Validasi tipe data number
    const dataValid = itemsKoreksi.map(item => ({
      ...item,
      qty: Number(item.qty) || 1, // Qty tetap dibaca dari memori walau tak ada di layar
      modalBaru: Number(item.modalBaru) || 0
    }));

    // Hitung total nota baru berdasarkan Qty x Harga Baru
    const totalPengeluaranBaru = dataValid.reduce((sum, item) => sum + (item.qty * item.modalBaru), 0);

    if (window.confirm("Simpan pencocokan harga nota ini Fi? Harga Modal Eceran di Gudang Utama akan langsung diperbarui otomatis!")) {
      
      const dataSinkronGudang = dataValid.map(item => {
        const totalIsi = Number(item.isiKeEceran) || 1;
        const hargaNotaAgen = Number(item.modalBaru) || 0;
        
        // 🎯 UBAH KE CEIL: Pembagian dari koreksi nota history ikut bulat ke atas
        const modalEceranTerkecil = Math.ceil(hargaNotaAgen / totalIsi);

        return {
          ...item,
          id: item.id, 
          modalEceranTerhitung: modalEceranTerkecil 
        };
      });

      onKoreksiNota(notaSedangDiedit, dataSinkronGudang, totalPengeluaranBaru);
      setNotaSedangDiedit(null);
      setItemsKoreksi([]);
    }
  };


  // ── 📝 TAMPILAN JIKA SEDANG MASUK HALAMAN EDIT NOTA KHUSUS (CLEAN UX) ──
  if (notaSedangDiedit) {
    const totalKoreksiBerjalan = itemsKoreksi.reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const m = Number(item.modalBaru) || 0;
      return sum + (q * m);
    }, 0);

    return (
      <div className={styles.container}>
        <div className={styles.boxKoreksiTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-color, #eef0f3)' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>✏️ Pencocokan Harga Agen</h3>
          <button type="button" onClick={() => setNotaSedangDiedit(null)} style={{ background: 'var(--bg-toggle, #f2f2f7)', border: 'none', color: '#dc3545', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>Batal</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {itemsKoreksi.map((item) => {
            const currentModal = item.modalBaru === '' ? 0 : Number(item.modalBaru);
            const modalPcsEstimasi = Math.round(currentModal / (Number(item.isiKeEceran) || 1));

            return (
              <div key={item.idUnik} className={styles.itemKoreksiRow} style={{ padding: '14px', backgroundColor: 'var(--bg-header, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #eef0f3)' }}>
                
                {/* ── BARIS 1: NAMA BARANG & INFO QTY (TEKS SAJA, ANTI BINGUNG) ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--text-main)', marginBottom: '2px' }}>{item.nama}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Kulakan: <strong style={{color: '#495057'}}>{item.qty} {item.satuanModal || 'Dus'}</strong>
                      {item.isiKeEceran > 1 && ` (Isi ${item.isiKeEceran} Pcs)`}
                    </span>
                  </div>
                  
                  <span style={{ fontSize: '0.75rem', color: '#0a8168', backgroundColor: 'rgba(10,129,104,0.08)', padding: '3px 6px', borderRadius: '6px', fontWeight: '800' }}>
                    Eceran: Rp {modalPcsEstimasi.toLocaleString('id-ID')}
                  </span>
                </div>
                
                {/* ── BARIS 2: SATU-SATUNYA INPUT FOKUS (HARGA MODAL BARU) ── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed #eef0f3' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: '700' }}>
                    Set Harga 1 {item.satuanModal || 'Dus'}:
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: '#888', fontWeight: '600' }}>Rp</span>
                    <input 
                      type="number" 
                      value={item.modalBaru} 
                      onChange={(e) => handleUbahHargaKoreksi(item.idUnik, e.target.value)} 
                      placeholder="0"
                      style={{ 
                        width: '130px', 
                        padding: '8px 10px 8px 30px', 
                        borderRadius: '8px', 
                        border: '1px solid #ced4da', 
                        backgroundColor: '#f8f9fa', 
                        color: '#111', 
                        fontSize: '0.95rem', 
                        fontWeight: '800', 
                        textAlign: 'right', 
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Ringkasan Total Koreksi */}
        <div className={styles.cardNota} style={{ marginTop: '16px', backgroundColor: 'var(--bg-toggle, #f2f2f7)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color, #eef0f3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Total Nota Tervalidasi:</span>
            <span style={{ color: '#0a8168', fontSize: '1.25rem', fontWeight: '900' }}>Rp {totalKoreksiBerjalan.toLocaleString('id-ID')}</span>
          </div>
          <button type="button" onClick={handleEksekusiSimpan} style={{ width: '100%', padding: '12px', backgroundColor: '#0a8168', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(10, 129, 104, 0.2)' }}>
            💾 Simpan & Update Gudang
          </button>
        </div>
      </div>
    );
  }

  // ── 📊 TAMPILAN NORMAL UTAMA HISTORY WARUNG ──
  return (
    <div className={styles.container}>
      
      <div className={styles.tabHeader}>
        <button type="button" onClick={() => setTabAktif('rekap')} className={`${styles.tabBtn} ${tabAktif === 'rekap' ? styles.tabBtnActive : ''}`}>
          📋 1. Nota Kulakan
        </button>
        <button type="button" onClick={() => setTabAktif('log')} className={`${styles.tabBtn} ${tabAktif === 'log' ? styles.tabBtnActive : ''}`}>
          📉 2. Riwayat Harga
        </button>
      </div>

      {tabAktif === 'rekap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {historyBelanja.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '24px', fontSize: '0.85rem' }}>Belum ada nota kulakan yang tersimpan, Fi.</p>
          ) : (
            historyBelanja.map((nota) => (
              <div key={nota.id} className={styles.cardNota}>
                <div className={styles.notaHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 className={styles.notaTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>📄 {nota.id}</h4>
                    <span className={styles.notaTanggal} style={{ fontSize: '0.75rem', color: '#888' }}>{nota.tanggal}</span>
                  </div>
                  <button type="button" onClick={() => handleBukaKoreksiHalaman(nota)} className={styles.btnKoreksi}>
                    ✏️ Cocokkan Harga
                  </button>
                </div>

                <div style={{ margin: '8px 0', borderTop: '1px dashed var(--border-color, #eef0f3)', borderBottom: '1px dashed var(--border-color, #eef0f3)', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {nota.items.map((item, idx) => (
                    <div key={item.idUnik || idx} className={styles.itemRow} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-main)' }}>
                        {item.nama} <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({item.qty} {item.satuanModal})</span>
                      </span>
                      <span style={{ fontWeight: '600' }}>
                        Rp {(item.qty * (item.modalBaru ?? item.hargaModalAgen ?? 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.totalRow} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span style={{ color: '#0a8168', fontSize: '0.85rem' }}>Total Pengeluaran:</span>
                  <span style={{ color: '#0a8168', fontSize: '1rem', fontWeight: '800' }}>Rp {(nota.totalPengeluarannya || nota.items.reduce((s,i)=>s+(i.qty*(i.modalBaru ?? i.hargaModalAgen ?? 0)),0)).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tabAktif === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logPerubahanHarga.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '24px', fontSize: '0.85rem' }}>Belum ada pergerakan naik-turun harga modal agen.</p>
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