import React, { useState } from 'react';
import { Copy, Terminal, Info } from 'lucide-react';

interface EngineerUtilitiesProps {
  language: 'en' | 'id';
  theme: 'dark' | 'light';
  triggerToast: (msg: string) => void;
}

export const EngineerUtilities: React.FC<EngineerUtilitiesProps> = ({
  language,
  theme,
  triggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'converter' | 'summary'>('sheets');

  // Mini tool: IP/Binary state
  const [convertIp, setConvertIp] = useState('192.168.1.1');
  const [convertBin, setConvertBin] = useState('11000000.10101000.00000001.00000001');

  // Route Summarizer State
  const [summaryInput, setSummaryInput] = useState('192.168.1.0\n192.168.2.0\n192.168.3.0\n192.168.0.0');
  const [summaryResult, setSummaryResult] = useState('');

  // Translations
  const t = {
    en: {
      title: 'Network Engineer Toolkit',
      sheets: 'Reference Cheat Sheets',
      converter: 'IP ↔ Binary Converter',
      summary: 'Route Summarization Calc',
      ipInput: 'IP Address',
      binInput: 'Binary Address representation',
      convert: 'Convert',
      errFormat: 'Invalid format entered!',
      sumPlaceholder: 'Enter network blocks (one per line, e.g. 192.168.1.0)',
      sumBtn: 'Summarize Routes',
      sumResult: 'Optimal Summary Address / Route:',
      sumExplanation: 'All input networks fit perfectly within this summarized address block.',
    },
    id: {
      title: 'Alat Bantu Insinyur Jaringan',
      sheets: 'Lembar Panduan Referensi',
      converter: 'Konverter IP ↔ Biner',
      summary: 'Kalkulator Ringkasan Rute',
      ipInput: 'Alamat IP',
      binInput: 'Representasi Alamat Biner',
      convert: 'Konversi',
      errFormat: 'Format yang dimasukkan tidak valid!',
      sumPlaceholder: 'Masukkan blok jaringan (satu per baris, contoh: 192.168.1.0)',
      sumBtn: 'Ringkas Rute',
      sumResult: 'Alamat / Rute Ringkasan Optimal:',
      sumExplanation: 'Semua jaringan input cocok dan masuk dalam blok alamat terangkum ini.',
    },
  }[language];

  // Logic IP ↔ Binary Converter
  const IPV4_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const BIN_REGEX = /^([01]{8}\.){3}[01]{8}$/;

  const handleIpToBin = () => {
    if (!IPV4_REGEX.test(convertIp)) {
      triggerToast(t.errFormat);
      return;
    }
    const parts = convertIp.split('.');
    const binStr = parts.map(p => parseInt(p, 10).toString(2).padStart(8, '0')).join('.');
    setConvertBin(binStr);
  };

  const handleBinToIp = () => {
    // Remove spaces, support dots or raw 32-bits
    let cleanBin = convertBin.replace(/\s/g, '');
    if (cleanBin.length === 32 && !cleanBin.includes('.')) {
      // Insert dots
      cleanBin = `${cleanBin.slice(0, 8)}.${cleanBin.slice(8, 16)}.${cleanBin.slice(16, 24)}.${cleanBin.slice(24)}`;
    }
    
    if (!BIN_REGEX.test(cleanBin)) {
      triggerToast(t.errFormat);
      return;
    }

    const parts = cleanBin.split('.');
    const ipStr = parts.map(p => parseInt(p, 2)).join('.');
    setConvertIp(ipStr);
  };

  // Route Summarization engine
  const handleSummarize = () => {
    const rawLines = summaryInput.split('\n');
    const ips = rawLines
      .map(line => line.trim())
      .filter(line => IPV4_REGEX.test(line));

    if (ips.length === 0) {
      triggerToast(t.errFormat);
      return;
    }

    // Convert IPs to numbers
    const ipNums = ips.map(ip => {
      const parts = ip.split('.');
      return ((parseInt(parts[0], 10) << 24) +
              (parseInt(parts[1], 10) << 16) +
              (parseInt(parts[2], 10) << 8) +
              parseInt(parts[3], 10)) >>> 0;
    });

    // Find the common prefix bits
    const firstIp = ipNums[0];
    let commonBits = 32;

    for (let i = 1; i < ipNums.length; i++) {
      const diff = firstIp ^ ipNums[i];
      if (diff === 0) continue;
      
      // Find position of the highest set bit in XOR diff
      const msb = 31 - Math.floor(Math.log2(diff));
      if (msb < commonBits) {
        commonBits = msb;
      }
    }

    // Generate summary address
    const mask = (commonBits === 0 ? 0 : (0xFFFFFFFF << (32 - commonBits))) >>> 0;
    const summaryNum = (firstIp & mask) >>> 0;
    
    const summaryIp = [
      (summaryNum >>> 24) & 255,
      (summaryNum >>> 16) & 255,
      (summaryNum >>> 8) & 255,
      summaryNum & 255
    ].join('.');

    setSummaryResult(`${summaryIp}/${commonBits}`);
  };

  return (
    <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'} mt-8`}>
      <h3 className="card-title font-bold text-xl mb-6 flex items-center gap-2 border-b border-gray-800 pb-3">
        <Terminal className="text-cyan-400" size={22} /> {t.title}
      </h3>

      {/* Toolkit Tabs */}
      <div className="flex gap-2 border-b border-gray-900 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'sheets' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40' : 'text-gray-400 hover:text-white'}`}
        >
          {t.sheets}
        </button>
        <button
          onClick={() => setActiveTab('converter')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'converter' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40' : 'text-gray-400 hover:text-white'}`}
        >
          {t.converter}
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40' : 'text-gray-400 hover:text-white'}`}
        >
          {t.summary}
        </button>
      </div>

      {/* PANEL 1: CHEAT SHEETS */}
      {activeTab === 'sheets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div>
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-cyan-400">/24 to /30 CIDR Subnet Quick Chart</h4>
            <div className="table-container border border-gray-900 rounded-xl overflow-x-auto bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-gray-800 text-gray-400">
                    <th className="p-2 font-semibold">Prefix</th>
                    <th className="p-2 font-semibold">Subnet Mask</th>
                    <th className="p-2 font-semibold">Usable Hosts</th>
                    <th className="p-2 font-semibold">Wildcard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900 font-mono text-gray-300">
                  <tr className="hover:bg-slate-900/30">
                    <td className="p-2 text-cyan-400 font-bold">/24</td>
                    <td className="p-2">255.255.255.0</td>
                    <td className="p-2 text-white font-bold">254</td>
                    <td className="p-2 text-gray-500">0.0.0.255</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30">
                    <td className="p-2 text-cyan-400 font-bold">/25</td>
                    <td className="p-2">255.255.255.128</td>
                    <td className="p-2 text-white font-bold">126</td>
                    <td className="p-2 text-gray-500">0.0.0.127</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30">
                    <td className="p-2 text-cyan-400 font-bold">/26</td>
                    <td className="p-2">255.255.255.192</td>
                    <td className="p-2 text-white font-bold">62</td>
                    <td className="p-2 text-gray-500">0.0.0.63</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30">
                    <td className="p-2 text-cyan-400 font-bold">/27</td>
                    <td className="p-2">255.255.255.224</td>
                    <td className="p-2 text-white font-bold">30</td>
                    <td className="p-2 text-gray-500">0.0.0.31</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30">
                    <td className="p-2 text-cyan-400 font-bold">/28</td>
                    <td className="p-2">255.255.255.240</td>
                    <td className="p-2 text-white font-bold">14</td>
                    <td className="p-2 text-gray-500">0.0.0.15</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30">
                    <td className="p-2 text-cyan-400 font-bold">/29</td>
                    <td className="p-2">255.255.255.248</td>
                    <td className="p-2 text-white font-bold">6</td>
                    <td className="p-2 text-gray-500">0.0.0.7</td>
                  </tr>
                  <tr className="hover:bg-slate-900/30">
                    <td className="p-2 text-cyan-400 font-bold">/30</td>
                    <td className="p-2">255.255.255.252</td>
                    <td className="p-2 text-white font-bold">2</td>
                    <td className="p-2 text-gray-500">0.0.0.3</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-cyan-400">RFC 1918 Private Ranges</h4>
            <div className="bg-slate-950/40 border border-gray-900 p-4 rounded-xl space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-gray-900 pb-2">
                <div>
                  <span className="font-bold text-white font-mono text-sm block">10.0.0.0 /8</span>
                  <span className="text-gray-500">10.0.0.0 - 10.255.255.255</span>
                </div>
                <span className="text-cyan-400 font-semibold uppercase">16.7M IPs</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-900 pb-2">
                <div>
                  <span className="font-bold text-white font-mono text-sm block">172.16.0.0 /12</span>
                  <span className="text-gray-500">172.16.0.0 - 172.31.255.255</span>
                </div>
                <span className="text-cyan-400 font-semibold uppercase">1.04M IPs</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-white font-mono text-sm block">192.168.0.0 /16</span>
                  <span className="text-gray-500">192.168.0.0 - 192.168.255.255</span>
                </div>
                <span className="text-cyan-400 font-semibold uppercase">65.5K IPs</span>
              </div>
            </div>

            <h4 className="text-sm font-bold text-white mb-3 mt-5 uppercase tracking-wider text-cyan-400">Common IPv6 Prefixes</h4>
            <div className="bg-slate-950/40 border border-gray-900 p-4 rounded-xl space-y-2 text-xs font-mono text-gray-300">
              <p><span className="text-cyan-400 font-bold">2000::/3</span> — Global Unicast (Public)</p>
              <p><span className="text-emerald-400 font-bold">fe80::/10</span> — Link-Local (Device Auto)</p>
              <p><span className="text-orange-400 font-bold">fc00::/7</span> — Unique Local (ULA Private)</p>
              <p><span className="text-red-400 font-bold">ff00::/8</span> — Multicast address space</p>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: IP to BINARY CONVERTER */}
      {activeTab === 'converter' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-slate-950/40 border border-gray-900 p-5 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-cyan-400">{t.converter}</h4>
            
            <div className="form-group mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">{t.ipInput}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="bg-slate-900 border border-gray-800 focus:border-cyan-500 rounded-xl px-3 py-2 outline-none text-white text-sm font-mono w-full"
                  value={convertIp}
                  onChange={(e) => setConvertIp(e.target.value)}
                />
                <button
                  onClick={handleIpToBin}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold px-4 py-2 transition-all"
                >
                  {t.convert}
                </button>
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="block text-xs text-gray-500 mb-1.5">{t.binInput}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="bg-slate-900 border border-gray-800 focus:border-cyan-500 rounded-xl px-3 py-2 outline-none text-white text-xs font-mono w-full"
                  value={convertBin}
                  onChange={(e) => setConvertBin(e.target.value)}
                />
                <button
                  onClick={handleBinToIp}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold px-4 py-2 transition-all"
                >
                  {t.convert}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center text-xs text-gray-500 leading-relaxed bg-slate-950/20 border border-gray-900 p-5 rounded-2xl">
            <h5 className="font-bold text-white mb-2 uppercase tracking-wide flex items-center gap-1"><Info size={14} className="text-cyan-400" /> How to use</h5>
            <p className="mb-2">Enter any valid IPv4 address on the top box and click "Convert" to translate it into a dotted 32-bit binary structure.</p>
            <p>Alternatively, write or paste a 32-bit binary string (with or without octet separation dots) in the bottom box to convert it back to decimals.</p>
          </div>
        </div>
      )}

      {/* PANEL 3: ROUTE SUMMARIZATION */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-slate-950/40 border border-gray-900 p-5 rounded-2xl">
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-cyan-400">{t.summary}</h4>
            
            <div className="form-group mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">{t.sumPlaceholder}</label>
              <textarea
                rows={4}
                className="w-full bg-slate-900 border border-gray-800 focus:border-cyan-500 rounded-xl p-3 outline-none text-white text-sm font-mono"
                value={summaryInput}
                onChange={(e) => setSummaryInput(e.target.value)}
                placeholder="e.g.&#10;192.168.1.0&#10;192.168.2.0&#10;192.168.3.0"
              />
            </div>

            <button
              onClick={handleSummarize}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-bold py-2.5 transition-all shadow-lg shadow-cyan-950/20"
            >
              {t.sumBtn}
            </button>
          </div>

          <div className="flex flex-col justify-center bg-slate-950/20 border border-gray-900 p-5 rounded-2xl">
            {summaryResult ? (
              <div className="animate-fade-in">
                <span className="text-xs uppercase text-gray-500 font-bold block mb-1">{t.sumResult}</span>
                <span className="text-3xl font-extrabold text-cyan-400 font-mono block mb-2 select-all select-none relative group">
                  {summaryResult}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryResult);
                      triggerToast('Summary route copied!');
                    }}
                    className="absolute right-0 top-1 text-gray-500 hover:text-white"
                  >
                    <Copy size={16} />
                  </button>
                </span>
                <p className="text-xs text-gray-400 leading-relaxed"><Info size={12} className="inline mr-1 text-cyan-400 mt-0.5" /> {t.sumExplanation}</p>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500 leading-relaxed font-mono">
                <Terminal className="mx-auto mb-2 text-gray-600" size={32} />
                Waiting for summarization input blocks...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
