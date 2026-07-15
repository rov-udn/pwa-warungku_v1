import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase.js'; 
import { ref, set, onValue, update } from 'firebase/database';

// 🎯 IMPOR MODUL AUTHENTICATION DARI FIREBASE
import { auth } from '../firebase.js';
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

export function AppProvider({ children }) {
  // ── 👤 STATE MULTI-USER WARUNG VIA CLOUD AUTH ──
  const [userWarung, setUserWarung] = useState(() => {
    const savedUser = localStorage.getItem('warung_aktif_user');
    return savedUser ? JSON.parse(savedUser) : null; 
  });

  // ── 🌐 STATE KONEKSI OFFLINE/ONLINE REALTIME ──
  const [isOnline, setIsOnline] = useState(getOnlineStatus());

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
  const [daftarBarang, setDaftarBarang] = useState(() => readStoredState(`${prefixPath}_daftar_barang`, []));
  const [historyBelanja, setHistoryBelanja] = useState(() => readStoredState(`${prefixPath}_history_belanja`, []));
  const [logPerubahanHarga, setLogPerubahanHarga] = useState(() => readStoredState(`${prefixPath}_log_perubahan_harga`, []));
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

  // ── 🔑 MULTI-USER CLOUD ACTIONS (DAFTAR & LOGIN EMAIL RESMI) ──
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

  // ── 🔄 REALTIME FIREBASE SYNC (LURUS SEARAH DENGAN PERSISTANDSYNC) ──
  useEffect(() => {
    if (!isOnline || !userWarung) return;

    const subscribeToPath = (path, key, setter) => onValue(ref(db, `users/${userWarung.idWarung}/${path}`), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Validasi ketat: Hanya update state jika data dari cloud berbeda dengan data lokal berjalan
        setter((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
        });
        localStorage.setItem(key, JSON.stringify(data));
      }
    });

    // 🎯 FIX SINKRONISASI: Menghapus string kata kunci yang salah tumpuk
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
      const updateData = [...prevBarang, { ...barangBaru, id: Date.now() }];
      persistAndSync(STORAGE_KEYS.barang, updateData);
      return updateData;
    });
  }, [persistAndSync, STORAGE_KEYS.barang]);

  const handleEditBarang = useCallback((id, dataDiperbarui) => {
    setDaftarBarang((prevBarang) => {
      const updateData = prevBarang.map((barang) =>
        barang.id === id ? { ...barang, ...dataDiperbarui } : barang
      );
      persistAndSync(STORAGE_KEYS.barang, updateData);
      return updateData;
    });
  }, [persistAndSync, STORAGE_KEYS.barang]);

  const handleHapusBarang = useCallback((id) => {
    const namaPanggilan = userWarung ? userWarung.pemilik : 'Bos';
    if (window.confirm(`Yakin mau hapus barang ini dari toko, ${namaPanggilan}?`)) {
      setDaftarBarang((prevBarang) => {
        const updateData = prevBarang.filter((barang) => barang.id !== id);
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
        if (barang.id === idBarang) {
          let modalEceranTerkecil;
          if (['Dus', 'Karton', 'Bal'].includes(satuanBeliAgen)) {
            const isiPerDus = Number(barang.minimalBeliGrosirBesar) || 40;
            modalEceranTerkecil = perPieceFromTotal(hargaModalBaru, isiPerDus);
          } else if (['Renteng', 'Pack', 'Slop'].includes(satuanBeliAgen)) {
            const isiPerRenteng = Number(barang.minimalBeliGrosir) || 10;
            modalEceranTerkecil = perPieceFromTotal(hargaModalBaru, isiPerRenteng);
          } else {
            modalEceranTerkecil = Math.ceil(Number(hargaModalBaru) || 0);
          }

          const modalLamaUntukLog = prevModal !== null ? Number(prevModal) : (barang.modal || 0);
          if (modalLamaUntukLog !== modalEceranTerkecil) {
            logBaruBaru = {
              idLog: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
              namaBarang: barang.nama,
              modalLama: Number(modalLamaUntukLog),
              modalBaru: Number(modalEceranTerkecil)
            };
          }
          return { ...barang, modal: modalEceranTerkecil };
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
      idLog: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
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

  // ── ⚙️ FUNGSI UTAMA KOREKSI NOTA KULAKAN (AMANDEMEN ANTI-DOUBLE + LOG MANTAP) ──
  const handleKoreksiNota = useCallback((idNota, itemsDiperbarui, totalPengeluaranBaru) => {
    const logAntreanBaru = [];

    // 1. UPDATE STATE DAFTAR BARANG SECARA BATCH LOKAL
    setDaftarBarang((prevBarang) => {
      const barangUpdate = prevBarang.map((barang) => {
        // 🎯 DIUBAH: Dibungkus dengan Number() agar perbandingan ID Text vs Angka tetap COCOK!
const itemKoreksi = itemsDiperbarui.find((item) => Number(item.id) === Number(barang.id));
        if (itemKoreksi) {
          const modalEceranBaru = Number(itemKoreksi.modalEceranTerhitung) || 0;
          const hargaNotaAgenBaru = Number(itemKoreksi.modalBaru) || 0;
          const isiGrosirMenengah = Number(barang.minimalBeliGrosir) || 10;
          const modalGrosirMenengahBaru = Math.ceil(modalEceranBaru * isiGrosirMenengah);
          
          const modalEceranLama = Number(barang.modal) || 0;
          
          if (modalEceranBaru !== modalEceranLama) {
            logAntreanBaru.push({
              idLog: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
              namaBarang: barang.nama,
              modalLama: Number(modalEceranLama),
              modalBaru: Number(modalEceranBaru)
            });
          }

          return {
            ...barang,
            modal: modalEceranBaru,
            hargaModalAgen: hargaNotaAgenBaru,
            modalGrosirTotal: modalGrosirMenengahBaru,
            jualGrosirBesarTotal: hargaNotaAgenBaru
          };
        }
        return barang;
      });

      persistAndSync(STORAGE_KEYS.barang, barangUpdate);
      return barangUpdate;
    });

    // 2. UPDATE STATE HISTORY BELANJA SECARA BATCH LOKAL
    setHistoryBelanja((prevHistory) => {
      const historyUpdate = prevHistory.map((nota) => {
        // Bandingkan sebagai string untuk menghindari mismatch tipe
        if ((String(nota.id) || '') === (String(idNota) || '')) {
          return { ...nota, items: itemsDiperbarui, totalPengeluarannya: totalPengeluaranBaru };
        }
        return nota;
      });

      persistAndSync(STORAGE_KEYS.history, historyUpdate);
      return historyUpdate;
    });

    // 3. UPDATE STATE LOG HARGA SECARA BATCH LOKAL
    if (logAntreanBaru.length > 0) {
      setLogPerubahanHarga((prevLog) => {
        const updateLog = [...logAntreanBaru, ...prevLog];
        persistAndSync(STORAGE_KEYS.logHarga, updateLog);
        return updateLog;
      });
    }

  }, [persistAndSync, STORAGE_KEYS.barang, STORAGE_KEYS.history, STORAGE_KEYS.logHarga]);

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
      const historyFiltered = historyTerbaru.filter((nota) => {
        const idTimestamp = Number(nota.id.split('-')[1]);
        return idTimestamp > batasWaktu;
      });
      persistAndSync(STORAGE_KEYS.history, historyFiltered);
      return historyFiltered;
    });
  }, [persistAndSync, STORAGE_KEYS.history]);

  const handleMigrasiDataFirestore = useCallback(async (dataFirestoreLama) => {
    try {
      const tebakKategoriDariNama = (namaBarang) => {
        const namaKecKecil = (namaBarang || '').toLowerCase();
        if (namaKecKecil.includes('rokok') || namaKecKecil.includes('filter')) return 'Rokok/Korek';
        if (namaKecKecil.includes('mie') || namaKecKecil.includes('indomie')) return 'Mie/Instan';
        if (namaKecKecil.includes('kopi') || namaKecKecil.includes('teh')) return 'Minuman/Kopi/Susu';
        return 'item lain';
      };

      const dataHasilKonversi = dataFirestoreLama.map((itemLama) => {
        const namaKecil = (itemLama.nama || '').toLowerCase();
        const isRokok = namaKecil.includes('rokok') || namaKecil.includes('filter');
        const isSembakoCurah = namaKecil.includes('beras') || namaKecil.includes('gula');
        let minimalGrosirBesarDefault = Number(itemLama.minimalBeliGrosirBesar || (isSembakoCurah ? 25 : 40));
        
        let modalEceranAwal = 0;
        if (itemLama.modalEceran !== undefined) modalEceranAwal = Number(itemLama.modalEceran);
        else if (itemLama.modal !== undefined) modalEceranAwal = Number(itemLama.modal);

        const totalHargaAgen = Number(itemLama.hargaAgen || (modalEceranAwal * minimalGrosirBesarDefault));
        let hargaJualMurni = Number(itemLama.hargaEceran || itemLama.jual || 0);

        return {
          id: itemLama.id || `BARANG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          nama: itemLama.nama || 'Tanpa Nama',
          modal: modalEceranAwal, 
          hargaModalAgen: totalHargaAgen,
          jual: hargaJualMurni,
          satuanModal: itemLama.satuanBeli || (isRokok ? 'Slop' : 'Dus'),
          satuanJual: itemLama.satuanJual || (isRokok ? 'Bungkus' : 'Pcs'),
          isiGrosirBesar: minimalGrosirBesarDefault,
          varian: itemLama.varian || [],
          bisaGrosir: true,
          minimalBeliGrosir: Number(itemLama.minimalBeliGrosir) || 10,
          satuanGrosirNama: isRokok ? 'Slop' : 'Kotak/Renteng',
          jualGrosir: Math.round(modalEceranAwal * 1.05),
          bisaGrosirBesar: !isRokok,
          minimalBeliGrosirBesar: minimalGrosirBesarDefault,
          satuanGrosirBesarNama: itemLama.satuanBeli || (isRokok ? 'Slop' : 'Dus'),
          jualGrosirBesarTotal: totalHargaAgen,
          jualGrosirBesarPerPcs: modalEceranAwal,
          catatan: itemLama.catatan || '',
          stok: Number(itemLama.stok || 0),
          kategori: itemLama.kategori || tebakKategoriDariNama(itemLama.nama)
        };
      });

      const dataSudahUrutAZ = dataHasilKonversi.sort((a, b) => (a.nama || '').localeCompare(b.nama || ''));
      
      // 1. Simpan ke state lokal React agar UI langsung update rapi A-Z
      setDaftarBarang(dataSudahUrutAZ);

      // 2. 🎯 STRATEGI BARU: Ubah Array menjadi Objek Map berdasarkan ID masing-masing
      // Agar Firebase Realtime Database menerimanya berjejer secara massal, bukan menimpa folder
      const paketUpdateFirebase = {};
      dataSudahUrutAZ.forEach((barang) => {
        paketUpdateFirebase[barang.id] = barang;
      });

      // 3. Import langsung ke path target database akun baru kamu
      // Pastikan variabel 'uid' atau 'userWarung.uid' sudah tersedia di dalam scope AppContext kamu ya!
      const targetBarangRef = ref(db, `users/${userWarung?.uid}/daftarBarang`);
      
      // Tembak secara massal menggunakan update() agar masuk semua sekaligus!
      await update(targetBarangRef, paketUpdateFirebase);

      // 4. Cadangkan juga ke LocalStorage lokal laptop sebagai backup cadangan
      localStorage.setItem(STORAGE_KEYS.barang, JSON.stringify(dataSudahUrutAZ));

      alert(`✅ Berhasil! ${dataSudahUrutAZ.length} barang masuk sekaligus secara rapi berurutan A-Z!`);
    } catch (error) {
      console.error(error);
      alert("❌ Gagal konversi data!");
    }
  }, [ STORAGE_KEYS.barang, userWarung]);

  return (
    <AppContext.Provider value={{
      userWarung,
      isOnline,
      daftarBarang, 
      historyBelanja, 
      logPerubahanHarga, 
      isDark, 
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
      handleMigrasiDataFirestore
    }}>
      {children}
    </AppContext.Provider>
  );
}