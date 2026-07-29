import { db } from '../firebase.js'; 
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * Helper untuk mengonversi input angka aman (mencegah NaN / Undefined / Null)
 */
const safeNumber = (val, fallback = 0) => {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  return Number.isNaN(num) ? fallback : num;
};

/**
 * 📥 Memproses teks JSON dari Modal Import
 * Mengubah string JSON/Array menjadi data terstruktur bersih
 */
export const importAndTransformJSON = (jsonString) => {
  try {
    const rawData = JSON.parse(jsonString);
    const dataArray = Array.isArray(rawData) ? rawData : [rawData];

    // Bersihkan setiap dokumen menggunakan transformFirestoreDoc
    const cleanedData = dataArray.map((item) => transformFirestoreDoc(item));

    return {
      success: true,
      data: cleanedData,
    };
  } catch (err) {
    console.error("Gagal parsing JSON:", err);
    return {
      success: false,
      error: "Format JSON tidak valid! Pastikan format teks JSON sudah benar.",
    };
  }
};

/**
 * Murni Menyaring Data & Mengubah ke Skema Baku AppContext Buku Warung
 */
export const transformFirestoreDoc = (docData) => {
  // 1. Ekstrak & Tentukan Modal Nota / Harga Modal Agen
  const hargaModalAgen = safeNumber(
    docData.hargaModalAgen ?? docData.hargaNota ?? docData.hargaAgen ?? docData.modal,
    0
  );

  // 2. Ekstrak & Tentukan Isi Ke Eceran (Default minimal 1)
  const isiKeEceran = safeNumber(
    docData.isiKeEceran ?? docData.isiEceran ?? docData.isiGrosirBesar ?? docData.isiPerPak ?? docData.isi,
    1
  ) || 1;

  // 3. Kalkulasi Modal Eceran (Presisi dengan Pembulatan Ke Atas / Math.ceil)
  const modal = safeNumber(
    docData.modal ?? docData.modalEceran,
    hargaModalAgen > 0 ? Math.ceil(hargaModalAgen / isiKeEceran) : 0
  );

  // 4. Ekstrak Harga Jual Eceran
  const jual = safeNumber(
    docData.jual ?? docData.jualEceran ?? docData.hargaJual,
    0
  );

  // 5. Ekstrak Harga Jual Grosir
  const jualGrosirTotal = safeNumber(
    docData.jualGrosirTotal ?? docData.jualGrosir ?? docData.hargaGrosir,
    0
  );

  // 6. Minimal Beli Grosir
  const minimalBeliGrosir = safeNumber(
    docData.minimalBeliGrosir ?? docData.minGrosir ?? docData['Isi Per Slop'],
    0
  );

  // Status Bisa Grosir (True jika ada harga grosir & min beli > 0)
  const bisaGrosir = docData.bisaGrosir !== undefined 
    ? Boolean(docData.bisaGrosir) 
    : (jualGrosirTotal > 0 && minimalBeliGrosir > 0);

  // Kembalikan Objek yang Presisi & Selaras dengan AppContext.jsx
  return {
    id: docData.id || `BARANG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    nama: String(docData.nama || docData.namaBarang || '').trim(),
    kategori: String(docData.kategori || 'Umum').trim(),
    
    // Satuan
    satuanTerbesar: String(docData.satuanTerbesar || docData.satuanGrosirNama || 'Dus').trim(),
    satuanJual: String(docData.satuanJual || docData.satuanEceranNama || 'Pcs').trim(),
    satuanGrosirNama: String(docData.satuanGrosirNama || 'Renteng').trim(),

    // Field Angka/Matematika Utama
    hargaModalAgen: hargaModalAgen,
    isiKeEceran: isiKeEceran,
    modal: modal,
    jual: jual,

    // Grosir
    bisaGrosir: bisaGrosir,
    minimalBeliGrosir: bisaGrosir ? minimalBeliGrosir : 0,
    jualGrosirTotal: jualGrosirTotal,
    modalGrosirTotal: safeNumber(docData.modalGrosirTotal, 0),

    // Metadata Opsional
    stok: safeNumber(docData.stok, 0),
    varian: Array.isArray(docData.varian) ? docData.varian : [],
    catatan: String(docData.catatan || '').trim()
  };
};

/**
 * Fungsi Utama untuk Eksekusi Migrasi / Re-Import Data di Firestore
 */
export const executeCleanMigration = async (onProgress) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const totalDocs = querySnapshot.docs.length;
    let count = 0;

    for (const docSnap of querySnapshot.docs) {
      const rawData = docSnap.data();
      const cleanedData = transformFirestoreDoc({ ...rawData, id: docSnap.id });

      // setDoc TANPA { merge: true } agar field lama musnah total!
      await setDoc(doc(db, 'products', docSnap.id), cleanedData);

      count++;
      if (onProgress) {
        onProgress(Math.round((count / totalDocs) * 100));
      }
    }

    return { success: true, total: count };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error: error.message };
  }
};