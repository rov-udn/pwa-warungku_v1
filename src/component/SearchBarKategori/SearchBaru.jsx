
import styles from './SearchBaru.module.css';

function SearchBaru({ 
  searchTerm, 
  setSearchTerm, 
  kategoriAktif, 
  setKategoriAktif, 
  daftarKategori = [],
  placeholder = "🔎 Cari barang...",
  children // 💡 Tempat menampung tombol tambahan (seperti tombol +Tambah atau Import)
}) {
  return (
    <div className={styles.stickyHeader}>
      {/* Baris Pencarian & Tombol Aksi */}
      <div className={styles.searchRow}>
        <input 
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchBar}
        />
        {/* Tombol tambahan dari komponen induk otomatis masuk ke sini */}
        {children}
      </div>

      {/* Scroll Horizontal Kategori */}
      <div className={styles.scrollKategori}>
        {daftarKategori.map((kat) => {
          const isAktif = kategoriAktif === kat;
          return (
            <button
              key={kat}
              type="button"
              onClick={() => setKategoriAktif(kat)}
              className={`${styles.btnKategoriPill} ${isAktif ? styles.btnKategoriActive : ''}`}
            >
              {kat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SearchBaru;