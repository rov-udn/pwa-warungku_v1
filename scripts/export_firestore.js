#!/usr/bin/env node

/**
 * Export collection dari Firestore ke JSON file
 * 
 * Setup:
 *   1. Download service account key dari Firebase Console → Project Settings → Service Accounts
 *   2. Simpan file JSON ke project root atau sesuaikan path di bawah
 *   3. Jalankan: node scripts/export_firestore.js <collectionName> [outputFile]
 * 
 * Contoh:
 *   node scripts/export_firestore.js barang firestore_barang_export.json
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PENTING: Ganti dengan path ke file service account kamu
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

async function exportCollection(collectionName, outputFile) {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`❌ Service account file not found: ${serviceAccountPath}`);
    console.error('   Silakan download dari Firebase Console → Project Settings → Service Accounts → Generate new private key');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  try {
    console.log(`📥 Exporting collection: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    const docs = [];
    snapshot.forEach(doc => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    fs.writeFileSync(outputFile, JSON.stringify(docs, null, 2));
    console.log(`✅ Exported ${docs.length} document(s) to: ${outputFile}`);
    console.log(`\n📋 Selanjutnya, jalankan:`);
    console.log(`   node scripts/transform_firestore_to_app.js ${outputFile} ${outputFile.replace('.json', '_transformed.json')}`);
  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

const collectionName = process.argv[2];
const outputFile = process.argv[3] || `firestore_${collectionName}_export.json`;

if (!collectionName) {
  console.error('Usage: node scripts/export_firestore.js <collectionName> [outputFile]');
  console.error('Example: node scripts/export_firestore.js barang firestore_barang.json');
  process.exit(1);
}

exportCollection(collectionName, outputFile);
