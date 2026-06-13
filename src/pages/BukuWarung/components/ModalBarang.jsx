import { useState } from 'react';
import { createPortal } from 'react-dom';

function ModalBarang({ isOpen, onClose, modalMode, barangAktif, onSimpan }) {
  // ── 🧠 TRICK SAKTI: Inisialisasi nilai awal langsung membaca data barangAktif jika modenya 'edit' ──
  const isEdit = modalMode === 'edit' && barangAktif;

  const [nama, setNama] = useState(isEdit ? (barangAktif.nama || '') : '');
  const [modal, setModal] = useState(isEdit ? (barangAktif.modal || '') : '');
  const [jual, setJual] = useState(isEdit ? (barangAktif.jual || '') : '');
  const [satuanModal, setSatuanModal] = useState(isEdit ? (barangAktif.satuanModal || 'Pcs') : 'Pcs');
  const [catatan, setCatatan] = useState(isEdit ? (barangAktif.catatan || '') : '');
  const [punyaVarian, setPunyaVarian] = useState(isEdit ? (barangAktif.varian?.length > 0 || false) : false);
  const [varianInput, setVarianInput] = useState(isEdit ? (barangAktif.varian?.join(', ') || '') : '');

  const [bisaGrosir, setBisaGrosir] = useState(isEdit ? (barangAktif.bisaGrosir || false) : false);
  const [minimalBeliGrosir, setMinimalBeliGrosir] = useState(isEdit ? (barangAktif.minimalBeliGrosir || '') : '');
  const [jualGrosir, setJualGrosir] = useState(isEdit ? (barangAktif.jualGrosir || '') : '');
  const [satuanGrosirNama, setSatuanGrosirNama] = useState(isEdit ? (barangAktif.satuanGrosirNama || 'Renteng') : 'Renteng');

  const [bisaGrosirBesar, setBisaGrosirBesar] = useState(isEdit ? (barangAktif.bisaGrosirBesar || false) : false);
  const [minimalBeliGrosirBesar, setMinimalBeliGrosirBesar] = useState(isEdit ? (barangAktif.minimalBeliGrosirBesar || '') : '');
  const [jualGrosirBesarTotal, setJualGrosirBesarTotal] = useState(isEdit ? (barangAktif.jualGrosirBesarTotal || '') : ''); 
  const [satuanGrosirBesarNama, setSatuanGrosirBesarNama] = useState(isEdit ? (barangAktif.satuanGrosirBesarNama || 'Dus') : 'Dus');

  // Guard Clause: Jika modal sedang tertutup, langsung stop di sini tanpa merender elemen HTML apa pun
  if (!isOpen) return null;

  // ── 📊 VARIABEL STYLE BAWAAN ASLI KAMU ──
  const styleBoxInput = { padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color, #eef0f3)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'var(--bg-toggle, #f2f2f7)', color: 'var(--text-main, #1c1c1e)', width: '100%', boxSizing: 'border-box' };
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
      varian: punyaVarian ? varianInput.split(',').map(v => v.trim()).filter(v => v !== '') : [],
      bisaGrosir,
      minimalBeliGrosir: bisaGrosir ? Number(minimalBeliGrosir) : null,
      jualGrosir: bisaGrosir ? Number(jualGrosir) : null,
      satuanGrosirNama: bisaGrosir ? satuanGrosirNama : '',
      bisaGrosirBesar,
      minimalBeliGrosirBesar: bisaGrosirBesar ? Number(minimalBeliGrosirBesar) : null,
      jualGrosirBesarTotal: bisaGrosirBesar ? Number(jualGrosirBesarTotal) : null,
      jualGrosirBesarPerPcs: bisaGrosirBesar ? Math.round(Number(jualGrosirBesarTotal) / Math.max(1, Number(minimalBeliGrosirBesar))) : null,
      satuanGrosirBesarNama: bisaGrosirBesar ? satuanGrosirBesarNama : ''
    });
    onClose();
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'var(--bg-header, #ffffff)', width: '100%', maxWidth: '420px', maxHeight: '85vh', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)' }}>
          {modalMode === 'tambah' ? '➕ Tambah Barang Baru' : '📝 Edit Data Barang'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* Input Nama */}
          <div>
            <label style={styleLabel}>Nama Barang</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Kopi Kapal Api" style={styleBoxInput} />
          </div>

          {/* Grid Multi-Satuan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={styleLabel}>Harga Modal Eceran Terkecil</label>
              <div style={styleRowGrid}>
                <input type="number" value={modal} onChange={(e) => setModal(e.target.value)} placeholder="2500" style={{ ...styleBoxInput, width: '60%', borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
                <select value={satuanModal} onChange={(e) => setSatuanModal(e.target.value)} style={{ ...styleBoxInput, width: '40%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                  {['Pcs', 'Bungkus', 'Sachet', 'Blister', 'Botol', 'Batang', 'Kg'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={styleLabel}>Harga Jual Eceran Toko</label>
              <div style={styleRowGrid}>
                <input type="number" value={jual} onChange={(e) => setJual(e.target.value)} placeholder="3000" style={{ ...styleBoxInput, width: '60%', borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
                <div style={{ ...styleBoxInput, width: '40%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {satuanModal}
                </div>
              </div>
            </div>
          </div>

          {/* ── OPSI VARIAN ── */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '8px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={punyaVarian} onChange={(e) => setPunyaVarian(e.target.checked)} />
              Barang punya banyak varian rasa/warna?
            </label>
            {punyaVarian && (
              <div style={{ marginTop: '6px' }}>
                <label style={styleLabel}>Masukkan Varian (Pisah dengan koma)</label>
                <input type="text" value={varianInput} onChange={(e) => setVarianInput(e.target.value)} placeholder="Soto, Ayam Bawang, Kare" style={styleBoxInput} />
              </div>
            )}
          </div>

          {/* ── OPSI GROSIR LEVEL MENENGAH (RENTENG/SLOP/PAK KECIL) ── */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '8px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={bisaGrosir} onChange={(e) => setBisaGrosir(e.target.checked)} />
              Aktifkan Grosir Level Menengah? (Renteng/Slop/Pak)
            </label>

            {bisaGrosir && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>Nama Satuan Menengah</label>
                    <select value={satuanGrosirNama} onChange={(e) => setSatuanGrosirNama(e.target.value)} style={{ ...styleBoxInput, backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600', height: '35px' }}>
                      {/* 🟢 SUNTIKKAN OPSI 'PAK KECIL' DI SINI FI */}
                      {['Renteng', 'Slop', 'Pak', 'Pak Kecil', 'Lempeng'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styleLabel}>Isi per 1 {satuanGrosirNama} (Total Pcs)</label>
                    <input type="number" value={minimalBeliGrosir} onChange={(e) => setMinimalBeliGrosir(e.target.value)} placeholder="10" style={styleBoxInput} />
                  </div>
                </div>
                <div>
                  <label style={styleLabel}>Harga Jual per Pcs (Saat Grosir Menengah)</label>
                  <input type="number" value={jualGrosir} onChange={(e) => setJualGrosir(e.target.value)} placeholder="1800" style={styleBoxInput} />
                </div>
              </div>
            )}
          </div>

          {/* ── OPSI GROSIR LEVEL BESAR (DUS/BAL/PAK BESAR) ── */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '8px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={bisaGrosirBesar} onChange={(e) => setBisaGrosirBesar(e.target.checked)} />
              Aktifkan Grosir Level Besar? (Dus/Bal/Karton)
            </label>

            {bisaGrosirBesar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>Nama Satuan Besar</label>
                    <select value={satuanGrosirBesarNama} onChange={(e) => setSatuanGrosirBesarNama(e.target.value)} style={{ ...styleBoxInput, backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600', height: '35px' }}>
                      {/* 🟢 SUNTIKKAN OPSI 'PAK BESAR' DI SINI FI */}
                      {['Dus', 'Bal', 'Karton', 'Pack Besar', 'Sak/Karung'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styleLabel}>Isi per 1 {satuanGrosirBesarNama} (Total Pcs)</label>
                    <input type="number" value={minimalBeliGrosirBesar} onChange={(e) => setMinimalBeliGrosirBesar(e.target.value)} placeholder="40" style={styleBoxInput} />
                  </div>
                </div>
                <div>
                  <label style={styleLabel}>Harga Jual Total per 1 {satuanGrosirBesarNama} (Rp)</label>
                  <input type="number" value={jualGrosirBesarTotal} onChange={(e) => setJualGrosirBesarTotal(e.target.value)} placeholder="105000" style={styleBoxInput} />
                  {jualGrosirBesarTotal && minimalBeliGrosirBesar && (
                    <span style={{ fontSize: '0.7rem', color: '#0a8168', fontWeight: '700', marginTop: '2px', display: 'block' }}>
                      📊 Otomatis kehitung: Rp {(Number(jualGrosirBesarTotal) / Number(minimalBeliGrosirBesar)).toFixed(0)} / pcs pas kasir nanti.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label style={styleLabel}>Catatan Grosir (Opsional)</label>
            <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Ketik catatan tambahan di sini..." style={{ ...styleBoxInput, resize: 'none', height: '40px' }} />
          </div>

          {/* Tombol Aksi */}
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