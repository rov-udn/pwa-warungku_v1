import { useState, useMemo, useEffect } from 'react';
import styles from './BelanjaAgen.module.css'; // 👈 Mengunci CSS Module asli bawaan kamu!
import SearchBaru from '../../component/SearchBarKategori/SearchBaru'; // 👈 Komponen SearchBaru yang sudah diperbarui

function BelanjaAgen({ daftarBarang = [], onUpdateHargaModal, onTambahHistoryBelanja }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Semua'); 
  const [tabAktif, setTabAktif] = useState('pilih'); 

  // ── 🎯 FIX MUTLAK MEMORI: Auto-load data keranjang lama pas web dibuka ──
  const [keranjang, setKeranjang] = useState(() => {
    const dataLokal = localStorage.getItem('keranjang_belanja_agen');
    return dataLokal ? JSON.parse(dataLokal) : [];
  });

  // State untuk Modal Pemilih Kriteria
  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [barangTerpilih, setBarangTerpilih] = useState(null);
  const [satuanTerpilih, setSatuanTerpilih] = useState('');
  const [varianTerpilih, setVarianTerpilih] = useState(''); 
  const [qtyInput, setQtyInput] = useState(1);
  const [inputHargaModal, setInputHargaModal] = useState('');

  // ── 💾 EFFECT UNTUK AUTO-SAVE SETIAP KALI KERANJANG BERUBAH ──
  useEffect(() => {
    localStorage.setItem('keranjang_belanja_agen', JSON.stringify(keranjang));
  }, [keranjang]);

  // ── 🟢 KATEGORI DIKUNCI SESUAI DATABASE BUKU WARUNG KAMU ──
  const daftarKategori = ['Semua', 'Sembako/Dapur', 'Mie/Instan', 'Minuman/Kopi/Susu', 'Rokok/Korek', 'Snack/Biskuit/Roti', 'Sabun/Pembersih', 'Obat-obatan/Medical item', 'plastik/Cup', 'item lain'];

  // ── 🎯 FIX FILTER KATEGORI AMAN 100% ──
  const barangFiltered = useMemo(() => {
    return daftarBarang.filter((barang) => {
      const cocokSearch = barang.nama.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Ambil properti kategori dari barang, lowercase-kan untuk membandingkan
      const katBarang = (barang.kategori || 'item lain').trim().toLowerCase();
      const katAktifLower = kategoriAktif.toLowerCase();
      
      const cocokKategori = kategoriAktif === 'Semua' || katBarang === katAktifLower;
      return cocokSearch && cocokKategori;
    });
  }, [daftarBarang, searchTerm, kategoriAktif]);

  const handleKlikTambah = (barang) => {
    setBarangTerpilih(barang);
    setVarianTerpilih(barang.varian && barang.varian.length > 0 ? barang.varian[0] : ''); 
    setQtyInput(1);

    // 🎯 FIX MUTLAK: Membaca properti data raw lama milik Rofi
    const satuanDefault = barang.satuanBeli || barang.satuanModal || 'Dus';
    const hargaDefault = barang.hargaAgen || barang.hargaModalAgen || 0;

    setSatuanTerpilih(satuanDefault);
    setInputHargaModal(hargaDefault);
    setModalTerbuka(true);
  };

  const handleSimpanKeKeranjang = () => {
    if (!barangTerpilih) return;

    const hargaModalFinal = Number(inputHargaModal);
    
    // Opsional: Update harga modal di database utama jika diubah di keranjang
    if (typeof onUpdateHargaModal === 'function' && hargaModalFinal !== (barangTerpilih.hargaModalAgen || barangTerpilih.hargaAgen)) {
      onUpdateHargaModal(barangTerpilih.id, hargaModalFinal, satuanTerpilih);
    }

    const namaDenganVarian = varianTerpilih ? `${barangTerpilih.nama} (${varianTerpilih})` : barangTerpilih.nama;

    const itemKeranjangBaru = {
      idUnik: `${barangTerpilih.id}-${satuanTerpilih}-${varianTerpilih}-${Date.now()}`,
      id: barangTerpilih.id,
      nama: namaDenganVarian, 
      qty: Number(qtyInput),
      satuanModal: satuanTerpilih,
      modalBaru: hargaModalFinal
    };

    setKeranjang((prev) => [...prev, itemKeranjangBaru]);
    setModalTerbuka(false);
    setBarangTerpilih(null);
  };

  const handleHapusItemKeranjang = (idUnik) => {
    setKeranjang((prev) => prev.filter(item => item.idUnik !== idUnik));
  };

  const handleUbahQtyRow = (idUnik, delta) => {
    setKeranjang((prev) =>
      prev.map((item) => {
        if (item.idUnik === idUnik) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      })
    );
  };

  const handleUbahHargaRow = (idUnik, hargaBaru) => {
    setKeranjang((prev) =>
      prev.map((item) => {
        if (item.idUnik === idUnik) {
          return { ...item, modalBaru: Number(hargaBaru) };
        }
        return item;
      })
    );
  };

  const hitungTotalEstimasi = () => {
    return keranjang.reduce((total, item) => total + (item.qty * item.modalBaru), 0);
  };

  const handleShareUniversal = async () => {
    if (keranjang.length === 0) return;

    const tgl = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let teksNota = `🏪 *PESANAN BARANG - WARUNG HASAN*\n`; 
    teksNota += `📅 ${tgl} | ⏰ ${jam} WIB\n`;
    teksNota += `--------------------------------\n\n`;
    teksNota += `*DAFTAR KULAKAN (Per Kategori):*\n\n`;

    // ── 📦 1. PENGELOMPOKKAN BARANG BERDASARKAN KATEGORI ──
    // Kita buat wadah kosong untuk menampung barang sesuai kategorinya
    const kelompokKategori = {};

    keranjang.forEach((item) => {
      // Cari data barang asli dari daftarBarang untuk melihat kategorinya
      const barangAsli = daftarBarang.find(b => b.id === item.id);
      const namaKategori = (barangAsli?.kategori || 'item lain').trim();

      // Jika wadah kategorinya belum ada, buat baru berupa array kosong
      if (!kelompokKategori[namaKategori]) {
        kelompokKategori[namaKategori] = [];
      }
      // Masukkan item keranjang ke dalam kelompoknya
      kelompokKategori[namaKategori].push(item);
    });

    // ── 📝 2. MENYUSUN TEKS NOTA WA PER KATEGORI ──
    // Loop melintasi urutan kategori resmi yang kamu punya
    daftarKategori.forEach((kat) => {
      if (kat === 'Semua') return; // Lewati kategori 'Semua' karena ini hanya untuk filter filter

      // Cari apakah ada barang belanjaan di kategori ini
      // Kita pakai mencocokkan lowercase biar aman dari salah ketik huruf besar/kecil
      const namaKatKey = Object.keys(kelompokKategori).find(k => k.toLowerCase() === kat.toLowerCase());
      const barangDiKategori = kelompokKategori[namaKatKey];

      // Jika ada barangnya, tulis nama kategorinya dan list barangnya ke bawah
      if (barangDiKategori && barangDiKategori.length > 0) {
        teksNota += `📁 *KATEGORI: ${kat.toUpperCase()}*\n`;
        
        barangDiKategori.forEach((item, index) => {
          teksNota += `  ${index + 1}. ${item.nama}\n`;
          teksNota += `     x *${item.qty} ${item.satuanModal}*\n`;
        });
        
        teksNota += `\n`; // Beri jarak antar kategori biar renggang rapi
      }
    });

    teksNota += `--------------------------------\n`;
    teksNota += `_Mohon disiapkan ya Ko/Cik, terima kasih!_ 🙏`;

    // ── 🚀 EKSEKUSI SHARE SEPERTI BIASA ──
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Pesanan Warung Hasan', text: teksNota });
        
        if (typeof onTambahHistoryBelanja === 'function') {
          onTambahHistoryBelanja(keranjang);
        }
        setKeranjang([]);
        localStorage.removeItem('keranjang_belanja_agen');
        setTabAktif('pilih'); 
        
      } catch (err) {
        console.log("Share dibatalkan oleh Rofi, data keranjang aman.", err);
      }
    } else {
      navigator.clipboard.writeText(teksNota);
      alert("📋 Daftar pesanan sudah dicopy ke HP, Fi!");
      
      if (typeof onTambahHistoryBelanja === 'function') {
        onTambahHistoryBelanja(keranjang);
      }
      setKeranjang([]);
      localStorage.removeItem('keranjang_belanja_agen');
      setTabAktif('pilih');
    }
  };

  return (
    <div className={styles.container}>
      
      {/* ── 🕹️ HEADER NAVIGASI TAB ── */}
      <div className={styles.tabHeader}>
        <button
          type="button"
          onClick={() => setTabAktif('pilih')}
          className={`${styles.tabBtn} ${tabAktif === 'pilih' ? styles.tabBtnActive : ''}`}
        >
          🔍 Pilih Barang
        </button>
        <button
          type="button"
          onClick={() => setTabAktif('keranjang')}
          className={`${styles.tabBtn} ${tabAktif === 'keranjang' ? styles.tabBtnActive : ''}`}
        >
          🛒 Keranjang Belanja
          {keranjang.length > 0 && <span className={styles.badgeCount}>{keranjang.length}</span>}
        </button>
      </div>

      {/* ── 📦 TAB 1: AREA LIHAT BARANG DAN MASUKIN KERANJANG ── */}
      {tabAktif === 'pilih' && (
  <div>
    {/* 💡 FIX MUTLAK: Menggunakan komponen SearchBaru yang seragam */}
    <SearchBaru
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      kategoriAktif={kategoriAktif}
      setKategoriAktif={setKategoriAktif}
      daftarKategori={daftarKategori}
      placeholder="🔎 Cari barang kulakan (Indomie, Surya, dll)..."
    /> {/* 👈 Langsung ditutup di sini karena menu Belanja Agen tidak butuh tombol tambahan di header search */}

    <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginTop: '14px', marginBottom: '8px', color: 'var(--text-main, #1c1c1e)', textAlign: 'left' }}>
      Pilih Barang Toko
    </h3>
          <div className={styles.gridBarang}>
            {barangFiltered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Barang tidak ditemukan, Fi. 🧐</div>
            ) : (
              barangFiltered.map((barang) => (
                <div key={barang.id} onClick={() => handleKlikTambah(barang)} className={styles.cardPilihItem}>
                  <div className={styles.infoKiri}>
                    <h4>{barang.nama}</h4>
                    <span>M: Rp {(barang.hargaModalAgen || barang.hargaAgen || 0).toLocaleString('id-ID')} / {barang.satuanModal || 'Dus'}</span>
                  </div>
                  <div className={styles.indicatorPilih}>
                    + Keranjang
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 🛒 TAB 2: MENU AREA LIST KERANJANG BELANJA TERPISAH ── */}
      {(tabAktif === 'get_keranjang' || tabAktif === 'keranjang') && (
        <div>
          {keranjang.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🛒</span>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>Keranjang kulakan kosong, Fi!</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Silakan kembali ke tab pilih barang terlebih dahulu.</p>
            </div>
          ) : (
            <>
              <div>
                {keranjang.map((item) => (
                  <div key={item.idUnik} className={styles.itemBelanja}>
                    <div className={styles.infoNama}>
                      <p className={styles.namaBarang}>{item.nama}</p>
                    </div>

                    <div className={styles.centerSection}>
                      <span className={styles.satuanLabel}>{item.satuanModal}</span>
                      <div className={styles.counterBox}>
                        <button type="button" onClick={() => handleUbahQtyRow(item.idUnik, -1)} className={styles.btnCount}>-</button>
                        <input type="number" value={item.qty} readOnly className={styles.qtyInput} />
                        <button type="button" onClick={() => handleUbahQtyRow(item.idUnik, 1)} className={styles.btnCount}>+</button>
                      </div>
                    </div>

                    <div className={styles.rightSection}>
                      <div className={styles.hargaContainer}>
                        <input 
                          type="number" 
                          value={item.modalBaru} 
                          onChange={(e) => handleUbahHargaRow(item.idUnik, e.target.value)} 
                          className={styles.inputHarga} 
                        />
                        <div className={styles.totalHargaRow}>
                          Rp {(item.qty * item.modalBaru).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    <button type="button" onClick={() => handleHapusItemKeranjang(item.idUnik)} className={styles.btnHapusRow}>
                      ❌
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.estimasiBox}>
                <div className={styles.rowTotal}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-muted)' }}>Estimasi Total Kulakan:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0a8168' }}>
                    Rp {hitungTotalEstimasi().toLocaleString('id-ID')}
                  </span>
                </div>
                <button type="button" onClick={handleShareUniversal} className={styles.btnSelesai}>
                  🚀 Kirim Daftar Pesanan ke WA Agen
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 🟢 POP-UP MODAL SELECTION ── */}
      {modalTerbuka && barangTerpilih && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: '#ffffff', width: '100%', maxWidth: '400px', borderRadius: '14px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', color: '#1c1c1e' }}>
            
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800' }}>Kriteria Kulakan</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#555', fontWeight: '600' }}>{barangTerpilih.nama}</p>

            {/* A. Pilihan Varian */}
            {barangTerpilih.varian && barangTerpilih.varian.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#444', marginBottom: '6px', textAlign: 'left' }}>Pilih Varian Rasa / Jenis:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {barangTerpilih.varian.map((v) => {
                    const isVarianAktif = varianTerpilih === v;
                    return (
                      <button 
                        type="button" 
                        key={v} 
                        onClick={() => setVarianTerpilih(v)} 
                        style={{ padding: '6px 12px', borderRadius: '6px', border: isVarianAktif ? '1px solid #0a8168' : '1px solid #ced4da', backgroundColor: isVarianAktif ? 'rgba(10,129,104,0.1)' : '#fff', color: isVarianAktif ? '#0a8168' : '#333', fontWeight: isVarianAktif ? '700' : '500', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* B. Pemilih Satuan Otomatis */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#444', marginBottom: '6px', textAlign: 'left' }}>Pilih Satuan Beli Agen:</label>
              {(() => {
                const options = [];
                
                const unitBesar = barangTerpilih.satuanModal || barangTerpilih.satuanTerbesar || 'Dus';
                options.push({
                  type: 'tanggaAtas',
                  label: unitBesar,
                  calculate: () => barangTerpilih.hargaModalAgen || barangTerpilih.hargaAgen || 0
                });

                if (barangTerpilih.satuanGrosirNama && barangTerpilih.satuanGrosirNama !== unitBesar) {
                  options.push({
                    type: 'tanggaTengah',
                    label: barangTerpilih.satuanGrosirNama,
                    calculate: () => barangTerpilih.modalGrosirTotal || ((barangTerpilih.modal || 0) * (barangTerpilih.minimalBeliGrosir || 10))
                  });
                }

                const unitKecil = barangTerpilih.satuanJual || 'Pcs';
                if (unitKecil !== unitBesar && unitKecil !== barangTerpilih.satuanGrosirNama) {
                  options.push({
                    type: 'tanggaBawah',
                    label: unitKecil,
                    calculate: () => Math.round(barangTerpilih.modal || 0)
                  });
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: '6px' }}>
                    {options.map((opt) => {
                      const dipilih = satuanTerpilih === opt.label;
                      return (
                        <button
                          key={opt.type}
                          type="button"
                          onClick={() => {
                            setSatuanTerpilih(opt.label);
                            setInputHargaModal(opt.calculate());
                          }}
                          style={{ padding: '8px 4px', borderRadius: '6px', border: dipilih ? '1px solid #0a8168' : '1px solid #ced4da', backgroundColor: dipilih ? 'rgba(10,129,104,0.1)' : '#fff', color: dipilih ? '#0a8168' : '#333', fontWeight: dipilih ? '700' : '500', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* C. Qty Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#444', marginBottom: '6px', textAlign: 'left' }}>Jumlah Kulakan:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setQtyInput(prev => Math.max(1, prev - 1))} style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                <input type="number" value={qtyInput} onChange={(e) => setQtyInput(Math.max(1, Number(e.target.value)))} style={{ flexGrow: 1, height: '36px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none', background: '#fff', color: '#111' }} />
                <button type="button" onClick={() => setQtyInput(prev => prev + 1)} style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #ced4da', background: '#f8f9fa', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* D. Harga Modal Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#444', marginBottom: '6px', textAlign: 'left' }}>Harga Modal Agen (Bisa Di-edit):</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>Rp</span>
                <input type="number" value={inputHargaModal} onChange={(e) => setInputHargaModal(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '1rem', fontWeight: '700', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f2f2f7', color: '#222' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setModalTerbuka(false)} style={{ flex: 1, padding: '10px', background: '#f1f3f5', border: 'none', borderRadius: '8px', fontWeight: '700', color: '#495057', cursor: 'pointer' }}>Batal</button>
              <button type="button" onClick={handleSimpanKeKeranjang} style={{ flex: 1, padding: '10px', background: '#0a8168', border: 'none', borderRadius: '8px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>Simpan</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default BelanjaAgen;