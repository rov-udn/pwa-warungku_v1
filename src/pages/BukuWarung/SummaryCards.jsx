import { memo, useMemo } from 'react';
import styles from './SummaryCards.module.css';

function SummaryCards({ daftarBarang = [], totalKategori = 0 }) {
  // ── 📊 1. HITUNG DATA RIIL WARUNG HYBRID (MEMOIZED) ──
  const { totalModal, totalJenisBarang } = useMemo(() => {
    const list = Array.isArray(daftarBarang) ? daftarBarang : [];
    const tm = list.reduce((sum, barang) => sum + (barang.modal || 0), 0);
    const tj = list.length;
    return { totalModal: tm, totalJenisBarang: tj };
  }, [daftarBarang]);

  /* ── 🛑 AMANKAN KODE LAMA YANG BELUM FULL DIGITAL (DI-NONAKTIFKAN) ──
  const totalJual = daftarBarang.reduce((sum, barang) => sum + (barang.jual || 0), 0);
  const totalCuan = totalJual - totalModal;
  ─────────────────────────────────────────────────────────────────── */

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

      {/* Kartu 3: Total Kategori Aktif (Glow Neon Style 🚀) */}
      <div className={`${styles.card} ${styles.cardKategori} ${styles.fullWidthMobile}`}>
        <div className={styles.cardHeader}>
          <span className={styles.title}>TOTAL KATEGORI</span>
          <span className={styles.icon}>🏷️</span>
        </div>
        <div className={styles.valueGlow}>
          {totalKategori} <span className={styles.subtextKategori}>Kelompok</span>
        </div>
      </div>

      {/* ── 🛑 AMANKAN HTML KARTU LAMA (DI-NONAKTIFKAN) ──
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.title}>ESTIMASI OMSET</span>
          <span className={styles.icon}>💰</span>
        </div>
        <div className={styles.value}>
          <span className={styles.currency}>Rp </span>
          {totalJual.toLocaleString('id-ID')}
        </div>
      </div>
      ───────────────────────────────────────────────── */}
    </div>
  );
}

export default memo(SummaryCards);