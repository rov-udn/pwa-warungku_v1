import { memo, useMemo } from 'react';
import styles from './SummaryCards.module.css';

// 🎯 IMPOR CUSTOM HOOK GUDANG GLOBAL
import { useAppGudang } from '../../context/useAppGudang.jsx'; 

function SummaryCards({ daftarBarang: propsDaftarBarang }) {
  // Ambil data dari gudang pusat sebagai cadangan utama
  const { daftarBarang: contextDaftarBarang } = useAppGudang();

  // ── 📊 HITUNG DATA RIIL WARUNG ──
  const { totalModal, totalJenisBarang } = useMemo(() => {
    const dataMentah = propsDaftarBarang || contextDaftarBarang;
    const list = Array.isArray(dataMentah) ? dataMentah : [];
    
    // Hitung total modal stok toko (aman dari string/NaN)
    const tm = list.reduce((sum, barang) => {
      const modalUnit = Number(barang.modal) || 0;
      // Jika ingin menghitung total modal x stok fisik, buka komentar baris di bawah:
      // const jumlahStok = Number(barang.stok) || 0;
      // return sum + (modalUnit * jumlahStok);
      
      return sum + modalUnit;
    }, 0);
    
    // Hitung total varian/jenis barang
    const tj = list.length;

    return { totalModal: tm, totalJenisBarang: tj };
  }, [propsDaftarBarang, contextDaftarBarang]);

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