import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const rawData = JSON.parse(readFileSync(join(__dirname, '..', 'firestore_minimal_2026-06-13.json'), 'utf-8'));

function perPieceFromTotal(total, units) {
  const t = Number(total) || 0;
  const u = Math.max(1, Number(units) || 1);
  return Math.round(t / u);
}

const converted = rawData.map((itemLama) => {
  const namaKecil = (itemLama.nama || '').toLowerCase();
  const isRokok = namaKecil.includes('rokok') || namaKecil.includes('filter') ||
    namaKecil.includes('mild') || namaKecil.includes('surya') ||
    itemLama.kategori === 'Rokok/Korek' ||
    namaKecil.includes('djinggo') || namaKecil.includes('djarum') ||
    namaKecil.includes('sampoerna') || namaKecil.includes('gudang') ||
    namaKecil.includes('garam') || namaKecil.includes('neslite') ||
    namaKecil.includes('gajah') || namaKecil.includes('magnum') ||
    namaKecil.includes('marlboro') || namaKecil.includes('dunhill') ||
    namaKecil.includes('kretek') || namaKecil.includes('wismilak') ||
    namaKecil.includes('camel') || namaKecil.includes('esse');

  const satuanBeli = itemLama.satuanModal || 'Pcs';
  const totalHargaAgen = Number(itemLama.modal || 0);
  const totalHargaJual = Number(itemLama.jual || 0);

  let minimalGrosirDefault = 10;
  let minimalGrosirBesarDefault = 40;

  if (namaKecil.includes('promag') && satuanBeli === 'Karton') {
    minimalGrosirBesarDefault = 540;
  } else if (namaKecil.includes('promag') && ['Slop', 'Pack Besar'].includes(satuanBeli)) {
    minimalGrosirBesarDefault = 12;
  } else if (['Slop', 'Renteng', 'Pack'].includes(satuanBeli)) {
    minimalGrosirBesarDefault = 10;
  } else if (['Dus', 'Karton', 'Bal'].includes(satuanBeli)) {
    minimalGrosirBesarDefault = 40;
  }

  // Jika satuan adalah satuan paket (beli per slop/dus/dll), modal adalah total
  // → hitung modal per pcs
  let modalEceranAwal;
  if (['Slop', 'Renteng', 'Pack', 'Dus', 'Karton', 'Bal'].includes(satuanBeli)) {
    modalEceranAwal = perPieceFromTotal(totalHargaAgen, minimalGrosirBesarDefault);
  } else {
    modalEceranAwal = Math.round(totalHargaAgen);
  }

  // Harga jual per pcs
  let hargaJualPerPcs;
  if (['Slop', 'Renteng', 'Pack', 'Dus', 'Karton', 'Bal'].includes(satuanBeli)) {
    hargaJualPerPcs = perPieceFromTotal(totalHargaJual, minimalGrosirBesarDefault);
  } else {
    hargaJualPerPcs = Math.round(totalHargaJual);
  }

  if (hargaJualPerPcs === 0) {
    hargaJualPerPcs = Math.round(modalEceranAwal * 1.15);
  }

  let catatanGabungan = itemLama.catatan || '';

  return {
    id: itemLama.id || `BARANG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    nama: itemLama.nama || 'Tanpa Nama',
    modal: modalEceranAwal,
    jual: hargaJualPerPcs,
    satuanModal: satuanBeli,
    satuanJual: satuanBeli,
    varian: itemLama.varian || [],
    bisaGrosir: true,
    minimalBeliGrosir: minimalGrosirDefault,
    satuanGrosirNama: isRokok ? 'Slop' : 'Kotak/Renteng',
    jualGrosir: Math.round(modalEceranAwal * 1.05),
    bisaGrosirBesar: !isRokok,
    minimalBeliGrosirBesar: minimalGrosirBesarDefault,
    satuanGrosirBesarNama: satuanBeli,
    jualGrosirBesarTotal: totalHargaAgen,
    jualGrosirBesarPerPcs: perPieceFromTotal(totalHargaAgen, minimalGrosirBesarDefault),
    catatan: catatanGabungan,
    stok: Number(itemLama.stok || 0)
  };
});

// Urutkan berdasarkan nama
converted.sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

const output = `// Data barang dari Firebase Firestore (diimpor ${new Date().toLocaleDateString('id-ID')})
// Total: ${converted.length} item
export const initialBarang = ${JSON.stringify(converted, null, 2)};
`;

const outputPath = join(__dirname, '..', 'src', 'data', 'initialBarang.js');
writeFileSync(outputPath, output, 'utf-8');

console.log(`✅ Berhasil generate ${converted.length} barang ke initialBarang.js`);
console.log(`📁 Output: ${outputPath}`);

// Tampilkan sample
console.log('\n📦 Sample 3 item pertama:');
converted.slice(0, 3).forEach(item => {
  console.log(`  - ${item.nama}: modal=${item.modal}, jual=${item.jual}, satuan=${item.satuanModal}`);
});
