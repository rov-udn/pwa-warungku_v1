import { memo, useMemo } from 'react';

function MainMenuNav({ halamanAktif, onMenuClick }) {
  // ── 🕹️ DAFTAR MENU DENGAN INJEKSI SVG MURNI (MEMOIZED - BIARKAN TETAP MILIKMU) ──
  const menuItems = useMemo(() => [
    { 
      id: 'buku-warung', 
      label: 'Data Barang', 
      sub: 'Stok & Gudang',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={halamanAktif === 'buku-warung' ? 'var(--icon-nav-active, #0a8168)' : 'var(--icon-nav-inactive, #88888b)'}>
          <path d="M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.2 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55zM12 11.55V22"/>
        </svg>
      )
    },
    { 
      id: 'belanja', 
      label: 'Belanja Agen', 
      sub: 'Kalkulator Nota',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={halamanAktif === 'belanja' ? 'var(--icon-nav-active, #0a8168)' : 'var(--icon-nav-inactive, #88888b)'}>
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      )
    },
    { 
      id: 'kasir', 
      label: 'Mesin Kasir', 
      sub: 'Transaksi POS',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={halamanAktif === 'kasir' ? 'var(--icon-nav-active, #0a8168)' : 'var(--icon-nav-inactive, #88888b)'}>
          <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
        </svg>
      )
    }, 
    { 
      id: 'history', 
      label: 'Catatan History', 
      sub: 'Rekap & Log Harga',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={halamanAktif === 'history' ? 'var(--icon-nav-active, #0a8168)' : 'var(--icon-nav-inactive, #88888b)'}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
        </svg>
      )
    }
  ], [halamanAktif]);

  return (
    /* ── 🎯 BERJEJER KE BAWAH (1 KOLOM) PAS DI TENGAH CANVAS ── */
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '10px', 
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {menuItems.map((item) => {
        const isActive = halamanAktif === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onMenuClick(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              height: '68px',
              width: '100%',
              padding: '0 16px',
              border: 'none',
              borderRadius: '14px',
              cursor: 'pointer',
              background: isActive
                ? 'var(--bg-nav-active)'
                : (document.body.classList.contains('dark-theme') ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.88)'),
              color: isActive ? 'var(--accent-nav-active)' : (document.body.classList.contains('dark-theme') ? 'var(--text-main)' : '#1c1c1e'),
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'left',
              boxShadow: isActive ? 'inset 0 0 0 1.5px var(--accent-cyan), 0 10px 20px rgba(15, 23, 42, 0.08)' : '0 8px 16px rgba(15, 23, 42, 0.04)',
              position: 'relative',
              boxSizing: 'border-box',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Area Pembungkus Ikon (Lebih ramping) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: isActive ? 'linear-gradient(135deg, var(--accent), var(--accent-cyan))' : 'rgba(15, 23, 42, 0.05)',
              color: isActive ? '#ffffff' : 'inherit',
              flexShrink: 0,
              boxShadow: isActive ? '0 6px 16px rgba(10, 129, 104, 0.16)' : 'none'
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
            </div>

            {/* 📝 Teks Judul Menu & Sub Sejajar Horizontal */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontWeight: '700', fontSize: '0.92rem', lineHeight: '1.2' }}>
                {item.label}
              </div>
              <div style={{ 
                fontSize: '0.72rem', 
                color: 'var(--text-muted, #8e8e93)', 
                marginTop: '2px' 
              }}>
                {item.sub}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default memo(MainMenuNav);