import { useState, useEffect, useMemo } from 'react';
import SummaryCards from "../../pages/BukuWarung/SummaryCards.jsx";

function Header({ activePage, daftarBarang = [] }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  // ── 📱 TOGGLE BUKA/TUTUP MANUAL MOBILE (DEFAULT: TERBUKA) ──
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const opsiTanggal = { weekday: 'short', day: '2-digit' };
  const formatTanggal = currentTime.toLocaleDateString('id-ID', opsiTanggal);
  const formatJam = currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // ── 📊 HITUNG DATA RIIL WARUNG HYBRID (MEMOIZED) ──
  // Logika Radar Otomatis Kategori untuk Hitung Total Kelompok Kategori Riil
  const dapatkanKategoriBarang = (nama) => {
    const namaKecil = (nama || '').toLowerCase();
    if (namaKecil.includes('rokok') || namaKecil.includes('filter') || namaKecil.includes('mild') || namaKecil.includes('surya')) return 'Rokok';
    if (namaKecil.includes('mie') || namaKecil.includes('indomie') || namaKecil.includes('sedaap') || namaKecil.includes('intermie')) return 'Mie Instan';
    if (namaKecil.includes('kopi') || namaKecil.includes('kapal api') || namaKecil.includes('teh') || namaKecil.includes('le minerale')) return 'Kopi / Minuman';
    if (namaKecil.includes('sabun') || namaKecil.includes('sampo') || namaKecil.includes('rinso') || namaKecil.includes('biore')) return 'Sabun / Sampo';
    if (namaKecil.includes('chiki') || namaKecil.includes('snack') || namaKecil.includes('wafer') || namaKecil.includes('biskuit')) return 'Camilan';
    return 'Sembako';
  };

  // Memoize perhitungan agar tidak rekalkulasi tiap kali header (waktu) berubah
  const { totalBarang, totalModal, totalKategori } = useMemo(() => {
    const list = Array.isArray(daftarBarang) ? daftarBarang : [];
    const tb = list.length;
    const tm = list.reduce((sum, b) => sum + (b.modal || 0), 0);
    const tk = new Set(list.map(b => dapatkanKategoriBarang(b.nama))).size;
    return { totalBarang: tb, totalModal: tm, totalKategori: tk };
  }, [daftarBarang]);

  /* ── 🛑 AMANKAN RUMUS LAMA YANG BELUM FULL DIGITAL (DI-NONAKTIFKAN) ──
  const totalJual = daftarBarang.reduce((sum, b) => sum + (b.jual || 0), 0);
  const totalCuan = totalJual - totalModal;
  ────────────────────────────────────────────────────────────────────── */

  const isMobile = window.innerWidth <= 768;

  // ── 📐 HITUNG TINGGI HEADER AKTIF (DIPERLONGGAR BIAR GAK TABRAKAN) ──
  const headerHeight = isMobile 
    ? (isExpanded ? '235px' : '62px') // 👈 Dari 210px kita naikin ke 235px, Fi!
    : '190px';

  // 🛠️ TENTARA SAKTI: Tembak langsung nilainya ke root dokumen agar CSS global bisa baca!
  useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-header-height', headerHeight);
  }, [headerHeight]);

  const isOnline = false;

  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? 0 : '20px',
      left: isMobile ? 0 : '240px',
      width: isMobile ? '100%' : 'calc(100% - 240px)',
      height: headerHeight,
      backgroundColor: 'var(--bg-header, #ffffff)',
      borderBottom: '1px solid var(--border-color, #eef0f3)',
      padding: isMobile 
        ? (isExpanded ? '12px 14px 20px 14px' : '10px 12px') 
        : '12px 16px',
      boxSizing: 'border-box',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '4px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
      borderRadius: isMobile ? '0 0 16px 16px' : '12px 0 0 12px', 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
      overflow: 'visible' 
    }}>
      
      {/* ── 📱 KONDISI HP PAS DI-MINIMIZE ── */}
      {isMobile && !isExpanded ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '100%', gap: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: '95px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)', whiteSpace: 'nowrap' }}>W. Haerudin</h1>
              <span style={{
                backgroundColor: isOnline ? 'rgba(39, 174, 96, 0.12)' : 'rgba(235, 87, 87, 0.12)',
                padding: '4px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: isOnline ? '1px solid rgba(39, 174, 96, 0.15)' : '1px solid rgba(235, 87, 87, 0.15)',
              }}>
                <span style={{ width: '6px', height: '6px', backgroundColor: isOnline ? '#2cc96b' : '#ff4d4d', borderRadius: '50%', boxShadow: isOnline ? '0 0 6px #2cc96b' : '0 0 6px #ff4d4d' }}></span>
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #8e8e93)', fontWeight: '600', marginTop: '1px' }}>
              {formatTanggal} • <span style={{ color: 'var(--text-main, #1c1c1e)' }}>{formatJam}</span>
            </div>
          </div>

          {/* 📊 SINKRONISASI BADGE MINI HEADER VERSI STRATEGI HYBRID */}
          <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ background: 'rgba(64,159,255,0.08)', padding: '5px 6px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: '700', color: '#409eff', whiteSpace: 'nowrap' }}>
              M:<span style={{color: 'var(--text-main, #1c1c1e)'}}>{(totalModal/1000).toFixed(0)}k</span>
            </div>
            <div style={{ background: 'rgba(230,162,60,0.08)', padding: '5px 6px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: '700', color: '#e6a23c', whiteSpace: 'nowrap' }}>
              B:<span style={{color: 'var(--text-main, #1c1c1e)'}}>{totalBarang} item</span>
            </div>
            <div style={{ background: 'rgba(103,194,58,0.08)', padding: '5px 6px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: '700', color: '#67c23a', whiteSpace: 'nowrap' }}>
              K:<span style={{color: 'var(--text-main, #1c1c1e)'}}>{totalKategori} Kat</span>
            </div>
          </div>

          <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: 'var(--bg-toggle, #f2f2f7)', border: '1px solid var(--border-color, #eef0f3)', padding: '5px 7px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', marginLeft: '1px' }}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      ) : (
        /* ── 💻 KONDISI NORMAL: MEKAR / DESKTOP ── */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)' }}>Warung Haerudin</h1>
              <span style={{
                backgroundColor: isOnline ? 'rgba(39, 174, 96, 0.1)' : 'rgba(235, 87, 87, 0.1)', color: isOnline ? '#27ae60' : '#eb5757', padding: '3px 6px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', border: isOnline ? '1px solid rgba(39, 174, 96, 0.15)' : '1px solid rgba(235, 87, 87, 0.15)', textTransform: 'uppercase'
              }}>
                <span style={{ width: '5px', height: '5px', backgroundColor: isOnline ? '#2cc96b' : '#ff4d4d', borderRadius: '50%', boxShadow: isOnline ? '0 0 6px #2cc96b' : '0 0 6px #ff4d4d' }}></span>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ background: 'var(--bg-toggle, #f2f2f7)', border: '1px solid var(--border-color, #eef0f3)', padding: '2px 8px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-main, #1c1c1e)', fontWeight: '600' }}>
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.68rem', paddingBottom: '2px', height: '16px' }}>
            <div style={{ color: 'var(--text-muted, #8e8e93)', fontWeight: '500' }}>
              Aplikasi Utama / <span style={{ color: '#0a8168', fontWeight: '700' }}>{activePage === 'buku-warung' ? 'Data Barang' : 'Dashboard'}</span>
            </div>
            <div style={{ color: 'var(--text-muted, #8e8e93)', fontWeight: '500', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>📅 {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
              <span style={{ color: 'var(--text-main, #1c1c1e)', fontWeight: '700' }}>🕒 {currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

          <div style={{ width: '100%', transform: isMobile ? 'scale(0.96)' : 'none', transformOrigin: 'top center', marginTop: '2px' }}>
            {/* 🎯 DATA UTAMA DIOPER KE KARTU SUMMARY UTK COCOKKAN LAYOUT 3 KOTAK */}
            <SummaryCards daftarBarang={daftarBarang} totalKategori={totalKategori} />
          </div>
        </>
      )}

      {/* ── 🔄 TOMBOL KLIK PENARIK MANUAL (EXPAND TOGGLE) ── */}
      {isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '42px',
            height: '20px',
            backgroundColor: 'var(--bg-header, #ffffff)',
            border: '1px solid var(--border-color, #eef0f3)',
            borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 6px rgba(0,0,0,0.05)',
            zIndex: 110,
            outline: 'none'
          }}
        >
          <span style={{ 
            fontSize: '0.65rem', 
            color: '#1c1c1e',   
            fontWeight: '900',  
            transition: 'transform 0.3s',
            display: 'inline-block',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            ▼
          </span>
        </button>
      )}

    </div>
  );
}

export default Header;