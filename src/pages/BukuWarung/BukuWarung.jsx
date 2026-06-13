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

  // ── 🏷️ DAFTAR KATEGORI UNTUK QUICK FILTER (Sama persis dengan Belanja Agen) ──
  const daftarKategori = ['Semua', 'Sembako', 'Rokok', 'Mie Instan', 'Kopi / Minuman', 'Sabun / Sampo', 'Camilan'];

  // Fungsi radar otomatis untuk mengelompokkan barang berdasarkan nama
  const dapatkanKategoriBarang = (nama) => {
    const namaKecil = nama.toLowerCase();
    if (namaKecil.includes('rokok') || namaKecil.includes('filter') || namaKecil.includes('mild') || namaKecil.includes('surya')) return 'Rokok';
    if (namaKecil.includes('mie') || namaKecil.includes('indomie') || namaKecil.includes('sedaap') || namaKecil.includes('intermie')) return 'Mie Instan';
    if (namaKecil.includes('kopi') || namaKecil.includes('kapal api') || namaKecil.includes('teh') || namaKecil.includes('le minerale')) return 'Kopi / Minuman';
    if (namaKecil.includes('sabun') || namaKecil.includes('sampo') || namaKecil.includes('rinso') || namaKecil.includes('biore')) return 'Sabun / Sampo';
    if (namaKecil.includes('chiki') || namaKecil.includes('snack') || namaKecil.includes('wafer') || namaKecil.includes('biskuit')) return 'Camilan';
    return 'Sembako';
  };

  // ── 🔍 FILTER DOUBLE SAKTI: SEARCH TEXT + KATEGORI KLIK (FIXED) ──
  const barangFiltered = useMemo(() => {
    return daftarBarang.filter((barang) => {
      const cocokSearch = barang.nama.toLowerCase().includes(searchTerm.toLowerCase());
      const katBarang = dapatkanKategoriBarang(barang.nama);
      const cocokKategori = kategoriAktif === 'Semua' || katBarang.toLowerCase() === kategoriAktif.toLowerCase();
      return cocokSearch && cocokKategori;
    });
  }, [daftarBarang, searchTerm, kategoriAktif]);

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
      // Jika harga modal berubah pada edit, catat perubahan harga melalui handler global
      // Simpan perubahan terlebih dahulu, lalu kirim sinyal log perubahan harga
      onEditBarang(idBarangAktif, dataBaru);
      try {
        const modalLama = barangAktif?.modal || 0;
        const modalBaru = Number(dataBaru.modal) || 0;
        
        if (modalBaru !== modalLama && typeof onAddLogPerubahanHarga === 'function') {
          onAddLogPerubahanHarga({ namaBarang: barangAktif?.nama, modalLama, modalBaru });
        }
      } catch (e) {
        console.error('Gagal mencatat perubahan harga dari BukuWarung:', e);
      }
    }
    setIsModalOpen(false);
  };

  const handleImportJson = () => {
    if (!importJsonText.trim()) {
      alert('Masukkan JSON terlebih dahulu');
      return;
    }
    const result = importAndTransformJSON(importJsonText);
    if (!result.success) {
      alert(`❌ Error: ${result.error}`);
      return;
    }
    if (typeof onMigrasiFirestore === 'function') {
      onMigrasiFirestore(result.data);
      alert(`✅ Berhasil mengimpor ${result.count} barang dari Firestore!`);
      setImportJsonText('');
      setIsImportModalOpen(false);
    } else {
      alert('❌ Migration handler tidak tersedia');
    }
  };

  return (
    <div className={styles.container}>
      
      {/* ── 🏷️ HEADER ATAS HALAMAN ── */}
      <div className={styles.headerArea}>
        <h2 className={styles.mainTitle}>Buku Warung (Data Barang)</h2>
        <p className={styles.subHeader}>
          💡 Tips: Ketuk kartu barang untuk melihat varian rasa, harga grosir & rentengan.
        </p>
      </div>

      {/* ── 📊 BARIS TOMBOL TAMBAH & INPUT CARI ── */}
      <div>
        <div className={styles.searchRow}>
          <input 
            type="text"
            placeholder="🔎 Ketik nama barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchBar}
          />
          {/* FIX: Diubah ke bukaModalTambah agar tidak crash not defined */}
          <button onClick={bukaModalTambah} className={styles.btnTambah}>
            + Barang
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className={styles.btnImport} title="Import dari Firestore">
            📥 Migrasi
          </button>
        </div>

        {/* 🟢 TOMBOL KATEGORI SCROLL HORIZONTAL KHAS KASIR MODERN 🟢 */}
        <div className={styles.scrollKategori}>
          {daftarKategori.map((kat) => {
            const isAktif = kategoriAktif === kat;
            return (
              <button
                key={kat}
                type="button"
                onClick={() => setKategoriAktif(kat)}
                className={`${styles.btnKategoriPill} ${isAktif ? styles.btnKategoriActive : ''}`}
              >
                {kat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 📦 LIST KARTU DAFTAR BARANG (ACCORDION) ── */}
      <div className={styles.listContainer}>
        {/* FIX: Menggunakan barangFiltered agar fitur klik kategori berfungsi menyaring barang */}
        {barangFiltered.length > 0 ? (
          barangFiltered.map((barang) => {
            const isTerbuka = idCardTerbuka === barang.id;

            return (
              <div 
                key={barang.id}
                onClick={() => setIdCardTerbuka(isTerbuka ? null : barang.id)}
                className={styles.cardItem}
              >
                {/* Info Utama Barang (Selalu Terlihat) */}
                <div className={styles.cardMainInfo}>
                  {/* SUNTIKKAN BADGE TAG KATEGORI OTOMATIS */}
                  <span className={styles.badgeKategori}>
                    {dapatkanKategoriBarang(barang.nama)}
                  </span>

                  <h4 className={styles.barangNama}>{barang.nama}</h4>
                  <div className={styles.priceGrid}>
                    <span>M: <strong style={{ color: 'var(--text-main)' }}>Rp {barang.modal?.toLocaleString('id-ID')}</strong>/{barang.satuanModal || 'Pcs'}</span>
                    <span>Jual: <strong style={{ color: '#0a8168' }}>Rp {barang.jual?.toLocaleString('id-ID')}</strong>/{barang.satuanJual || 'Pcs'}</span>
                  </div>
                </div>

                {/* ── 🔽 PANEL DETAIL MEKAR ── */}
                {isTerbuka && (
                  <div onClick={(e) => e.stopPropagation()} className={styles.detailPanel}>
                    
                    {/* Detail Varian Rasa */}
                    {barang.varian && barang.varian.length > 0 && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>🎨 Varian Rasa:</span>
                        <div className={styles.badgeContainer}>
                          {barang.varian.map((v, i) => (
                            <span key={i} className={styles.badgeVarian}>{v}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detail Grosir Menengah (Renteng) */}
                    {barang.bisaGrosir && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>🛒 Grosir ({barang.satuanGrosirNama || 'Renteng'}):</span> Beli min. {barang.minimalBeliGrosir} Pcs → <strong style={{ color: '#0a8168' }}>Rp {barang.jualGrosir?.toLocaleString('id-ID')}</strong> /pcs
                      </div>
                    )}

                    {/* Detail Grosir Besar (Dus) - VERSI SINKRON BELANJA AGEN */}
                    {barang.bisaGrosirBesar && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>📦 Grosir Besar ({barang.satuanGrosirBesarNama || 'Dus'}):</span> Isi {barang.minimalBeliGrosirBesar} Pcs → <strong>Rp {barang.jualGrosirBesarTotal?.toLocaleString('id-ID')}</strong> 
                        <span style={{ color: '#0a8168', fontWeight: '700', fontSize: '0.8rem', marginLeft: '6px' }}>
                          (Jatuhnya Rp {barang.jualGrosirBesarPerPcs ? Math.round(barang.jualGrosirBesarPerPcs).toLocaleString('id-ID') : Math.round(barang.jualGrosirBesarTotal / (barang.minimalBeliGrosirBesar || 1)).toLocaleString('id-ID')}/pcs)
                        </span>
                      </div>
                    )}

                    {/* Catatan Manual */}
                    {barang.catatan && (
                      <p className={styles.boxCatatan}>📝 {barang.catatan}</p>
                    )}

                    {/* Tombol Aksi Edit Di Dalam Laci */}
                    <div className={styles.actionArea}>
                      <button onClick={() => bukaModalEdit(barang)} className={styles.btnEdit}>
                        ✏️ Edit Data
                      </button>
                    </div>
                  </div>
                )}

                {/* 🗑️ TOMBOL HAPUS */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Yakin ingin menghapus ${barang.nama}?`)) {
                      onHapusBarang(barang.id);
                    }
                  }}
                  className={styles.btnHapus}
                >
                  Hapus
                </button>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Barang tidak ditemukan, Fi. 🧐
          </div>
        )}
      </div>

      {/* ── 🚨 POP-UP MODAL ── */}
      <ModalBarang 
        key={isModalOpen ? (idBarangAktif || 'tambah_baru') : 'modal_tertutup'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalMode={modalMode}
        barangAktif={barangAktif}
        onSimpan={handleSimpanTerpisah}
      />

      {/* ── 📥 MODAL IMPORT FIRESTORE ── */}
      {isImportModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsImportModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>📥 Impor Data Firestore</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Paste JSON dari export Firestore atau file transformed_*.json
            </p>
            <textarea 
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste JSON array di sini..."
              rows={8}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              }}
            />
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsImportModalOpen(false)} style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: '#f0f0f0', border: 'none', cursor: 'pointer' }}>
                Batal
              </button>
              <button onClick={handleImportJson} style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
                ✅ Impor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default BukuWarung;