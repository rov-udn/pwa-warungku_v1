import { useState, useEffect, useMemo } from 'react';
import SummaryCards from "../../pages/BukuWarung/SummaryCards.jsx";
import { useAppGudang } from '../../context/useAppGudang.jsx';

// 🎯 SEKARANG MENERIMA isDarkMode DAN onToggleDarkMode DARI APP.JSX
function Header({ activePage, daftarBarang = [], isDarkMode, onToggleDarkMode }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { userWarung, isOnline, handleLogoutWarung } = useAppGudang();

  // Ambil nama warung secara dinamis, kalau belum terdaftar fallback ke 'Buku Warung'
  const namaTokoAktif = userWarung ? userWarung.namaWarung : 'Buku Warung';

  const handleKeluar = () => {
    if (window.confirm(`Bos ${userWarung?.pemilik || 'User'}, yakin mau keluar dari akun warung ini?`)) {
      handleLogoutWarung();
    }
  };

  // ── 📱 TOGGLE BUKA/TUTUP MANUAL MOBILE (DEFAULT: TERBUKA) ──
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 💡 HAPUS EFFECT LOCALSTORAGE DI SINI KARENA SUDAH DIKENDALIKAN PUSAT OLEH APP.JSX!

  const opsiTanggal = { weekday: 'short', day: '2-digit' };
  const formatTanggal = currentTime.toLocaleDateString('id-ID', opsiTanggal);
  const formatJam = currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });

  // ── 📊 HITUNG DATA RIIL WARUNG HYBRID (MEMOIZED) ──
  const dapatkanKategoriBarang = (nama) => {
    const namaKecil = (nama || '').toLowerCase();
    if (namaKecil.includes('rokok') || namaKecil.includes('filter') || namaKecil.includes('mild') || namaKecil.includes('surya')) return 'Rokok';
    if (namaKecil.includes('mie') || namaKecil.includes('indomie') || namaKecil.includes('sedaap') || namaKecil.includes('intermie')) return 'Mie Instan';
    if (namaKecil.includes('kopi') || namaKecil.includes('kapal api') || namaKecil.includes('teh') || namaKecil.includes('le minerale')) return 'Kopi / Minuman';
    if (namaKecil.includes('sabun') || namaKecil.includes('sampo') || namaKecil.includes('rinso') || namaKecil.includes('biore')) return 'Sabun / Sampo';
    if (namaKecil.includes('chiki') || namaKecil.includes('snack') || namaKecil.includes('wafer') || namaKecil.includes('biskuit')) return 'Camilan';
    return 'Sembako';
  };

  const { totalBarang, totalModal, totalKategori } = useMemo(() => {
    const list = Array.isArray(daftarBarang) ? daftarBarang : [];
    const tb = list.length;
    const tm = list.reduce((sum, b) => sum + (b.modal || 0), 0);
    const tk = new Set(list.map(b => dapatkanKategoriBarang(b.nama))).size;
    return { totalBarang: tb, totalModal: tm, totalKategori: tk };
  }, [daftarBarang]);

  const isMobile = window.innerWidth <= 768;

  const headerHeight = isMobile 
    ? (isExpanded ? '235px' : '62px') 
    : '190px';

  useEffect(() => {
    document.documentElement.style.setProperty('--dynamic-header-height', headerHeight);
  }, [headerHeight]);

  return (
    <div
      onClick={() => isMobile && setIsExpanded(!isExpanded)}
      style={{
        position: 'fixed',
        top: isMobile ? 0 : '20px',
        left: isMobile ? 0 : '240px',
        width: isMobile ? '100%' : 'calc(100% - 240px)',
        height: headerHeight,
        background: isDarkMode
          ? 'linear-gradient(135deg, rgba(10, 15, 27, 0.98), rgba(79, 140, 255, 0.2))'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(240, 247, 255, 0.96))',
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
        borderRadius: isMobile ? '0 0 18px 18px' : '16px 0 0 16px', 
        boxShadow: isDarkMode ? '0 16px 36px rgba(2, 8, 23, 0.36)' : '0 16px 36px rgba(15, 23, 42, 0.08)',
        overflow: 'visible',
        cursor: isMobile ? 'pointer' : 'default',
        backdropFilter: 'blur(16px)'
      }}
    >
      
      {/* ── 📱 KONDISI HP PAS DI-MINIMIZE ── */}
      {isMobile && !isExpanded ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: '95px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <h1 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)', whiteSpace: 'nowrap' }}>W. Haerudin</h1>
                <span style={{
                  backgroundColor: isOnline ? 'rgba(39, 174, 96, 0.12)' : 'rgba(220, 38, 38, 0.14)',
                  padding: '4px', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: isOnline ? '1px solid rgba(39, 174, 96, 0.2)' : '1px solid rgba(220, 38, 38, 0.2)',
                }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: isOnline ? '#2cc96b' : '#ff4d4d', borderRadius: '50%', boxShadow: isOnline ? '0 0 6px #2cc96b' : '0 0 6px #ff4d4d' }}></span>
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #8e8e93)', fontWeight: '600', marginTop: '1px' }}>
                {formatTanggal} • <span style={{ color: 'var(--text-main, #1c1c1e)' }}>{formatJam}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '4px', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
              <div style={{ background: 'rgba(64,159,255,0.08)', padding: '5px 6px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: '700', color: '#409eff', whiteSpace: 'nowrap' }}>
                M:<span style={{color: 'var(--text-main, #1c1c1e)'}}>{(totalModal/1000).toFixed(0)}k</span>
              </div>
              <div style={{ background: 'rgba(230,162,60,0.08)', padding: '5px 6px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: '700', color: '#e6a23c', whiteSpace: 'nowrap' }}>
                B:<span style={{color: 'var(--text-main, #1c1c1e)'}}>{totalBarang} item</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button onClick={(e) => { e.stopPropagation(); onToggleDarkMode(); }} style={{ background: 'var(--bg-toggle, #f2f2f7)', border: '1px solid var(--border-color, #eef0f3)', padding: '5px 7px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem' }}>
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      ) : (
        /* ── 💻 KONDISI NORMAL: MEKAR / DESKTOP ── */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? '1.05rem' : '1.25rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)' }}>{namaTokoAktif}</h1>
              <span style={{
                backgroundColor: isOnline ? 'rgba(39, 174, 96, 0.1)' : 'rgba(235, 87, 87, 0.1)', color: isOnline ? '#27ae60' : '#eb5757', padding: '3px 6px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px', border: isOnline ? '1px solid rgba(39, 174, 96, 0.15)' : '1px solid rgba(235, 87, 87, 0.15)', textTransform: 'uppercase'
              }}>
                <span style={{ width: '5px', height: '5px', backgroundColor: isOnline ? '#2cc96b' : '#ff4d4d', borderRadius: '50%', boxShadow: isOnline ? '0 0 6px #2cc96b' : '0 0 6px #ff4d4d' }}></span>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {/* 🎯 MEMICU SAKELAR DARI APP.JSX PUSAT */}
            <button onClick={onToggleDarkMode} style={{ background: 'var(--bg-toggle, #f2f2f7)', border: '1px solid var(--border-color, #eef0f3)', padding: '2px 8px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--text-main, #1c1c1e)', fontWeight: '600' }}>
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>

            {/* 🎯 3. TOMBOL LOG OUT SAKTI UNTUK TESTING */}
        <button 
          onClick={handleKeluar}
          style={{
            padding: '6px 12px',
            backgroundColor: '#fce8e6',
            border: '1px solid #c5221f',
            color: '#c5221f',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
        >
          🚪 Keluar
        </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.68rem', paddingBottom: '2px', height: '16px' }}>
            <div style={{ color: 'var(--text-muted, #8e8e93)', fontWeight: '500' }}>
              Aplikasi Utama / <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{activePage === 'buku-warung' ? 'Data Barang' : 'Dashboard'}</span>
            </div>
            <div style={{ color: 'var(--text-muted, #8e8e93)', fontWeight: '500', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>📅 {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
              <span style={{ color: 'var(--text-main, #1c1c1e)', fontWeight: '700' }}>🕒 {currentTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>

          <div style={{ width: '100%', transform: isMobile ? 'scale(0.96)' : 'none', transformOrigin: 'top center', marginTop: '2px' }}>
            <SummaryCards daftarBarang={daftarBarang} totalKategori={totalKategori} showKategori={false} />
          </div>
        </>
      )}

    </div>
  );
}

export default Header;