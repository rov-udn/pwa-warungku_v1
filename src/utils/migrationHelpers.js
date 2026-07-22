import * as XLSX from 'xlsx';

/**
 * Migration utilities untuk Firestore / Excel / CSV → App
 */

// ── 🍏 FUNGSI TRANSFOMASI DATA UTAMA (TETAP SAMA SEPERTI MILIKMU) ──
export function transformFirestoreDoc(doc, docId, idx) {
  const nama = doc.nama || doc['Nama Barang'] || doc.Nama || `Item ${idx + 1}`;
  const kategoriRaw = doc.kategori || doc.Kategori || doc['Kategori'] || '';
  const kategoriLower = String(kategoriRaw).toLowerCase();
  const catatan = [doc.catatanUtama || '', doc.catatanHarga || '', doc.Catatan || ''].filter(Boolean).join(' | ');

  const bisaGrosir = kategoriLower.includes('rokok') || kategoriLower.includes('snack') || kategoriLower.includes('mie') || kategoriLower.includes('biskit');
  const bisaGrosirBesar = !kategoriLower.includes('rokok');
  const satuanBeliLower = String(doc.satuanBeli || doc['Satuan Beli'] || doc.satuanModal || '').toLowerCase();
  const satuanGrosirBesarNama = satuanBeliLower.includes('slop') ? 'Bal' : (satuanBeliLower.includes('pack') ? 'Dus' : 'Dus');

  // Normalisasi Kategori
  let kategoriFinal = kategoriRaw || 'item lain';
  if (kategoriLower.includes('medical') || kategoriLower.includes('obat')) {
    kategoriFinal = 'Obat-obatan/Medical item';
  } else if (kategoriLower.includes('minuman') || kategoriLower.includes('kopi')) {
    kategoriFinal = 'Minuman/Kopi/Susu';
  } else if (kategoriLower.includes('snack') || kategoriLower.includes('roti') || kategoriLower.includes('biskit')) {
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

  const safeNumber = (v, fallback = 0) => {
    if (v === '' || v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  const normalizeSatuan = (s) => {
    if (!s) return 'Pcs';
    const t = String(s).trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  return {
    id: String(docId || doc.id || `${Date.now()}-${idx}`),
    nama: nama,

    // Mentoleransi nama kolom Excel maupun properti JSON Firestore
    modal: doc.modal !== undefined ? doc.modal : (doc['Harga Modal'] ?? doc.modalEceran ?? ''),
    hargaModalAgen: doc.hargaModalAgen !== undefined ? doc.hargaModalAgen : (doc['Harga Agen'] ?? doc.hargaAgen ?? ''),
    jual: doc.jual !== undefined ? doc.jual : (doc['Harga Jual'] ?? doc.jualEceran ?? ''),
    hargaEceran: doc.hargaEceran !== undefined ? doc.hargaEceran : (doc.hargaEceran ?? ''),

    satuanModal: normalizeSatuan(doc.satuanModal || doc.satuanBeli || doc['Satuan Beli']),
    satuanJual: normalizeSatuan(doc.satuanJual || doc.satuanBeli || doc['Satuan Jual']),
    varian: Array.isArray(doc.varian) ? doc.varian : (doc.varian ? [doc.varian] : []),

    bisaGrosir: doc.bisaGrosir !== undefined ? Boolean(doc.bisaGrosir) : bisaGrosir,
    minimalBeliGrosir: safeNumber(doc.minimalBeliGrosir || doc['Isi Per Slop'], bisaGrosir ? 10 : null),
    jualGrosir: doc.jualGrosir !== undefined ? doc.jualGrosir : null,
    satuanGrosirNama: doc.satuanGrosirNama || (bisaGrosir ? 'Renteng' : ''),

    bisaGrosirBesar: doc.bisaGrosirBesar !== undefined ? Boolean(doc.bisaGrosirBesar) : bisaGrosirBesar,
    minimalBeliGrosirBesar: safeNumber(doc.minimalBeliGrosirBesar || doc['Isi Per Dus'], bisaGrosirBesar ? 40 : null),
    jualGrosirBesarTotal: doc.jualGrosirBesarTotal !== undefined ? doc.jualGrosirBesarTotal : null,
    jualGrosirBesarPerPcs: doc.jualGrosirBesarPerPcs !== undefined ? doc.jualGrosirBesarPerPcs : null,
    satuanGrosirBesarNama: doc.satuanGrosirBesarNama || (bisaGrosirBesar ? satuanGrosirBesarNama : ''),

    catatan: catatan || doc.catatan || '',
    stok: safeNumber(doc.stok || doc.Stok || doc.STOK, 0),
    kategori: kategoriFinal,

    isiKeEceran: safeNumber(doc.isiKeEceran, doc.isiPerSatuan || doc.isiSatuan || 1),
    isiPerSatuan: safeNumber(doc.isiPerSatuan, doc.isiSatuan || doc.isiKeEceran || 1),
    modalEceran: doc.modalEceran !== undefined ? doc.modalEceran : '',
    modalGrosirTotal: doc.modalGrosirTotal !== undefined ? doc.modalGrosirTotal : null
  };
}

export function transformFirestoreArray(docs) {
  return docs.map((doc, idx) => transformFirestoreDoc(doc, doc.id, idx));
}

// ── 🚀 FUNGSI BARU: PARSER UNIVERSAL (Bisa File Excel, CSV, Maupun JSON) ──
export async function importAndTransformAnyFile(file) {
  try {
    const fileName = file.name.toLowerCase();
    let rawDocs = [];

    if (fileName.endsWith('.json')) {
      // BACA JSON
      const text = await file.text();
      const parsed = JSON.parse(text);
      rawDocs = Array.isArray(parsed) ? parsed : [parsed];
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      // BACA EXCEL / CSV
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rawDocs = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    } else {
      return { success: false, error: 'Format file tidak didukung! Harus .json, .xlsx, .xls, atau .csv' };
    }

    // Lewatkan semua baris data ke fungsi transformasi milikmu
    const transformed = transformFirestoreArray(rawDocs);
    return { success: true, data: transformed, count: transformed.length };

  } catch (err) {
    console.error("Gagal impor file:", err);
    return { success: false, error: err.message };
  }
}