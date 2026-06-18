import { useState, useEffect } from 'react';
import { Layers, Globe, Sun, Moon, Share2, Clipboard, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Sub components
import { IPv4Calculator } from './components/IPv4Calculator';
import { IPv6Calculator } from './components/IPv6Calculator';
import { SmartTips } from './components/SmartTips';
import { EngineerUtilities } from './components/EngineerUtilities';
import { HistoryPanel } from './components/HistoryPanel';

interface HistoryItem {
  id: string;
  type: 'ipv4' | 'ipv6';
  address: string;
  prefix: number;
  timestamp: string;
  label?: string;
  pinned: boolean;
}

export default function App() {
  const [tab, setTab] = useState<'ipv4' | 'ipv6'>('ipv4');
  const [language, setLanguage] = useState<'en' | 'id'>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // IP parameters shared for Tips & Utilities
  const [v4Ip, setV4Ip] = useState('192.168.10.12');
  const [v4Prefix, setV4Prefix] = useState(27);
  const [v6Ip, setV6Ip] = useState('2001:db8::1');
  const [v6Prefix, setV6Prefix] = useState(64);

  // History & Pinned Favorites
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Share Modal State
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Initial setup: Read URL query params & local storage history
  useEffect(() => {
    // 1. URL Query parameters parser
    const params = new URLSearchParams(window.location.search);
    const qType = params.get('type');
    const qIp = params.get('ip');
    const qPrefix = params.get('prefix');

    if (qType === 'ipv4' || qType === 'ipv6') {
      setTab(qType);
      if (qIp) {
        if (qType === 'ipv4') {
          setV4Ip(qIp);
          if (qPrefix) setV4Prefix(parseInt(qPrefix, 10) || 24);
        } else {
          setV6Ip(qIp);
          if (qPrefix) setV6Prefix(parseInt(qPrefix, 10) || 64);
        }
      }
    }

    // 2. Load History from localStorage
    const savedHistory = localStorage.getItem('piro_history_v2');
    if (savedHistory) {
      try {
        setHistoryList(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history: ', e);
      }
    }
  }, []);

  // Theme effect binder
  useEffect(() => {
    const body = document.body;
    if (theme === 'light') {
      body.classList.add('bg-slate-50', 'text-slate-900');
      body.classList.remove('bg-gray-950', 'text-white');
    } else {
      body.classList.add('bg-gray-950', 'text-white');
      body.classList.remove('bg-slate-50', 'text-slate-900');
    }
  }, [theme]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  // History operations
  const handleSaveHistory = (type: 'ipv4' | 'ipv6', address: string, prefixVal: number, label?: string) => {
    // Prevent duplicates
    const isDuplicate = historyList.some(
      item => item.type === type && item.address === address && item.prefix === prefixVal
    );

    if (isDuplicate) {
      triggerToast(language === 'en' ? 'Calculation already saved!' : 'Kalkulasi sudah tersimpan!');
      return;
    }

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      type,
      address,
      prefix: prefixVal,
      timestamp: new Date().toLocaleTimeString(),
      label: label || (type === 'ipv4' ? 'IPv4 Block' : 'IPv6 Prefix'),
      pinned: false,
    };

    const updated = [newItem, ...historyList];
    setHistoryList(updated);
    localStorage.setItem('piro_history_v2', JSON.stringify(updated));
    triggerToast(language === 'en' ? 'Saved successfully!' : 'Berhasil disimpan!');
  };

  const handlePin = (id: string) => {
    const updated = historyList.map(item => {
      if (item.id === id) return { ...item, pinned: !item.pinned };
      return item;
    });
    setHistoryList(updated);
    localStorage.setItem('piro_history_v2', JSON.stringify(updated));
    triggerToast(language === 'en' ? 'Favorite toggled!' : 'Favorit diubah!');
  };

  const handleDeleteHistory = (id: string) => {
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    localStorage.setItem('piro_history_v2', JSON.stringify(updated));
    triggerToast(language === 'en' ? 'Record deleted!' : 'Catatan dihapus!');
  };

  const handleClearHistory = () => {
    // Keep pinned items, delete unpinned
    const updated = historyList.filter(item => item.pinned);
    setHistoryList(updated);
    localStorage.setItem('piro_history_v2', JSON.stringify(updated));
    triggerToast(language === 'en' ? 'Cleared history!' : 'Riwayat dibersihkan!');
  };

  const handleLoadFromHistory = (type: 'ipv4' | 'ipv6', address: string, prefixVal: number) => {
    setTab(type);
    if (type === 'ipv4') {
      setV4Ip(address);
      setV4Prefix(prefixVal);
    } else {
      setV6Ip(address);
      setV6Prefix(prefixVal);
    }
    triggerToast(language === 'en' ? 'Calculation loaded!' : 'Kalkulasi dimuat!');
    
    // Smooth scroll up to inputs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Share calculation builder
  const handleOpenShare = () => {
    const currentIp = tab === 'ipv4' ? v4Ip : v6Ip;
    const currentPrefix = tab === 'ipv4' ? v4Prefix : v6Prefix;
    const origin = window.location.origin;
    const fullShareUrl = `${origin}/piro?type=${tab}&ip=${encodeURIComponent(currentIp)}&prefix=${currentPrefix}`;
    setShareUrl(fullShareUrl);
    setShowShareModal(true);
  };

  // Translations main interface
  const t = {
    en: {
      tagline: 'Modern Subnet Calculator for Network Engineers',
      ipv4: 'IPv4 Calculator',
      ipv6: 'IPv6 Calculator',
      shareBtn: 'Share Result',
      shareTitle: 'Share this Subnet',
      shareDesc: 'Send this unique link or scan the QR code to instantly load this subnet configuration.',
      copyLink: 'Copy URL Link',
      close: 'Close',
    },
    id: {
      tagline: 'Kalkulator Subnet Modern untuk Insinyur Jaringan',
      ipv4: 'Kalkulator IPv4',
      ipv6: 'Kalkulator IPv6',
      shareBtn: 'Bagikan Hasil',
      shareTitle: 'Bagikan Subnet Ini',
      shareDesc: 'Kirim tautan unik ini atau pindai kode QR untuk langsung memuat konfigurasi subnet ini.',
      copyLink: 'Salin Tautan URL',
      close: 'Tutup',
    },
  }[language];

  // Callback listeners to capture IP parameters on child input changes
  const handleV4Change = (ipVal: string, prefVal: number) => {
    setV4Ip(ipVal);
    setV4Prefix(prefVal);
  };

  const handleV6Change = (ipVal: string, prefVal: number) => {
    setV6Ip(ipVal);
    setV6Prefix(prefVal);
  };

  return (
    <div className={`app-container min-h-screen ${theme === 'dark' ? 'text-gray-100' : 'text-slate-800'}`}>
      
      {/* Premium Top Navigation */}
      <nav className={`flex justify-between items-center py-4 px-6 rounded-2xl mb-8 ${theme === 'dark' ? 'bg-slate-900/60 border border-gray-800/80' : 'bg-white border border-gray-200'} backdrop-blur-md`}>
        <div className="flex items-center gap-2">
          <Layers className="text-cyan-400 stroke-[2.5]" size={24} />
          <span className="font-extrabold text-xl tracking-tight select-none">
            PI<span className="text-cyan-400">RO</span>
          </span>
        </div>

        {/* Tab switchers in center */}
        <div className="flex bg-slate-950/80 border border-gray-900 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setTab('ipv4')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'ipv4' ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            {t.ipv4}
          </button>
          <button
            onClick={() => setTab('ipv6')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'ipv6' ? 'bg-cyan-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            {t.ipv6}
          </button>
        </div>

        {/* Right utilities bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-gray-800 hover:border-cyan-500 text-gray-400 hover:text-white transition-all"
            title="Share Calculation"
          >
            <Share2 size={14} /> <span className="hidden sm:inline">{t.shareBtn}</span>
          </button>
          <div className="vr border-r border-gray-800 h-6"></div>
          
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white"
            title="Toggle Language"
          >
            <Globe size={14} />
            <span className="uppercase text-[10px]">{language}</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-gray-400 hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Main Layout Container */}
      <main className="max-w-[1200px] mx-auto pb-12">
        {tab === 'ipv4' ? (
          <div className="animate-fade-in">
            <IPv4Calculator
              language={language}
              theme={theme}
              onSaveHistory={handleSaveHistory}
              triggerToast={triggerToast}
              onChange={handleV4Change}
            />
            <SmartTips language={language} type="ipv4" ipAddress={v4Ip} prefix={v4Prefix} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <IPv6Calculator
              language={language}
              theme={theme}
              onSaveHistory={handleSaveHistory}
              triggerToast={triggerToast}
              onChange={handleV6Change}
            />
            <SmartTips language={language} type="ipv6" ipAddress={v6Ip} prefix={v6Prefix} />
          </div>
        )}

        {/* Engineer reference sheets and mini tools */}
        <EngineerUtilities language={language} theme={theme} triggerToast={triggerToast} />

        {/* History log panel */}
        <HistoryPanel
          language={language}
          theme={theme}
          historyList={historyList}
          onPin={handlePin}
          onDelete={handleDeleteHistory}
          onClear={handleClearHistory}
          onLoad={handleLoadFromHistory}
        />
      </main>

      {/* Toast popup */}
      <div className={`toast fixed bottom-6 right-6 flex items-center gap-2 bg-emerald-500 border border-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-2xl z-[1100] transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}>
        <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        {toastMsg}
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[2000]">
          <div className={`w-full max-w-md rounded-2xl border p-6 relative animate-fade-in ${theme === 'dark' ? 'bg-slate-950 border-gray-900 text-white' : 'bg-white border-gray-200 text-slate-800'}`}>
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="font-extrabold text-lg mb-2 flex items-center gap-2">
              <Share2 className="text-cyan-400" size={20} /> {t.shareTitle}
            </h3>
            <p className="text-xs text-gray-500 mb-6">{t.shareDesc}</p>

            {/* QR Code */}
            <div className="flex justify-center bg-white p-4 rounded-xl mb-6 max-w-[200px] mx-auto shadow-inner">
              <QRCodeSVG value={shareUrl} size={168} />
            </div>

            {/* URL Input Copy */}
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className={`w-full text-xs font-mono rounded-lg px-3 py-2 border outline-none select-all ${theme === 'dark' ? 'bg-slate-900 border-gray-800 text-cyan-400' : 'bg-slate-50 border-gray-200 text-cyan-600'}`}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  triggerToast(language === 'en' ? 'Link copied!' : 'Tautan disalin!');
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1"
              >
                <Clipboard size={14} /> Copy
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 border border-gray-800 hover:border-cyan-500 text-white text-xs font-bold py-2 rounded-lg mt-6"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
