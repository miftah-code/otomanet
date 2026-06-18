import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Shuffle, Save, HelpCircle, Info } from 'lucide-react';

interface IPv6CalculatorProps {
  language: 'en' | 'id';
  theme: 'dark' | 'light';
  onSaveHistory: (type: 'ipv4' | 'ipv6', address: string, prefix: number, label?: string) => void;
  triggerToast: (msg: string) => void;
  onChange: (ip: string, prefix: number) => void;
}

const RANDOM_EXAMPLES = [
  { ip: '2001:db8::1', prefix: 64, label: 'Standard LAN Segment' },
  { ip: '2001:db8:abcd:1234::', prefix: 48, label: 'Enterprise Allocation' },
  { ip: 'fc00:10:20::100', prefix: 7, label: 'Unique Local Address (ULA)' },
  { ip: 'fe80::211:22ff:fe33:4455', prefix: 10, label: 'Link-Local Address (EUI-64)' },
  { ip: 'ff02::1', prefix: 8, label: 'Link-Local Multicast' },
  { ip: '::1', prefix: 128, label: 'Loopback address' },
];

export const IPv6Calculator: React.FC<IPv6CalculatorProps> = ({
  language,
  theme,
  onSaveHistory,
  triggerToast,
  onChange,
}) => {
  const [ip, setIp] = useState('2001:db8::1');
  const [prefix, setPrefix] = useState(64);
  const [macAddress, setMacAddress] = useState('00:11:22:33:44:55');
  const [eui64Result, setEui64Result] = useState('');
  
  // V6 Subnetting State
  const [targetPrefix, setTargetPrefix] = useState(64);
  const [viewCount, setViewCount] = useState(8);
  const [v6Subnets, setV6Subnets] = useState<any[]>([]);

  // Translations
  const t = {
    en: {
      params: 'IPv6 Parameters',
      address: 'IPv6 Address',
      prefixLen: 'Prefix Length',
      errIp: 'Please enter a valid IPv6 address (e.g. 2001:db8::1)',
      errPrefix: 'Prefix length must be between 1 and 128',
      calculate: 'Calculate',
      reset: 'Reset',
      random: 'Random Example',
      save: 'Save History',
      copy: 'Copy Results',
      v6Details: 'IPv6 Network Details',
      expanded: 'Expanded Address',
      compressed: 'Compressed Address',
      prefixStr: 'Network Prefix',
      totalIps: 'Total IPv6 Addresses',
      rangeStart: 'First Address',
      rangeEnd: 'Last Address',
      scope: 'Address Scope & Class',
      analysis: 'IPv6 Advanced Analysis',
      slaacTitle: 'SLAAC Suitability',
      slaacOk: '✅ Suitable for SLAAC (Prefix is /64)',
      slaacWarn: '⚠️ Unsuitable for SLAAC. Stateless Auto-Configuration requires a /64 prefix length per RFC 4862.',
      eui64Title: 'EUI-64 SLAAC MAC Converter',
      macLabel: 'MAC Address (for EUI-64)',
      eui64ResultLabel: 'Resulting EUI-64 Link-Local IP:',
      convert: 'Convert MAC',
      rdnsTitle: 'Reverse DNS Pointer (PTR Record)',
      rdnsPlaceholder: 'Reverse IP pointer record for DNS lookups',
      plannerTitle: 'IPv6 Subnet Planner / Subdivision',
      divideLabel: 'Target Subnet Prefix',
      viewLabel: 'Number of Subnets to View',
      generate: 'Generate Planning Table',
      idx: 'Subnet #',
      v6SubnetAddr: 'Subnet Prefix / Range',
      usageRec: 'Usage Recommendation',
      eduTitle: 'IPv6 Human Education Helper',
      eduQ1: 'What does a /64 prefix mean?',
      eduA1: 'A /64 prefix is the standard subnet size for Local Area Networks (LANs) in IPv6. It allocates 64 bits for the network identifier and leaves 64 bits for host interface IDs. It supports 18.4 billion billion IP addresses per segment!',
      eduQ2: 'How many subnets can be created from an enterprise allocation?',
      eduA2: 'If you receive a /48 allocation from an ISP, you can create 65,536 standard /64 subnets. If you receive a /56 allocation, you can create 256 standard /64 subnets.',
    },
    id: {
      params: 'Parameter IPv6',
      address: 'Alamat IPv6',
      prefixLen: 'Panjang Prefix',
      errIp: 'Masukkan alamat IPv6 yang valid (misal: 2001:db8::1)',
      errPrefix: 'Panjang prefix harus bernilai antara 1 dan 128',
      calculate: 'Hitung',
      reset: 'Reset',
      random: 'Contoh Acak',
      save: 'Simpan ke Riwayat',
      copy: 'Salin Hasil',
      v6Details: 'Rincian Jaringan IPv6',
      expanded: 'Alamat Ekspansi Lengkap',
      compressed: 'Alamat Kompresi Pendek',
      prefixStr: 'Prefix Jaringan',
      totalIps: 'Total Alamat IPv6',
      rangeStart: 'Alamat Pertama',
      rangeEnd: 'Alamat Terakhir',
      scope: 'Skala & Cakupan Alamat',
      analysis: 'Analisis Lanjutan IPv6',
      slaacTitle: 'Kesesuaian SLAAC',
      slaacOk: '✅ Sesuai untuk SLAAC (Prefix bernilai /64)',
      slaacWarn: '⚠️ Tidak sesuai untuk SLAAC. Konfigurasi Otomatis Stateless membutuhkan panjang prefix /64 (RFC 4862).',
      eui64Title: 'Konverter EUI-64 SLAAC MAC',
      macLabel: 'Alamat MAC (untuk EUI-64)',
      eui64ResultLabel: 'Hasil IP Link-Local EUI-64:',
      convert: 'Konversi MAC',
      rdnsTitle: 'Reverse DNS Pointer (Rekor PTR)',
      rdnsPlaceholder: 'Rekor pointer reverse IP untuk lookup DNS',
      plannerTitle: 'Perencana Subnet / Pembagian IPv6',
      divideLabel: 'Target Prefix Subnet',
      viewLabel: 'Jumlah Subnet untuk Ditampilkan',
      generate: 'Buat Tabel Rencana',
      idx: 'Subnet #',
      v6SubnetAddr: 'Prefix / Rentang Subnet',
      usageRec: 'Rekomendasi Penggunaan',
      eduTitle: 'Asisten Edukasi Jaringan IPv6',
      eduQ1: 'Apa arti dari prefix /64?',
      eduA1: 'Prefix /64 adalah ukuran subnet standar untuk Local Area Networks (LAN) di IPv6. Mengalokasikan 64 bit untuk pengenal jaringan dan 64 bit untuk ID antarmuka host. Mendukung 18,4 miliar miliar alamat IP per segmen!',
      eduQ2: 'Berapa banyak subnet yang dapat dibuat dari alokasi korporat?',
      eduA2: 'Jika Anda mendapatkan alokasi /48 dari ISP, Anda dapat membuat 65.536 subnet /64 standar. Jika mendapatkan alokasi /56, Anda dapat membuat 256 subnet /64 standar.',
    },
  }[language];

  const IPV6_REGEX = /^(?:(?:[a-fA-F0-9]{1,4}:){7,7}[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,7}:|(?:[a-fA-F0-9]{1,4}:){1,6}:[a-fA-F0-9]{1,4}|(?:[a-fA-F0-9]{1,4}:){1,5}(?::[a-fA-F0-9]{1,4}){1,2}|(?:[a-fA-F0-9]{1,4}:){1,4}(?::[a-fA-F0-9]{1,4}){1,3}|(?:[a-fA-F0-9]{1,4}:){1,3}(?::[a-fA-F0-9]{1,4}){1,4}|(?:[a-fA-F0-9]{1,4}:){1,2}(?::[a-fA-F0-9]{1,4}){1,5}|[a-fA-F0-9]{1,4}:(?::[a-fA-F0-9]{1,4}){1,6}|:(?::[a-fA-F0-9]{1,4}){1,7}|fe80:(?::[a-fA-F0-9]{1,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[a-fA-F0-9]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  // Parse IPv6 address into array of 8 integers (16-bit blocks)
  const parseIPv6 = (ipStr: string): number[] | null => {
    if (!IPV6_REGEX.test(ipStr)) return null;
    let str = ipStr.toLowerCase();
    
    if (str.includes('::')) {
      const parts = str.split('::');
      const left = parts[0] ? parts[0].split(':') : [];
      const right = parts[1] ? parts[1].split(':') : [];
      const missingCount = 8 - (left.length + right.length);
      const middle = Array(missingCount).fill('0000');
      const blocks = [...left, ...middle, ...right];
      return blocks.map(b => parseInt(b, 16));
    } else {
      const blocks = str.split(':');
      return blocks.map(b => parseInt(b, 16));
    }
  };

  const formatExpandedIPv6 = (blocks: number[]): string => {
    return blocks.map(b => b.toString(16).padStart(4, '0')).join(':');
  };

  const formatCompressedIPv6 = (blocks: number[]): string => {
    const hexBlocks = blocks.map(b => b.toString(16));
    let maxZeroCount = 0;
    let maxZeroStart = -1;
    let currentZeroCount = 0;
    let currentZeroStart = -1;
    
    for (let i = 0; i <= 8; i++) {
      if (i < 8 && hexBlocks[i] === '0') {
        if (currentZeroCount === 0) currentZeroStart = i;
        currentZeroCount++;
      } else {
        if (currentZeroCount > maxZeroCount && currentZeroCount >= 2) {
          maxZeroCount = currentZeroCount;
          maxZeroStart = currentZeroStart;
        }
        currentZeroCount = 0;
      }
    }
    
    if (maxZeroStart !== -1) {
      const left = hexBlocks.slice(0, maxZeroStart).join(':');
      const right = hexBlocks.slice(maxZeroStart + maxZeroCount).join(':');
      return `${left}::${right}`;
    }
    
    return hexBlocks.join(':');
  };

  // Perform Calculations
  const isV6Valid = IPV6_REGEX.test(ip) && !isNaN(prefix) && prefix >= 1 && prefix <= 128;
  const blocks = isV6Valid ? parseIPv6(ip) : null;

  let expanded = '';
  let compressed = '';
  let netPrefixStr = '';
  let rangeStart = '';
  let rangeEnd = '';
  let totalIpCountText = '';
  let scopeClass = 'Global Unicast';
  let rdnsRecord = '';
  let subnetId = '0000';
  let interfaceId = '0000:0000:0000:0000';

  if (isV6Valid && blocks) {
    expanded = formatExpandedIPv6(blocks);
    compressed = formatCompressedIPv6(blocks);

    // Calc Network block prefix
    const netBlocks = Array(8).fill(0);
    const rangeEndBlocks = Array(8).fill(0xFFFF);
    const fullBlocks = Math.floor(prefix / 16);
    const remBits = prefix % 16;
    
    for (let i = 0; i < fullBlocks; i++) {
      netBlocks[i] = blocks[i];
      rangeEndBlocks[i] = blocks[i];
    }
    
    if (fullBlocks < 8) {
      const mask = (0xFFFF0000 >>> remBits) & 0xFFFF;
      netBlocks[fullBlocks] = blocks[fullBlocks] & mask;
      rangeEndBlocks[fullBlocks] = (blocks[fullBlocks] & mask) | (~mask & 0xFFFF);
      for (let i = fullBlocks + 1; i < 8; i++) {
        netBlocks[i] = 0;
        rangeEndBlocks[i] = 0xFFFF;
      }
    }

    netPrefixStr = formatCompressedIPv6(netBlocks) + `/${prefix}`;
    rangeStart = formatCompressedIPv6(netBlocks);
    rangeEnd = formatCompressedIPv6(rangeEndBlocks);

    // Total counts
    const hostBits = 128 - prefix;
    if (hostBits === 0) totalIpCountText = '1';
    else {
      const count = 1n << BigInt(hostBits);
      totalIpCountText = count.toLocaleString(language === 'id' ? 'id-ID' : 'en-US');
    }

    // Subnet ID & Interface ID
    // Standard SLAAC splits 64 network / 64 host. Subnet ID represents block 3 and 4 in /64.
    const expandedHexBlocks = expanded.split(':');
    subnetId = expandedHexBlocks.slice(2, 4).join(':').toUpperCase();
    interfaceId = expandedHexBlocks.slice(4, 8).join(':').toUpperCase();

    // Scope identification
    if (blocks[0] === 0 && blocks[1] === 0 && blocks[2] === 0 && blocks[3] === 0 &&
        blocks[4] === 0 && blocks[5] === 0 && blocks[6] === 0 && blocks[7] === 1) {
      scopeClass = 'Loopback (::1)';
    } else if (blocks[0] === 0 && blocks[1] === 0 && blocks[2] === 0 && blocks[3] === 0 &&
               blocks[4] === 0 && blocks[5] === 0 && blocks[6] === 0 && blocks[7] === 0) {
      scopeClass = 'Unspecified (::)';
    } else if ((blocks[0] & 0xFF00) === 0xFF00) {
      scopeClass = 'Multicast (FF00::/8)';
    } else if ((blocks[0] & 0xFFC0) === 0xFE80) {
      scopeClass = 'Link-Local Unicast (FE80::/10)';
    } else if ((blocks[0] & 0xFE00) === 0xFC00) {
      scopeClass = 'Unique Local Address (ULA) (FC00::/7)';
    } else if (blocks[0] === 0x2001 && blocks[1] === 0x0db8) {
      scopeClass = 'Documentation Address Space (2001:db8::/32)';
    }

    // Reverse DNS (PTR record)
    // Reverse expanded hex characters and append .ip6.arpa
    const rawHex = expanded.replace(/:/g, '');
    const reversedHex = rawHex.split('').reverse().join('.');
    rdnsRecord = reversedHex + '.ip6.arpa';
  }

  useEffect(() => {
    if (isV6Valid) {
      onChange(ip, prefix);
    }
  }, [ip, prefix, isV6Valid, onChange]);

  const handleReset = () => {
    setIp('2001:db8::1');
    setPrefix(64);
    setEui64Result('');
    setV6Subnets([]);
  };

  const handleRandom = () => {
    const item = RANDOM_EXAMPLES[Math.floor(Math.random() * RANDOM_EXAMPLES.length)];
    setIp(item.ip);
    setPrefix(item.prefix);
    triggerToast(language === 'en' ? `Loaded Example: ${item.label}` : `Memuat Contoh: ${item.label}`);
  };

  // MAC to EUI-64 converter
  const handleMacConvert = () => {
    const cleanMac = macAddress.replace(/[:.-]/g, '').toLowerCase();
    if (cleanMac.length !== 12) {
      triggerToast(language === 'en' ? 'Please enter a valid 48-bit MAC address!' : 'Masukkan alamat MAC 48-bit yang valid!');
      return;
    }
    // EUI-64 logic:
    // 1. Insert 'fffe' in the middle of MAC (between octet 3 and 4)
    // MAC: 00:11:22:33:44:55 -> 001122 and 334455 -> 0011:22ff:fe33:4455
    const part1 = cleanMac.slice(0, 6);
    const part2 = cleanMac.slice(6);
    const middleMac = `${part1}fffe${part2}`; // e.g. 001122fffe334455

    // 2. Flip 7th bit of 1st byte (Universal/Local bit)
    // First byte: '00' -> binary '00000000' -> flip 7th bit (0-indexed: bit pos 1 from left, 2^1 pos) -> '02' (binary '00000010')
    const firstByteHex = cleanMac.slice(0, 2);
    let byteVal = parseInt(firstByteHex, 16);
    byteVal = byteVal ^ 2; // XOR with 2 flips the 7th bit (bit 1)
    const newFirstByteHex = byteVal.toString(16).padStart(2, '0');

    const eui64Hex = newFirstByteHex + middleMac.slice(2); // e.g. 021122fffe334455
    
    // Group into 4 hex chunks
    const block1 = eui64Hex.slice(0, 4);
    const block2 = eui64Hex.slice(4, 8);
    const block3 = eui64Hex.slice(8, 12);
    const block4 = eui64Hex.slice(12, 16);
    
    const eui64Ip = `fe80::${block1}:${block2}:${block3}:${block4}`;
    setEui64Result(eui64Ip);
    triggerToast(language === 'en' ? 'Converted EUI-64 Address successfully!' : 'Alamat EUI-64 berhasil dikonversi!');
  };

  // Add offset helper for 128-bit array
  const addIPv6Offset = (blocksArr: number[], offsetHex: string): number[] => {
    const result = [...blocksArr];
    let carry = BigInt("0x" + offsetHex);
    for (let i = 7; i >= 0; i--) {
      const val = BigInt(result[i]) + carry;
      result[i] = Number(val & 0xFFFFn);
      carry = val >> 16n;
    }
    return result;
  };

  // IPv6 Subdivision Planning Table Generator
  const handleGenerateV6 = () => {
    if (!isV6Valid || !blocks) return;
    if (targetPrefix <= prefix) {
      triggerToast(language === 'en' ? 'Target prefix must be smaller block (larger number) than parent prefix!' : 'Prefix target harus memiliki ukuran blok lebih kecil (angka lebih besar) daripada prefix induk!');
      return;
    }

    const netBlocks = Array(8).fill(0);
    const fullBlocks = Math.floor(prefix / 16);
    const remBits = prefix % 16;
    for (let i = 0; i < fullBlocks; i++) {
      netBlocks[i] = blocks[i];
    }
    if (fullBlocks < 8) {
      const mask = (0xFFFF0000 >>> remBits) & 0xFFFF;
      netBlocks[fullBlocks] = blocks[fullBlocks] & mask;
    }

    const diffBits = targetPrefix - prefix;
    const totalPossible = Math.pow(2, diffBits);
    const limit = Math.min(viewCount, totalPossible, 128);

    const subnetsList: any[] = [];
    const bitSize = 128 - targetPrefix;

    for (let i = 0; i < limit; i++) {
      const offsetVal = BigInt(i) << BigInt(bitSize);
      const offsetHex = offsetVal.toString(16);
      const subNetBlocks = addIPv6Offset(netBlocks, offsetHex);
      
      const endOffsetVal = offsetVal + (1n << BigInt(bitSize)) - 1n;
      const endOffsetHex = endOffsetVal.toString(16);
      const subEndBlocks = addIPv6Offset(netBlocks, endOffsetHex);

      let usage = 'Standard LAN Subnet';
      if (targetPrefix === 64) usage = 'Standard LAN Segment (SLAAC Compatible)';
      else if (targetPrefix < 64) usage = 'Routing Aggregation / Core Block';
      else if (targetPrefix > 64) usage = 'Point-to-Point WAN link / Loopbacks';

      subnetsList.push({
        idx: i + 1,
        net: formatCompressedIPv6(subNetBlocks) + `/${targetPrefix}`,
        range: `${formatCompressedIPv6(subNetBlocks)} - ${formatCompressedIPv6(subEndBlocks)}`,
        rec: usage,
      });
    }

    setV6Subnets(subnetsList);
  };

  const copyResultsText = () => {
    const text = `
PIRO IPv6 ANALYSIS REPORT
=========================
IPv6 Address: ${ip}/${prefix}
Expanded: ${expanded}
Compressed: ${compressed}
Network Prefix: ${netPrefixStr}
First Address: ${rangeStart}
Last Address: ${rangeEnd}
Address Scope: ${scopeClass}
Total Address Count: ${totalIpCountText}
Reverse DNS PTR: ${rdnsRecord}
    `.trim();

    navigator.clipboard.writeText(text);
    triggerToast(language === 'en' ? 'IPv6 analysis copied to clipboard!' : 'Hasil analisis IPv6 disalin ke papan klip!');
  };

  return (
    <div className="calculator-grid">
      
      {/* Left parameter card */}
      <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'}`}>
        <h3 className="card-title font-bold text-xl mb-6 flex items-center gap-2">
          <i className="bi bi-sliders2 text-cyan-400"></i> {t.params}
        </h3>

        <div className="form-group mb-4">
          <label className="block text-sm font-semibold mb-2">{t.address}</label>
          <div className="input-container relative">
            <i className="bi bi-globe absolute left-3 top-3 text-gray-500"></i>
            <input
              type="text"
              className={`w-full bg-slate-950/80 border ${isV6Valid ? 'border-gray-800 focus:border-cyan-500' : 'border-red-500'} rounded-xl py-2.5 pl-10 pr-4 outline-none text-white font-mono`}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 2001:db8::1"
            />
          </div>
          {!isV6Valid && <span className="text-red-500 text-xs mt-1 block">{t.errIp}</span>}
        </div>

        <div className="form-group mb-6">
          <label className="block text-sm font-semibold mb-2">{t.prefixLen}</label>
          <div className="input-container relative">
            <i className="bi bi-hash absolute left-3 top-3 text-gray-500"></i>
            <input
              type="number"
              className="w-full bg-slate-950/80 border border-gray-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 outline-none text-white"
              value={prefix}
              min="1"
              max="128"
              onChange={(e) => setPrefix(parseInt(e.target.value, 10) || 64)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => {
              if (isV6Valid) onSaveHistory('ipv6', ip, prefix, 'Manual V6 Calc');
            }}
            disabled={!isV6Valid}
            className="btn-action flex items-center justify-center gap-1.5 bg-slate-900 border border-gray-800 hover:border-cyan-500 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          >
            <Save size={16} /> {t.save}
          </button>
          <button
            onClick={copyResultsText}
            disabled={!isV6Valid}
            className="btn-action flex items-center justify-center gap-1.5 bg-slate-900 border border-gray-800 hover:border-cyan-500 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          >
            <Copy size={16} /> {t.copy}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleRandom}
            className="btn-action flex items-center justify-center gap-1.5 bg-slate-900 border border-gray-800 hover:border-cyan-500 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
          >
            <Shuffle size={16} /> {t.random}
          </button>
          <button
            onClick={handleReset}
            className="btn-action flex items-center justify-center gap-1.5 bg-red-950/40 border border-red-900/60 hover:bg-red-900/40 py-2.5 rounded-xl text-sm font-bold text-red-400 transition-all"
          >
            <RefreshCw size={16} /> {t.reset}
          </button>
        </div>
      </div>

      {/* Right Details Panel */}
      <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'}`}>
        <h3 className="card-title font-bold text-xl mb-6 flex items-center gap-2">
          <i className="bi bi-grid-3x3-gap-fill text-cyan-400"></i> {t.v6Details}
        </h3>

        <div className="details-grid mb-6">
          <div className="detail-item highlight-panel flex justify-between items-center bg-cyan-950/20 border border-cyan-800/40 p-4 rounded-xl">
            <div>
              <span className="detail-label block text-xs uppercase font-bold text-cyan-400">{t.totalIps}</span>
              <span className="highlight-value text-xl sm:text-2xl font-extrabold text-white font-mono" dangerouslySetInnerHTML={{ __html: totalIpCountText }} />
            </div>
            <span className="text-xs text-gray-500 font-mono">2<sup>{128 - prefix}</sup></span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900 col-span-1 sm:col-span-2">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.prefixStr}</span>
            <span className="detail-value text-cyan-400 font-bold font-mono text-lg">{netPrefixStr}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900 col-span-1 sm:col-span-2">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.expanded}</span>
            <span className="detail-value text-white font-bold font-mono text-xs sm:text-sm">{expanded}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900 col-span-1 sm:col-span-2">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.compressed}</span>
            <span className="detail-value text-white font-bold font-mono text-sm sm:text-md">{compressed}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.rangeStart}</span>
            <span className="detail-value text-emerald-400 font-bold font-mono text-sm">{rangeStart}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.rangeEnd}</span>
            <span className="detail-value text-orange-400 font-bold font-mono text-sm">{rangeEnd}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">Subnet ID</span>
            <span className="detail-value text-white font-bold font-mono text-sm">{subnetId}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900 col-span-1 sm:col-span-2">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">Interface ID</span>
            <span className="detail-value text-white font-bold font-mono text-xs sm:text-sm select-all">{interfaceId}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.scope}</span>
            <span className="detail-value text-white font-bold text-sm">{scopeClass}</span>
          </div>
        </div>

        {/* EUI-64 & SLAAC analysis */}
        <div className="ipv6-analysis border-t border-gray-800 pt-6 mb-6">
          <h4 className="detail-label text-xs uppercase font-bold text-gray-400 mb-4 flex items-center gap-1.5">
            <i className="bi bi-shield-check text-cyan-400"></i> {t.analysis}
          </h4>

          {/* SLAAC banner */}
          <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${prefix === 64 ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400' : 'bg-orange-950/20 border-orange-900/60 text-orange-400'}`}>
            <Info size={20} className="shrink-0 mt-0.5" />
            <div className="text-sm">
              <h5 className="font-bold mb-1">{t.slaacTitle}</h5>
              <p>{prefix === 64 ? t.slaacOk : t.slaacWarn}</p>
            </div>
          </div>

          {/* EUI64 Converter */}
          <div className="eui64-box bg-slate-950/60 border border-gray-900 p-4 rounded-xl mb-6">
            <h5 className="text-xs uppercase font-bold text-gray-400 mb-3 flex items-center gap-1.5">
              <i className="bi bi-cpu text-cyan-400"></i> {t.eui64Title}
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end mb-3">
              <div className="form-group col-span-1 sm:col-span-2 mb-0">
                <label className="block text-xs text-gray-500 mb-1">{t.macLabel}</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-gray-800 focus:border-cyan-500 rounded-lg px-3 py-2 outline-none text-white text-sm font-mono"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  placeholder="e.g. 00:11:22:33:44:55"
                />
              </div>
              <button
                onClick={handleMacConvert}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-gray-800 hover:border-cyan-500 rounded-lg text-xs font-bold py-2.5 transition-all h-[38px] flex items-center justify-center gap-1"
              >
                <RefreshCw size={12} /> {t.convert}
              </button>
            </div>

            {eui64Result && (
              <div className="p-3 bg-slate-900 border border-gray-800 rounded-lg text-xs font-mono flex items-center justify-between">
                <div>
                  <span className="text-gray-500 block mb-0.5">{t.eui64ResultLabel}</span>
                  <span className="text-emerald-400 font-bold text-sm select-all">{eui64Result}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(eui64Result);
                    triggerToast(language === 'en' ? 'EUI-64 address copied!' : 'Alamat EUI-64 disalin!');
                  }}
                  className="text-gray-500 hover:text-white"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Reverse DNS ptr */}
          <div className="eui64-box bg-slate-950/60 border border-gray-900 p-4 rounded-xl">
            <h5 className="text-xs uppercase font-bold text-gray-400 mb-2 flex items-center gap-1.5">
              <i className="bi bi-dns text-cyan-400"></i> {t.rdnsTitle}
            </h5>
            <p className="text-xs text-gray-500 mb-3">{t.rdnsPlaceholder}</p>
            <div className="p-3 bg-slate-900 border border-gray-800 rounded-lg text-xs font-mono text-cyan-400 break-all select-all select-none relative group">
              {rdnsRecord}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(rdnsRecord);
                  triggerToast('Reverse DNS PTR record copied!');
                }}
                className="absolute right-3 top-3 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Subnet Planning divider */}
        <div className="subnet-planner border-t border-gray-800 pt-6 mb-6">
          <h4 className="detail-label text-xs uppercase font-bold text-gray-400 mb-4 flex items-center gap-1.5">
            <i className="bi bi-diagram-3 text-cyan-400"></i> {t.plannerTitle}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="form-group">
              <label className="block text-xs text-gray-500 mb-1">{t.divideLabel}</label>
              <select
                className="w-full bg-slate-950/80 border border-gray-900 rounded-xl px-3 py-2 outline-none text-white text-sm"
                value={targetPrefix}
                onChange={(e) => setTargetPrefix(parseInt(e.target.value, 10))}
              >
                {Array.from({ length: 128 }, (_, i) => i + 1)
                  .filter(p => p > prefix)
                  .map(p => (
                    <option key={p} value={p}>/{p} {p === 64 ? '(Standard LAN)' : p === 128 ? '(Single Host)' : ''}</option>
                  ))
                }
              </select>
            </div>

            <div className="form-group">
              <label className="block text-xs text-gray-500 mb-1">{t.viewLabel}</label>
              <input
                type="number"
                className="w-full bg-slate-950/80 border border-gray-900 rounded-xl px-3 py-2 outline-none text-white text-sm"
                value={viewCount}
                min="1"
                max="128"
                onChange={(e) => setViewCount(Math.min(128, Math.max(1, parseInt(e.target.value, 10) || 8)))}
              />
            </div>

            <button
              onClick={handleGenerateV6}
              disabled={!isV6Valid || prefix >= 128}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-bold h-[38px] mt-5 flex items-center justify-center gap-1 shadow-lg shadow-cyan-950/20 disabled:opacity-50"
            >
              <Shuffle size={14} /> {t.generate}
            </button>
          </div>

          {v6Subnets.length > 0 && (
            <div className="v6-table mt-4">
              <div className="table-container max-h-[300px] overflow-y-auto border border-gray-900 rounded-xl bg-slate-950/40">
                <table className="w-full border-collapse text-sm text-left">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-gray-800 text-gray-500">
                      <th className="p-3 font-semibold">{t.idx}</th>
                      <th className="p-3 font-semibold">{t.v6SubnetAddr}</th>
                      <th className="p-3 font-semibold">{t.usageRec}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {v6Subnets.map(sub => (
                      <tr key={sub.idx} className="hover:bg-slate-900/30 font-mono text-xs">
                        <td className="p-3 text-gray-500">{sub.idx}</td>
                        <td className="p-3 text-cyan-400 font-bold">
                          {sub.net}
                          <span className="block text-[10px] text-gray-500 font-normal mt-0.5">{sub.range}</span>
                        </td>
                        <td className="p-3 text-white">{sub.rec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Education helper FAQ */}
        <div className="ipv6-edu border-t border-gray-800 pt-6">
          <h4 className="detail-label text-xs uppercase font-bold text-gray-400 mb-4 flex items-center gap-1.5">
            <i className="bi bi-journal-bookmark text-cyan-400"></i> {t.eduTitle}
          </h4>

          <div className="space-y-4">
            <div className="bg-slate-950/40 border border-gray-900 p-4 rounded-xl">
              <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <HelpCircle size={16} className="text-cyan-400" /> {t.eduQ1}
              </h5>
              <p className="text-xs text-gray-400 leading-relaxed">{t.eduA1}</p>
            </div>

            <div className="bg-slate-950/40 border border-gray-900 p-4 rounded-xl">
              <h5 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <HelpCircle size={16} className="text-cyan-400" /> {t.eduQ2}
              </h5>
              <p className="text-xs text-gray-400 leading-relaxed">{t.eduA2}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
