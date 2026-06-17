import { useState } from 'react';
import { createPortal } from 'react-dom';

function ModalBarang({ isOpen, onClose, modalMode, barangAktif, onSimpan }) {
  const isEdit = modalMode === 'edit' && barangAktif;

  // ── 🍏 STATE UTAMA (ECERAN) ──
  const [nama, setNama] = useState(isEdit ? (barangAktif.nama || '') : '');
  const [modal, setModal] = useState(isEdit ? (barangAktif.modal || '') : '');
  const [jual, setJual] = useState(isEdit ? (barangAktif.jual || '') : '');
  const [satuanModal, setSatuanModal] = useState(isEdit ? (barangAktif.satuanModal || 'Pcs') : 'Pcs');
  const [catatan, setCatatan] = useState(isEdit ? (barangAktif.catatan || '') : '');
  const [punyaVarian, setPunyaVarian] = useState(isEdit ? (barangAktif.varian?.length > 0 || false) : false);
  const [varianInput, setVarianInput] = useState(isEdit ? (barangAktif.varian?.join(', ') || '') : '');
  
  // ⚖️ STATE: Faktor pengali desimal untuk barang kiloan/curah (Contoh: 0.25 untuk seprapat)
  const [beratKonversi, setBeratKonversi] = useState(isEdit ? (barangAktif.beratKonversi || '1') : '1');

  // 🧮 STATE BARU: Fitur Hitung Mundur dari Nota Agen (Mencegah pecahan pusing)
  const [inputPakaiHargaAgen, setInputPakaiHargaAgen] = useState(false);
  const [modalAgenInput, setModalAgenInput] = useState('');
  const [isiAgenInput, setIsiAgenInput] = useState('');

  // ── 🛒 STATE GROSIR LEVEL MENENGAH (SLOP/RENTENG) ──
  const [bisaGrosir, setBisaGrosir] = useState(isEdit ? (barangAktif.bisaGrosir || false) : false);
  const [satuanGrosirNama, setSatuanGrosirNama] = useState(isEdit ? (barangAktif.satuanGrosirNama || 'Slop') : 'Slop');
  const [minimalBeliGrosir, setMinimalBeliGrosir] = useState(isEdit ? (barangAktif.minimalBeliGrosir || '') : '');
  const [jualGrosirTotal, setJualGrosirTotal] = useState(isEdit ? (barangAktif.jualGrosirTotal || '') : '');

  // ── 📦 STATE GROSIR LEVEL BESAR (DUS/BAL/KARUNG) ──
  const [bisaGrosirBesar, setBisaGrosirBesar] = useState(isEdit ? (barangAktif.bisaGrosirBesar || false) : false);
  const [satuanGrosirBesarNama, setSatuanGrosirBesarNama] = useState(isEdit ? (barangAktif.satuanGrosirBesarNama || 'Dus') : 'Dus');
  const [minimalBeliGrosirBesar, setMinimalBeliGrosirBesar] = useState(isEdit ? (barangAktif.minimalBeliGrosirBesar || '') : '');
  const [jualGrosirBesarTotal, setJualGrosirBesarTotal] = useState(isEdit ? (barangAktif.jualGrosirBesarTotal || '') : '');

  if (!isOpen) return null;

  // ── 🧮 LIVE AUTO-CALCULATOR MODAL AGEN (UNTUK FITUR GROSIR) ──
  const modalAgenMenengah = Number(modal) * (Number(minimalBeliGrosir) || 0);
  const modalAgenBesar = Number(modal) * (Number(minimalBeliGrosirBesar) || 0);

  // Cek apakah barang ini tipe timbangan/curah
  const isBarangTimbangan = satuanModal === 'Kg' || satuanModal === 'Liter' || catatan.toLowerCase().includes('kilo') || catatan.toLowerCase().includes('curah');

  // Fungsi pembagi otomatis nota agen ke eceran presisi
  const hitungMundurModalEceran = (hargaAgen, isi) => {
    const harga = Number(hargaAgen) || 0;
    const jumlah = Number(isi) || 0;
    if (harga > 0 && jumlah > 0) {
      setModal((harga / jumlah).toFixed(4)); // Simpan sampai 4 desimal di belakang koma biar super presisi
    } else {
      setModal('');
    }
  };

  // ── 🎨 STYLE COMPONENT ──
  const styleBoxInput = { padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color, #eef0f3)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'var(--bg-toggle, #f2f2f7)', color: 'var(--text-main, #1c1c1e)', width: '100%', boxSizing: 'border-box' };
  const styleBoxInputReadOnly = { ...styleBoxInput, backgroundColor: '#e5e5ea', color: '#555555', fontWeight: '600', cursor: 'not-allowed' };
  const styleLabel = { fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #8e8e93)', marginBottom: '2px', display: 'block' };
  const styleRowGrid = { display: 'flex', width: '100%', boxSizing: 'border-box' };
  const styleFlexCheck = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main, #1c1c1e)' };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama || !modal || !jual) { alert("Nama, Modal, dan Jual wajib diisi ya, Fi!"); return; }
    
    onSimpan({
      nama, 
      modal: Number(modal), 
      jual: Number(jual), 
      satuanModal, 
      satuanJual: satuanModal, 
      catatan,
      beratKonversi: Number(beratKonversi) || 1,
      varian: punyaVarian ? varianInput.split(',').map(v => v.trim()).filter(v => v !== '') : [],
      
      // Grosir Menengah (Slop)
      bisaGrosir,
      satuanGrosirNama: bisaGrosir ? satuanGrosirNama : '',
      minimalBeliGrosir: bisaGrosir ? Number(minimalBeliGrosir) : null,
      modalGrosirTotal: bisaGrosir ? modalAgenMenengah : null,
      jualGrosirTotal: bisaGrosir ? Number(jualGrosirTotal) : null,
      jualGrosir: bisaGrosir ? Math.round(Number(jualGrosirTotal) / Math.max(1, Number(minimalBeliGrosir))) : null,

      // Grosir Besar (Dus)
      bisaGrosirBesar,
      satuanGrosirBesarNama: bisaGrosirBesar ? satuanGrosirBesarNama : '',
      minimalBeliGrosirBesar: bisaGrosirBesar ? Number(minimalBeliGrosirBesar) : null,
      modalGrosirBesarTotal: bisaGrosirBesar ? modalAgenBesar : null,
      jualGrosirBesarTotal: bisaGrosirBesar ? Number(jualGrosirBesarTotal) : null,
      jualGrosirBesarPerPcs: bisaGrosirBesar ? Math.round(Number(jualGrosirBesarTotal) / Math.max(1, Number(minimalBeliGrosirBesar))) : null
    });
    onClose();
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'var(--bg-header, #ffffff)', width: '100%', maxWidth: '440px', maxHeight: '90vh', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)' }}>
          {modalMode === 'tambah' ? '➕ Tambah Barang Baru' : '📝 Edit Data Barang'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* 1. NAMA BARANG */}
          <div>
            <label style={styleLabel}>Nama Barang</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Roti Aoka Cokelat" style={styleBoxInput} />
          </div>

          {/* 2. LEVEL ECERAN TERKECIL + FITUR NOTA AGEN */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={styleLabel}>Harga Modal Eceran</label>
              <label style={{ fontSize: '0.7rem', fontWeight: '700', color: '#0a8168', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="checkbox" 
                  checked={inputPakaiHargaAgen} 
                  onChange={(e) => {
                    setInputPakaiHargaAgen(e.target.checked);
                    if(!e.target.checked) { setModal(''); setModalAgenInput(''); setIsiAgenInput(''); }
                  }} 
                />
                📟 Hitung dari Nota Agen
              </label>
            </div>

            {inputPakaiHargaAgen ? (
              <div style={{ display: 'flex', gap: '6px', backgroundColor: 'rgba(10, 129, 104, 0.05)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(10, 129, 104, 0.2)' }}>
                <input 
                  type="number" 
                  placeholder="Harga Nota (100000)" 
                  value={modalAgenInput}
                  onChange={(e) => {
                    setModalAgenInput(e.target.value);
                    hitungMundurModalEceran(e.target.value, isiAgenInput);
                  }}
                  style={styleBoxInput} 
                />
                <span style={{ fontSize: '1rem', alignSelf: 'center', fontWeight: '700', color: '#0a8168' }}>÷</span>
                <input 
                  type="number" 
                  placeholder="Isi (60)" 
                  value={isiAgenInput}
                  onChange={(e) => {
                    setIsiAgenInput(e.target.value);
                    hitungMundurModalEceran(modalAgenInput, e.target.value);
                  }}
                  style={{ ...styleBoxInput, width: '100px', textAlign: 'center' }} 
                />
                <div style={{ minWidth: '70px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#0a8168', fontWeight: '700', borderLeft: '1px solid #cbd5e1' }}>
                  <span>Estimasi:</span>
                  <span style={{ fontSize: '0.85rem' }}>Rp {modal ? Math.round(Number(modal)).toLocaleString('id-ID') : 0}</span>
                </div>
              </div>
            ) : (
              <div style={styleRowGrid}>
                <input type="number" value={modal} onChange={(e) => setModal(e.target.value)} placeholder="1667" style={{ ...styleBoxInput, width: '60%', borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
                <select value={satuanModal} onChange={(e) => setSatuanModal(e.target.value)} style={{ ...styleBoxInput, width: '40%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                  {['Pcs', 'Bungkus', 'Sachet', 'Botol', 'Kg', 'Liter', 'Butir'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* HARGA JUAL ECERAN */}
          <div>
            <label style={styleLabel}>Harga Jual Eceran Toko</label>
            <div style={styleRowGrid}>
              <input type="number" value={jual} onChange={(e) => setJual(e.target.value)} placeholder="2300" style={{ ...styleBoxInput, width: '60%', borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
              <div style={{ ...styleBoxInput, width: '40%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {satuanModal}
              </div>
            </div>
          </div>

          {/* ⚖️ PANEL: INPUT BERAT KONVERSI KHUSUS BARANG KILOAN / CURAH */}
          {isBarangTimbangan && (
            <div style={{ backgroundColor: 'rgba(255, 149, 0, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
              <label style={{ ...styleLabel, color: '#c67c00' }}>⚖️ Set Ukuran Timbangan Eceran Ini</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Berat Eceran =</span>
                <input 
                  type="number" 
                  step="0.01" 
                  value={beratKonversi} 
                  onChange={(e) => setBeratKonversi(e.target.value)} 
                  placeholder="0.25" 
                  style={{ ...styleBoxInput, width: '80px', textAlign: 'center', borderColor: 'rgba(255, 149, 0, 0.4)' }} 
                />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>Kg / Liter asli</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: '#8e8e93', lineHeight: '1.2' }}>
                💡 Tips: Jika eceran ukuran Seprapat isi <code>0.25</code>, jika Setengah Kilo isi <code>0.5</code>, jika Se-kilo isi <code>1</code>.
              </p>
            </div>
          )}

          {/* 3. OPSI VARIAN */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '8px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={punyaVarian} onChange={(e) => setPunyaVarian(e.target.checked)} />
              Barang punya banyak varian rasa/warna?
            </label>
            {punyaVarian && (
              <div style={{ marginTop: '6px' }}>
                <label style={styleLabel}>Masukkan Varian (Pisah dengan koma)</label>
                <input type="text" value={varianInput} onChange={(e) => setVarianInput(e.target.value)} placeholder="Cokelat, Susu, Keju" style={styleBoxInput} />
              </div>
            )}
          </div>

          {/* 4. GROSIR LEVEL MENENGAH (SLOP/RENTENG) */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '8px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={bisaGrosir} onChange={(e) => setBisaGrosir(e.target.checked)} />
              Aktifkan Grosir Level Menengah? (Slop/Renteng/Pak)
            </label>

            {bisaGrosir && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', padding: '10px', backgroundColor: 'rgba(10, 129, 104, 0.05)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>Nama Satuan Grosir</label>
                    <select value={satuanGrosirNama} onChange={(e) => setSatuanGrosirNama(e.target.value)} style={{ ...styleBoxInput, backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                      {['Slop', 'Renteng', 'Pak', 'Pak Kecil', 'Kg', 'Liter', 'Lempeng'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styleLabel}>Isi per 1 {satuanGrosirNama} (Jumlah {satuanModal})</label>
                    <input type="number" value={minimalBeliGrosir} onChange={(e) => setMinimalBeliGrosir(e.target.value)} placeholder="4" style={styleBoxInput} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>📥 Harga Modal 1 {satuanGrosirNama} (Auto)</label>
                    <input type="text" value={minimalBeliGrosir ? `Rp ${Math.round(modalAgenMenengah).toLocaleString('id-ID')}` : 'Rp 0'} readOnly style={styleBoxInputReadOnly} />
                  </div>
                  <div>
                    <label style={styleLabel}>📤 Harga Jual 1 {satuanGrosirNama} (Total)</label>
                    <input type="number" value={jualGrosirTotal} onChange={(e) => setJualGrosirTotal(e.target.value)} placeholder="12000" style={styleBoxInput} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. GROSIR LEVEL BESAR (DUS/BAL) */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '8px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={bisaGrosirBesar} onChange={(e) => setBisaGrosirBesar(e.target.checked)} />
              Aktifkan Grosir Level Besar? (Dus/Bal/Karung)
            </label>

            {bisaGrosirBesar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', padding: '10px', backgroundColor: 'rgba(0, 122, 255, 0.05)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>Nama Satuan Besar</label>
                    <select value={satuanGrosirBesarNama} onChange={(e) => setSatuanGrosirBesarNama(e.target.value)} style={{ ...styleBoxInput, backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                      {['Dus', 'Bal', 'Karton', 'Pack Besar', 'Sak/Karung'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styleLabel}>Isi per 1 {satuanGrosirBesarNama} (Jumlah {satuanModal})</label>
                    <input type="number" value={minimalBeliGrosirBesar} onChange={(e) => setMinimalBeliGrosirBesar(e.target.value)} placeholder="60" style={styleBoxInput} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>📥 Harga Modal 1 {satuanGrosirBesarNama} (Auto)</label>
                    <input type="text" value={minimalBeliGrosirBesar ? `Rp ${Math.round(modalAgenBesar).toLocaleString('id-ID')}` : 'Rp 0'} readOnly style={styleBoxInputReadOnly} />
                  </div>
                  <div>
                    <label style={styleLabel}>📤 Harga Jual 1 {satuanGrosirBesarNama} (Total)</label>
                    <input type="number" value={jualGrosirBesarTotal} onChange={(e) => setJualGrosirBesarTotal(e.target.value)} placeholder="130000" style={styleBoxInput} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. CATATAN */}
          <div>
            <label style={styleLabel}>Catatan Tambahan (Opsional)</label>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Ketik catatan di sini..." style={{ ...styleBoxInput, resize: 'none', height: '40px' }} />
          </div>

          {/* 7. TOMBOL AKSI */}
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