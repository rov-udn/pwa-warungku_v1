import { useState } from 'react';
import styles from './ModalBarang.module.css';
import { useAppGudang } from '../../../context/useAppGudang.jsx'; 

function ModalBarang({ isOpen, onClose, modalMode, barangAktif, onSimpan }) {
  const { userWarung } = useAppGudang();
  const isEdit = modalMode === 'edit' && Boolean(barangAktif);

  // ── 🍏 1. NAMA, KATEGORI & VARIAN BARANG (Langsung inisialisasi awal) ──
  const [nama, setNama] = useState(isEdit ? (barangAktif.nama || '') : '');
  const [kategori, setKategori] = useState(isEdit ? (barangAktif.kategori || 'item lain') : 'item lain');
  const [catatan, setCatatan] = useState(isEdit ? (barangAktif.catatan || barangAktif.catatanUtama || '') : '');
  const [punyaVarian, setPunyaVarian] = useState(isEdit ? (barangAktif.varian?.length > 0) : false);
  const [varianInput, setVarianInput] = useState(isEdit ? (barangAktif.varian?.join(', ') || '') : '');

  // ── 📥 2. RANTAI SATUAN & KONVERSI ──
  const [satuanTerbesar, setSatuanTerbesar] = useState(
    isEdit ? (barangAktif.satuanTerbesar || barangAktif.satuanBeli || 'Dus') : 'Dus'
  );
  const [hargaModalAgen, setHargaModalAgen] = useState(
    isEdit ? (barangAktif.hargaModalAgen ?? '') : ''
  );
  const [isiKeEceran, setIsiKeEceran] = useState(
    isEdit ? (barangAktif.isiKeEceran ?? '1') : '1'
  );
  const [satuanEceran, setSatuanEceran] = useState(
    isEdit ? (barangAktif.satuanJual || 'Pcs') : 'Pcs'
  );
  const [jumlahKonversiGrosir, setJumlahKonversiGrosir] = useState(
    isEdit ? (barangAktif.minimalBeliGrosir ?? '10') : '10'
  );
  const [satuanGrosirNama, setSatuanGrosirNama] = useState(
    isEdit ? (barangAktif.satuanGrosirNama || 'Renteng') : 'Renteng'
  );

  // ── 📤 3. BLOK HARGA JUAL KASIR ──
  const [jualEceran, setJualEceran] = useState(
    isEdit ? (barangAktif.jual ?? '') : ''
  );
  const [jualGrosirTotal, setJualGrosirTotal] = useState(
    isEdit ? (barangAktif.jualGrosirTotal ?? '') : ''
  );

  const daftarKategori = [
    'Sembako/Dapur',
    'Rokok/Korek',
    'Minuman/Kopi/Susu',
    'Snack/Biskuit/Roti',
    'Mie/Instan',
    'Sabun/Pembersih',
    'Obat-obatan/Medical item',
    'plastik/Cup',
    'item lain'
  ];

  if (!isOpen) return null;

  // 🧮 LIVE CALCULATION
  const hargaNota = Number(hargaModalAgen) || 0;
  const totalIsiTerkecil = Number(isiKeEceran) || 1;
  const isiPerGrosirMenengah = Number(jumlahKonversiGrosir) || 1;

  const modalEceranTerkecil = hargaNota > 0 && totalIsiTerkecil > 0 ? Math.ceil(hargaNota / totalIsiTerkecil) : 0;
  const modalGrosirMenengahTerhitung = Math.ceil(modalEceranTerkecil * isiPerGrosirMenengah);

  // 🛢️ HELPER KONVERSI MINYAK
  const handleKonversiMinyak = () => {
    const beratKg = Number(isiKeEceran) || 0;
    if (beratKg <= 0) {
      alert("Masukkan angka berat (Kg) di kotak isi eceran dulu, " + (userWarung ? userWarung.pemilik : 'Bos') + "!");
      return;
    }
    const hasilLiter = (beratKg / 0.92).toFixed(2);
    
    setIsiKeEceran(hasilLiter);
    setSatuanEceran('Liter');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama.trim()) { 
      alert("Nama Barang wajib diisi ya, " + (userWarung ? userWarung.pemilik : 'Bos') + "!"); 
      return; 
    }

    const valJualEceran = jualEceran ? Number(jualEceran) : 0;
    const valJualGrosirTotal = jualGrosirTotal ? Number(jualGrosirTotal) : 0;
    const valJualGrosirPerPcs = (valJualGrosirTotal > 0 && isiPerGrosirMenengah > 0)
      ? Math.round(valJualGrosirTotal / isiPerGrosirMenengah) 
      : 0;

    // 🎯 PAYLOAD BAKU
    onSimpan({
      ...(isEdit ? barangAktif : {}),

      nama: nama.trim(),
      kategori,
      catatan,
      varian: punyaVarian ? varianInput.split(',').map(v => v.trim()).filter(Boolean) : [],

      // 1. Konversi Isi
      isiKeEceran: totalIsiTerkecil,

      // 2. Satuan
      satuanTerbesar,
      satuanBeli: satuanTerbesar,
      satuanModal: satuanTerbesar,
      satuanJual: satuanEceran,

      // 3. Modal & Agen
      hargaModalAgen: hargaNota,
      modal: modalEceranTerkecil,

      // 4. Kasir & Harga Jual
      jual: valJualEceran,
      jualGrosirTotal: valJualGrosirTotal,
      jualGrosir: valJualGrosirPerPcs,

      // 5. Pengaturan Grosir
      bisaGrosir: valJualGrosirTotal > 0,
      bisaGrosirBesar: true,
      satuanGrosirNama: satuanGrosirNama,
      minimalBeliGrosir: isiPerGrosirMenengah,
      minimalBeliGrosirBesar: totalIsiTerkecil,
      modalGrosirTotal: modalGrosirMenengahTerhitung,
    });

    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        
        <h3 className={styles.modalTitle}>
          {modalMode === 'tambah' ? '➕ Tambah Barang Baru' : '📝 Edit Data Barang'}
        </h3>

        <form onSubmit={handleSubmit} className={styles.formContainer}>
          
          <div>
            <span className={styles.inputLabel}>Kategori Barang</span>
            <select value={kategori} onChange={(e) => setKategori(e.target.value)} className={styles.boxInput} style={{ fontWeight: '600' }}>
              {daftarKategori.map(kat => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>

          <div>
            <span className={styles.inputLabel}>Nama Barang</span>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Promag / Rokok Surya" className={styles.boxInput} />
          </div>

          <div className={styles.sectionModal}>
            <span className={styles.sectionTitleModal}>📥 DATA MODAL (Input Sesuai Nota Agen)</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <span className={styles.inputLabel}>Pilih Satuan Terbesar</span>
                <select value={satuanTerbesar} onChange={(e) => setSatuanTerbesar(e.target.value)} className={styles.boxInput} style={{ fontWeight: '600' }}>
                  {['Dus', 'Karung/Sak', 'Pack Besar', 'Slop', 'Pak', 'Ball', 'Karton', 'pcs', 'pack', 'rcg', 'Ikat', 'Bal', 'Kg'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <span className={styles.inputLabel}>Harga Nota 1 {satuanTerbesar}</span>
                <input type="number" value={hargaModalAgen} onChange={(e) => setHargaModalAgen(e.target.value)} placeholder="Msl: 150000" className={styles.boxInput} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <span className={styles.inputLabel}>Total Isi Eceran per {satuanTerbesar}</span>
                <div className={styles.rowGrid}>
                  <input type="number" value={isiKeEceran} onChange={(e) => setIsiKeEceran(e.target.value)} placeholder="10" className={styles.boxInput} style={{ width: '45%', borderRadius: '8px 0 0 8px', borderRight: 'none', textAlign: 'center' }} />
                  <select value={satuanEceran} onChange={(e) => setSatuanEceran(e.target.value)} className={styles.boxInput} style={{ width: '55%', borderRadius: '0 8px 8px 0', fontWeight: '700' }}>
                    {['Pcs', 'Kg', 'Liter', 'Bungkus', 'Sachet', 'Botol', 'Butir', 'Pack', '¼', 'Galon'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span className={styles.inputLabel}>🔒 Modal / 1 {satuanEceran} (Auto)</span>
                <input type="text" value={modalEceranTerkecil > 0 ? `Rp ${modalEceranTerkecil.toLocaleString('id-ID')}` : 'Rp 0'} readOnly className={`${styles.boxInput} ${styles.boxInputReadOnly}`} />
              </div>
            </div>

            {kategori === 'Sembako/Dapur' && (
              <div style={{ marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleKonversiMinyak}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: 'var(--bg-nav-active, #e6f4ea)',
                    border: '1px solid var(--accent-cyan, #137333)',
                    color: 'var(--accent-cyan, #137333)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  🛢️ Konversi {isiKeEceran || 0} Kg ke Liter (Minyak Sayur)
                </button>
              </div>
            )}

            <div style={{ borderTop: '1px dashed rgba(10, 129, 104, 0.2)', paddingTop: '8px', marginTop: '4px' }}>
              <span className={styles.inputLabel}>⚙️ Set Ukuran Eceran Kulakan Agen (Otomatis Mengalikan)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div className={styles.rowGrid}>
                  <input type="number" value={jumlahKonversiGrosir} onChange={(e) => setJumlahKonversiGrosir(e.target.value)} placeholder="10" className={styles.boxInput} style={{ width: '45%', borderRadius: '8px 0 0 8px', borderRight: 'none', textAlign: 'center' }} />
                  <select value={satuanGrosirNama} onChange={(e) => setSatuanGrosirNama(e.target.value)} className={styles.boxInput} style={{ width: '55%', borderRadius: '0 8px 8px 0', fontWeight: '600' }}>
                    {['Renteng', 'Slop', 'Pak Kecil', 'Pack', 'Bungkus', 'Lempeng', 'Kg', 'rcg', 'pcs'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <input type="text" value={modalGrosirMenengahTerhitung > 0 ? `Rp ${modalGrosirMenengahTerhitung.toLocaleString('id-ID')} / ${satuanGrosirNama}` : `Rp 0 / ${satuanGrosirNama}`} readOnly className={`${styles.boxInput} ${styles.boxInputReadOnly}`} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.sectionKasir}>
            <span className={styles.sectionTitleKasir}>📤 MENU KASIR: Atur Harga Jual Toko</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <span className={styles.inputLabel}>Jual Eceran (per {satuanEceran})</span>
                <input type="number" value={jualEceran} onChange={(e) => setJualEceran(e.target.value)} placeholder="Contoh: 2000" className={styles.boxInput} />
              </div>
              <div>
                <span className={styles.inputLabel}>Jual Grosir (per {satuanGrosirNama} - Opsional)</span>
                <input type="number" value={jualGrosirTotal} onChange={(e) => setJualGrosirTotal(e.target.value)} placeholder="Contoh: 18000" className={styles.boxInput} />
              </div>
            </div>
          </div>

          <div>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={punyaVarian} onChange={(e) => setPunyaVarian(e.target.checked)} />
              Barang punya banyak varian rasa/warna?
            </label>
            {punyaVarian && (
              <div style={{ marginTop: '6px' }}>
                <input 
                  type="text" 
                  value={varianInput} 
                  onChange={(e) => setVarianInput(e.target.value)} 
                  placeholder="Msl: Cokelat, Keju, Mint" 
                  className={styles.boxInput} 
                />
              </div>
            )}
          </div>

          <div>
            <label className={styles.inputLabel}>Catatan Tambahan (Opsional)</label>
            <textarea 
              value={catatan} 
              onChange={(e) => setCatatan(e.target.value)} 
              placeholder="Ketik catatan di sini..." 
              className={styles.boxInput}
              style={{ resize: 'none', height: '36px' }} 
            />
          </div>

          <div className={styles.actionRow}>
            <button type="button" onClick={onClose} className={styles.btnBatal}>Batal</button>
            <button type="submit" className={styles.btnSimpan}>Simpan</button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalBarang;