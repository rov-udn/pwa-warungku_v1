import { useState } from 'react';
import { createPortal } from 'react-dom';

function ModalBarang({ isOpen, onClose, modalMode, barangAktif, onSimpan }) {
  const isEdit = modalMode === 'edit' && barangAktif;

  // ── 🍏 1. NAMA & VARIAN BARANG ──
  const [nama, setNama] = useState(isEdit ? (barangAktif.nama || '') : '');
  const [catatan, setCatatan] = useState(isEdit ? (barangAktif.catatan || '') : '');
  const [punyaVarian, setPunyaVarian] = useState(isEdit ? (barangAktif.varian?.length > 0 || false) : false);
  const [varianInput, setVarianInput] = useState(isEdit ? (barangAktif.varian?.join(', ') || '') : '');

  // ── 📥 2. LOGIKA RANTAI 3 TANGGA: DATA MODAL KULAKAN AGEN ──
  const [satuanTerbesar, setSatuanTerbesar] = useState(isEdit ? (barangAktif.satuanTerbesar || 'Dus') : 'Dus');
  const [hargaModalAgen, setHargaModalAgen] = useState(isEdit ? (barangAktif.hargaModalAgen || '') : '');
  const [isiKeEceran, setIsiKeEceran] = useState(isEdit ? (barangAktif.isiKeEceran || '60') : '60');
  const [satuanEceran, setSatuanEceran] = useState(isEdit ? (barangAktif.satuanModal || 'Pcs') : 'Pcs');

  // Jembatan Satuan Menengah Pilihan User (Msl: isi 10 Renteng)
  const [jumlahKonversiGrosir, setJumlahKonversiGrosir] = useState(isEdit ? (barangAktif.minimalBeliGrosir || '10') : '10');
  const [satuanGrosirNama, setSatuanGrosirNama] = useState(isEdit ? (barangAktif.satuanGrosirNama || 'Renteng') : 'Renteng');

  // ── 📤 3. BLOK DATA JUAL TOKO (KASIR) ──
  const [jualEceran, setJualEceran] = useState(isEdit ? (barangAktif.jual || '') : '');
  const [jualGrosirTotal, setJualGrosirTotal] = useState(isEdit ? (barangAktif.jualGrosirTotal || '') : '');

  if (!isOpen) return null;

  // 🧮 LIVE CALCULATION (MATEMATIKA LANGSUNG - LOLOS SENSOR ESLINT)
  const hargaNota = Number(hargaModalAgen) || 0;
  const totalIsiTerkecil = Number(isiKeEceran) || 1;
  const isiPerGrosirMenengah = Number(jumlahKonversiGrosir) || 1;

  // 1. Hitung modal terkecil mutlak (Pcs/Kg) untuk kasir
  const modalEceranTerkecil = hargaNota > 0 && totalIsiTerkecil > 0 ? (hargaNota / totalIsiTerkecil).toFixed(4) : '0';

  // 2. Hitung modal grosir menengah otomatis (Modal Terkecil x Jumlah Jembatan Tengah)
  const modalGrosirMenengahTerhitung = (Number(modalEceranTerkecil) * isiPerGrosirMenengah).toFixed(4);

  // ── 🎨 STYLE DASHBOARD (MATTE COMPONENT) ──
  const styleBoxInput = { padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #eef0f3)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'var(--bg-toggle, #f2f2f7)', color: 'var(--text-main, #1c1c1e)', width: '100%', boxSizing: 'border-box' };
  const styleBoxInputReadOnly = { ...styleBoxInput, backgroundColor: '#e5e5ea', color: '#555555', fontWeight: '700', cursor: 'not-allowed' };
  const styleLabel = { fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #8e8e93)', marginBottom: '3px', display: 'block' };
  const styleRowGrid = { display: 'flex', width: '100%', boxSizing: 'border-box' };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama || Number(modalEceranTerkecil) <= 0 || !jualEceran) { alert("Nama Barang, Harga Nota, dan Jual Eceran wajib diisi ya, Fi!"); return; }

    onSimpan({
      nama,
      modal: Number(modalEceranTerkecil), // Acuan modal terkecil (Pcs/Kg)
      jual: Number(jualEceran),
      satuanModal: satuanEceran,
      satuanJual: satuanEceran,
      catatan,
      varian: punyaVarian ? varianInput.split(',').map(v => v.trim()).filter(v => v !== '') : [],
      
      // Data Kulakan Terbesar (Nota Agen)
      satuanTerbesar,
      hargaModalAgen: hargaNota,
      isiKeEceran: totalIsiTerkecil,

      // Data Jembatan Satuan Menengah (Renteng/Slop/Pack Kecil)
      bisaGrosir: true, // Dipaksa true agar Belanja Agen selalu memunculkan opsi belanja eceran
      satuanGrosirNama: satuanGrosirNama,
      minimalBeliGrosir: isiPerGrosirMenengah,
      modalGrosirTotal: Number(modalGrosirMenengahTerhitung),
      
      // Harga Jual Grosir Toko (Jika diisi user)
      jualGrosirTotal: jualGrosirTotal ? Number(jualGrosirTotal) : null,
      jualGrosir: jualGrosirTotal ? Math.round(Number(jualGrosirTotal) / isiPerGrosirMenengah) : null
    });
    onClose();
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'var(--bg-header, #ffffff)', width: '100%', maxWidth: '440px', maxHeight: '94vh', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)' }}>
          {modalMode === 'tambah' ? '➕ Tambah Barang Baru' : '📝 Edit Data Barang'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* NAMA BARANG */}
          <div>
            <label style={styleLabel}>Nama Barang</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Promag / Rokok Surya" style={styleBoxInput} />
          </div>

          {/* 📥 BLOK DATA MODAL (INPUT NOTA AGEN) */}
          <div style={{ backgroundColor: 'rgba(10, 129, 104, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(10, 129, 104, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0a8168', display: 'block' }}>📥 DATA MODAL (Input Sesuai Nota Agen)</span>
            
            {/* Lini 1: Satuan Terbesar (Jerigen Dihapus, Diganti Pack Besar) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label style={styleLabel}>Pilih Satuan Terbesar</label>
                <select value={satuanTerbesar} onChange={(e) => setSatuanTerbesar(e.target.value)} style={{ ...styleBoxInput, backgroundColor: '#ffffff', fontWeight: '600' }}>
                  {['Dus', 'Karung/Sak', 'Pack Besar', 'Slop', 'Pak', 'Ball', 'Karton'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={styleLabel}>Harga Nota 1 {satuanTerbesar}</label>
                <input type="number" value={hargaModalAgen} onChange={(e) => setHargaModalAgen(e.target.value)} placeholder="Msl: 150000" style={{ ...styleBoxInput, backgroundColor: '#ffffff' }} />
              </div>
            </div>

            {/* Lini 2: Total Isi Eceran Terkecil */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label style={styleLabel}>Total Isi Eceran per {satuanTerbesar}</label>
                <div style={styleRowGrid}>
                  <input type="number" value={isiKeEceran} onChange={(e) => setIsiKeEceran(e.target.value)} placeholder="60" style={{ ...styleBoxInput, width: '45%', borderRadius: '8px 0 0 8px', borderRight: 'none', backgroundColor: '#ffffff', textAlign: 'center' }} />
                  <select value={satuanEceran} onChange={(e) => setSatuanEceran(e.target.value)} style={{ ...styleBoxInput, width: '55%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '700' }}>
                    {['Pcs', 'Kg', 'Liter', 'Bungkus', 'Sachet', 'Botol', 'Butir'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={styleLabel}>🔒 Modal / 1 {satuanEceran} (Auto)</label>
                <input type="text" value={Number(modalEceranTerkecil) > 0 ? `Rp ${Math.round(Number(modalEceranTerkecil)).toLocaleString('id-ID')}` : 'Rp 0'} readOnly style={styleBoxInputReadOnly} />
              </div>
            </div>

            {/* Lini 3: Jembatan Opsi Belanja Eceran Pilihan Rofi */}
            <div style={{ borderTop: '1px dashed rgba(10, 129, 104, 0.2)', paddingTop: '8px', marginTop: '4px' }}>
              <label style={styleLabel}>⚙️ Set Ukuran Eceran Kulakan Agen (Otomatis Mengalikan)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div style={styleRowGrid}>
                  <input type="number" value={jumlahKonversiGrosir} onChange={(e) => setJumlahKonversiGrosir(e.target.value)} placeholder="10" style={{ ...styleBoxInput, width: '45%', borderRadius: '8px 0 0 8px', borderRight: 'none', backgroundColor: '#ffffff', textAlign: 'center' }} />
                  <select value={satuanGrosirNama} onChange={(e) => setSatuanGrosirNama(e.target.value)} style={{ ...styleBoxInput, width: '55%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                    {['Renteng', 'Slop', 'Pak Kecil', 'Pack', 'Bungkus', 'Lempeng'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <input type="text" value={Number(modalGrosirMenengahTerhitung) > 0 ? `Rp ${Math.round(Number(modalGrosirMenengahTerhitung)).toLocaleString('id-ID')} / ${satuanGrosirNama}` : `Rp 0 / ${satuanGrosirNama}`} readOnly style={styleBoxInputReadOnly} />
                </div>
              </div>
            </div>
          </div>

          {/* 📤 3. BLOK DATA JUAL TOKO */}
          <div style={{ backgroundColor: 'rgba(0, 122, 255, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#007aff', display: 'block', marginBottom: '6px' }}>📤 MENU KASIR: Atur Harga Jual Toko</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={styleLabel}>Jual Eceran (per {satuanEceran})</label>
                <input type="number" value={jualEceran} onChange={(e) => setJualEceran(e.target.value)} placeholder="Contoh: 2000" style={{ ...styleBoxInput, backgroundColor: '#ffffff' }} />
              </div>
              <div>
                <label style={styleLabel}>Jual Grosir (per {satuanGrosirNama} - Opsional)</label>
                <input type="number" value={jualGrosirTotal} onChange={(e) => setJualGrosirTotal(e.target.value)} placeholder="Contoh: 18000" style={{ ...styleBoxInput, backgroundColor: '#ffffff' }} />
              </div>
            </div>
          </div>

          {/* OPSI VARIAN */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
              <input type="checkbox" checked={punyaVarian} onChange={(e) => setPunyaVarian(e.target.checked)} />
              Barang punya banyak varian rasa/warna?
            </label>
            {punyaVarian && (
              <div style={{ marginTop: '6px' }}>
                <input type="text" value={varianInput} onChange={(e) => setVarianInput(e.target.value)} placeholder="Msl: Cokelat, Keju, Mint" style={styleBoxInput} />
              </div>
            )}
          </div>

          {/* CATATAN */}
          <div>
            <label style={styleLabel}>Catatan Tambahan (Opsional)</label>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Ketik catatan di sini..." style={{ ...styleBoxInput, resize: 'none', height: '36px' }} />
          </div>

          {/* TOMBOL AKSI */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', backgroundColor: 'var(--border-color, #f2f2f7)', border: 'none', borderRadius: '8px', fontWeight: '700', color: 'var(--text-muted, #8e8e93)', cursor: 'pointer' }}>Batal</button>
            <button type="submit" style={{ flex: 1, padding: '9px', backgroundColor: '#0a8168', border: 'none', borderRadius: '8px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}>Simpan</button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}

export default ModalBarang;