import React from 'react';
import { History, Pin, PinOff, Trash2, Bookmark, Star } from 'lucide-react';

interface HistoryItem {
  id: string;
  type: 'ipv4' | 'ipv6';
  address: string;
  prefix: number;
  timestamp: string;
  label?: string;
  pinned: boolean;
}

interface HistoryPanelProps {
  language: 'en' | 'id';
  theme: 'dark' | 'light';
  historyList: HistoryItem[];
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onLoad: (type: 'ipv4' | 'ipv6', address: string, prefix: number) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  language,
  theme,
  historyList,
  onPin,
  onDelete,
  onClear,
  onLoad,
}) => {
  
  // Translations
  const t = {
    en: {
      historyTitle: 'Calculation History',
      favoriteTitle: 'Pinned & Favorite Networks',
      examplesTitle: 'Quick Topology Examples',
      smallOffice: 'Small Office',
      enterprise: 'Enterprise LAN',
      p2p: 'Point-to-Point Link',
      datacenter: 'Data Center Core',
      isp: 'ISP Block',
      ipv6Ent: 'IPv6 Enterprise',
      empty: 'No recent calculations yet. Save some calculations above!',
      clearAll: 'Clear History',
      loadBtn: 'Load',
    },
    id: {
      historyTitle: 'Riwayat Kalkulasi',
      favoriteTitle: 'Jaringan Favorit & Tersemat',
      examplesTitle: 'Contoh Topologi Cepat',
      smallOffice: 'Kantor Kecil (SOHO)',
      enterprise: 'LAN Perusahaan',
      p2p: 'Link Point-to-Point',
      datacenter: 'Inti Data Center',
      isp: 'Blok Alokasi ISP',
      ipv6Ent: 'Perusahaan IPv6',
      empty: 'Belum ada riwayat. Simpan hasil perhitungan di atas!',
      clearAll: 'Hapus Semua',
      loadBtn: 'Muat',
    },
  }[language];

  // Quick Examples definitions
  const EXAMPLES = [
    { type: 'ipv4', address: '192.168.1.0', prefix: 24, label: t.smallOffice },
    { type: 'ipv4', address: '10.0.0.0', prefix: 16, label: t.enterprise },
    { type: 'ipv4', address: '10.255.0.0', prefix: 30, label: t.p2p },
    { type: 'ipv4', address: '10.100.0.0', prefix: 20, label: t.datacenter },
    { type: 'ipv4', address: '192.0.2.0', prefix: 22, label: t.isp },
    { type: 'ipv6', address: '2001:db8:ffff::', prefix: 48, label: t.ipv6Ent },
  ];

  const pinnedList = historyList.filter(item => item.pinned);
  const regularList = historyList.filter(item => !item.pinned);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
      
      {/* 1. QUICK EXAMPLES */}
      <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'}`}>
        <h3 className="card-title font-bold text-lg mb-4 flex items-center gap-2">
          <Bookmark className="text-cyan-400" size={20} /> {t.examplesTitle}
        </h3>
        
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => onLoad(ex.type as any, ex.address, ex.prefix)}
              className="flex justify-between items-center text-xs text-left bg-slate-950/40 hover:bg-slate-900/60 border border-gray-900 rounded-xl px-4 py-3 text-gray-300 hover:text-white transition-all font-mono group"
            >
              <div>
                <span className="font-sans font-bold block text-gray-400 group-hover:text-cyan-400 transition-colors mb-0.5">{ex.label}</span>
                <span>{ex.address}/{ex.prefix}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-white transition-colors bg-slate-900 border border-gray-800 px-2 py-0.5 rounded-lg">
                {ex.type}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. PINNED FAVORITES */}
      <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'}`}>
        <h3 className="card-title font-bold text-lg mb-4 flex items-center gap-2">
          <Star className="text-cyan-400 fill-cyan-400/20" size={20} /> {t.favoriteTitle}
        </h3>

        {pinnedList.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500 font-mono">
            No pinned favorite networks yet. Click the pin icon in your history list!
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {pinnedList.map(item => (
              <div
                key={item.id}
                className="flex justify-between items-center text-xs bg-cyan-950/10 hover:bg-cyan-950/20 border border-cyan-900/30 rounded-xl px-4 py-3 text-gray-300 font-mono relative group"
              >
                <div>
                  <span className="font-sans font-bold block text-cyan-400 mb-0.5">{item.label || 'Saved Network'}</span>
                  <span>{item.address}/{item.prefix}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoad(item.type, item.address, item.prefix)}
                    className="text-[10px] uppercase font-bold bg-cyan-500 text-white hover:bg-cyan-600 px-2.5 py-1 rounded-lg transition-colors font-sans"
                  >
                    {t.loadBtn}
                  </button>
                  <button onClick={() => onPin(item.id)} className="text-cyan-400 hover:text-white" title="Unpin">
                    <PinOff size={14} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-white" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. RECENT HISTORY */}
      <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'}`}>
        <h3 className="card-title font-bold text-lg mb-4 flex justify-between items-center">
          <span className="flex items-center gap-2"><History className="text-cyan-400" size={20} /> {t.historyTitle}</span>
          {historyList.length > 0 && (
            <button
              onClick={onClear}
              className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 flex items-center gap-1 font-sans"
            >
              <Trash2 size={12} /> {t.clearAll}
            </button>
          )}
        </h3>

        {regularList.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500 font-mono">
            {t.empty}
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {regularList.map(item => (
              <div
                key={item.id}
                className="flex justify-between items-center text-xs bg-slate-950/40 hover:bg-slate-900/60 border border-gray-900 rounded-xl px-4 py-3 text-gray-300 font-mono group"
              >
                <div>
                  <span className="font-sans font-bold block text-gray-400 mb-0.5">{item.label || 'Subnet Calculation'}</span>
                  <span>{item.address}/{item.prefix}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoad(item.type, item.address, item.prefix)}
                    className="text-[10px] uppercase font-bold bg-slate-900 hover:bg-slate-800 text-white border border-gray-800 px-2.5 py-1 rounded-lg transition-colors font-sans"
                  >
                    {t.loadBtn}
                  </button>
                  <button onClick={() => onPin(item.id)} className="text-gray-500 hover:text-white" title="Pin Favorite">
                    <Pin size={14} />
                  </button>
                  <button onClick={() => onDelete(item.id)} className="text-gray-500 hover:text-red-400" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
