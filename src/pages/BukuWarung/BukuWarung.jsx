import { useState, useMemo } from 'react';
import ModalBarang from './components/ModalBarang';
import { importAndTransformJSON } from '../../utils/migrationHelpers';
import styles from './BukuWarung.module.css'; 

function BukuWarung({ daftarBarang = [], onTambahBarang, onHapusBarang, onEditBarang, onMigrasiFirestore, onAddLogPerubahanHarga }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('tambah');
  const [idBarangAktif, setIdBarangAktif] = useState(null);
  const [barangAktif, setBarangAktif] = useState(null);
  const [idCardTerbuka, setIdCardTerbuka] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Semua');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [filterRugiAktif, setFilterRugiAktif] = useState(false);

  const daftarKategori = [
    'Semua', 
    'Sembako/Dapur', 
    'Mie/Instan', 
    'Minuman/Kopi/Susu', 
    'Rokok/Korek', 
    'Snack/Biskuit/Roti', 
    'Sabun/Pembersih', 
    'Obat-obatan/Medical item', 
    'plastik/Cup', 
    'item lain'
  ];

  const jumlahBarangRugi = useMemo(() => {
    return daftarBarang.filter(barang => {
      const eceranRugi = Number(barang.jual) < Number(barang.modal);
      const grosirRugi = barang.jualGrosirTotal && barang.modalGrosirTotal 
        ? Number(barang.jualGrosirTotal) < Number(barang.modalGrosirTotal) 
        : false;
      return eceranRugi || grosirRugi;
    }).length;
  }, [daftarBarang]);

  const barangFiltered = useMemo(() => {
    return daftarBarang.filter((barang) => {
      const cocokSearch = barang.nama.toLowerCase().includes(searchTerm.toLowerCase());
      const katBarang = (barang.kategori || 'item lain').trim();
      const cocokKategori = kategoriAktif === 'Semua' || katBarang.toLowerCase() === kategoriAktif.toLowerCase();
      
      const eceranRugi = Number(barang.jual) < Number(barang.modal);
      const grosirRugi = barang.jualGrosirTotal && barang.modalGrosirTotal 
        ? Number(barang.jualGrosirTotal) < Number(barang.modalGrosirTotal) 
        : false;
      const apakahRugi = eceranRugi || grosirRugi;

      if (filterRugiAktif) {
        return cocokSearch && cocokKategori && apakahRugi;
      }
      return cocokSearch && cocokKategori;
    });
  }, [daftarBarang, searchTerm, kategoriAktif, filterRugiAktif]);
  
  const hitungMarginCuan = (hargaModal, hargaJual) => {
    const modal = Number(hargaModal) || 0;
    const jual = Number(hargaJual) || 0;
    if (jual <= 0 || jual <= modal) return 0;
    return (((jual - modal) / jual) * 100).toFixed(1);
  };

  const bukaModalTambah = () => {
    setModalMode('tambah');
    setIdBarangAktif(null);
    setBarangAktif(null);
    setIsModalOpen(true);
  };

  const bukaModalEdit = (barang) => {
    setModalMode('edit');
    setIdBarangAktif(barang.id);
    setBarangAktif(barang);
    setIsModalOpen(true);
  };

  const handleSimpanTerpisah = (dataBaru) => {
    if (modalMode === 'tambah') {
      onTambahBarang(dataBaru);
    } else {
      onEditBarang(idBarangAktif, dataBaru);
      try {
        const modalLama = barangAktif?.modal || 0;
        const modalBaru = Number(dataBaru.modal) || 0;
        if (modalBaru !== modalLama && typeof onAddLogPerubahanHarga === 'function') {
          onAddLogPerubahanHarga({ namaBarang: barangAktif?.nama, modalLama, modalBaru });
        }
      } catch (e) {
        console.error('Gagal mencatat perubahan harga:', e);
      }
    }
    setIsModalOpen(false);
  };

  const handleImportJson = () => {
    if (!importJsonText.trim()) { alert('Masukkan JSON terlebih dahulu'); return; }
    const result = importAndTransformJSON(importJsonText);
    if (!result.success) { alert(`❌ Error: ${result.error}`); return; }
    if (typeof onMigrasiFirestore === 'function') {
      onMigrasiFirestore(result.data);
      setImportJsonText('');
      setIsImportModalOpen(false);
    } else {
      alert('❌ Migration handler tidak tersedia');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <h2 className={styles.mainTitle}>Buku Warung (Data Barang)</h2>
        <p className={styles.subHeader}>💡 Tips: Ketuk kartu barang untuk melihat varian rasa, harga grosir & rentengan.</p>
      </div>

      {jumlahBarangRugi > 0 && (
        <div onClick={() => setFilterRugiAktif(!filterRugiAktif)} style={{ backgroundColor: filterRugiAktif ? '#ff3b30' : 'rgba(255, 59, 48, 0.08)', border: '1px solid #ff3b30', borderRadius: '12px', padding: '12px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: filterRugiAktif ? '0 4px 14px rgba(255, 59, 48, 0.35)' : 'none', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: filterRugiAktif ? '#ffffff' : '#ff3b30' }}>Ada {jumlahBarangRugi} Barang Jual Rugi / Belum Naik Harga!</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: filterRugiAktif ? 'rgba(255,255,255,0.85)' : 'var(--text-muted, #8e8e93)' }}>{filterRugiAktif ? '👉 Menampilkan barang boncos saja (Klik untuk membatalkan)' : '👉 Klik di sini untuk jalan pintas perbaiki harga!'}</p>
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', backgroundColor: filterRugiAktif ? '#ffffff' : '#ff3b30', color: filterRugiAktif ? '#ff3b30' : '#ffffff', padding: '4px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{filterRugiAktif ? 'Lihat Semua' : 'Shortcut Scann'}</span>
        </div>
      )}

      <div>
        <div className={styles.searchRow}>
          <input type="text" placeholder="🔎 Ketik nama barang..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={styles.searchBar} />
          <button onClick={bukaModalTambah} className={styles.btnTambah}>+ Barang</button>
          <button onClick={() => setIsImportModalOpen(true)} className={styles.btnImport}>📥 Migrasi</button>
        </div>

        <div className={styles.scrollKategori}>
          {daftarKategori.map((kat) => {
            const isAktif = kategoriAktif === kat && !filterRugiAktif;
            return (
              <button key={kat} type="button" onClick={() => { setKategoriAktif(kat); setFilterRugiAktif(false); }} className={`${styles.btnKategoriPill} ${isAktif ? styles.btnKategoriActive : ''}`}>{kat}</button>
            );
          })}
        </div>
      </div>

      <div className={styles.listContainer}>
        {barangFiltered.length > 0 ? (
          barangFiltered.map((barang) => {
            const isTerbuka = idCardTerbuka === barang.id;
            const isEceranRugi = Number(barang.jual) < Number(barang.modal);
            const isGrosirRugi = barang.jualGrosirTotal && barang.modalGrosirTotal ? Number(barang.jualGrosirTotal) < Number(barang.modalGrosirTotal) : false;
            const apakahRugi = isEceranRugi || isGrosirRugi;

            return (
              <div key={barang.id} onClick={() => setIdCardTerbuka(isTerbuka ? null : barang.id)} className={styles.cardItem} style={{ border: apakahRugi ? '1px solid rgba(255, 59, 48, 0.45)' : '1px solid var(--border-color, #eef0f3)', backgroundColor: apakahRugi ? 'rgba(255, 59, 48, 0.01)' : 'var(--bg-header, #ffffff)' }}>
                <div className={styles.cardMainInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span className={styles.badgeKategori}>{barang.kategori || 'item lain'}</span>
                    {apakahRugi && <span style={{ backgroundColor: '#ff3b30', color: '#ffffff', fontSize: '0.65rem', fontWeight: '900', padding: '1px 6px', borderRadius: '4px' }}>⚠️ RUGI</span>}
                  </div>

                  <h4 className={styles.barangNama}>{barang.nama}</h4>
                  
                  {/* ── 🎯 DISPLAY HARGA: M (AGEN TERBESAR) VS JUAL (ECERAN TERKECIL) ── */}
                  <div className={styles.priceGrid}>
                    <span>M: <strong style={{ color: 'var(--text-main)' }}>Rp {(barang.hargaModalAgen || barang.hargaAgen || 0).toLocaleString('id-ID')}</strong>/{barang.satuanTerbesar || barang.satuanModal || 'Dus'}</span>
                    <span>Jual: <strong style={{ color: isEceranRugi ? '#ff3b30' : '#0a8168', fontWeight: '800' }}>Rp {barang.jual?.toLocaleString('id-ID')}</strong>/{barang.satuanJual || 'Pcs'}</span>
                  </div>

                  {/* ── 🎯 LOGIKA HITUNG MARGIN UNTUNG ADIL PER UNIT BESAR ── */}
                  <div style={{ marginTop: '5px', fontSize: '0.75rem', fontWeight: '700', textAlign: 'left' }}>
                    {(() => {
                      const totalIsiPaket = Number(barang.isiKeEceran || barang.isiGrosirBesar || 40);
                      const totalOmsetPerUnitBesar = (barang.jual || 0) * totalIsiPaket;
                      const totalModalAgen = Number(barang.hargaModalAgen || barang.hargaAgen || 0);
                      
                      const untungRupiahPerUnitBesar = totalOmsetPerUnitBesar - totalModalAgen;
                      const persenMargin = totalOmsetPerUnitBesar > 0 ? ((untungRupiahPerUnitBesar / totalOmsetPerUnitBesar) * 100).toFixed(1) : 0;

                      return untungRupiahPerUnitBesar > 0 ? (
                        <span style={{ color: '#0a8168', backgroundColor: 'rgba(10, 129, 104, 0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>📈 Margin Untung: {persenMargin}% (+Rp {untungRupiahPerUnitBesar.toLocaleString('id-ID')} / {barang.satuanTerbesar || barang.satuanModal || 'Dus'})</span>
                      ) : (
                        <span style={{ color: '#ff3b30', backgroundColor: 'rgba(255, 59, 48, 0.08)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>🛑 Jual Rugi: Selisih Rp {Math.abs(untungRupiahPerUnitBesar).toLocaleString('id-ID')}</span>
                      );
                    })()}
                  </div>
                </div>

                {isTerbuka && (
                  <div onClick={(e) => e.stopPropagation()} className={styles.detailPanel}>
                    {barang.varian && barang.varian.length > 0 && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>🎨 Varian Rasa:</span>
                        <div className={styles.badgeContainer}>
                          {barang.varian.map((v, i) => <span key={i} className={styles.badgeVarian}>{v}</span>)}
                        </div>
                      </div>
                    )}

                    {barang.bisaGrosir && (() => {
                      const marginGrosir = hitungMarginCuan(barang.modalGrosirTotal, barang.jualGrosirTotal);
                      return (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>🛒 Grosir ({barang.satuanGrosirNama || 'Renteng'}):</span> Beli min. {barang.minimalBeliGrosir} {barang.satuanJual || 'Pcs'} → <strong style={{ color: isGrosirRugi ? '#ff3b30' : '#0a8168' }}>Rp {barang.jualGrosirTotal ? barang.jualGrosirTotal.toLocaleString('id-ID') : '0'}</strong>
                          {Number(marginGrosir) > 0 && <span style={{ color: '#0a8168', marginLeft: '6px', fontWeight: 'bold', fontSize: '0.78rem' }}>(Cuan Grosir: {marginGrosir}%)</span>}
                        </div>
                      );
                    })()}

                    {barang.catatan && <p className={styles.boxCatatan}>📝 {barang.catatan}</p>}

                    <div className={styles.actionArea}>
                      <button onClick={() => bukaModalEdit(barang)} className={styles.btnEdit}>✏️ Edit Data</button>
                    </div>
                  </div>
                )}

                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Yakin ingin menghapus ${barang.nama}?`)) onHapusBarang(barang.id); }} className={styles.btnHapus}>Hapus</button>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Barang tidak ditemukan, Fi. 🧐</div>
        )}
      </div>
{/* POP-UP MODAL FORM EDIT / TAMBAH */}
      <ModalBarang key={isModalOpen ? (idBarangAktif || 'tambah_baru') : 'modal_tertutup'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} modalMode={modalMode} barangAktif={barangAktif} onSimpan={handleSimpanTerpisah} />

      {/* 📥 🎯 POP-UP MODAL IMPORT MIGRASI FIRESTORE (Menghilangkan warning ESLint) */}
      {isImportModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsImportModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px', boxSizing: 'border-box' }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--bg-header, #ffffff)', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '800' }}>📥 Impor Data Firestore</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #8e8e93)', marginBottom: '12px' }}>
              Paste teks isi file firestore_raw_2026_06_13.json di bawah ini untuk memindahkan data toko, Fi.
            </p>
            <textarea 
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste text JSON array di sini..."
              rows={8}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border-color, #eef0f3)', borderRadius: '8px', backgroundColor: 'var(--bg-toggle, #f2f2f7)', color: 'var(--text-main, #1c1c1e)', fontFamily: 'monospace', fontSize: '0.8rem', boxSizing: 'border-box', resize: 'none' }}
            />
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsImportModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: 'var(--border-color, #f2f2f7)', color: 'var(--text-muted, #8e8e93)', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleImportJson} style={{ padding: '9px 16px', borderRadius: '8px', backgroundColor: '#0a8168', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}>
                ✅ Impor Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default BukuWarung;