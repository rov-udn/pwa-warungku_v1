# 🏪 Warung Haerudin PWA - Setup & Migration

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# Buka: http://localhost:5173 (atau port yang ditunjukkan)

# Check code quality
npm run lint
```

---

## 📥 Migrasi Data dari Firestore Lama

### Otomatis (Recommended) ⭐
```bash
# 1. Sekali kali: Download serviceAccountKey.json dari Firebase Console
#    → Simpan di project root (di samping package.json)
#    → File akan otomatis di-ignore git (aman!)

# 2. Kapan saja ingin sync:
npm run firestore-sync

# 3. Copy output JSON ke app:
#    - Buka: http://localhost:5176/
#    - Klik "📥 Migrasi" di halaman Buku Warung
#    - Paste JSON → Klik "✅ Impor"
#    - DONE ✅
```

### Manual (Jika tidak ingin install firebase-admin)
1. Export dari Firebase Console → Firestore → collection → Export
2. Paste JSON ke "📥 Migrasi" modal di app
3. Klik import

---

## 📚 Dokumentasi Lengkap
Baca: [MIGRASI_FIRESTORE.md](./MIGRASI_FIRESTORE.md)

---

## 📁 Struktur Project

```
src/
├── App.jsx                    # Main state & handlers
├── component/
│   ├── header/Header.jsx
│   ├── layout/DashboardLayout.jsx
│   └── sidebar/MainMenuNav.jsx
├── pages/
│   ├── BelanjaAgen/          # Pembelian agen
│   ├── BukuWarung/           # Data barang & import
│   ├── History/              # Riwayat belanja
│   └── CatatanPerubahanHarga/ (future)
├── utils/
│   └── migrationHelpers.js   # Transform logic
├── data/
│   └── initialBarang.js      # Sample data

scripts/
├── firestore-sync.js         # ⭐ Auto-sync dari Firestore
├── transform_firestore_to_app.js
└── export_firestore.js
```

---

## 🔑 Key Features

- ✅ **Offline-First**: Data di localStorage (tidak perlu server)
- ✅ **Auto-Logging**: Catat setiap perubahan harga
- ✅ **Grosir Smart**: Hitung harga grosir otomatis
- ✅ **PWA Ready**: Bisa install sebagai app di phone
- ✅ **Dark Mode**: Toggle di header
- ✅ **Kategori Auto**: Deteksi kategori dari nama barang
- ✅ **Import Firestore**: Migrasi data mudah

---

## 💾 Data Storage

Semua data tersimpan di browser **localStorage**:
- `warung_daftar_barang` - List barang
- `warung_history_belanja` - History transaksi
- `warung_log_perubahan_harga` - Log perubahan harga

**Backup manual:**
```javascript
// Console browser (F12):
copy(localStorage)  // Copy semua data
// Paste ke file .json untuk backup
```

---

## 🛠 NPM Scripts

```bash
npm run dev              # Start dev server
npm run build           # Build untuk production
npm run lint            # Check code quality
npm run firestore-sync  # Sync data dari Firestore
npm run preview         # Preview production build
```

---

## 📱 Deployment (Gratis)

### Via Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Via GitHub Pages + GitHub Actions
Lihat `.github/workflows/` (kalau ada)

---

## 🔒 Security Notes

- ⚠️ **serviceAccountKey.json** - JANGAN commit ke git! (sudah di .gitignore)
- ⚠️ Simpan credentials aman, tidak di cloud publik
- ✅ App berjalan offline (tidak punya backend = lebih aman)
- ✅ Data hanya di device user (tidak tercentralisasi)

---

## 🆘 Troubleshooting

### Port 5173 sudah terpakai
```bash
npm run dev -- --port 3000
```

### npm install error
```bash
npm cache clean --force
npm install
```

### Build error
```bash
npm run lint
npm run build
```

### Data tidak muncul
- Buka DevTools (F12) → Storage → localStorage
- Cek key: `warung_daftar_barang`
- Jika kosong: import ulang data

---

## 📞 Quick Links

- 📖 [Migrasi Lengkap](./MIGRASI_FIRESTORE.md)
- 🔗 [Firebase Console](https://console.firebase.google.com/)
- 📚 [React Docs](https://react.dev/)
- 🎨 [Vite Docs](https://vitejs.dev/)

---

## 🎯 TODOs (Roadmap)

- [ ] Fitur POS/Kasir (input harga cepat)
- [ ] Laporan bulanan
- [ ] Sync ke cloud (optional backup)
- [ ] Barcode scanner
- [ ] Multi-user (login management)
- [ ] Export laporan ke Excel/PDF

---

Made with ❤️ untuk Warung Haerudin
