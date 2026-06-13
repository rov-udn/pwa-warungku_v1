#!/usr/bin/env node

/**
 * 🔄 Firestore Auto-Sync (Otomatis ambil data dari Firebase)
 * 
 * Penggunaan:
 *   npm run firestore-sync
 * 
 * Atau manual:
 *   node scripts/firestore-sync.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformFirestoreArray } from '../src/utils/migrationHelpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function syncFirestore() {
  console.log('\n🔄 Firestore Auto-Sync\n');

  // Cek existence serviceAccountKey.json
  const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ serviceAccountKey.json tidak ditemukan!');
    console.error('\n📝 Cara setup:');
    console.error('   1. Buka: https://console.firebase.google.com/');
    console.error('   2. Pilih project → Project Settings (⚙️)');
    console.error('   3. Tab "Service Accounts"');
    console.error('   4. Click "Generate New Private Key"');
    console.error('   5. Simpan file ke: ' + serviceAccountPath);
    console.error('\n💡 File JSON harus di gitignore (sudah ada di .gitignore)');
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    // Init firebase-admin dengan modular API (kompatibel versi baru)
    initializeApp({
      credential: cert(serviceAccount),
    });

    const db = getFirestore();
    const collectionName = process.argv[2] || 'barang';

    console.log(`📥 Ambil data dari collection: "${collectionName}"`);
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty) {
      console.error(`❌ Collection "${collectionName}" kosong atau tidak ada!`);
      process.exit(1);
    }

    const docs = [];
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Ditemukan ${docs.length} barang`);

    // Transform ke schema app
    console.log('🔄 Transforming schema...');
    const transformed = transformFirestoreArray(docs);

    // Simpan 3 versi file untuk safety
    const timestamp = new Date().toISOString().split('T')[0];
    const baseDir = path.join(__dirname, '..');
    
    // 1. Raw export
    const rawFile = path.join(baseDir, `firestore_raw_${timestamp}.json`);
    fs.writeFileSync(rawFile, JSON.stringify(docs, null, 2));
    console.log(`📄 Raw data: ${rawFile}`);

    // 2. Transformed
    const transformedFile = path.join(baseDir, `firestore_transformed_${timestamp}.json`);
    fs.writeFileSync(transformedFile, JSON.stringify(transformed, null, 2));
    console.log(`📄 Transformed: ${transformedFile}`);

    // 3. Minimal (hanya field penting untuk clipboard)
    const minimal = transformed.map(item => ({
      id: item.id,
      nama: item.nama,
      modal: item.modal,
      jual: item.jual,
      satuanModal: item.satuanModal,
      stok: item.stok,
      catatan: item.catatan,
    }));
    const minimalFile = path.join(baseDir, `firestore_minimal_${timestamp}.json`);
    fs.writeFileSync(minimalFile, JSON.stringify(minimal, null, 2));
    console.log(`📄 Minimal: ${minimalFile}`);

    // Summary
    console.log('\n📊 Data Summary:');
    console.log(`   Total: ${transformed.length} barang`);
    console.log(`   Modal Min: Rp ${Math.min(...transformed.map(x => x.modal)).toLocaleString('id-ID')}`);
    console.log(`   Modal Max: Rp ${Math.max(...transformed.map(x => x.modal)).toLocaleString('id-ID')}`);
    console.log(`   Jual Min: Rp ${Math.min(...transformed.map(x => x.jual)).toLocaleString('id-ID')}`);
    console.log(`   Jual Max: Rp ${Math.max(...transformed.map(x => x.jual)).toLocaleString('id-ID')}`);

    // Show preview
    console.log('\n📋 Preview (3 item pertama):');
    console.log(JSON.stringify(transformed.slice(0, 3), null, 2));

    // Instruction untuk next step
    console.log('\n✨ Next Step:');
    console.log(`   1. Copy content dari file: ${transformedFile}`);
    console.log(`   2. Buka app: http://localhost:5176/`);
    console.log(`   3. Klik "📥 Migrasi" → Paste JSON → Impor`);
    console.log(`\n💡 Atau copy dari file "firestore_minimal_*.json" untuk yang simple\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

syncFirestore();
