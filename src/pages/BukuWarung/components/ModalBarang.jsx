import { useState } from 'react';
import { createPortal } from 'react-dom';

function ModalBarang({ isOpen, onClose, modalMode, barangAktif, onSimpan }) {
  const isEdit = modalMode === 'edit' && barangAktif;

  // ── 🍏 STATE UTAMA (NAMA & VARIAN) ──
  const [nama, setNama] = useState(isEdit ? (barangAktif.nama || '') : '');
  const [catatan, setCatatan] = useState(isEdit ? (barangAktif.catatan || '') : '');
  const [punyaVarian, setPunyaVarian] = useState(isEdit ? (barangAktif.varian?.length > 0 || false) : false);
  const [varianInput, setVarianInput] = useState(isEdit ? (barangAktif.varian?.join(', ') || '') : '');

  // ── 📦 TANGGA 3: INPUT KULAKAN TERBESAR (NOTA AGEN) ──
  const [satuanGrosirBesarNama, setSatuanGrosirBesarNama] = useState(isEdit ? (barangAktif.satuanGrosirBesarNama || 'Dus') : 'Dus');
  const [hargaModalAgenTotal, setHargaModalAgenTotal] = useState(isEdit ? (barangAktif.hargaModalGrosirBesarTotal || '') : '');
  const [isiKeEceran, setIsiKeEceran] = useState(isEdit ? (barangAktif.minimalBeliGrosirBesar || '60') : '60');

  // ── 🍏 TANGGA 1: LEVEL ECERAN TERKECIL ──
  const [satuanEceran, setSatuanEceran] = useState(isEdit ? (barangAktif.satuanModal || 'Pcs') : 'Pcs');
  const [jualEceran, setJualEceran] = useState(isEdit ? (barangAktif.jual || '') : '');

  // ── 🛒 TANGGA 2: GROSIR LEVEL MENENGAH (SLOP/RENTENG) ──
  const [bisaGrosir, setBisaGrosir] = useState(isEdit ? (barangAktif.bisaGrosir || false) : false);
  const [satuanGrosirNama, setSatuanGrosirNama] = useState(isEdit ? (barangAktif.satuanGrosirNama || 'Slop') : 'Slop');
  const [minimalBeliGrosir, setMinimalBeliGrosir] = useState(isEdit ? (barangAktif.minimalBeliGrosir || '10') : '10');
  const [jualGrosirTotal, setJualGrosirTotal] = useState(isEdit ? (barangAktif.jualGrosirTotal || '') : '');

  // ── 🛒 TANGGA 3 KELUARAN: JUAL GROSIR BESAR TOKO ──
  const [bisaGrosirBesar, setBisaGrosirBesar] = useState(isEdit ? (barangAktif.bisaGrosirBesar || false) : false);
  const [jualGrosirBesarTotal, setJualGrosirBesarTotal] = useState(isEdit ? (barangAktif.jualGrosirBesarTotal || '') : '');

  // ⚖️ STATE TIMBANGAN CURAH (Kg/Liter)
  const [beratKonversi, setBeratKonversi] = useState(isEdit ? (barangAktif.beratKonversi || '1') : '1');

  // 🛡️ SECURITY GUARD: Jalankan setelah semua state ter-deklarasi (Lolos ESLint)
  if (!isOpen) return null;

  // 🧮 LIVE CALCULATION (MATEMATIKA LANGSUNG TANPA EFFECT - LOLOS SENSOR ESLINT)
  const hargaAgen = Number(hargaModalAgenTotal) || 0;
  const totalIsiEceran = Number(isiKeEceran) || 1;
  
  // 1. Hitung Modal Eceran Asli (Disimpan presisi di database)
  const modalEceranTerhitung = hargaAgen > 0 && totalIsiEceran > 0 ? (hargaAgen / totalIsiEceran).toFixed(4) : '0';

  // 2. Hitung Otomatis Modal untuk Level Menengah (Isi Slop x Modal Eceran)
  const modalGrosirMenengahTerhitung = Number(modalEceranTerhitung) * (Number(minimalBeliGrosir) || 0);

  const isBarangTimbangan = satuanEceran === 'Kg' || satuanEceran === 'Liter' || catatan.toLowerCase().includes('kilo') || catatan.toLowerCase().includes('curah');

  // ── 🎨 STYLE COMPONENT ──
  const styleBoxInput = { padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color, #eef0f3)', fontSize: '0.85rem', outline: 'none', backgroundColor: 'var(--bg-toggle, #f2f2f7)', color: 'var(--text-main, #1c1c1e)', width: '100%', boxSizing: 'border-box' };
  const styleBoxInputReadOnly = { ...styleBoxInput, backgroundColor: '#e5e5ea', color: '#555555', fontWeight: '600', cursor: 'not-allowed' };
  const styleLabel = { fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #8e8e93)', marginBottom: '2px', display: 'block' };
  const styleRowGrid = { display: 'flex', width: '100%', boxSizing: 'border-box' };
  const styleFlexCheck = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-main, #1c1c1e)' };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama || Number(modalEceranTerhitung) <= 0 || !jualEceran) { alert("Nama, Modal Kulakan, dan Harga Jual Eceran wajib diisi ya, Fi!"); return; }

    onSimpan({
      nama,
      modal: Number(modalEceranTerhitung),
      jual: Number(jualEceran),
      satuanModal: satuanEceran,
      satuanJual: satuanEceran,
      catatan,
      beratKonversi: Number(beratKonversi) || 1,
      varian: punyaVarian ? varianInput.split(',').map(v => v.trim()).filter(v => v !== '') : [],
      
      // Data Mentah Kulakan Nota Agen (Untuk kebutuhan Edit Data besok)
      satuanTerbesar: satuanGrosirBesarNama,
      hargaModalAgen: hargaAgen,
      isiKeEceran: totalIsiEceran,

      // TANGGA 2: Grosir Level Menengah (Slop/Renteng)
      bisaGrosir,
      satuanGrosirNama: bisaGrosir ? satuanGrosirNama : '',
      minimalBeliGrosir: bisaGrosir ? Number(minimalBeliGrosir) : null,
      modalGrosirTotal: bisaGrosir ? modalGrosirMenengahTerhitung : null,
      jualGrosirTotal: bisaGrosir ? Number(jualGrosirTotal) : null,
      jualGrosir: bisaGrosir ? Math.round(Number(jualGrosirTotal) / Math.max(1, Number(minimalBeliGrosir))) : null,

      // TANGGA 3: Grosir Level Besar (Dus/Bal)
      bisaGrosirBesar,
      satuanGrosirBesarNama: bisaGrosirBesar ? satuanGrosirBesarNama : '',
      minimalBeliGrosirBesar: bisaGrosirBesar ? totalIsiEceran : null,
      modalGrosirBesarTotal: bisaGrosirBesar ? hargaAgen : null,
      jualGrosirBesarTotal: bisaGrosirBesar ? Number(jualGrosirBesarTotal) : null,
      jualGrosirBesarPerPcs: bisaGrosirBesar ? Math.round(Number(jualGrosirBesarTotal) / Math.max(1, totalIsiEceran)) : null
    });
    onClose();
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: 'var(--bg-header, #ffffff)', width: '100%', maxWidth: '440px', maxHeight: '92vh', borderRadius: '16px', padding: '20px', boxSizing: 'border-box', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main, #1c1c1e)' }}>
          {modalMode === 'tambah' ? '➕ Tambah Barang Baru' : '📝 Edit Data Barang'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
          
          {/* NAMA BARANG */}
          <div>
            <label style={styleLabel}>Nama Barang</label>
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Roti Aoka Cokelat" style={styleBoxInput} />
          </div>

          {/* 📦 TANGGA UTAMA KULAKAN (INPUT NOTA AGEN) */}
          <div style={{ backgroundColor: 'rgba(10, 129, 104, 0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(10, 129, 104, 0.15)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0a8168', display: 'block', marginBottom: '8px' }}>📥 TANGGA 3: Kulakan Terbesar (Nota Agen)</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={styleLabel}>Beli Satuan Terbesar</label>
                <select value={satuanGrosirBesarNama} onChange={(e) => setSatuanGrosirBesarNama(e.target.value)} style={{ ...styleBoxInput, backgroundColor: '#ffffff', fontWeight: '600' }}>
                  {['Dus', 'Karung/Sak', 'Slop', 'Renteng', 'Pak', 'Ball', 'Karton'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={styleLabel}>Harga Modal 1 {satuanGrosirBesarNama}</label>
                <input type="number" value={hargaModalAgenTotal} onChange={(e) => setHargaModalAgenTotal(e.target.value)} placeholder="Msl: 100000" style={{ ...styleBoxInput, backgroundColor: '#ffffff' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label style={styleLabel}>Total Isi Eceran per {satuanGrosirBesarNama}</label>
                <div style={styleRowGrid}>
                  <input type="number" value={isiKeEceran} onChange={(e) => setIsiKeEceran(e.target.value)} placeholder="60" style={{ ...styleBoxInput, width: '50%', borderRadius: '8px 0 0 8px', borderRight: 'none', backgroundColor: '#ffffff', textAlign: 'center' }} />
                  <select value={satuanEceran} onChange={(e) => setSatuanEceran(e.target.value)} style={{ ...styleBoxInput, width: '50%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                    {['Pcs', 'Bungkus', 'Sachet', 'Botol', 'Kg', 'Liter', 'Butir'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={styleLabel}>💰 Hasil Modal Eceran (Auto)</label>
                <input type="text" value={Number(modalEceranTerhitung) > 0 ? `Rp ${Math.round(Number(modalEceranTerhitung)).toLocaleString('id-ID')}` : 'Rp 0'} readOnly style={styleBoxInputReadOnly} />
              </div>
            </div>
          </div>

          {/* 🍏 TANGGA 1: HARGA JUAL ECERAN TOKO */}
          <div>
            <label style={styleLabel}>Harga Jual Eceran Toko</label>
            <div style={styleRowGrid}>
              <input type="number" value={jualEceran} onChange={(e) => setJualEceran(e.target.value)} placeholder="Contoh: 2000" style={{ ...styleBoxInput, width: '60%', borderRadius: '8px 0 0 8px', borderRight: 'none' }} />
              <div style={{ ...styleBoxInput, width: '40%', borderRadius: '0 8px 8px 0', backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                per {satuanEceran}
              </div>
            </div>
          </div>

          {/* ⚖️ PANEL TIMBANGAN CURAH */}
          {isBarangTimbangan && (
            <div style={{ backgroundColor: 'rgba(255, 149, 0, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 149, 0, 0.2)' }}>
              <label style={{ ...styleLabel, color: '#c67c00' }}>⚖️ Set Ukuran Timbangan Eceran Ini</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Berat Eceran =</span>
                <input type="number" step="0.01" value={beratKonversi} onChange={(e) => setBeratKonversi(e.target.value)} placeholder="0.25" style={{ ...styleBoxInput, width: '80px', textAlign: 'center', borderColor: 'rgba(255, 149, 0, 0.4)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>Kg / Liter asli</span>
              </div>
            </div>
          )}

          {/* OPSI VARIAN */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '6px' }}>
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

          {/* 🛒 TANGGA 2: GROSIR LEVEL MENENGAH (SLOP/RENTENG) */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '6px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={bisaGrosir} onChange={(e) => setBisaGrosir(e.target.checked)} />
              Aktifkan Grosir Level Menengah Toko? (Slop/Renteng)
            </label>

            {bisaGrosir && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', padding: '10px', backgroundColor: 'rgba(10, 129, 104, 0.05)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>Nama Satuan Grosir Menengah</label>
                    <select value={satuanGrosirNama} onChange={(e) => setSatuanGrosirNama(e.target.value)} style={{ ...styleBoxInput, backgroundColor: 'var(--border-color, #e5e5ea)', fontWeight: '600' }}>
                      {['Slop', 'Renteng', 'Pak', 'Pak Kecil', 'Lempeng'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={styleLabel}>Isi per 1 {satuanGrosirNama} (Jumlah {satuanEceran})</label>
                    <input type="number" value={minimalBeliGrosir} onChange={(e) => setMinimalBeliGrosir(e.target.value)} placeholder="10" style={styleBoxInput} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>📥 Modal 1 {satuanGrosirNama} (Auto)</label>
                    <input type="text" value={minimalBeliGrosir ? `Rp ${Math.round(modalGrosirMenengahTerhitung).toLocaleString('id-ID')}` : 'Rp 0'} readOnly style={styleBoxInputReadOnly} />
                  </div>
                  <div>
                    <label style={styleLabel}>📤 Harga Jual 1 {satuanGrosirNama} Total</label>
                    <input type="number" value={jualGrosirTotal} onChange={(e) => setJualGrosirTotal(e.target.value)} placeholder="Msl: 18000" style={styleBoxInput} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🛒 TANGGA 3: JUAL KEMBALI GROSIR LEVEL BESAR */}
          <div style={{ borderTop: '1px dashed var(--border-color, #eef0f3)', paddingTop: '6px' }}>
            <label style={styleFlexCheck}>
              <input type="checkbox" checked={bisaGrosirBesar} onChange={(e) => setBisaGrosirBesar(e.target.checked)} />
              Aktifkan Harga Jual Grosir Level Besar ke Pelanggan?
            </label>

            {bisaGrosirBesar && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', padding: '10px', backgroundColor: 'rgba(0, 122, 255, 0.05)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={styleLabel}>📥 Modal 1 {satuanGrosirBesarNama} (Nota Agen)</label>
                    <input type="text" value={hargaAgen ? `Rp ${hargaAgen.toLocaleString('id-ID')}` : 'Rp 0'} readOnly style={styleBoxInputReadOnly} />
                  </div>
                  <div>
                    <label style={styleLabel}>📤 Harga Jual 1 {satuanGrosirBesarNama} Keluar</label>
                    <input type="number" value={jualGrosirBesarTotal} onChange={(e) => setJualGrosirBesarTotal(e.target.value)} placeholder="Msl: 120000" style={styleBoxInput} />
                  </div>
                </div>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: '#007aff' }}>
                  📈 Mengaktifkan ini otomatis membuat pelanggan yang beli langsung sebanyak <code>{isiKeEceran} {satuanEceran}</code> dapet harga grosir besar utuh.
                </p>
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