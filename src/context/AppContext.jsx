import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase.js'; 
import { ref, set, onValue } from 'firebase/database';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// 🎯 IMPOR PONDASI CONTEXT DARI FILE TERPISAH
import { AppContext } from './AppContextCore.jsx';

// Indikator status koneksi internet browser
const getOnlineStatus = () => typeof navigator !== 'undefined' ? navigator.onLine : true;

const readStoredState = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch (error) {
    console.warn(`Gagal membaca ${key}:`, error);
    return fallback;
  }
};

const perPieceFromTotal = (total, units) => {
  const t = Number(total) || 0;
  const u = Math.max(1, Number(units) || 1);
  return Math.ceil(t / u);
};

// 🛡️ GARDA PENGAMAN: Memastikan 100% variabel barang bersih & presisi
const sanitizeBarang = (item) => {
  const safeNumber = (v, fallback = 0) => {
    if (v === '' || v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  const safeString = (v, fallback = '') => {
    if (v === undefined || v === null) return fallback;
    return String(v).trim();
  };

  // 🎯 1. HARGA NOTA / MODAL AGEN (Satuan Terbesar)
  const hargaModalAgen = safeNumber(item.hargaModalAgen, 0);

  // 🎯 2. ISI PCS DALAM PAKET/DUS (Pakai fallback 1)
  const isiKeEceran = safeNumber(item.isiKeEceran, 1) || 1;

  // 🎯 3. HITUNG MODAL ECERAN RIIL PER PCS
  const modalEceranRiil = hargaModalAgen > 0 && isiKeEceran > 0
    ? Math.ceil(hargaModalAgen / isiKeEceran)
    : safeNumber(item.modal, 0);

  // 🎯 4. HARGA JUAL ECERAN & GROSIR
  const hargaJualEceran = safeNumber(item.jual, 0);
  const bisaGrosir = item.bisaGrosir !== undefined ? Boolean(item.bisaGrosir) : false;
  const jualGrosirTotal = safeNumber(item.jualGrosirTotal, 0);
  const modalGrosirTotal = safeNumber(item.modalGrosirTotal, 0);

  // 🎯 5. KEMBALIKAN SKEMA CLEAN & UNIFORM
  return {
    id: item.id || `BARANG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nama: safeString(item.nama, 'Tanpa Nama'),
    kategori: safeString(item.kategori, 'item lain'),
    
    // Core Math Fields
    hargaModalAgen: hargaModalAgen,
    modal: modalEceranRiil,
    jual: hargaJualEceran,
    isiKeEceran: isiKeEceran,

    // Satuan
    satuanTerbesar: safeString(item.satuanTerbesar, 'Dus'),
    satuanJual: safeString(item.satuanJual, 'Pcs'),

    // Fitur Grosir
    bisaGrosir: bisaGrosir,
    minimalBeliGrosir: safeNumber(item.minimalBeliGrosir, 0),
    satuanGrosirNama: safeString(item.satuanGrosirNama, 'Renteng'),
    jualGrosirTotal: jualGrosirTotal,
    modalGrosirTotal: modalGrosirTotal,

    // Pelengkap & Metadata
    varian: Array.isArray(item.varian) ? item.varian : [],
    catatan: safeString(item.catatan),
    stok: safeNumber(item.stok, 0)
  };
};

export function AppProvider({ children }) {
  // ── 👤 STATE MULTI-USER WARUNG VIA CLOUD AUTH ──
  const [userWarung, setUserWarung] = useState(() => {
    const savedUser = localStorage.getItem('warung_aktif_user');
    return savedUser ? JSON.parse(savedUser) : null; 
  });

  // ── 🌐 STATE KONEKSI OFFLINE/ONLINE REALTIME ──
  const [isOnline, setIsOnline] = useState(getOnlineStatus());

  const [activePage, setActivePage] = useState(() => 
    typeof window !== 'undefined' && window.innerWidth <= 768 ? 'dashboard' : 'buku-warung'
  );

  // Pantau perubahan jaringan internet secara real-time
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🎯 KUNCI UTAMA: Menggunakan UID unik Firebase Auth sebagai folder pemisah antar warung!
  const prefixPath = userWarung ? `users/${userWarung.idWarung}` : 'lokal_guest';

  const STORAGE_KEYS = {
    barang: `${prefixPath}_daftar_barang`,
    history: `${prefixPath}_history_belanja`,
    logHarga: `${prefixPath}_log_perubahan_harga`
  };

  // ── 📊 STATES GLOBAL ──
  const [daftarBarang, setDaftarBarang] = useState(() => readStoredState(STORAGE_KEYS.barang, []));
  const [historyBelanja, setHistoryBelanja] = useState(() => readStoredState(STORAGE_KEYS.history, []));
  const [logPerubahanHarga, setLogPerubahanHarga] = useState(() => readStoredState(STORAGE_KEYS.logHarga, []));
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // ── 🔄 DETEKSI REALTIME STATUS LOGIN EMAIL (FIREBASE AUTH WATCHER) ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        onValue(ref(db, `users/${user.uid}/profile`), (snapshot) => {
          const profileData = snapshot.val();
          if (profileData) {
            const sessionUser = {
              idWarung: user.uid, 
              email: user.email,
              pemilik: profileData.pemilik,
              namaWarung: profileData.namaWarung
            };
            localStorage.setItem('warung_aktif_user', JSON.stringify(sessionUser));
            setUserWarung(sessionUser);
          }
        });
      } else {
        localStorage.removeItem('warung_aktif_user');
        setUserWarung(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // ── 🔑 MULTI-USER CLOUD ACTIONS ──
  const handleDaftarWarungBaru = useCallback(async (email, password, namaPemilik, namaWarungBaru) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid; 

      const dataUserBaru = {
        idWarung: uid, 
        pemilik: namaPemilik,
        namaWarung: namaWarungBaru,
        dbuatPada: new Date().toISOString()
      };

      await set(ref(db, `users/${uid}/profile`), dataUserBaru);
      
      setDaftarBarang([]);
      setHistoryBelanja([]);
      setLogPerubahanHarga([]);
      
      alert(`🎉 Selamat Akun Berhasil Dibuat!\nWarung ${namaWarungBaru} sudah siap digunakan, Bos ${namaPemilik}!`);
    } catch (error) {
      console.error(error);
      alert(`❌ Gagal Mendaftar: ${error.message}`);
    }
  }, []);

  const handleLoginEmail = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("🔓 Login Sukses! Data warung Anda otomatis disinkronkan.");
      setActivePage('dashboard'); 
    } catch (error) {
      console.error(error);
      alert(`❌ Login Gagal: ${error.message}`);
    }
  }, []);

  const handleLogoutWarung = useCallback(async () => {
    const namaPanggilan = userWarung ? userWarung.pemilik : 'Bos';
    if (window.confirm(`Keluar dari warung saat ini, ${namaPanggilan}?`)) {
      try {
        await signOut(auth);
        setDaftarBarang(readStoredState('lokal_guest_daftar_barang', []));
        setHistoryBelanja(readStoredState('lokal_guest_history_belanja', []));
        setLogPerubahanHarga(readStoredState('lokal_guest_log_perubahan_harga', []));
        alert("🚪 Berhasil Keluar Akun!");
      } catch (error) {
        console.error("Gagal logout:", error);
      }
    }
  }, [userWarung]);

  // ── 💾 ACTION SINKRONISASI SMART OFFLINE-FIRST ──
  const persistAndSync = useCallback((key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    
    if (getOnlineStatus() && userWarung) {
      const firebasePath = key.replace(`${prefixPath}_`, ''); 
      set(ref(db, `users/${userWarung.idWarung}/${firebasePath}`), value);
    }
  }, [userWarung, prefixPath]);

  // ── 🔄 REALTIME FIREBASE SYNC ──
  useEffect(() => {
    if (!isOnline || !userWarung) return;

    const subscribeToPath = (path, key, setter) => onValue(ref(db, `users/${userWarung.idWarung}/${path}`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedData = Array.isArray(data) ? data : Object.values(data);
        setter((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(parsedData)) return prev;
          return parsedData;
        });
        localStorage.setItem(key, JSON.stringify(parsedData));
      }
    });

    const unsubBarang = subscribeToPath('daftar_barang', STORAGE_KEYS.barang, setDaftarBarang);
    const unsubHistory = subscribeToPath('history_belanja', STORAGE_KEYS.history, setHistoryBelanja);
    const unsubLog = subscribeToPath('log_perubahan_harga', STORAGE_KEYS.logHarga, setLogPerubahanHarga);

    return () => {
      unsubBarang();
      unsubHistory();
      unsubLog();
    };
  }, [isOnline, userWarung, STORAGE_KEYS.barang, STORAGE_KEYS.history, STORAGE_KEYS.logHarga]);

  // ── 🌗 TEMA ENGINE ──
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // ── ⚙️ FUNGSI MUTASI UTAMA TOKO ──
  const handleTambahBarang = useCallback((barangBaru) => {
    setDaftarBarang((prevBarang) => {
      const barangBersih = sanitizeBarang({ ...barangBaru, id: Date.now() });
      const updateData = [...prevBarang, barangBersih];
      persistAndSync(STORAGE_KEYS.barang, updateData);
      return updateData;
    });
  }, [persistAndSync, STORAGE_KEYS.barang]);

  const handleEditBarang = useCallback((id, dataDiperbarui) => {
    setDaftarBarang((prevBarang) => {
      const updateData = prevBarang.map((barang) =>
        String(barang.id) === String(id) ? sanitizeBarang({ ...barang, ...dataDiperbarui }) : barang
      );
      persistAndSync(STORAGE_KEYS.barang, updateData);
      return updateData;
    });
  }, [persistAndSync, STORAGE_KEYS.barang]);

  const handleHapusBarang = useCallback((id) => {
    const namaPanggilan = userWarung ? userWarung.pemilik : 'Bos';
    if (window.confirm(`Yakin mau hapus barang ini dari toko, ${namaPanggilan}?`)) {
      setDaftarBarang((prevBarang) => {
        const updateData = prevBarang.filter((barang) => String(barang.id) !== String(id));
        persistAndSync(STORAGE_KEYS.barang, updateData);
        return updateData;
      });
    }
  }, [persistAndSync, STORAGE_KEYS.barang, userWarung]);

  const handleUpdateHargaModal = useCallback((idBarang, hargaModalBaru, satuanBeliAgen = 'Pcs', prevModal = null) => {
    let logBaruBaru = null;
    let daftarBarangTerupdate = [];

    setDaftarBarang((prevBarang) => {
      daftarBarangTerupdate = prevBarang.map((barang) => {
        if (String(barang.id) === String(idBarang)) {
          let modalEceranTerkecil;
          if (['Dus', 'Karton', 'Bal'].includes(satuanBeliAgen)) {
            const isiPerDus = Number(barang.isiKeEceran) || 1;
            modalEceranTerkecil = perPieceFromTotal(hargaModalBaru, isiPerDus);
          } else if (['Renteng', 'Pack', 'Slop'].includes(satuanBeliAgen)) {
            const isiPerRenteng = Number(barang.minimalBeliGrosir) || 1;
            modalEceranTerkecil = perPieceFromTotal(hargaModalBaru, isiPerRenteng);
          } else {
            modalEceranTerkecil = Math.ceil(Number(hargaModalBaru) || 0);
          }

          const modalLamaUntukLog = prevModal !== null ? Number(prevModal) : (barang.modal || 0);

          if (modalLamaUntukLog > 0 && modalEceranTerkecil > 0 && modalLamaUntukLog !== modalEceranTerkecil) {
            logBaruBaru = {
              idLog: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
              namaBarang: barang.nama,
              modalLama: Number(modalLamaUntukLog),
              modalBaru: Number(modalEceranTerkecil)
            };
          }
          return sanitizeBarang({ ...barang, modal: modalEceranTerkecil, hargaModalAgen: Number(hargaModalBaru) || 0 });
        }
        return barang;
      });

      persistAndSync(STORAGE_KEYS.barang, daftarBarangTerupdate);
      return daftarBarangTerupdate;
    });

    if (logBaruBaru) {
      setLogPerubahanHarga((prevLog) => {
        const updateLog = [logBaruBaru, ...prevLog];
        persistAndSync(STORAGE_KEYS.logHarga, updateLog);
        return updateLog;
      });
    }
  }, [persistAndSync, STORAGE_KEYS.barang, STORAGE_KEYS.logHarga]);

  const addLogPerubahanHarga = useCallback(({ namaBarang, modalLama, modalBaru }) => {
    if (modalLama === modalBaru) return;
    const entry = {
      idLog: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      namaBarang: namaBarang || 'Unknown',
      modalLama: Number(modalLama) || 0,
      modalBaru: Number(modalBaru) || 0
    };
    setLogPerubahanHarga((prev) => {
      const updateLog = [entry, ...prev];
      persistAndSync(STORAGE_KEYS.logHarga, updateLog);
      return updateLog;
    });
  }, [persistAndSync, STORAGE_KEYS.logHarga]);

  // ── ⚙️ FUNGSI KOREKSI NOTA BATCH SYNC SAFE ──
  const handleKoreksiNota = useCallback((idNota, itemsDiperbarui, totalPengeluaranBaru) => {
    let logAntreanBaru = [];
    let barangTerupdate = [];
    let historyTerupdate = [];

    // 1. Hitung Update Barang
    setDaftarBarang((prevBarang) => {
      barangTerupdate = prevBarang.map((barang) => {
        const itemKoreksi = itemsDiperbarui.find((item) => 
          String(item.id) === String(barang.id) || 
          (item.nama && barang.nama && item.nama.toLowerCase().trim() === barang.nama.toLowerCase().trim())
        );

        if (itemKoreksi) {
          const modalEceranBaru = Number(
            itemKoreksi.modalEceranTerhitung ?? 
            itemKoreksi.modal ?? 
            0
          );

          const hargaNotaAgenBaru = Number(
            itemKoreksi.modalBaru ?? 
            itemKoreksi.hargaModalAgen ?? 
            barang.hargaModalAgen ?? 
            0
          );

          const modalEceranLama = Number(barang.modal) || 0;

          if (modalEceranLama > 0 && modalEceranBaru > 0 && modalEceranLama !== modalEceranBaru) {
            logAntreanBaru.push({
              idLog: `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
              namaBarang: barang.nama,
              modalLama: modalEceranLama,
              modalBaru: modalEceranBaru
            });
          }

          return sanitizeBarang({
            ...barang,
            modal: modalEceranBaru,
            hargaModalAgen: hargaNotaAgenBaru
          });
        }
        return barang;
      });
      return barangTerupdate;
    });

    // 2. Hitung Update History
    setHistoryBelanja((prevHistory) => {
      historyTerupdate = prevHistory.map((nota) => {
        if (String(nota.id) === String(idNota)) {
          return { ...nota, items: itemsDiperbarui, totalPengeluarannya: totalPengeluaranBaru };
        }
        return nota;
      });
      return historyTerupdate;
    });

    // 3. Simpan Synchronous ke LocalStorage & Firebase
    setTimeout(() => {
      if (barangTerupdate.length > 0) {
        persistAndSync(STORAGE_KEYS.barang, barangTerupdate);
      }
      if (historyTerupdate.length > 0) {
        persistAndSync(STORAGE_KEYS.history, historyTerupdate);
      }

      if (logAntreanBaru.length > 0) {
        setLogPerubahanHarga((prevLog) => {
          const updateLog = [...logAntreanBaru, ...prevLog];
          persistAndSync(STORAGE_KEYS.logHarga, updateLog);
          return updateLog;
        });
      }
    }, 50);

  }, [persistAndSync, STORAGE_KEYS.barang, STORAGE_KEYS.history, STORAGE_KEYS.logHarga]);

  const handleTambahHistoryBelanja = useCallback((keranjangData) => {
    const notaBaru = {
      id: `NOTA-${Date.now()}`,
      tanggal: new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }),
      items: keranjangData,
      totalPengeluarannya: keranjangData.reduce((sum, item) => sum + ((Number(item.modalBaru) || 0) * (Number(item.qty) || 1)), 0)
    };
    setHistoryBelanja((prevHistory) => {
      const historyTerbaru = [notaBaru, ...prevHistory];
      const batasWaktu = Date.now() - (15 * 24 * 60 * 60 * 1000);
      const historyFiltered = historyTerbaru.filter((nota) => {
        const idTimestamp = Number(String(nota.id).split('-')[1]);
        return idTimestamp > batasWaktu;
      });
      persistAndSync(STORAGE_KEYS.history, historyFiltered);
      return historyFiltered;
    });
  }, [persistAndSync, STORAGE_KEYS.history]);

  const handleMigrasiDataFirestore = useCallback(async (dataFirestoreLama) => {
    try {
      if (!userWarung) {
        alert("❌ Kamu harus login akun warung dulu, Bos!");
        return;
      }

      const dataHasilKonversi = dataFirestoreLama.map((itemLama) => sanitizeBarang(itemLama));
      const dataSudahUrutAZ = dataHasilKonversi.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      
      setDaftarBarang(dataSudahUrutAZ);
      persistAndSync(STORAGE_KEYS.barang, dataSudahUrutAZ);

      alert(`✅ Sukses, Bos! ${dataSudahUrutAZ.length} data barang berhasil diimpor & disinkronkan!`);
    } catch (error) {
      console.error(error);
      alert("❌ Gagal total pas konversi data: " + error.message);
    }
  }, [STORAGE_KEYS.barang, userWarung, persistAndSync]);

  const handleImportDaftarBarang = useCallback((dataArray) => {
    try {
      if (!Array.isArray(dataArray)) return { success: false, message: 'Input harus berupa array' };
      
      const dataCleaned = dataArray.map(item => sanitizeBarang(item));
      const dataSudahUrut = dataCleaned.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      
      setDaftarBarang(dataSudahUrut);
      persistAndSync(STORAGE_KEYS.barang, dataSudahUrut);
      return { success: true, count: dataSudahUrut.length };
    } catch (err) {
      console.error('Import gagal', err);
      return { success: false, error: err.message };
    }
  }, [persistAndSync, STORAGE_KEYS.barang]);

  const handleBersihkanDataDatabase = useCallback(() => {
    if (!userWarung) {
      alert("❌ Kamu harus login dulu, Bos!");
      return;
    }

    const konfirmasi = window.confirm("⚠️ Rapikan & bersihkan seluruh database?");
    if (!konfirmasi) return;

    try {
      setDaftarBarang((prevBarang) => {
        const listBarang = Array.isArray(prevBarang) ? prevBarang : Object.values(prevBarang || {});
        const dataBersih = listBarang.map((barang) => sanitizeBarang(barang));
        
        persistAndSync(STORAGE_KEYS.barang, dataBersih);
        alert(`🎉 SUKSES! Sebanyak ${dataBersih.length} barang berhasil dirapikan!`);
        return dataBersih;
      });
    } catch (error) {
      console.error("Gagal membersihkan data:", error);
      alert("❌ Gagal merapikan database: " + error.message);
    }
  }, [userWarung, persistAndSync, STORAGE_KEYS.barang]);

  return (
    <AppContext.Provider value={{
      userWarung,
      isOnline,
      daftarBarang, 
      historyBelanja, 
      logPerubahanHarga, 
      isDark,
      activePage,
      setActivePage, 
      toggleTheme,
      handleDaftarWarungBaru, 
      handleLoginEmail,       
      handleLogoutWarung,
      handleTambahBarang, 
      handleEditBarang, 
      handleHapusBarang,
      handleUpdateHargaModal, 
      addLogPerubahanHarga, 
      handleKoreksiNota,
      handleTambahHistoryBelanja, 
      handleMigrasiDataFirestore,
      handleBersihkanDataDatabase,
      handleImportDaftarBarang
    }}>
      {children}
    </AppContext.Provider>
  );
}