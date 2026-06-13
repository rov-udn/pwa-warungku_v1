import { useState, useMemo } from 'react';
import styles from './RightSidebar.module.css';

function RightSidebar({ logPerubahanHarga = [] }) {
  // ── 🧮 STATE ALAT CEK MARGIN CEPAT ──
  const [modalInput, setModalInput] = useState('');
  const [pcsInput, setPcsInput] = useState('1');
  const [jualInput, setJualInput] = useState('');

  // ── 📊 REAKTIF HITUNG CUAN & MARGIN ──
  const hasilMargin = useMemo(() => {
    const modalTotal = Number(modalInput) || 0;
    const pcs = Math.max(1, Number(pcsInput) || 1);
    const jualEceran = Number(jualInput) || 0;

    const modalPerPcs = Math.round(modalTotal / pcs);
    const untungPerPcs = jualEceran - modalPerPcs;
    const untungTotalPaket = (jualEceran * pcs) - modalTotal;
    const persentaseMargin = jualEceran > 0 ? ((untungPerPcs / jualEceran) * 100).toFixed(1) : '0.0';

    return {
      modalPerPcs,
      untungPerPcs,
      untungTotalPaket,
      persentaseMargin
    };
  }, [modalInput, pcsInput, jualInput]);

  // Ambil maksimal 3 log perubahan harga terbaru untuk radar
  const latestLogs = useMemo(() => {
    return Array.isArray(logPerubahanHarga) ? logPerubahanHarga.slice(0, 3) : [];
  }, [logPerubahanHarga]);

  return (
    <div className={styles.container}>
      
      {/* 🚨 WIDGET 1: RADAR PERUBAHAN HARGA 🚨 */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <h4 className={styles.widgetTitle}>Radar Harga Agen</h4>
          <span className={styles.widgetIcon}>🚨</span>
        </div>
        
        <div className={styles.logList}>
          {latestLogs.length === 0 ? (
            <p className={styles.emptyState}>Belum ada riwayat update harga modal dari agen.</p>
          ) : (
            latestLogs.map((log) => {
              const diff = (log.modalBaru || 0) - (log.modalLama || 0);
              const isNaik = diff > 0;
              
              return (
                <div key={log.idLog} className={styles.logItem}>
                  <div className={styles.logMeta}>
                    <span style={{ fontWeight: '700' }}>UPDATE MODAL</span>
                    <span className={styles.logDate}>{log.tanggal}</span>
                  </div>
                  <h5 className={styles.logTitle} title={log.namaBarang}>{log.namaBarang}</h5>
                  <div className={styles.logPriceRow}>
                    <div className={styles.logPrices}>
                      <span className={styles.priceOld}>Rp {log.modalLama?.toLocaleString('id-ID')}</span>
                      <span>➡️</span>
                      <span className={styles.priceNew}>Rp {log.modalBaru?.toLocaleString('id-ID')}</span>
                    </div>
                    {diff !== 0 && (
                      <span className={`${styles.priceDiff} ${isNaik ? styles.priceDiffUp : styles.priceDiffDown}`}>
                        {isNaik ? '▲' : '▼'} Rp {Math.abs(diff).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 🧮 WIDGET 2: ALAT CEK MARGIN CEPAT 🧮 */}
      <div className={styles.widget}>
        <div className={styles.widgetHeader}>
          <h4 className={styles.widgetTitle}>Cek Margin Cepat</h4>
          <span className={styles.widgetIcon}>💸</span>
        </div>
        
        <form className={styles.calcForm} onSubmit={(e) => e.preventDefault()}>
          
          {/* Input 1: Harga Modal Total */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Modal Kulakan (Total)</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputPrepend}>Rp</span>
              <input 
                type="number"
                value={modalInput}
                onChange={(e) => setModalInput(e.target.value)}
                placeholder="0"
                className={`${styles.inputField} ${styles.inputFieldPrepended}`}
              />
            </div>
          </div>

          {/* Input 2: Jumlah Pcs */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Jumlah Pcs / Isi Paket</label>
            <div className={styles.inputWrapper}>
              <input 
                type="number"
                value={pcsInput}
                onChange={(e) => setPcsInput(e.target.value)}
                placeholder="1"
                min="1"
                className={`${styles.inputField} ${styles.inputFieldAppended}`}
              />
              <span className={styles.inputAppend}>Pcs</span>
            </div>
          </div>

          {/* Input 3: Rencana Jual Eceran */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Rencana Jual (per Pcs)</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputPrepend}>Rp</span>
              <input 
                type="number"
                value={jualInput}
                onChange={(e) => setJualInput(e.target.value)}
                placeholder="0"
                className={`${styles.inputField} ${styles.inputFieldPrepended}`}
              />
            </div>
          </div>

          {/* Kotak Hasil Reaktif */}
          <div className={styles.resultsBox}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Modal per Pcs:</span>
              <span className={styles.resultValue}>Rp {hasilMargin.modalPerPcs.toLocaleString('id-ID')}</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Untung per Pcs:</span>
              <span className={styles.resultValue} style={{ color: hasilMargin.untungPerPcs >= 0 ? 'var(--accent-emerald, #0a8168)' : '#d9480f' }}>
                Rp {hasilMargin.untungPerPcs.toLocaleString('id-ID')}
              </span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Cuan 1 Paket:</span>
              <span className={styles.resultValue} style={{ color: hasilMargin.untungTotalPaket >= 0 ? 'var(--accent-emerald, #0a8168)' : '#d9480f' }}>
                Rp {hasilMargin.untungTotalPaket.toLocaleString('id-ID')}
              </span>
            </div>
            <div className={styles.resultRow} style={{ borderTop: '1px dashed var(--border-light, #eef0f3)', paddingTop: '6px', marginTop: '2px' }}>
              <span className={styles.resultLabel} style={{ fontWeight: '700' }}>Margin Profit:</span>
              <span className={styles.resultHighlight}>{hasilMargin.persentaseMargin}%</span>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
}

export default RightSidebar;
