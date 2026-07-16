import { useContext } from 'react';
// 🎯 AMBIL DARI CORE CONTEXT YANG TRANSPARAN DI MATA VITE
import { AppContext } from './AppContextCore.jsx'; 

export const useAppGudang = () => {
  const context = useContext(AppContext);
  
  // Ambil langsung userWarung dari dalam context yang berhasil dibaca
  const userWarung = context?.userWarung;
  const namaPanggilan = userWarung ? userWarung.pemilik : 'Bos';
  
  if (!context) {
    throw new Error('useAppGudang harus digunakan di dalam AppProvider ya, ' + namaPanggilan + '!');
  }
  
  return context;
};