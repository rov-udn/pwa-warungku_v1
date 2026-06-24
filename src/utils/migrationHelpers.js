/**
 * Migration utilities untuk Firestore → App
 */

// ── 🍏 FUNGSI TEBAKAN HARGA LAMA SUDAH DIHAPUS AGAR LOLOS ESLINT ──

export function transformFirestoreDoc(doc, docId, idx) {
  // 🎯 AMAN ESLINT: Langsung ambil data non-harga yang dibutuhkan saja
  const nama = doc.nama || `Item ${idx + 1}`;
  const kategoriLower = (doc.kategori || '').toLowerCase();
  const catatan = [doc.catatanUtama || '', doc.catatanHarga || ''].filter(Boolean).join(' | ');

  // Mengatur logika grosir dasar bawaan
  const bisaGrosir = kategoriLower.includes('rokok') || kategoriLower.includes('snack') || kategoriLower.includes('mie') || kategoriLower.includes('biskit');
  const bisaGrosirBesar = !kategoriLower.includes('rokok');
  const satuanBeliLower = (doc.satuanBeli || '').toLowerCase();
  const satuanGrosirBesarNama = satuanBeliLower.includes('slop') ? 'Bal' : (satuanBeliLower.includes('pack') ? 'Dus' : 'Dus');

  // ── 🎯 NORMALISASI KATEGORI ──
  let kategoriFinal = doc.kategori || 'item lain';
  if (kategoriLower.includes('medical') || kategoriLower.includes('obat')) {
    kategoriFinal = 'Obat-obatan/Medical item';
  } else if (kategoriLower.includes('minuman') || kategoriLower.includes('kopi')) {
    kategoriFinal = 'Minuman/Kopi/Susu';
  } else if (kategoriLower.includes('snack') || kategoriLower.includes('roti')) {
    kategoriFinal = 'Snack/Biskuit/Roti';
  } else if (kategoriLower.includes('sabun') || kategoriLower.includes('bersih')) {
    kategoriFinal = 'Sabun/Pembersih';
  } else if (kategoriLower.includes('plastik') || kategoriLower.includes('cup')) {
    kategoriFinal = 'plastik/Cup';
  } else if (kategoriLower.includes('mie')) {
    kategoriFinal = 'Mie/Instan';
  } else if (kategoriLower.includes('sembako') || kategoriLower.includes('dapur')) {
    kategoriFinal = 'Sembako/Dapur';
  } else if (kategoriLower.includes('rokok') || kategoriLower.includes('korek')) {
    kategoriFinal = 'Rokok/Korek';
  }

  return {
    id: docId || `${Date.now()}-${idx}`,
    nama: nama,
    
    // ── 🎯 TARGET RESET: Semua nominal diset kosong/null agar status otomatis "Belum Set" ──
    modal: '',            // Kosong agar dibaca sebagai string kosong di state
    hargaModalAgen: '',   
    jual: '',             
    hargaEceran: '',      
    
    satuanModal: (doc.satuanBeli || 'Pcs').charAt(0).toUpperCase() + (doc.satuanBeli || 'Pcs').slice(1).toLowerCase(),
    satuanJual: 'Pcs',
    varian: [],
    
    // Logika grosir di-reset nominalnya, tapi strukturnya tetap aktif agar siap diisi
    bisaGrosir: bisaGrosir,
    minimalBeliGrosir: bisaGrosir ? 10 : null,
    jualGrosir: null,
    satuanGrosirNama: bisaGrosir ? 'Renteng' : '',
    
    bisaGrosirBesar: bisaGrosirBesar,
    minimalBeliGrosirBesar: bisaGrosirBesar ? (satuanBeliLower.includes('slop') || satuanBeliLower.includes('pak kecil') ? 12 : 40) : null,
    jualGrosirBesarTotal: null,
    jualGrosirBesarPerPcs: null,
    satuanGrosirBesarNama: bisaGrosirBesar ? satuanGrosirBesarNama : '',
    
    catatan: catatan,
    stok: Number(doc.stok || 0),
    kategori: kategoriFinal
  };
}

export function transformFirestoreArray(docs) {
  return docs.map((doc, idx) => transformFirestoreDoc(doc, doc.id, idx));
}

/**
 * Import handler: parse JSON string → transform → return array
 */
export function importAndTransformJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const docs = Array.isArray(data) ? data : [data];
    const transformed = transformFirestoreArray(docs);
    return { success: true, data: transformed, count: transformed.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}