/**
 * Migration utilities untuk Firestore → App
 */

// Transform logic (inline dari transform_firestore_to_app.js)
function guessMinimalBeliGrosirBesar(satuanBeli) {
  const unit = (satuanBeli || '').toLowerCase();
  if (unit.includes('slop') || unit.includes('pak kecil')) return 12;
  if (unit.includes('karton') || unit.includes('bal')) return 40;
  return 40;
}

function guessHargaJual(modal) {
  return Math.round(modal * 1.15);
}

export function transformFirestoreDoc(doc, docId, idx) {
  const modal = Number(doc.hargaAgen || 0);
  const nama = doc.nama || `Item ${idx + 1}`;
  const kategoriLower = (doc.kategori || '').toLowerCase();

  const bisaGrosir = kategoriLower.includes('rokok') || kategoriLower.includes('snack') || kategoriLower.includes('mie') || kategoriLower.includes('biskit');
  const bisaGrosirBesar = !kategoriLower.includes('rokok');

  const catatan = [doc.catatanUtama || '', doc.catatanHarga || ''].filter(Boolean).join(' | ');

  const satuanBeliLower = (doc.satuanBeli || '').toLowerCase();
  const minimalGrosirBesar = guessMinimalBeliGrosirBesar(satuanBeliLower);
  const satuanGrosirBesarNama = satuanBeliLower.includes('slop') ? 'Bal' : (satuanBeliLower.includes('pack') ? 'Dus' : 'Dus');

  const jualGrosirBesarTotal = bisaGrosirBesar ? Math.round(modal * minimalGrosirBesar * 1.05) : null;

  return {
    id: docId || `${Date.now()}-${idx}`,
    nama: nama,
    modal: modal,
    jual: guessHargaJual(modal),
    satuanModal: (doc.satuanBeli || 'Pcs').charAt(0).toUpperCase() + (doc.satuanBeli || 'Pcs').slice(1).toLowerCase(),
    satuanJual: 'Pcs',
    varian: [],
    bisaGrosir: bisaGrosir,
    minimalBeliGrosir: bisaGrosir ? 10 : null,
    jualGrosir: bisaGrosir ? Math.round(modal * 1.05) : null,
    satuanGrosirNama: bisaGrosir ? 'Renteng' : '',
    bisaGrosirBesar: bisaGrosirBesar,
    minimalBeliGrosirBesar: bisaGrosirBesar ? minimalGrosirBesar : null,
    jualGrosirBesarTotal: jualGrosirBesarTotal,
    jualGrosirBesarPerPcs: jualGrosirBesarTotal ? Math.round(jualGrosirBesarTotal / minimalGrosirBesar) : null,
    satuanGrosirBesarNama: bisaGrosirBesar ? satuanGrosirBesarNama : '',
    catatan: catatan,
    stok: Number(doc.stok || 0),
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
