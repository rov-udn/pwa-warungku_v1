import { useState, useEffect, useCallback, useMemo } from 'react';
import DashboardLayout from './component/layout/DashboardLayout.jsx';
import MainMenuNav from './component/sidebar/MainMenuNav.jsx';
import BukuWarung from './pages/BukuWarung/BukuWarung.jsx';
import Header from './component/header/Header.jsx';
import BelanjaAgen from './pages/BelanjaAgen/BelanjaAgen.jsx';
import HistoryWarung from './pages/History/HistoryWarung.jsx';
import { initialBarang } from './data/initialBarang.js';
import './global.css'; // 🎯 Pastikan diimport sebagai CSS biasa, bukan module!

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isScrolled, setIsScrolled] = useState(false);

  // 🟢 LOGIKA LOCALSTORAGE
  const [daftarBarang, setDaftarBarang] = useState(() => {
    const dataTersimpan = localStorage.getItem('warung_daftar_barang');
    return dataTersimpan ? JSON.parse(dataTersimpan) : initialBarang;
  });

  const [historyBelanja, setHistoryBelanja] = useState(() => {
    const historyTersimpan = localStorage.getItem('warung_history_belanja');
    return historyTersimpan ? JSON.parse(historyTersimpan) : [];
  });

  const [logPerubahanHarga, setLogPerubahanHarga] = useState(() => {
    const logTersimpan = localStorage.getItem('warung_log_perubahan_harga');
    return logTersimpan ? JSON.parse(logTersimpan) : [];
  });

  // 🔄 EFFECT SYNC LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('warung_daftar_barang', JSON.stringify(daftarBarang));
  }, [daftarBarang]);

  useEffect(() => {
    localStorage.setItem('warung_log_perubahan_harga', JSON.stringify(logPerubahanHarga));
  }, [logPerubahanHarga]);

  // ── 🔧 HELPER KONVERSI GROSIR AMAN ──
  const perPieceFromTotal = (total, units) => {
    const t = Number(total) || 0;
    const u = Math.max(1, Number(units) || 1);
    return Math.round(t / u);
  };

  // ── LOGIKA MUTASI DATA BARANG ──
  const handleTambahBarang = useCallback((barangBaru) => {
    setDaftarBarang((prevBarang) => [
      ...prevBarang,
      { ...barangBaru, id: Date.now() }
    ]);
  }, []);

  const handleEditBarang = useCallback((id, dataDiperbarui) => {
    setDaftarBarang((prevBarang) =>
      prevBarang.map((barang) =>
        barang.id === id ? { ...barang, ...dataDiperbarui } : barang
      )
    );
  }, []);

  const handleHapusBarang = useCallback((id) => {
    if(window.confirm("Yakin mau hapus barang ini dari toko, Fi?")) {
      setDaftarBarang((prevBarang) => prevBarang.filter(barang => barang.id !== id));
    }
  }, []);

  // ── 🛠️ FUNGSI AUTO-SYNC HARGA MODAL (BERSIH & AMAN) ──
  const handleUpdateHargaModal = useCallback((idBarang, hargaModalBaru, satuanBeliAgen = 'Pcs', prevModal = null) => {
    let logBaruBaru = null;

    setDaftarBarang((prevBarang) =>
      prevBarang.map((barang) => {
        if (barang.id === idBarang) {
          let modalEceranTerkecil;

          if (['Dus', 'Karton', 'Bal'].includes(satuanBeliAgen)) {
            const isiPerDus = Number(barang.minimalBeliGrosirBesar) || 40;
            modalEceranTerkecil = perPieceFromTotal(hargaModalBaru, isiPerDus);
          } else if (['Renteng', 'Pack', 'Slop'].includes(satuanBeliAgen)) {
            const isiPerRenteng = Number(barang.minimalBeliGrosir) || 10;
            modalEceranTerkecil = perPieceFromTotal(hargaModalBaru, isiPerRenteng);
          } else {
            modalEceranTerkecil = Math.round(Number(hargaModalBaru) || 0);
          }

          const modalLamaUntukLog = prevModal !== null ? Number(prevModal) : (barang.modal || 0);
          if (modalLamaUntukLog !== modalEceranTerkecil) {
            logBaruBaru = {
              idLog: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
              namaBarang: barang.nama,
              modalLama: modalLamaUntukLog,
              modalBaru: modalEceranTerkecil
            };
          }
          return { ...barang, modal: modalEceranTerkecil };
        }
        return barang;
      })
    );

    if (logBaruBaru) {
      setLogPerubahanHarga((prevLog) => [logBaruBaru, ...prevLog]);
    }
  }, []);

  const addLogPerubahanHarga = useCallback(({ namaBarang, modalLama, modalBaru }) => {
    if (modalLama === modalBaru) return;
    const entry = {
      idLog: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      namaBarang: namaBarang || 'Unknown',
      modalLama: Number(modalLama) || 0,
      modalBaru: Number(modalBaru) || 0
    };
    setLogPerubahanHarga((prev) => [entry, ...prev]);
  }, []);

  // ── ✏️ FUNGSI KOREKSI NOTA KULAKAN (VERSI SINKRONISASI MASSAL) ──
  const handleKoreksiNota = useCallback((idNota, itemsDiperbarui, totalPengeluaranBaru) => {
    setHistoryBelanja((prevHistory) => {
      const historyUpdate = prevHistory.map((nota) => {
        if (nota.id === idNota) {
          return {
            ...nota,
            items: itemsDiperbarui,
            totalPengeluarannya: totalPengeluaranBaru
          };
        }
        return nota;
      });
      localStorage.setItem('warung_history_belanja', JSON.stringify(historyUpdate));
      return historyUpdate;
    });

    setDaftarBarang((prevBarang) => {
      const barangUpdate = prevBarang.map((barang) => {
        const itemKoreksi = itemsDiperbarui.find(item => item.id === barang.id);
        if (itemKoreksi) {
          const modalEceranBaru = Number(itemKoreksi.modalEceranTerhitung) || 0;
          const hargaNotaAgenBaru = Number(itemKoreksi.modalBaru) || 0;
          const isiJembatanTengah = Number(barang.minimalBeliGrosir) || 10;
          const modalGrosirMenengahBaru = Number((modalEceranBaru * isiJembatanTengah).toFixed(4));

          return {
            ...barang,
            modal: modalEceranBaru,
            hargaModalAgen: hargaNotaAgenBaru,
            modalGrosirTotal: modalGrosirMenengahBaru
          };
        }
        return barang;
      });

      localStorage.setItem('warung_daftar_barang', JSON.stringify(barangUpdate));
      return barangUpdate;
    });
  }, []);

  // ── 📅 FUNGSI TAMBAH HISTORY BELANJAAN ──
  const handleTambahHistoryBelanja = useCallback((keranjangData) => {
    const notaBaru = {
      id: `NOTA-${Date.now()}`,
      tanggal: new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      items: keranjangData,
      totalPengeluarannya: keranjangData.reduce((sum, item) => sum + (item.modalBaru * item.qty), 0)
    };
    setHistoryBelanja((prevHistory) => {
      const historyTerbaru = [notaBaru, ...prevHistory];
      const batasWaktu = Date.now() - (15 * 24 * 60 * 60 * 1000);
      const historyFiltered = historyTerbaru.filter(nota => {
        const idTimestamp = Number(nota.id.split('-')[1]);
        return idTimestamp > batasWaktu;
      });

      localStorage.setItem('warung_history_belanja', JSON.stringify(historyFiltered));
      return historyFiltered;
    });
  }, []);

  // 🚀 FUNGSI ADAPTER FIRESTORE LAMA (🎯 FIXED: DENGAN LOGIKA UNIT DUS/KG & AUTO-SORT A-Z)
  const handleMigrasiDataFirestore = useCallback((dataFirestoreLama) => {
    try {
      const tebakKategoriDariNama = (namaBarang) => {
        const namaKecil = (namaBarang || '').toLowerCase();
        if (
          namaKecil.includes('rokok') || namaKecil.includes('filter') || namaKecil.includes('mild') || 
          namaKecil.includes('surya') || namaKecil.includes('djarum') || namaKecil.includes('samsoet') || 
          namaKecil.includes('sampoerna') || namaKecil.includes('magnum') || namaKecil.includes('korek') ||
          namaKecil.includes('gg') || namaKecil.includes('ji sam soe') || namaKecil.includes('bold')
        ) return 'Rokok/Korek';
        if (namaKecil.includes('mie') || namaKecil.includes('indomie') || namaKecil.includes('sedaap') || namaKecil.includes('intermie') || namaKecil.includes('sarimi')) return 'Mie/Instan';
        if (namaKecil.includes('kopi') || namaKecil.includes('kapal api') || namaKecil.includes('teh') || namaKecil.includes('susu') || namaKecil.includes('aqua') || namaKecil.includes('vit')) return 'Minuman/Kopi/Susu';
        if (namaKecil.includes('sabun') || namaKecil.includes('sampo') || namaKecil.includes('rinso') || namaKecil.includes('biore') || namaKecil.includes('sunlight')) return 'Sabun/Pembersih';
        if (namaKecil.includes('chiki') || namaKecil.includes('snack') || namaKecil.includes('wafer') || namaKecil.includes('oreo') || namaKecil.includes('roti') || namaKecil.includes('apel')) return 'Snack/Biskuit/Roti';
        if (namaKecil.includes('promag') || namaKecil.includes('bodrex') || namaKecil.includes('obat') || namaKecil.includes('panadol') || namaKecil.includes('paramex')) return 'Obat-obatan/Medical item';
        if (namaKecil.includes('plastik') || namaKecil.includes('cup') || namaKecil.includes('gelas') || namaKecil.includes('kantong')) return 'plastik/Cup';
        if (namaKecil.includes('beras') || namaKecil.includes('gula') || namaKecil.includes('terigu') || namaKecil.includes('minyak') || namaKecil.includes('bumbu') || namaKecil.includes('aci')) return 'Sembako/Dapur';
        return 'item lain';
      };

      const dataHasilKonversi = dataFirestoreLama.map((itemLama) => {
        const namaKecil = (itemLama.nama || '').toLowerCase();
        const kategoriAsliAtauNama = itemLama.kategori || itemLama.nama || '';
        const kategoriLower = kategoriAsliAtauNama.toLowerCase();
        
        const isRokok = namaKecil.includes('rokok') || namaKecil.includes('filter') || namaKecil.includes('mild') || namaKecil.includes('surya') || kategoriLower.includes('rokok') || kategoriLower.includes('korek');
        const isSembakoCurah = namaKecil.includes('beras') || namaKecil.includes('gula') || namaKecil.includes('terigu') || namaKecil.includes('aci') || namaKecil.includes('gunung');

        let minimalGrosirBesarDefault = Number(itemLama.minimalBeliGrosirBesar || itemLama.isiSatuan || itemLama.isiPerSatuan || (isSembakoCurah ? 25 : 40));
        if (minimalGrosirBesarDefault <= 1) minimalGrosirBesarDefault = isSembakoCurah ? 25 : 40;

        let modalEceranAwal = 0;
        if (itemLama.modalEceran !== undefined) {
          modalEceranAwal = Number(itemLama.modalEceran);
        } else if (itemLama.modal !== undefined) {
          modalEceranAwal = Number(itemLama.modal);
        } else if (itemLama.hargaAgen !== undefined && itemLama.hargaAgen > 0) {
          modalEceranAwal = Math.round(Number(itemLama.hargaAgen) / minimalGrosirBesarDefault);
        }

        const totalHargaAgen = Number(itemLama.hargaAgen || itemLama.jualGrosirBesarTotal || (modalEceranAwal * minimalGrosirBesarDefault));

        let hargaJualMurni = Number(itemLama.hargaEceran || itemLama.jual || itemLama.hargaJual || 0);
        if (hargaJualMurni === 0) {
          const hargaMentah = modalEceranAwal * 1.15;
          hargaJualMurni = Math.ceil(hargaMentah / 500) * 500;
        } else {
          hargaJualMurni = Math.round(hargaJualMurni);
        }

        let catatanGabungan = itemLama.catatan || '';
        if (!catatanGabungan && (itemLama.catatanUtama || itemLama.catatanHarga)) {
          catatanGabungan = [itemLama.catatanUtama || '', itemLama.catatanHarga || ''].filter(Boolean).join(' | ');
        }

        let satuanModalFinal = itemLama.satuanBeli || itemLama.satuanModal || (isRokok ? 'Slop' : isSembakoCurah ? 'Karung/Sak' : 'Dus');
        let satuanJualFinal = itemLama.satuanJual || (isRokok ? 'Bungkus' : isSembakoCurah ? 'Kg' : 'Pcs');

        let kategoriFinal = itemLama.kategori || tebakKategoriDariNama(itemLama.nama);
        const cekLower = kategoriFinal.toLowerCase();
        if (cekLower.includes('medical') || cekLower.includes('obat')) {
          kategoriFinal = 'Obat-obatan/Medical item';
        } else if (cekLower.includes('minuman') || cekLower.includes('kopi') || cekLower.includes('susu')) {
          kategoriFinal = 'Minuman/Kopi/Susu';
        } else if (cekLower.includes('snack') || cekLower.includes('roti') || cekLower.includes('biskuit')) {
          kategoriFinal = 'Snack/Biskuit/Roti';
        } else if (cekLower.includes('sabun') || cekLower.includes('bersih') || cekLower.includes('pembersih')) {
          kategoriFinal = 'Sabun/Pembersih';
        } else if (cekLower.includes('plastik') || cekLower.includes('cup')) {
          kategoriFinal = 'plastik/Cup';
        } else if (cekLower.includes('mie') || cekLower.includes('instan')) {
          kategoriFinal = 'Mie/Instan';
        } else if (cekLower.includes('sembako') || cekLower.includes('dapur')) {
          kategoriFinal = 'Sembako/Dapur';
        } else if (cekLower.includes('rokok') || cekLower.includes('korek')) {
          kategoriFinal = 'Rokok/Korek';
        }

        return {
          id: itemLama.id || `BARANG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          nama: itemLama.nama || 'Tanpa Nama',
          modal: modalEceranAwal, 
          hargaModalAgen: totalHargaAgen,         // Rp Agen Terbesar (M:)
          jual: hargaJualMurni,                   // Jual Eceran terkecil
          satuanModal: satuanModalFinal,
          satuanJual: satuanJualFinal,
          isiGrosirBesar: minimalGrosirBesarDefault,
          varian: itemLama.varian || [],
          bisaGrosir: true,
          minimalBeliGrosir: Number(itemLama.minimalBeliGrosir) || 10,
          satuanGrosirNama: isRokok ? 'Slop' : 'Kotak/Renteng',
          jualGrosir: Math.round(modalEceranAwal * 1.05),
          bisaGrosirBesar: !isRokok,
          minimalBeliGrosirBesar: minimalGrosirBesarDefault,
          satuanGrosirBesarNama: satuanModalFinal,
          jualGrosirBesarTotal: totalHargaAgen,
          jualGrosirBesarPerPcs: modalEceranAwal,
          catatan: catatanGabungan,
          stok: Number(itemLama.stok || 0),
          kategori: kategoriFinal
        };
      });

      // 🎯 URUTKAN BERDASARKAN ABJAD A-Z SEBELUM DISIMPAN
      const dataSudahUrutAZ = dataHasilKonversi.sort((a, b) => {
        return (a.nama || '').localeCompare(b.nama || '');
      });

      setDaftarBarang(dataSudahUrutAZ);
      localStorage.setItem('warung_daftar_barang', JSON.stringify(dataSudahUrutAZ));

      alert(`✅ Berhasil Sempurna! ${dataSudahUrutAZ.length} barang rapi berurutan A-Z di laci masing-masing!`);
    } catch (error) {
      console.error("Eror konversi data:", error);
      alert("❌ Waduh gagal konversi data, cek log konsol!");
    }
  }, []);
  
  const [activePage, setActivePage] = useState(() => {
    return window.innerWidth <= 768 ? 'dashboard' : 'buku-warung';
  });

  useEffect(() => {
    const handleResize = () => {
      const mobileStatus = window.innerWidth <= 768;
      setIsMobile(mobileStatus);
      if (!mobileStatus) setIsScrolled(false);
    };

    const handleScroll = () => {
      if (window.innerWidth <= 768) {
        setIsScrolled(window.scrollY > 30);
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
        <div style={{ 
          boxSizing: 'border-box', width: '100%', backgroundColor: 'var(--bg-body)', minHeight: '100vh',
          position: 'fixed', top: 'calc(var(--dynamic-header-height, 210px) + 12px)', left: 0,
          height: 'calc(100vh - calc(var(--dynamic-header-height, 210px) + 12px))', 
          overflowY: 'auto', padding: '20px 16px 80px 16px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#0a8168" style={{ filter: 'drop-shadow(0 0 4px rgba(10,129,104,0.3))' }}>
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)' }}>Menu Utama</h2>
          </div>
          <MainMenuNav halamanAktif={activePage} onMenuClick={handleMenuClick} />
          <div style={{ height: '60px' }}></div>
        </div>
      );
    }

    if (activePage === 'belanja' || (!isMobile && activePage === 'dashboard')) {
      return (
        <div style={{ paddingTop: !isMobile ? '20px' : '0' }}>
          <BelanjaAgen 
            daftarBarang={daftarBarang}
            onUpdateHargaModal={handleUpdateHargaModal}
            onTambahHistoryBelanja={handleTambahHistoryBelanja}
          />
          {isMobile && (
            <button 
              onClick={() => setActivePage('dashboard')} 
              style={{ marginTop: '16px', padding: '10px 16px', background: '#2a2a2a', border: 'none', color: '#fff', borderRadius: '10px', width: '100%', fontWeight: '700', fontSize: '0.9rem' }}
            >
              ⬅ Kembali ke Dashboard Utama
            </button>
          )}
        </div>
      );
    }

    if (activePage === 'buku-warung') {
      return (
        <>
          <BukuWarung   
            daftarBarang={daftarBarang} 
            onTambahBarang={handleTambahBarang}
            onEditBarang={handleEditBarang}
            onHapusBarang={handleHapusBarang} 
            onMigrasiFirestore={handleMigrasiDataFirestore}
            onUpdateHargaModal={handleUpdateHargaModal}
            onAddLogPerubahanHarga={addLogPerubahanHarga}
          />
          {isMobile && (
            <button 
              onClick={() => setActivePage('dashboard')} 
              style={{ marginTop: '20px', padding: '10px 16px', background: '#2a2a2a', border: 'none', color: '#fff', borderRadius: '6px', width: '100%', fontWeight: '500' }}
            >
              ⬅ Kembali ke Dashboard Utama
            </button>
          )}
        </>
      );
    }

    if (activePage === 'history') { 
      return (
        <div style={{ paddingTop: !isMobile ? '20px' : '0' }}>
          <HistoryWarung 
            historyBelanja={historyBelanja} 
            logPerubahanHarga={logPerubahanHarga}
            onKoreksiNota={handleKoreksiNota}
          />
          {isMobile && (
            <button 
              onClick={() => setActivePage('dashboard')} 
              style={{ marginTop: '16px', padding: '10px 16px', background: '#2a2a2a', border: 'none', color: '#fff', borderRadius: '10px', width: '100%', fontWeight: '700' }}
            >
              ⬅ Kembali ke Dashboard Utama
            </button>
          )}
        </div>
      );
    }

    if (activePage === 'kasir') {
      return (
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <h3>🎰 Modul Kasir</h3>
          <p style={{ color: 'var(--text-muted)' }}>Menu ini dinonaktifkan sementara karena kamu lebih cepat pakai manual! ⚡</p>
          {isMobile && <button onClick={() => setActivePage('dashboard')} style={{ marginTop: '20px', padding: '8px 16px', background: '#2a2a2a', border: 'none', color: '#fff', borderRadius: '6px' }}>Kembali</button>}
        </div>
      );
    }

    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Modul {activePage} sedang dikembangkan</h3>
        <button onClick={() => setActivePage('dashboard')} style={{ marginTop: '20px', padding: '8px 16px', background: '#2a2a2a', border: 'none', color: '#fff', borderRadius: '6px' }}>Kembali</button>
      </div>
    );
  }, [isMobile, activePage, daftarBarang, historyBelanja, logPerubahanHarga, handleUpdateHargaModal, addLogPerubahanHarga, handleTambahHistoryBelanja, handleTambahBarang, handleEditBarang, handleHapusBarang, handleMigrasiDataFirestore, handleKoreksiNota, handleMenuClick]);
  
  const memoedMainContent = useMemo(() => renderMainContent(), [renderMainContent]);

  return (
    <DashboardLayout 
      header={<Header activePage={activePage} isScrolled={isScrolled} daftarBarang={daftarBarang}/>}
      sidebar={
        isMobile ? (
          activePage !== 'dashboard' ? (
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'center', height: '100%', padding: '0 10px' }}>
              <button onClick={() => setActivePage('dashboard')} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill={activePage === 'dashboard' ? '#ffb703' : '#88888b'}>
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </button>
              <button onClick={() => setActivePage('belanja')} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill={activePage === 'belanja' ? '#ffb703' : '#88888b'}>
                  <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              <button onClick={() => setActivePage('history')} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill={activePage === 'history' ? '#ffb703' : '#88888b'}>
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </button>
              <button onClick={() => setActivePage('buku-warung')} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill={activePage === 'buku-warung' ? '#ffb703' : '#88888b'}>
                  <path d="M12 11.55C9.64 9.35 6.48 8 3 8v11c3.48 0 6.64 1.35 9 3.55 2.36-2.2 5.52-3.55 9-3.55V8c-3.48 0-6.64 1.35-9 3.55zM12 11.55V22"/>
                </svg>
              </button>
            </div>
          ) : null
        ) : (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '240px', height: '100vh', backgroundColor: '#121214', borderRight: '1px solid #2a2a2a', padding: '20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', zIndex: 90 }}>
            <p style={{ fontWeight: 'bold', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '15px' }}>NAVIGASI</p>
            <MainMenuNav halamanAktif={activePage} onMenuClick={handleMenuClick} />
            <div style={{ marginTop: 'auto', background: '#121212', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a2a' }}>
              <p style={{ color: 'var(--text-muted)' }}>Status App</p>
              <p style={{ color: '#00e676', fontWeight: 'bold', marginTop: '4px' }}>Rp Ready</p>
            </div>
          </div>
        )
      }
      mainContent={
        <div className="mainArea">
          {memoedMainContent}
        </div>
      }
      rightPanel={
        <div style={!isMobile ? { position: 'fixed', top: '195px', right: 0, width: '300px', height: '100vh', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', boxSizing: 'border-box', backgroundColor: '#ffffff', borderLeft: '1px solid #eef0f3' } : { display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: '1px solid #eef0f3' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1a1a1a', fontSize: '0.95rem' }}>Fitur Kanan</h4>
            <p style={{ fontSize: '0.8rem', color: '#88888b', margin: 0 }}>Log cepat aktif.</p>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: '1px solid #eef0f3', flexGrow: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1a1a1a', fontSize: '0.95rem' }}>Informasi Tambahan</h4>
            <p style={{ fontSize: '0.8rem', color: '#88888b', margin: 0 }}>Ringkasan performa warung hari ini.</p>
          </div>
        </div>
      }
    />
  );
}

export default App;