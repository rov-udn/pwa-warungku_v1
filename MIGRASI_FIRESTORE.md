# 📥 Cara Migrasi Data dari Firestore Lama

## ⚡ Cara Tercepat (Otomatis) ⭐

### 1️⃣ Setup Credentials Sekali Saja
```bash
# 1. Buka: https://console.firebase.google.com/
# 2. Pilih project → Project Settings (⚙️)
# 3. Tab "Service Accounts"
# 4. Click "Generate New Private Key"
# 5. File JSON akan download
# 6. Rename menjadi "serviceAccountKey.json"
# 7. Letakkan di folder project root (di samping package.json)
# 8. File ini akan di-ignore oleh git (aman, gak akan push ke repo)
```

### 2️⃣ Run Satu Command - Selesai!
```bash
npm run firestore-sync
```

**Output:**
- ✅ Otomatis ambil semua data dari Firestore
- 📊 Tampilkan summary (jumlah barang, range harga, dll)
- 📄 Generate 3 file JSON (raw, transformed, minimal)
- 🎯 Langsung siap untuk import ke app

### 3️⃣ Copy & Paste ke App
```
Buka: http://localhost:5176/
→ Klik "📥 Migrasi"
→ Paste JSON dari file yang dihasilkan
→ Klik "✅ Impor"
→ DONE ✅
```

---

## 📋 Apa Bedanya 3 File yang Dihasilkan?

| File | Isi | Gunanya |
|---|---|---|
| `firestore_raw_*.json` | Data original dari Firestore | Backup, troubleshooting |
| `firestore_transformed_*.json` | Data sudah format app (lengkap) | Main import ke app |
| `firestore_minimal_*.json` | Hanya field penting | Cepat di-paste, file kecil |

**Rekomendasi:** Pakai `firestore_transformed_*.json` atau `firestore_minimal_*.json`

---

## 🔧 Perlu Install Tambahan?

**Tergantung:**

### ✅ Sudah installed:
```bash
npm install firebase-admin
```
Tinggal jalankan `npm run firestore-sync` → DONE

### ❌ Belum installed:
```bash
npm install firebase-admin
npm run firestore-sync
```

> **Catatan:** firebase-admin hanya dipakai di CLI (scripts), bukan di app itself. File besar, tapi aman untuk dev/production.

---

## 📝 Alternatif Manual (Jika Tidak Ingin Install)

Jika tidak ingin install `firebase-admin`, masih bisa pakai manual:

### Via Firebase Console:
1. Buka https://console.firebase.google.com/
2. Pilih project → Firestore Database
3. Pilih collection → Click ⋮ (menu) → **Export collection**
4. Save file JSON
5. Paste ke import modal di app

### Via Firestore Web UI:
1. Buka Firestore Database di console
2. Pilih masing-masing document
3. Copy data → format jadi JSON array → paste ke modal

---

## 🎯 Perbandingan Metode

| Metode | Setup | Waktu | Aman | Rekomendasi |
|---|---|---|---|---|
| **firestore-sync** | 10 menit (serviceAccountKey) | 1 command | ✅ Tervalidasi | ⭐⭐⭐ Terbaik |
| **Firebase Console Export** | Langsung (login) | 2-3 menit | ✅ Safe | ⭐⭐ OK |
| **Manual Copy-Paste** | Langsung | 5-10 menit | ⚠️ Rawan kelewat | ⭐ Terakhir |

---

## 📋 Schema Mapping (Otomatis)

Saat import, transformasi ini otomatis terjadi:

```
Firestore Field          →  App Field
─────────────────────────────────────
hargaAgen               →  modal (harga per pcs)
nama                    →  nama (sama)
satuanBeli              →  satuanModal
kategori                →  auto-detect dari nama
stok                    →  stok
catatanUtama + 
catatanHarga            →  catatan (merged)
(tidak ada)             ←  jual (auto calc 15% markup)
(tidak ada)             ←  bisaGrosir (auto detect)
(tidak ada)             ←  minimalBeliGrosir (10 atau guess)
(tidak ada)             ←  jualGrosir (auto calc)
(tidak ada)             ←  bisaGrosirBesar (auto detect)
(tidak ada)             ←  minimalBeliGrosirBesar (12 atau 40)
```

**Semua field otomatis, tidak perlu manual mapping!**

---

## 💡 Tips & Trick

### Backup Sebelum Import
```bash
# Data lama di app tersimpan di localStorage
# Browser bisa di-inspect untuk backup manual
# Atau simpan data app sebelum import dengan:
# 1. Open console (F12)
# 2. localStorage.getItem('warung_daftar_barang')
# 3. Copy → paste ke notepad
```

### Validate Data Setelah Import
```
Di app:
1. Buka "Buku Warung"
2. Cek kategori filter → semua barang tersebar?
3. Lihat summary di atas (Total Modal, Total Barang)
4. Cek harga di beberapa item
5. Lihat catatan (merge dari catatanUtama + catatanHarga)
```

### Kalau Ada Salah/Mau Ulang
```bash
# Delete localStorage:
1. Open console (F12)
2. localStorage.clear()
3. Reload page
4. Re-import dengan data yang benar
```

### Export Data App untuk Backup
```bash
# Dari browser console:
copy(JSON.parse(localStorage.getItem('warung_daftar_barang')))
# → Paste ke file `.json` untuk backup
```

---

## ✅ Contoh Workflow End-to-End

### Scenario: Pindah dari Firestore lama ke app baru

```bash
# Step 1: Setup (sekali saja)
npm install firebase-admin
# Upload serviceAccountKey.json ke project root

# Step 2: Sync (kapan saja butuh update)
npm run firestore-sync
# Output: firestore_transformed_2026-06-13.json

# Step 3: Import (di browser)
Buka http://localhost:5176/
→ Klik "📥 Migrasi"
→ Paste isi dari firestore_transformed_2026-06-13.json
→ Klik "✅ Impor"

# Step 4: Validate
Lihat Buku Warung → check data, kategori, harga
Semua ok? Commit ke git!

# Step 5: Next sync (jika ada barang baru di Firestore)
npm run firestore-sync  # Generate file terbaru
# Import lagi ke app
# Data lama tidak dihapus, barang baru ditambah
```

---

## 🆘 Troubleshooting

### ❌ "npm run firestore-sync" error: Cannot find module 'firebase-admin'
```bash
npm install firebase-admin
npm run firestore-sync
```

### ❌ "serviceAccountKey.json tidak ditemukan"
Pastikan file sudah di project root (di samping package.json)
Nama harus persis: `serviceAccountKey.json`

### ❌ "Collection barang kosong atau tidak ada"
- Cek apakah collection name benar (default: `barang`)
- Firestore punya collection lain? Jalankan:
  ```bash
  node scripts/firestore-sync.js nama_collection_lain
  ```

### ❌ "JSON tidak valid saat import"
- Jangan edit file JSON manual
- Gunakan file output dari `npm run firestore-sync` langsung
- Jika error, copy dari terminal output (lebih aman)

### ❌ "Data import tapi harga Rp 0"
- Field `hargaAgen` atau `satuanBeli` mungkin undefined di Firestore
- Check file `firestore_raw_*.json` untuk lihat data original
- Edit di Firestore, re-run `npm run firestore-sync`

### ❌ "Data terima tapi kategori salah"
- Kategori auto-detect dari nama barang
- Jika salah, edit field `kategori` di Buku Warung setelah import
- Atau edit di Firestore lama, re-sync

---

## 📞 Quick Reference

```bash
# Setup pertama kali
npm install firebase-admin

# Sync data setiap update
npm run firestore-sync

# Output file yang dihasilkan
firestore_raw_YYYY-MM-DD.json          # Backup
firestore_transformed_YYYY-MM-DD.json  # ← Gunakan ini
firestore_minimal_YYYY-MM-DD.json      # Alternatif (simple)

# Import ke app
1. Copy isi file
2. Buka app → "📥 Migrasi"
3. Paste → "✅ Impor"
```

---

## 🎓 Kenapa Sistem Baru Lebih Baik?

| Aspek | Lama (Manual) | Baru (Otomatis) |
|---|---|---|
| **Waktu** | 5-10 min | 1 command |
| **Akurasi** | Rawan kelewat | 100% sempurna |
| **Backup** | Tidak ada | Ada (3 file) |
| **Validasi** | Manual cek | Auto summary |
| **Update** | Ulangi manual | Simpel re-sync |
| **Aman** | Perlu hati-hati | credentials aman |

**Kesimpulan:** Sistem otomatis = lebih cepat, lebih akurat, lebih aman! 🎉


