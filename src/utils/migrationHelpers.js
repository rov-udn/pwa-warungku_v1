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

  // Ambil nilai numerik dengan fallback yang aman
  const safeNumber = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  // Normalisasi satuan
  const normalizeSatuan = (s) => {
    if (!s) return 'Pcs';
    const t = String(s).trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  return {
    id: docId || (doc.id || `${Date.now()}-${idx}`),
    nama: nama,

    // Salin harga jika tersedia, jika tidak tetap kosong string untuk menandakan belum di-set
    modal: doc.modal !== undefined ? doc.modal : (doc.modalEceran ?? ''),
    hargaModalAgen: doc.hargaModalAgen !== undefined ? doc.hargaModalAgen : (doc.hargaAgen ?? ''),
    jual: doc.jual !== undefined ? doc.jual : (doc.jual ?? ''),
    hargaEceran: doc.hargaEceran !== undefined ? doc.hargaEceran : (doc.hargaEceran ?? ''),

    // Satuan & varian
    satuanModal: normalizeSatuan(doc.satuanModal || doc.satuanBeli),
    satuanJual: normalizeSatuan(doc.satuanJual || doc.satuanBeli),
    varian: Array.isArray(doc.varian) ? doc.varian : (doc.varian ? [doc.varian] : []),

    // Preserve grosir-related fields from source JSON when present
    bisaGrosir: doc.bisaGrosir !== undefined ? Boolean(doc.bisaGrosir) : bisaGrosir,
    minimalBeliGrosir: safeNumber(doc.minimalBeliGrosir, bisaGrosir ? 10 : null),
    jualGrosir: doc.jualGrosir !== undefined ? doc.jualGrosir : (doc.jualGrosir ?? null),
    satuanGrosirNama: doc.satuanGrosirNama || (bisaGrosir ? 'Renteng' : ''),

    bisaGrosirBesar: doc.bisaGrosirBesar !== undefined ? Boolean(doc.bisaGrosirBesar) : bisaGrosirBesar,
    minimalBeliGrosirBesar: safeNumber(doc.minimalBeliGrosirBesar, bisaGrosirBesar ? 40 : null),
    jualGrosirBesarTotal: doc.jualGrosirBesarTotal !== undefined ? doc.jualGrosirBesarTotal : null,
    jualGrosirBesarPerPcs: doc.jualGrosirBesarPerPcs !== undefined ? doc.jualGrosirBesarPerPcs : null,
    satuanGrosirBesarNama: doc.satuanGrosirBesarNama || (bisaGrosirBesar ? satuanGrosirBesarNama : ''),

    catatan: catatan || doc.catatan || '',
    stok: safeNumber(doc.stok, 0),
    kategori: kategoriFinal,

    // Additional helpers preserved from source if present
    isiKeEceran: safeNumber(doc.isiKeEceran, doc.isiPerSatuan || doc.isiSatuan || 1),
    isiPerSatuan: safeNumber(doc.isiPerSatuan, doc.isiSatuan || doc.isiKeEceran || 1),
    modalEceran: doc.modalEceran !== undefined ? doc.modalEceran : (doc.modalEceran ?? ''),
    modalGrosirTotal: doc.modalGrosirTotal !== undefined ? doc.modalGrosirTotal : null
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