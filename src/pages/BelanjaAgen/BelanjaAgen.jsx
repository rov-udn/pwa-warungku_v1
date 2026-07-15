import { useState, useMemo, useEffect } from 'react';
import styles from './BelanjaAgen.module.css'; // 👈 Mengunci CSS Module asli bawaan kamu!
import SearchBaru from '../../component/SearchBarKategori/SearchBaru'; // 👈 Komponen SearchBaru yang sudah diperbarui

// 🎯 1. IMPOR CUSTOM HOOK GUDANG GLOBAL DATA TOKO
import { useAppGudang } from '../../context/useAppGudang.jsx'; 

// 🎯 2. HAPUS PROPS BAWAAN LAMA DI DALAM KURUNG () KARENA DATA DIASUP LANGSUNG DARI GUDANG PUSAT
function BelanjaAgen() {
  // 🎯 3. TARIK DATA DAN FUNGSI LANGSUNG DARI GUDANG PUSAT CONTEXT
  const { 
    daftarBarang,
    userWarung, 
    handleUpdateHargaModal: onUpdateHargaModal, 
    handleTambahHistoryBelanja: onTambahHistoryBelanja 
  } = useAppGudang();

  // 🔒 STATES LOKAL KHUSUS INTERAKSI UI (TETAP DI SINI)
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Semua'); 
  const [tabAktif, setTabAktif] = useState('pilih'); 

  // Auto-load data keranjang lama pas web dibuka
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

  // EFFECT UNTUK AUTO-SAVE SETIAP KALI KERANJANG BERUBAH
  useEffect(() => {
    localStorage.setItem('keranjang_belanja_agen', JSON.stringify(keranjang));
  }, [keranjang]);

  const daftarKategori = ['Semua', 'Sembako/Dapur', 'Mie/Instan', 'Minuman/Kopi/Susu', 'Rokok/Korek', 'Snack/Biskuit/Roti', 'Sabun/Pembersih', 'Obat-obatan/Medical item', 'plastik/Cup', 'item lain'];

  // FILTER KATEGORI AMAN 100%
  const barangFiltered = useMemo(() => {
    return daftarBarang.filter((barang) => {
      const cocokSearch = barang.nama.toLowerCase().includes(searchTerm.toLowerCase());
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

    // 🎯 FIX MUTLAK 1: Ambil hargaModalAgen hasil koreksi nota agar sinkron sejak pertama klik
    const satuanDefault = barang.satuanBeli || barang.satuanModal || 'Dus';
    const hargaDefault = barang.hargaModalAgen !== undefined && barang.hargaModalAgen !== '' 
      ? barang.hargaModalAgen 
      : (barang.hargaAgen || 0);

    setSatuanTerpilih(satuanDefault);
    setInputHargaModal(hargaDefault);
    setModalTerbuka(true);
  };

  const handleSimpanKeKeranjang = () => {
    if (!barangTerpilih) return;

    const hargaModalFinal = Number(inputHargaModal);
    const hargaPembanding = barangTerpilih.hargaModalAgen !== undefined && barangTerpilih.hargaModalAgen !== ''
      ? barangTerpilih.hargaModalAgen
      : (barangTerpilih.hargaAgen || 0);
    
    if (typeof onUpdateHargaModal === 'function' && hargaModalFinal !== hargaPembanding) {
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

    // 🎯 1. AMBIL NAMA TOKO DINAMIS SECARA LIVE
    const namaTokoNota = userWarung ? userWarung.namaWarung : 'BUKU WARUNG';

    const tgl = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    const jam = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // 🎯 2. UBAH BARIS INI JADI DINAMIS (Menggunakan namaTokoNota)
    let teksNota = `🏪 *PESANAN BARANG - ${namaTokoNota.toUpperCase()}*\n`; 
    teksNota += `📅 ${tgl} | ⏰ ${jam} WIB\n`;
    teksNota += `--------------------------------\n\n`;
    teksNota += `*DAFTAR BELANJA :*\n\n`;

    const kelompokKategori = {};

    keranjang.forEach((item) => {
      const barangAsli = daftarBarang.find(b => b.id === item.id);
      const namaKategori = (barangAsli?.kategori || 'item lain').trim();

      if (!kelompokKategori[namaKategori]) {
        kelompokKategori[namaKategori] = [];
      }
      kelompokKategori[namaKategori].push(item);
    });

    daftarKategori.forEach((kat) => {
      if (kat === 'Semua') return; 

      const namaKatKey = Object.keys(kelompokKategori).find(k => k.toLowerCase() === kat.toLowerCase());
      const barangDiKategori = kelompokKategori[namaKatKey];

      if (barangDiKategori && barangDiKategori.length > 0) {
        teksNota += `📁 *${kat.toUpperCase()}*\n`;
        
        barangDiKategori.forEach((item, index) => {
          teksNota += `   ${index + 1}. ${item.nama}\n`;
          teksNota += `      x *${item.qty} ${item.satuanModal}*\n`;
        });
        
        teksNota += `\n`; 
      }
    });

    teksNota += `--------------------------------\n`;
    teksNota += `_Mohon disiapkan ya, terima kasih!_ 🙏`;

    if (navigator.share) {
      try {
        // 🎯 3. UBAH TITLE DI SINI JUGA AGAR DINAMIS SAAT DI-SHARE
        await navigator.share({ title: `Pesanan ${namaTokoNota}`, text: teksNota });
        
        if (typeof onTambahHistoryBelanja === 'function') {
          onTambahHistoryBelanja(keranjang);
        }
        setKeranjang([]);
        localStorage.removeItem('keranjang_belanja_agen');
        setTabAktif('pilih'); 
        
      } catch (err) {
        console.warn("Share dibatalkan oleh " + (userWarung ? userWarung.pemilik : 'Bos') + ", data keranjang aman.", err);
      }
    } else {
      navigator.clipboard.writeText(teksNota);
      alert("📋 Daftar pesanan sudah dicopy ke HP, " + (userWarung ? userWarung.pemilik : 'Bos') + "!");
      
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
          <SearchBaru
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            kategoriAktif={kategoriAktif}
            setKategoriAktif={setKategoriAktif}
            daftarKategori={daftarKategori}
            placeholder="🔎 Cari barang kulakan (Indomie, Surya, dll)..."
            style={{ '--searchbar-offset': '68px' }}
          />

          <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginTop: '14px', marginBottom: '8px', color: 'var(--text-main, #1c1c1e)', textAlign: 'left' }}>
            Pilih Barang Toko
          </h3>
          <div className={styles.gridBarang}>
            {barangFiltered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Barang tidak ditemukan, {userWarung ? userWarung.pemilik : 'Bos'}. 🧐</div>
            ) : (
              barangFiltered.map((barang) => {
                // 🎯 FIX MUTLAK 2: Kartu daftar luar memprioritaskan hargaModalAgen riil terbaru
                const modalTerupdate = barang.hargaModalAgen !== undefined && barang.hargaModalAgen !== '' 
                  ? barang.hargaModalAgen 
                  : (barang.hargaAgen || 0);

                return (
                  <div key={barang.id} onClick={() => handleKlikTambah(barang)} className={styles.cardPilihItem}>
                    <div className={styles.infoKiri}>
                      <h4>{barang.nama}</h4>
                      <span>M: Rp {modalTerupdate.toLocaleString('id-ID')} / {barang.satuanModal || 'Dus'}</span>
                    </div>
                    <div className={styles.indicatorPilih}>
                      + Keranjang
                    </div>
                  </div>
                );
              })
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
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>Keranjang kulakan kosong, {userWarung ? userWarung.pemilik : 'Bos'}!</p>
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
                  <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan, #0a8168)' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', boxSizing: 'border-box' }}>
          <div style={{ backgroundColor: 'var(--bg-toggle, #ffffff)', width: '100%', maxWidth: '400px', borderRadius: '14px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', color: 'var(--text-main, #1c1c1e)', border: '1px solid var(--border-light, #ced4da)' }}>
            
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Kriteria Kulakan</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary, #555)', fontWeight: '600' }}>{barangTerpilih.nama}</p>

            {/* A. Pilihan Varian */}
            {barangTerpilih.varian && barangTerpilih.varian.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px', textAlign: 'left' }}>Pilih Varian Rasa / Jenis:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {barangTerpilih.varian.map((v) => {
                    const isVarianAktif = varianTerpilih === v;
                    return (
                      <button 
                        type="button" 
                        key={v} 
                        onClick={() => setVarianTerpilih(v)} 
                        style={{ padding: '6px 12px', borderRadius: '6px', border: isVarianAktif ? '1px solid var(--accent-cyan)' : '1px solid var(--border-medium)', backgroundColor: isVarianAktif ? 'var(--bg-nav-active)' : 'var(--bg-input)', color: isVarianAktif ? 'var(--accent-cyan)' : 'var(--text-main)', fontWeight: isVarianAktif ? '700' : '500', fontSize: '0.8rem', cursor: 'pointer' }}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px', textAlign: 'left' }}>Pilih Satuan Beli Agen:</label>
              {(() => {
                const options = [];
                
                const unitBesar = barangTerpilih.satuanBeli || barangTerpilih.satuanModal || 'Dus';
                // 🎯 FIX MUTLAK 3: Ambil hargaModalAgen terupdate saat tombol satuan diklik
                const hargaTerupdateBesar = barangTerpilih.hargaModalAgen !== undefined && barangTerpilih.hargaModalAgen !== '' 
                  ? barangTerpilih.hargaModalAgen 
                  : (barangTerpilih.hargaAgen || 0);

                options.push({
                  type: 'tanggaAtas',
                  label: unitBesar,
                  calculate: () => hargaTerupdateBesar
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
                          style={{ padding: '8px 4px', borderRadius: '6px', border: dipilih ? '1px solid var(--accent-cyan)' : '1px solid var(--border-medium)', backgroundColor: dipilih ? 'var(--bg-nav-active)' : 'var(--bg-input)', color: dipilih ? 'var(--accent-cyan)' : 'var(--text-main)', fontWeight: dipilih ? '700' : '500', fontSize: '0.8rem', cursor: 'pointer' }}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px', textAlign: 'left' }}>Jumlah Kulakan:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button type="button" onClick={() => setQtyInput(prev => Math.max(1, prev - 1))} style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                <input type="number" value={qtyInput} onChange={(e) => setQtyInput(Math.max(1, Number(e.target.value)))} style={{ flexGrow: 1, height: '36px', border: '1px solid var(--border-medium)', borderRadius: '6px', fontSize: '1rem', fontWeight: '700', textAlign: 'center', outline: 'none', background: 'var(--bg-toggle)', color: 'var(--text-main)' }} />
                <button type="button" onClick={() => setQtyInput(prev => prev + 1)} style={{ width: '36px', height: '36px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              </div>
            </div>

            {/* D. Harga Modal Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px', textAlign: 'left' }}>Harga Modal Agen (Bisa Di-edit):</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Rp</span>
                <input type="number" value={inputHargaModal} onChange={(e) => setInputHargaModal(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '6px', border: '1px solid var(--border-medium)', fontSize: '1rem', fontWeight: '700', boxSizing: 'border-box', outline: 'none', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setModalTerbuka(false)} style={{ flex: 1, padding: '10px', background: 'var(--bg-input)', border: 'none', borderRadius: '8px', fontWeight: '700', color: 'var(--text-main)', cursor: 'pointer' }}>Batal</button>
              <button type="button" onClick={handleSimpanKeKeranjang} style={{ flex: 1, padding: '10px', background: 'var(--accent-cyan, #0a8168)', border: 'none', borderRadius: '8px', fontWeight: '700', color: '#fff', cursor: 'pointer' }}>Simpan</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default BelanjaAgen;