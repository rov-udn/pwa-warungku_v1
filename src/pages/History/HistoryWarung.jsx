import { useState } from 'react';
import styles from './HistoryWarung.module.css';

// 🎯 1. IMPOR CUSTOM HOOK GUDANG GLOBAL DATA TOKO
import { useAppGudang } from '../../context/useAppGudang.jsx';

function HistoryWarung() {
  // 🎯 2. TARIK DATA & FUNGSI DARI CONTEXT (Fallback [] agar anti-crash)
  const { 
    historyBelanja = [], 
    logPerubahanHarga = [],
    userWarung, 
    handleKoreksiNota: onKoreksiNota, 
    daftarBarang = []
  } = useAppGudang();

  const [tabAktif, setTabAktif] = useState('rekap'); // 'rekap' atau 'log'
  
  // State untuk membuka detail nota dan mode koreksi
  const [selectedNota, setSelectedNota] = useState(null);
  const [notaSedangDiedit, setNotaSedangDiedit] = useState(null);
  const [itemsKoreksi, setItemsKoreksi] = useState([]);

  // Helper Pengurutan Waktu Nota
  const getNotaTimestamp = (nota) => {
    if (!nota) return 0;
    const parts = String(nota.id || '').split('-');
    const maybeTs = Number(parts[1]);
    if (!Number.isNaN(maybeTs) && maybeTs > 0) return maybeTs;
    const tanggal = new Date(nota.tanggal);
    return Number.isNaN(tanggal.getTime()) ? 0 : tanggal.getTime();
  };

  const safeHistory = Array.isArray(historyBelanja) ? historyBelanja : [];
  const safeLogHarga = Array.isArray(logPerubahanHarga) ? logPerubahanHarga : [];

  const sortedHistoryBelanja = [...safeHistory].sort((a, b) => getNotaTimestamp(b) - getNotaTimestamp(a));

  const changeTab = (tab) => {
    setTabAktif(tab);
    setSelectedNota(null);
    setNotaSedangDiedit(null);
    setItemsKoreksi([]);
  };

  const handleBukaNotaDetail = (nota) => {
    setSelectedNota(nota);
    setNotaSedangDiedit(null);
    setItemsKoreksi([]);
  };

  // ── 🎯 PEMICU MASUK HALAMAN KOREKSI (SINKRON KEY ISI GUDANG) ──
  const handleBukaKoreksiHalaman = (nota) => {
    setNotaSedangDiedit(nota);
    setSelectedNota(null);
        
    const itemsPecahReferensi = (nota?.items || []).map((item, idx) => {
      const barangAsli = (daftarBarang || []).find(b => String(b.id) === String(item.id));
      let isiPembagi = 1;
      const satuanNotaKecil = (item.satuanModal || '').toLowerCase();
      
      if (!['pcs', 'bungkus', 'bks', 'eceran'].includes(satuanNotaKecil) && barangAsli) {
        isiPembagi = Number(barangAsli.isiKeEceran) || 1;
      }

      const stableIdUnik = item.idUnik || `item-${nota.id}-${idx}`;
      return {
        ...item,
        idUnik: stableIdUnik,
        modalBaru: item.modalBaru ?? 0,
        isiKeEceran: isiPembagi
      };
    });

    setItemsKoreksi(itemsPecahReferensi);
  };

  // ── 🎯 INPUT HANDLER ──
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

  // ── 🎯 EKSEKUSI SIMPAN ──
  const handleEksekusiSimpan = () => {
    const dataValid = itemsKoreksi.map(item => ({
      ...item,
      qty: Number(item.qty) || 1,
      modalBaru: Number(item.modalBaru) || 0
    }));

    const totalPengeluaranBaru = dataValid.reduce((sum, item) => sum + (item.qty * item.modalBaru), 0);
    const namaPanggilan = userWarung ? userWarung.pemilik : 'Bos';

    if (window.confirm(`Simpan pencocokan harga nota ini, ${namaPanggilan}? Harga Modal Eceran di Gudang Utama akan langsung diperbarui otomatis!`)) {
      
      const dataSinkronGudang = dataValid.map(item => {
        const totalIsi = Number(item.isiKeEceran) || 1;
        const hargaNotaAgen = Number(item.modalBaru) || 0;
        const modalEceranTerkecil = totalIsi > 0 ? (hargaNotaAgen / totalIsi) : hargaNotaAgen;

        return {
          ...item,
          id: item.id, 
          modalEceranTerhitung: modalEceranTerkecil 
        };
      });

      if (typeof onKoreksiNota === 'function') {
        onKoreksiNota(notaSedangDiedit.id, dataSinkronGudang, totalPengeluaranBaru);
      }
      setNotaSedangDiedit(null);
      setItemsKoreksi([]);
    }
  };


  // ── 📝 TAMPILAN JIKA SEDANG MASUK HALAMAN EDIT NOTA KHUSUS (CLEAN UX) ──
  if (notaSedangDiedit) {
    const totalKoreksiBerjalan = itemsKoreksi.reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const m = item.modalBaru === '' ? 0 : Number(item.modalBaru);
      return sum + (q * m);
    }, 0);

    return (
      <div className={styles.container}>
        <div className={styles.boxKoreksiTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-light, #eef0f3)' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>✏️ Pencocokan Harga Agen</h3>
          <button type="button" onClick={() => setNotaSedangDiedit(null)} style={{ background: 'var(--bg-input, #f2f2f7)', border: 'none', color: '#ff4a4a', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' }}>Batal</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {itemsKoreksi.map((item) => {
            const currentModal = item.modalBaru === '' ? 0 : Number(item.modalBaru);
            const totalIsi = Number(item.isiKeEceran) || 1;
            const modalPcsEstimasi = totalIsi > 0 ? Math.round(currentModal / totalIsi) : currentModal;

            return (
              <div key={item.idUnik} className={styles.itemKoreksiRow} style={{ padding: '14px', backgroundColor: 'var(--bg-toggle, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-light, #eef0f3)' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem', display: 'block', color: 'var(--text-main)', marginBottom: '2px' }}>{item.nama}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Kulakan: <strong style={{color: 'var(--text-main)'}}>{item.qty} {item.satuanModal || 'Dus'}</strong>
                      {totalIsi > 1 && ` (Isi ${totalIsi} Pcs)`}
                    </span>
                  </div>
                  
                  {/* 🎯 CYAN GLOW BAGIAN UTAMA ECERAN */}
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', backgroundColor: 'var(--bg-nav-active)', padding: '4px 8px', borderRadius: '6px', fontWeight: '800', border: '1px solid rgba(0,245,255,0.15)' }}>
                    Eceran: Rp {modalPcsEstimasi.toLocaleString('id-ID')}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-light)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: '700' }}>
                    Set Harga 1 {item.satuanModal || 'Dus'}:
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Rp</span>
                    <input 
                      type="number" 
                      value={item.modalBaru} 
                      onChange={(e) => handleUbahHargaKoreksi(item.idUnik, e.target.value)} 
                      placeholder="0"
                      style={{ 
                        width: '130px', 
                        padding: '8px 10px 8px 30px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-medium)', 
                        backgroundColor: 'var(--bg-input)', 
                        color: 'var(--text-main)', 
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
        <div className={styles.cardNota} style={{ marginTop: '16px', backgroundColor: 'var(--bg-toggle, #f2f2f7)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light, #eef0f3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Total Nota Tervalidasi:</span>
            <span style={{ color: 'var(--accent-cyan)', fontSize: '1.25rem', fontWeight: '900', textShadow: '0 0 10px rgba(0,245,255,0.2)' }}>Rp {totalKoreksiBerjalan.toLocaleString('id-ID')}</span>
          </div>
          <button type="button" onClick={handleEksekusiSimpan} style={{ width: '100%', padding: '12px', backgroundColor: 'var(--accent-neon, #0055ff)', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 85, 255, 0.4)' }}>
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
        <button type="button" onClick={() => changeTab('rekap')} className={`${styles.tabBtn} ${tabAktif === 'rekap' ? styles.tabBtnActive : ''}`}>
          📋 1. Nota Kulakan
        </button>
        <button type="button" onClick={() => changeTab('log')} className={`${styles.tabBtn} ${tabAktif === 'log' ? styles.tabBtnActive : ''}`}>
          📉 2. Riwayat Harga
        </button>
      </div>

      {tabAktif === 'rekap' && !selectedNota && !notaSedangDiedit && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedHistoryBelanja.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.85rem' }}>Belum ada nota kulakan yang tersimpan, {userWarung ? userWarung.pemilik : 'Bos'}.</p>
          ) : (
            sortedHistoryBelanja.map((nota) => (
              <div key={nota.id} className={styles.cardNota}>
                <div className={styles.notaHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 className={styles.notaTitle} style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800' }}>📄 {nota.id}</h4>
                    <span className={styles.notaTanggal} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{nota.tanggal}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleBukaNotaDetail(nota)} 
                    className={styles.btnKoreksi}
                  >
                    📌 Buka Nota
                  </button>
                </div>

                <div style={{ margin: '8px 0', borderTop: '1px dashed var(--border-light, #eef0f3)', borderBottom: '1px dashed var(--border-light, #eef0f3)', padding: '6px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {nota.items?.map((item, idx) => (
                    <div key={item.idUnik || idx} className={styles.itemRow} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-main)' }}>
                        {item.nama} <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>({item.qty} {item.satuanModal})</span>
                      </span>
                      <span style={{ fontWeight: '600' }}>
                        Rp {(item.qty * (Number(item.modalBaru) || 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.totalRow} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                  <span style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>Total Pengeluaran:</span>
                  <span style={{ color: 'var(--accent-cyan)', fontSize: '1rem', fontWeight: '800' }}>Rp {(nota.totalPengeluarannya || nota.items?.reduce((s,i)=>s+(i.qty*(Number(i.modalBaru) || 0)),0) || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tabAktif === 'rekap' && selectedNota && !notaSedangDiedit && (
        <div className={styles.cardNota} style={{ padding: '18px', backgroundColor: 'var(--bg-header)', border: '1px solid var(--border-light)', boxShadow: '0 12px 24px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>📄 Detail Nota {selectedNota?.id}</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedNota?.tanggal}</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setSelectedNota(null)} className={styles.btnKoreksi} style={{ padding: '7px 14px' }}>🔙 Kembali</button>
              <button type="button" onClick={() => handleBukaKoreksiHalaman(selectedNota)} className={styles.btnKoreksi} style={{ padding: '7px 14px' }}>✏️ Cocokkan Harga</button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
            {selectedNota?.items?.map((item, idx) => (
              <div key={item.idUnik || `${selectedNota?.id}-${idx}`} className={styles.itemRow} style={{ justifyContent: 'space-between', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-main)' }}>{item.nama}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{item.qty} {item.satuanModal || 'pcs'}</span>
                </div>
                <span style={{ fontWeight: '700' }}>Rp {(item.qty * (Number(item.modalBaru) || 0)).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div className={styles.totalRow} style={{ justifyContent: 'space-between', paddingTop: '12px' }}>
            <span style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>Total Pengeluaran:</span>
            <span style={{ color: 'var(--accent-cyan)', fontSize: '1rem', fontWeight: '800' }}>Rp {(selectedNota.totalPengeluarannya || selectedNota.items?.reduce((s,i)=>s+(i.qty*(Number(i.modalBaru) || 0)),0) || 0).toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}

      {tabAktif === 'log' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {safeLogHarga.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.85rem' }}>Belum ada pergerakan naik-turun harga modal agen.</p>
          ) : (
            safeLogHarga.map((log, idx) => {
              const modalLama = Number(log.modalLama) || 0;
              const modalBaru = Number(log.modalBaru) || 0;
              const apakahNaik = modalBaru > modalLama;
              const keyUnik = log.idLog || `log-${log.tanggal || 'item'}-${idx}`;
              
              return (
                <div key={keyUnik} className={styles.cardLog}>
                  <div className={styles.logKiri}>
                    <h4 style={{ color: 'var(--text-main)', margin: '0 0 2px 0', fontSize: '0.9rem' }}>{log.namaBarang}</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>⏰ {log.tanggal}</span>
                  </div>
                  <div className={styles.logKanan} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Perubahan Modal:</div>
                    <span style={{ color: apakahNaik ? '#ff4d4d' : 'var(--accent-cyan)', fontWeight: '800', fontSize: '0.85rem' }}>
                      Rp {modalLama.toLocaleString('id-ID')} ➔ Rp {modalBaru.toLocaleString('id-ID')}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 'bold', color: apakahNaik ? '#ff4d4d' : 'var(--accent-cyan)' }}>
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