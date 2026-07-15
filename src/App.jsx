import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DashboardLayout from './component/layout/DashboardLayout.jsx';
import MainMenuNav from './component/sidebar/MainMenuNav.jsx';
import BukuWarung from './pages/BukuWarung/BukuWarung.jsx';
import Header from './component/header/Header.jsx';
import BelanjaAgen from './pages/BelanjaAgen/BelanjaAgen.jsx';
import HistoryWarung from './pages/History/HistoryWarung.jsx';
import RightSidebar from './component/sidebar/RightSidebar.jsx';
import './global.css';

// 🎯 IMPORT CUSTOM HOOK GUDANG GLOBAL
import { useAppGudang } from './context/useAppGudang.jsx';
import DaftarWarung from './pages/DaftarWarung/DaftarWarung.jsx';

const MOBILE_BREAKPOINT = 768;

function App() {
  // 🔒 STATE LOKAL KHUSUS UI
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);
  const [activePage, setActivePage] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT ? 'dashboard' : 'buku-warung');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const lastScrollYRef = useRef(0);

  // 🌐 AMBIL DATA DAN FUNGSI DARI GUDANG PUSAT CONTEXT
  const { 
    daftarBarang, userWarung, historyBelanja, logPerubahanHarga, isDark, toggleTheme,
    handleTambahBarang, handleEditBarang, handleHapusBarang,
    handleUpdateHargaModal, addLogPerubahanHarga, handleKoreksiNota,
    handleTambahHistoryBelanja, handleMigrasiDataFirestore
  } = useAppGudang();

  // 🔄 1. MENJAGA KESELAMATAN HOOKS (Ditempatkan sebelum kondisi IF)
  useEffect(() => {
    const handleResize = () => {
      const mobileStatus = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobileStatus);
      if (!mobileStatus) setShowBackToTop(false);
    };

    const handleScroll = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        const currentScrollY = window.scrollY;
        const isScrollingUp = currentScrollY > 120 && currentScrollY < lastScrollYRef.current;
        setShowBackToTop(isScrollingUp);
        lastScrollYRef.current = currentScrollY;
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMenuClick = useCallback((Id) => setActivePage(Id), []);

  const renderMainContent = useCallback(() => {
    if (isMobile && activePage === 'dashboard') {
      return (
        <div style={{ boxSizing: 'border-box', width: '100%', backgroundColor: 'var(--bg-body)', minHeight: '100vh', padding: '0px 16px 100px 16px' }}>
          <div style={{ background: 'var(--bg-toggle)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.8px' }}>STATUS GUDANG WARUNG</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-cyan)', textShadow: '0 0 12px rgba(0, 245, 255, 0.3)' }}>{daftarBarang.length}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '700' }}>Item Produk</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingLeft: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent-neon)"><path d="M4 13h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1zm10-8h6c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1zm0 8h6c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1h-6c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1z"/></svg>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>Menu Utama</h2>
          </div>
          <MainMenuNav halamanAktif={activePage} onMenuClick={handleMenuClick} />
        </div>
      );
    }

    if (activePage === 'belanja' || (!isMobile && activePage === 'dashboard')) {
      return (
        <div style={{ paddingTop: !isMobile ? '20px' : '0' }}>
          <BelanjaAgen daftarBarang={daftarBarang} onUpdateHargaModal={handleUpdateHargaModal} onTambahHistoryBelanja={handleTambahHistoryBelanja} />
          {isMobile && <button onClick={() => setActivePage('dashboard')} style={{ marginTop: '16px', padding: '10px 16px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '10px', width: '100%', fontWeight: '700' }}>⬅ Kembali ke Dashboard Utama</button>}
        </div>
      );
    }

    if (activePage === 'buku-warung') {
      return (
        <>
          <BukuWarung daftarBarang={daftarBarang} onTambahBarang={handleTambahBarang} onEditBarang={handleEditBarang} onHapusBarang={handleHapusBarang} onMigrasiFirestore={handleMigrasiDataFirestore} onUpdateHargaModal={handleUpdateHargaModal} onAddLogPerubahanHarga={addLogPerubahanHarga} />
          {isMobile && <button onClick={() => setActivePage('dashboard')} style={{ marginTop: '20px', padding: '10px 16px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: '6px', width: '100%', fontWeight: '500' }}>⬅ Kembali ke Dashboard Utama</button>}
        </>
      );
    }

    if (activePage === 'history') { 
      return (
        <div style={{ paddingTop: !isMobile ? '20px' : '0' }}>
          <HistoryWarung historyBelanja={historyBelanja} logPerubahanHarga={logPerubahanHarga} onKoreksiNota={handleKoreksiNota} daftarBarang={daftarBarang} />
          {isMobile && <button onClick={() => setActivePage('dashboard')} style={{ marginTop: '16px', padding: '10px 16px', background: '#2a2a2a', border: 'none', color: '#fff', borderRadius: '10px', width: '100%', fontWeight: '700' }}>⬅ Kembali ke Dashboard Utama</button>}
        </div>
      );
    }

    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Modul Kasir & Lainnya</h3>
        <p style={{ color: 'var(--text-muted)' }}>Operasional dialihkan sementara ⚡</p>
        <button onClick={() => setActivePage('dashboard')} style={{ marginTop: '20px', padding: '8px 16px', background: 'var(--accent)', border: '#fff', color: '#fff', borderRadius: '6px' }}>Kembali</button>
      </div>
    );
  }, [isMobile, activePage, daftarBarang, historyBelanja, logPerubahanHarga, handleUpdateHargaModal, addLogPerubahanHarga, handleTambahHistoryBelanja, handleTambahBarang, handleEditBarang, handleHapusBarang, handleMigrasiDataFirestore, handleKoreksiNota, handleMenuClick]);
  
  const memoedMainContent = useMemo(() => renderMainContent(), [renderMainContent]);

  // 🎯 2. PINDAHKAN GERBANG KE SINI (Setelah semua Hooks dideklarasikan dengan sah)
  if (!userWarung) {
    return <DaftarWarung />;
  }

  // 📦 3. RETURN LAYOUT UTAMA SEPERTI BIASA
  return (
    <DashboardLayout 
      header={<Header activePage={activePage} daftarBarang={daftarBarang} isDarkMode={isDark} onToggleDarkMode={toggleTheme} />}
      sidebar={
        isMobile ? (
          activePage !== 'dashboard' && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '74px', background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.98))', borderTop: '1px solid var(--border-color)', display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center', zIndex: 9999, padding: '0 12px 8px 12px', backdropFilter: 'blur(16px)' }}>
              <button onClick={() => setActivePage('dashboard')} style={{ background: activePage === 'dashboard' ? 'var(--bg-nav-active)' : 'transparent', border: 'none', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill={activePage === 'dashboard' ? 'var(--accent)' : 'var(--icon-nav-inactive)'}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></button>
              <button onClick={() => setActivePage('belanja')} style={{ background: activePage === 'belanja' ? 'var(--bg-nav-active)' : 'transparent', border: 'none', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill={activePage === 'belanja' ? 'var(--accent)' : 'var(--icon-nav-inactive)'}><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg></button>
              <button onClick={() => setActivePage('history')} style={{ background: activePage === 'history' ? 'var(--bg-nav-active)' : 'transparent', border: 'none', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill={activePage === 'history' ? 'var(--accent)' : 'var(--icon-nav-inactive)'}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></button>
              <button onClick={() => setActivePage('buku-warung')} style={{ background: activePage === 'buku-warung' ? 'var(--bg-nav-active)' : 'transparent', border: 'none', padding: '8px 10px', borderRadius: '12px', minWidth: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" viewBox="0 0 24 24" fill={activePage === 'buku-warung' ? 'var(--accent)' : 'var(--icon-nav-inactive)'}><path d="M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.2 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55zM12 11.55V22"/></svg></button>
            </div>
          )
        ) : (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '240px', height: '100vh', backgroundColor: 'var(--bg-header)', borderRight: '1px solid var(--border-color)', padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', zIndex: 90 }}>
            <p style={{ fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '15px' }}>NAVIGASI</p>
            <MainMenuNav halamanAktif={activePage} onMenuClick={handleMenuClick} />
            <div style={{ marginTop: 'auto', background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)' }}>Status App</p>
              <p style={{ color: '#00e676', fontWeight: 'bold', marginTop: '4px' }}>Rp Ready</p>
            </div>
          </div>
        )
      }
      mainContent={
        <div className="mainArea" style={{ position: 'relative' }}>
          {memoedMainContent}
          {isMobile && showBackToTop && (
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '84px', right: '16px', zIndex: 10000, width: '52px', height: '52px', borderRadius: '50%', border: 'none', background: 'linear-gradient(180deg, var(--accent-cyan), var(--accent-neon))', color: '#fff', boxShadow: '0 12px 24px rgba(0,85,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬆</button>
          )}
        </div>
      }
      rightPanel={activePage === 'dashboard' ? null : <RightSidebar logPerubahanHarga={logPerubahanHarga} />}
    />
  );
}

export default App;