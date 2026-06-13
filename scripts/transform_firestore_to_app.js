#!/usr/bin/env node

/**
 * Transform Firestore export (lama) → App format (baru)
 * 
 * Penggunaan:
 *   node scripts/transform_firestore_to_app.js <input.json> [output.json]
 * 
 * Contoh:
 *   node scripts/transform_firestore_to_app.js barang_export.json barang_transformed.json
 */

import fs from 'fs';
import path from 'path';

// Mapping kategori → satuan grosir default & minimal beli
const kategoriGrosirMap = {
  'rokok': { satuanGrosir: 'Slop', minimalGrosir: 12, satuanGrosirBesar: 'Bal', minimalGrosirBesar: 50 },
  'mie instan': { satuanGrosir: 'Pack', minimalGrosir: 10, satuanGrosirBesar: 'Dus', minimalGrosirBesar: 40 },
  'snack': { satuanGrosir: 'Pack', minimalGrosir: 10, satuanGrosirBesar: 'Dus', minimalGrosirBesar: 40 },
  'biskit': { satuanGrosir: 'Pack', minimalGrosir: 10, satuanGrosirBesar: 'Dus', minimalGrosirBesar: 40 },
};

function guessMinimalBeliGrosirBesar(satuanBeli) {
  const unit = (satuanBeli || '').toLowerCase();
  if (unit.includes('slop') || unit.includes('pak kecil')) return 12;
  if (unit.includes('karton') || unit.includes('bal')) return 40;
  return 40; // default
}

function guessHargaJual(modal) {
  return Math.round(modal * 1.15);
}

function transformDoc(doc, docId, idx) {
  const modal = Number(doc.hargaAgen || 0);
  const nama = doc.nama || `Item ${idx + 1}`;
  const kategoriLower = (doc.kategori || '').toLowerCase();
  
  // Tentukan bisaGrosir & bisaGrosirBesar dari kategori
  const bisaGrosir = kategoriLower.includes('rokok') || kategoriLower.includes('snack') || kategoriLower.includes('mie') || kategoriLower.includes('biskit');
  const bisaGrosirBesar = !kategoriLower.includes('rokok'); // Rokok biasanya tidak punya grosir besar

  // Gabung catatan
  const catatan = [doc.catatanUtama || '', doc.catatanHarga || ''].filter(Boolean).join(' | ');

  // Guess satuan grosir besar dari satuanBeli
  const satuanBeliLower = (doc.satuanBeli || '').toLowerCase();
  const minimalGrosirBesar = guessMinimalBeliGrosirBesar(satuanBeliLower);
  const satuanGrosirBesarNama = satuanBeliLower.includes('slop') ? 'Bal' : (satuanBeliLower.includes('pack') ? 'Dus' : 'Dus');

  // Hitung harga grosir besar total (estimation: modal * minimalGrosirBesar * 1.05)
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
    barcode: doc.barcode || '', // Keep for reference
    fotoUrl: doc.fotoUrl || '', // Keep for reference
  };
}

function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3] || 'transformed_data.json';

  if (!inputFile) {
    console.error('Usage: node transform_firestore_to_app.js <input.json> [output.json]');
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`File not found: ${inputFile}`);
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const docs = Array.isArray(data) ? data : [data];

    console.log(`📦 Transforming ${docs.length} document(s)...`);

    const transformed = docs.map((doc, idx) => transformDoc(doc, doc.id, idx));

    fs.writeFileSync(outputFile, JSON.stringify(transformed, null, 2));
    console.log(`✅ Transformed data written to: ${outputFile}`);
    console.log(`\n📋 Preview (first 2):`);
    console.log(JSON.stringify(transformed.slice(0, 2), null, 2));
  } catch (err) {
    console.error('❌ Transform failed:', err.message);
    process.exit(1);
  }
}

main();
