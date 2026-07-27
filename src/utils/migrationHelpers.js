import { db } from '../firebase/config'; // Sesuaikan lokasi config firebase kamu
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * Helper untuk mengonversi input angka aman (mencegah NaN / Undefined / Null)
 */
const safeNumber = (val, fallback = 0) => {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

/**
 * Murni Menyaring Data & Mengubah ke Skema 11 Field Baku
 */
export const transformFirestoreDoc = (docData) => {
  // 1. Ekstrak & Tentukan Modal / Nota
  const hargaNota = safeNumber(
    docData.hargaNota ?? docData.hargaModalAgen ?? docData.hargaAgen ?? docData.modal,
    0
  );

  // 2. Ekstrak & Tentukan Isi Eceran
  const isiEceran = safeNumber(
    docData.isiEceran ?? docData.isiGrosirBesar ?? docData.isiPerPak ?? docData.isi,
    1
  );

  // 3. Kalkulasi Modal Eceran (Otomatis & Presisi)
  const modalEceran = safeNumber(
    docData.modalEceran,
    isiEceran > 0 ? Math.round(hargaNota / isiEceran) : hargaNota
  );

  // 4. Ekstrak Harga Jual Eceran
  const jualEceran = safeNumber(
    docData.jualEceran ?? docData.jual ?? docData.hargaJual,
    0
  );

  // 5. Ekstrak Harga Jual Grosir
  const jualGrosir = safeNumber(
    docData.jualGrosir ?? docData.hargaGrosir,
    0
  );

  // 6. Minimal Beli Grosir (Murni baca data, default 0 tanpa jebakan 10/40)
  const minimalBeliGrosir = safeNumber(
    docData.minimalBeliGrosir ?? docData.minGrosir ?? docData['Isi Per Slop'],
    0
  );

  // Status Bisa Grosir (True jika ada harga grosir & min beli > 0)
  const bisaGrosir = jualGrosir > 0 && minimalBeliGrosir > 0;

  // Kembalikan HANYA 11 Field Standar Buku Warung
  return {
    kodeBarang: String(docData.kodeBarang || docData.kode || '').trim(),
    namaBarang: String(docData.namaBarang || docData.nama || '').trim(),
    kategori: String(docData.kategori || 'Umum').trim(),
    satuanEceranNama: String(docData.satuanEceranNama || docData.satuan || 'Pcs').trim(),
    satuanGrosirNama: String(docData.satuanGrosirNama || docData.satuanGrosir || 'Pak').trim(),
    hargaNota: hargaNota,
    isiEceran: isiEceran,
    modalEceran: modalEceran,
    jualEceran: jualEceran,
    jualGrosir: jualGrosir,
    minimalBeliGrosir: bisaGrosir ? minimalBeliGrosir : 0,
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
      const cleanedData = transformFirestoreDoc(rawData);

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