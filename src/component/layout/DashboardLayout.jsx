import styles from './DashboardLayout.module.css';

function DashboardLayout({ header, sidebar, mainContent, rightPanel }) {
  return (
    <div className={styles.layoutContainer}>
      {/* Bagian Atas / Header */}
      <header className={styles.headerSection}>
        {header}
      </header>
      
      <div className={styles.bodySection}>
        {/* Navigasi Kiri Desktop / Bawah HP */}
        <aside className={styles.sidebarSection}>
          {sidebar}
        </aside>
        
        {/* Area Tengah Konten Buku Warung */}
        <main className={styles.mainContentSection}>
          {mainContent}
        </main>
        
        {/* Sisi Kanan Log */}
        <section className={styles.rightPanelSection}>
          {rightPanel}
        </section>
      </div>
    </div>
  );
}

export default DashboardLayout;