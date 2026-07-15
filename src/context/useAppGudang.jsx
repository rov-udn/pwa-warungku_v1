import { useContext } from 'react';
// 🎯 AMBIL DARI CORE CONTEXT YANG TRANSPARAN DI MATA VITE
import { AppContext } from './AppContextCore.jsx'; 

export const useAppGudang = (userWarung) => {
  const context = useContext(AppContext);
  const namaPanggilan = userWarung ? userWarung.pemilik : 'Bos';
  if (!context) {
    throw new Error('useAppGudang harus digunakan di dalam AppProvider ya, ' + namaPanggilan + '!');
  }
  return context;
};