import { memo, useMemo } from 'react';
import styles from './SummaryCards.module.css';

// 🎯 IMPOR CUSTOM HOOK GUDANG GLOBAL
import { useAppGudang } from '../../context/useAppGudang.jsx'; 

function SummaryCards({ daftarBarang: propsDaftarBarang }) {
  
  // Ambil data dari gudang pusat sebagai cadangan utama
  const { daftarBarang: contextDaftarBarang } = useAppGudang();

  // ── 📊 HITUNG DATA RIIL WARUNG (LOGIKAL FILTER DIPINDAH KE DALAM USEMEMO) ──
  const { totalModal, totalJenisBarang } = useMemo(() => {
    // 🎯 AMAN: Menentukan sumber data di dalam useMemo agar tidak memicu re-render eksternal
    const dataMentah = propsDaftarBarang || contextDaftarBarang;
    const list = Array.isArray(dataMentah) ? dataMentah : [];
    
    // Hitung total modal stok toko
    const tm = list.reduce((sum, barang) => sum + (barang.modal || 0), 0);
    
    // Hitung total varian/jenis barang
    const tj = list.length;

    return { totalModal: tm, totalJenisBarang: tj };
  }, [propsDaftarBarang, contextDaftarBarang]); // 🎯 Dependency diubah ke props & context aslinya

  return (
    <div className={styles.summaryGrid}>
      {/* Kartu 1: Total Modal Stok */}
      <div className={`${styles.card} ${styles.cardModal}`}>
        <div className={styles.cardHeader}>
          <span className={styles.title}>TOTAL MODAL STOK</span>
          <span className={styles.icon}>📦</span>
        </div>
        <div className={styles.value}>
          <span className={styles.currency}>Rp </span>
          {totalModal.toLocaleString('id-ID')}
        </div>
      </div>

      {/* Kartu 2: Total Jenis Barang */}
      <div className={`${styles.card} ${styles.cardBarang}`}>
        <div className={styles.cardHeader}>
          <span className={styles.title}>TOTAL BARANG</span>
          <span className={styles.icon}>📋</span>
        </div>
        <div className={styles.value}>
          {totalJenisBarang} <span className={styles.subtext}>Item</span>
        </div>
      </div>
    </div>
  );
}

export default memo(SummaryCards);