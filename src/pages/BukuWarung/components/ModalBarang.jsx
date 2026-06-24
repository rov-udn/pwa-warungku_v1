import { useState } from 'react';
import { createPortal } from 'react-dom';

function ModalBarang({ isOpen, onClose, modalMode, barangAktif, onSimpan }) {
  const isEdit = modalMode === 'edit' && barangAktif;

  // ── 🍏 1. NAMA, KATEGORI & VARIAN BARANG ──
  const [nama, setNama] = useState(isEdit ? (barangAktif.nama || '') : '');
  const [kategori, setKategori] = useState(isEdit ? (barangAktif.kategori || 'item lain') : 'item lain');
  const [catatan, setCatatan] = useState(isEdit ? (barangAktif.catatan || barangAktif.catatanUtama || '') : '');
  const [punyaVarian, setPunyaVarian] = useState(isEdit ? (barangAktif.varian?.length > 0 || false) : false);
  const [varianInput, setVarianInput] = useState(isEdit ? (barangAktif.varian?.join(', ') || '') : '');

  // ── 📥 2. LOGIKA RANTAI: SINKRON VARIABEL RAW VS PWA ──
  const [satuanTerbesar, setSatuanTerbesar] = useState(
    isEdit ? (barangAktif.satuanBeli || barangAktif.satuanTerbesar || barangAktif.satuanModal || 'Dus') : 'Dus'
  );
  const [hargaModalAgen, setHargaModalAgen] = useState(
    isEdit ? (barangAktif.hargaModalAgen || '') : ''
  );
  const [isiKeEceran, setIsiKeEceran] = useState(
    isEdit ? (barangAktif.isiKeEceran || '40') : '40'
  );
  const [satuanEceran, setSatuanEceran] = useState(
    isEdit ? (barangAktif.satuanJual || barangAktif.satuanEceran || 'Pcs') : 'Pcs'
  );

  const [jumlahKonversiGrosir, setJumlahKonversiGrosir] = useState(isEdit ? (barangAktif.minimalBeliGrosir || '10') : '10');
  const [satuanGrosirNama, setSatuanGrosirNama] = useState(isEdit ? (barangAktif.satuanGrosirNama || 'Renteng') : 'Renteng');

  // ── 📤 3. BLOK DATA JUAL TOKO ──
  const [jualEceran, setJualEceran] = useState(isEdit ? (barangAktif.jual || '') : '');
  const [jualGrosirTotal, setJualGrosirTotal] = useState(isEdit ? (barangAktif.jualGrosirTotal || '') : '');

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

  const modalEceranTerkecil = hargaNota > 0 && totalIsiTerkecil > 0 ? (hargaNota / totalIsiTerkecil).toFixed(4) : '0';
  const modalGrosirMenengahTerhitung = (Number(modalEceranTerkecil) * isiPerGrosirMenengah).toFixed(4);

  // ── 🎨 STYLING MATTE ──
  const styleBoxInput = { padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #eef0f3)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'var(--bg-toggle, #f2f2f7)', color: 'var(--text-main, #1c1c1e)', width: '100%', boxSizing: 'border-box' };
  const styleBoxInputReadOnly = { ...styleBoxInput, backgroundColor: '#e5e5ea', color: '#555555', fontWeight: '700', cursor: 'not-allowed' };
  const styleLabel = { fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #8e8e93)', marginBottom: '3px', display: 'block' };
  const styleRowGrid = { display: 'flex', width: '100%', boxSizing: 'border-box' };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama) { 
      alert("Nama Barang wajib diisi ya, Fi!"); 
      return; 
    }

    onSimpan({
      nama,
      kategori,
      modal: Number(modalEceranTerkecil), 
      modalEceran: Number(modalEceranTerkecil), 
      jual: jualEceran ? Number(jualEceran) : '', 
      hargaEceran: jualEceran ? Number(jualEceran) : '', 
      satuanModal: satuanTerbesar,
      satuanJual: satuanEceran,
      catatan,
      varian: punyaVarian ? varianInput.split(',').map(v => v.trim()).filter(v => v !== '') : [],
      
      satuanBeli: satuanTerbesar, 
      hargaAgen: hargaNota,
      isiSatuan: totalIsiTerkecil,
      isiPerSatuan: totalIsiTerkecil,

      satuanTerbesar,
      hargaModalAgen: hargaNota > 0 ? hargaNota : '', 
      isiKeEceran: totalIsiTerkecil,

      bisaGrosir: true, 
      satuanGrosirNama: satuanGrosirNama,
      minimalBeliGrosir: isiPerGrosirMenengah,
      modalGrosirTotal: Number(modalGrosirMenengahTerhitung),
      
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
          
          <div>
            <span style={styleLabel}>Kategori Barang</span>
            <select value={kategori} onChange={(e) => setKategori(e.target.value)} style={{ ...styleBoxInput, backgroundColor: '#ffffff', fontWeight: '600' }}>
              {daftarKategori.map(kat => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>

          <div>
            <span style={styleLabel}>Nama Barang</span>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Promag / Rokok Surya" style={styleBoxInput} />
          </div>

          <div style={{ backgroundColor: 'rgba(10, 129, 104, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(10, 129, 104, 0.15)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#0a8168', display: 'block' }}>📥 DATA MODAL (Input Sesuai Nota Agen)</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <span style={styleLabel}>Pilih Satuan Terbesar</span>
                <select value={satuanTerbesar} onChange={(e) => setSatuanTerbesar(e.target.value)} style={{ ...styleBoxInput, backgroundColor: '#ffffff', fontWeight: '600' }}>
                  {['Dus', 'Karung/Sak', 'Pack Besar', 'Slop', 'Pak', 'Ball', 'Karton', 'pcs', 'pack', 'rcg', 'Ikat', 'Bal', 'Kg'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <span style={styleLabel}>Harga Nota 1 {satuanTerbesar}</span>
                <input type="number" value={hargaModalAgen} onChange={(e) => setHargaModalAgen(e.target.value)} placeholder="Msl: 150000" style={{ ...styleBoxInput, backgroundColor: '#ffffff' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <span style={styleLabel}>Total Isi Eceran per {satuanTerbesar}</span>
                <div style={styleRowGrid}>
                  <input type="number" value={isiKeEceran} onChange={(e) => setIsiKeEceran(e.target.value)} placeholder="40" style={{ ...styleBoxInput, width: '45%', borderRadius: '8px 0 0 8px', borderRight: 'none', backgroundColor: '#ffffff', textAlign: 'center' }} />
                  <select value={satuanEceran} onChange={(e) => setSatuanEceran(e.target.value)} style={{ ...styleBoxInput, width: '55%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '700' }}>
                    {['Pcs', 'Kg', 'Liter', 'Bungkus', 'Sachet', 'Botol', 'Butir', 'Pack', '¼', 'Galon'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <span style={styleLabel}>🔒 Modal / 1 {satuanEceran} (Auto)</span>
                <input type="text" value={Number(modalEceranTerkecil) > 0 ? `Rp ${Math.round(Number(modalEceranTerkecil)).toLocaleString('id-ID')}` : 'Rp 0'} readOnly style={styleBoxInputReadOnly} />
              </div>
            </div>

            <div style={{ borderTop: '1px dashed rgba(10, 129, 104, 0.2)', paddingTop: '8px', marginTop: '4px' }}>
              <span style={styleLabel}>⚙️ Set Ukuran Eceran Kulakan Agen (Otomatis Mengalikan)</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div style={styleRowGrid}>
                  <input type="number" value={jumlahKonversiGrosir} onChange={(e) => setJumlahKonversiGrosir(e.target.value)} placeholder="10" style={{ ...styleBoxInput, width: '45%', borderRadius: '8px 0 0 8px', borderRight: 'none', backgroundColor: '#ffffff', textAlign: 'center' }} />
                  <select value={satuanGrosirNama} onChange={(e) => setSatuanGrosirNama(e.target.value)} style={{ ...styleBoxInput, width: '55%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                    {['Renteng', 'Slop', 'Pak Kecil', 'Pack', 'Bungkus', 'Lempeng', 'Kg', 'rcg'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <input type="text" value={Number(modalGrosirMenengahTerhitung) > 0 ? `Rp ${Math.round(Number(modalGrosirMenengahTerhitung)).toLocaleString('id-ID')} / ${satuanGrosirNama}` : `Rp 0 / ${satuanGrosirNama}`} readOnly style={styleBoxInputReadOnly} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(0, 122, 255, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#007aff', display: 'block', marginBottom: '6px' }}>📤 MENU KASIR: Atur Harga Jual Toko</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <span style={styleLabel}>Jual Eceran (per {satuanEceran})</span>
                <input type="number" value={jualEceran} onChange={(e) => setJualEceran(e.target.value)} placeholder="Contoh: 2000" style={{ ...styleBoxInput, backgroundColor: '#ffffff' }} />
              </div>
              <div>
                <span style={styleLabel}>Jual Grosir (per {satuanGrosirNama} - Opsional)</span>
                <input type="number" value={jualGrosirTotal} onChange={(e) => setJualGrosirTotal(e.target.value)} placeholder="Contoh: 18000" style={{ ...styleBoxInput, backgroundColor: '#ffffff' }} />
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
              <input type="checkbox" checked={punyaVarian} onChange={(e) => setPunyaVarian(e.target.checked)} />
              Barang punya banyak varian rasa/warna?
            </label>
            {punyaVarian && (
              <div style={{ marginTop: '6px' }}>
                {/* 🎯 FIX 1: Ditambahkan handler onChange agar isian varian bisa diketik */}
                <input 
                  type="text" 
                  value={varianInput} 
                  onChange={(e) => setVarianInput(e.target.value)} 
                  placeholder="Msl: Cokelat, Keju, Mint" 
                  style={styleBoxInput} 
                />
              </div>
            )}
          </div>

          <div>
            <span style={styleLabel}>Catatan Tambahan (Opsional)</span>
            {/* 🎯 FIX 2: Ditambahkan handler onChange agar isian catatan bisa diketik */}
            <textarea 
              value={catatan} 
              onChange={(e) => setCatatan(e.target.value)} 
              placeholder="Ketik catatan di sini..." 
              style={{ ...styleBoxInput, resize: 'none', height: '36px' }} 
            />
          </div>

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