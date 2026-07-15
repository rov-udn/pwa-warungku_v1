import { useState } from 'react';
import { useAppGudang } from '../../context/useAppGudang.jsx';

export default function DaftarWarung() {
  const { handleDaftarWarungBaru, handleLoginEmail } = useAppGudang();
  
  // State untuk switch antara Login dan Daftar
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // State Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pemilik, setPemilik] = useState('');
  const [namaWarung, setNamaWarung] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      alert('Email dan Password wajib diisi ya!');
      return;
    }

    if (isLoginMode) {
      // Eksekusi Login
      handleLoginEmail(email.trim(), password.trim());
    } else {
      // Eksekusi Daftar Baru
      if (!pemilik.trim() || !namaWarung.trim()) {
        alert('Nama Pemilik dan Nama Warung wajib diisi untuk pendaftaran baru, Bos!');
        return;
      }
      handleDaftarWarungBaru(email.trim(), password.trim(), pemilik.trim(), namaWarung.trim());
    }
  };

  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f4f6f9',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#0a8168', marginBottom: '8px' }}>
          {isLoginMode ? '🔓 Masuk Buku Warung' : '🏪 Registrasi Warung Baru'}
        </h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '24px' }}>
          {isLoginMode 
            ? 'Silakan masuk menggunakan email tokomu yang sudah terdaftar.' 
            : 'Mulai kelola produk secara cloud, terpisah aman, & offline-first.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#333', display: 'block', marginBottom: '6px' }}>Email</label>
            <input 
              type="email" 
              placeholder="contoh: warungku@gmail.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#333', display: 'block', marginBottom: '6px' }}>Password</label>
            <input 
              type="password" 
              placeholder="Minimal 6 karakter" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Kolom tambahan ini HANYA muncul kalau mode DAFTAR BARU */}
          {!isLoginMode && (
            <>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#333', display: 'block', marginBottom: '6px' }}>Nama Pemilik</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Haerudin" 
                  value={pemilik}
                  onChange={(e) => setPemilik(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#333', display: 'block', marginBottom: '6px' }}>Nama Warung</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Warung Haerudin" 
                  value={namaWarung}
                  onChange={(e) => setNamaWarung(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            style={{
              backgroundColor: '#0a8168',
              color: '#fff',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            {isLoginMode ? 'Masuk Sekarang 🚀' : 'Buka Warung Saya ✨'}
          </button>
        </form>

        <div style={{ marginTop: '20px', borderTop: '1px dashed #eee', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => setIsLoginMode(!isLoginMode)}
            style={{ background: 'none', border: 'none', color: '#0a8168', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            {isLoginMode ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Login di sini'}
          </button>
        </div>

      </div>
    </div>
  );
}