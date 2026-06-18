import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Shuffle, Save, Download, Plus, Trash2 } from 'lucide-react';

interface IPv4CalculatorProps {
  language: 'en' | 'id';
  theme: 'dark' | 'light';
  onSaveHistory: (type: 'ipv4' | 'ipv6', address: string, prefix: number, label?: string) => void;
  triggerToast: (msg: string) => void;
  onChange: (ip: string, prefix: number) => void;
}

const RANDOM_EXAMPLES = [
  { ip: '10.0.0.1', cidr: 8, label: 'Enterprise Backbone' },
  { ip: '172.16.50.25', cidr: 16, label: 'Corporate Office' },
  { ip: '192.168.1.100', cidr: 24, label: 'Home LAN' },
  { ip: '192.168.10.12', cidr: 27, label: 'Meraki Segment' },
  { ip: '10.254.0.5', cidr: 30, label: 'WAN Point-to-Point' },
  { ip: '192.0.2.1', cidr: 24, label: 'Documentation Address' },
];

export const IPv4Calculator: React.FC<IPv4CalculatorProps> = ({
  language,
  theme,
  onSaveHistory,
  triggerToast,
  onChange,
}) => {
  const [ip, setIp] = useState('192.168.10.12');
  const [cidr, setCidr] = useState(27);
  const [maskInput, setMaskInput] = useState('255.255.255.224');

  // VLSM State
  const [vlsmRequirements, setVlsmRequirements] = useState<{ id: string; name: string; size: number }[]>([
    { id: '1', name: 'Sales Department', size: 50 },
    { id: '2', name: 'Marketing Dept', size: 20 },
    { id: '3', name: 'Server LAN', size: 10 },
    { id: '4', name: 'Router P2P Link', size: 2 },
  ]);
  const [vlsmResults, setVlsmResults] = useState<any[]>([]);

  // Subnet Divider State
  const [divideType, setDivideType] = useState<'subnets' | 'hosts'>('subnets');
  const [divideValue, setDivideValue] = useState(4);
  const [dividedSubnets, setDividedSubnets] = useState<any[]>([]);

  // Translation Dictionaries
  const t = {
    en: {
      params: 'IPv4 Parameters',
      address: 'IP Address',
      cidr: 'CIDR Prefix',
      mask: 'Subnet Mask',
      errIp: 'Please enter a valid IPv4 address (e.g. 192.168.1.1)',
      calculate: 'Calculate',
      reset: 'Reset',
      random: 'Random Example',
      save: 'Save to History',
      copy: 'Copy Result',
      netInfo: 'Network Information',
      totalHosts: 'Total Hosts',
      usableHosts: 'Usable Hosts',
      wildcard: 'Wildcard Mask (Cisco)',
      netAddr: 'Network Address',
      broadcast: 'Broadcast Address',
      usableRange: 'Usable IP Range',
      binaryTitle: 'Binary Representation',
      ipBinary: 'IP Address Binary',
      maskBinary: 'Subnet Mask Binary',
      ipClass: 'Network Class & Info',
      hex: 'Hexadecimal Address',
      addrType: 'Address Designation',
      divisionTitle: 'Subnet Subdivision Generator',
      divideBy: 'Divide By',
      numSubnets: 'Number of Subnets',
      hostsReq: 'Hosts Requirement',
      generate: 'Generate Subnets',
      sub: 'Subnet',
      hosts: 'Hosts',
      exportCsv: 'Export CSV',
      print: 'Print Report',
      vlsmTitle: 'VLSM Helper (Variable Length Subnet Mask)',
      vlsmAdd: 'Add Requirement',
      vlsmName: 'Subnet / Segment Name',
      vlsmSize: 'Hosts Needed',
      vlsmResultTable: 'Optimal VLSM Allocation',
      emptyVlsm: 'Add segments above and calculate VLSM.',
      networkPortion: 'Network Bits',
      hostPortion: 'Host Bits',
    },
    id: {
      params: 'Parameter IPv4',
      address: 'Alamat IP',
      cidr: 'Prefix CIDR',
      mask: 'Subnet Mask',
      errIp: 'Masukkan alamat IPv4 yang valid (misal: 192.168.1.1)',
      calculate: 'Hitung',
      reset: 'Reset',
      random: 'Contoh Acak',
      save: 'Simpan ke Riwayat',
      copy: 'Salin Hasil',
      netInfo: 'Informasi Jaringan',
      totalHosts: 'Total Host',
      usableHosts: 'Usable Host',
      wildcard: 'Wildcard Mask (Cisco)',
      netAddr: 'Alamat Jaringan (Net ID)',
      broadcast: 'Alamat Broadcast',
      usableRange: 'Rentang IP Usable',
      binaryTitle: 'Representasi Biner',
      ipBinary: 'Biner Alamat IP',
      maskBinary: 'Biner Subnet Mask',
      ipClass: 'Kelas Jaringan & Info',
      hex: 'Alamat Heksadesimal',
      addrType: 'Tipe/Destinasi Alamat',
      divisionTitle: 'Generator Sub-Jaringan',
      divideBy: 'Bagi Berdasarkan',
      numSubnets: 'Jumlah Subnet',
      hostsReq: 'Kebutuhan Host',
      generate: 'Buat Subnet',
      sub: 'Subnet',
      hosts: 'Host',
      exportCsv: 'Ekspor CSV',
      print: 'Cetak Laporan',
      vlsmTitle: 'Asisten VLSM (Variable Length Subnet Mask)',
      vlsmAdd: 'Tambah Kebutuhan',
      vlsmName: 'Nama Segmen / Subnet',
      vlsmSize: 'Jumlah Host',
      vlsmResultTable: 'Alokasi VLSM Optimal',
      emptyVlsm: 'Tambahkan segmen di atas dan hitung VLSM.',
      networkPortion: 'Bit Network',
      hostPortion: 'Bit Host',
    },
  }[language];

  const IPV4_REGEX = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // Helper conversions
  const ip2long = (ipStr: string): number => {
    const parts = ipStr.split('.');
    return ((parseInt(parts[0], 10) << 24) +
            (parseInt(parts[1], 10) << 16) +
            (parseInt(parts[2], 10) << 8) +
            parseInt(parts[3], 10)) >>> 0;
  };

  const long2ip = (ipLong: number): string => {
    return [
      (ipLong >>> 24) & 255,
      (ipLong >>> 16) & 255,
      (ipLong >>> 8) & 255,
      ipLong & 255
    ].join('.');
  };

  const cidr2mask = (c: number): number => {
    return c === 0 ? 0 : (0xFFFFFFFF << (32 - c)) >>> 0;
  };

  const mask2cidr = (maskStr: string): number => {
    if (!IPV4_REGEX.test(maskStr)) return 24;
    const l = ip2long(maskStr);
    let count = 0;
    for (let i = 31; i >= 0; i--) {
      if (((l >>> i) & 1) === 1) count++;
      else break;
    }
    return count;
  };

  // Perform Calculations
  const validIp = IPV4_REGEX.test(ip);
  const ipLong = validIp ? ip2long(ip) : 0;
  const maskLong = cidr2mask(cidr);
  const wildcardLong = ~maskLong >>> 0;
  const networkLong = (ipLong & maskLong) >>> 0;
  const broadcastLong = (networkLong | wildcardLong) >>> 0;

  const totalHosts = Math.pow(2, 32 - cidr);
  let usableHosts = 0;
  let rangeStart = '';
  let rangeEnd = '';

  if (cidr === 32) {
    usableHosts = 1;
    rangeStart = long2ip(networkLong);
    rangeEnd = long2ip(networkLong);
  } else if (cidr === 31) {
    usableHosts = 2;
    rangeStart = long2ip(networkLong);
    rangeEnd = long2ip(broadcastLong);
  } else {
    usableHosts = totalHosts - 2;
    rangeStart = long2ip(networkLong + 1);
    rangeEnd = long2ip(broadcastLong - 1);
  }

  // Address scopes
  const octet1 = (ipLong >>> 24) & 255;
  const octet2 = (ipLong >>> 16) & 255;
  let ipClass = 'C';
  if (octet1 >= 1 && octet1 <= 126) ipClass = 'A';
  else if (octet1 === 127) ipClass = 'Loopback';
  else if (octet1 >= 128 && octet1 <= 191) ipClass = 'B';
  else if (octet1 >= 192 && octet1 <= 223) ipClass = 'C';
  else if (octet1 >= 224 && octet1 <= 239) ipClass = 'D (Multicast)';
  else if (octet1 >= 240) ipClass = 'E (Experimental)';

  let designation = 'Public Routable';
  if (octet1 === 10) designation = 'Private Network (RFC 1918)';
  else if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) designation = 'Private Network (RFC 1918)';
  else if (octet1 === 192 && octet2 === 168) designation = 'Private Network (RFC 1918)';
  else if (octet1 === 127) designation = 'Loopback Link-Local';
  else if (octet1 === 169 && octet2 === 254) designation = 'APIPA (Link-Local)';
  else if (octet1 >= 224 && octet1 <= 239) designation = 'Multicast Domain';

  const hexRepresentation = '0x' + (ipLong >>> 0).toString(16).toUpperCase().padStart(8, '0');

  // Sync mask input on cidr change
  useEffect(() => {
    setMaskInput(long2ip(cidr2mask(cidr)));
  }, [cidr]);

  // Handle manual mask input change
  const handleMaskChange = (val: string) => {
    setMaskInput(val);
    if (IPV4_REGEX.test(val)) {
      const computedCidr = mask2cidr(val);
      setCidr(computedCidr);
    }
  };

  const handleReset = () => {
    setIp('192.168.10.12');
    setCidr(27);
    setMaskInput('255.255.255.224');
    setDividedSubnets([]);
    setVlsmResults([]);
  };

  useEffect(() => {
    if (validIp) {
      onChange(ip, cidr);
    }
  }, [ip, cidr, validIp, onChange]);

  const handleRandom = () => {
    const item = RANDOM_EXAMPLES[Math.floor(Math.random() * RANDOM_EXAMPLES.length)];
    setIp(item.ip);
    setCidr(item.cidr);
    triggerToast(language === 'en' ? `Loaded Example: ${item.label}` : `Memuat Contoh: ${item.label}`);
  };

  // Binary array formatting
  const getBinaryString = (val: number) => {
    return (val >>> 0).toString(2).padStart(32, '0');
  };

  const ipBin = getBinaryString(ipLong);
  const maskBin = getBinaryString(maskLong);

  // Subnet Divider Calculations
  const handleGenerateSubnets = () => {
    if (!validIp) return;
    let computedCidr = cidr;
    let subnetsList: any[] = [];

    if (divideType === 'subnets') {
      const k = Math.ceil(Math.log2(divideValue));
      computedCidr = cidr + k;
      if (computedCidr > 32) {
        triggerToast(language === 'en' ? 'Subdivision exceeds address boundary!' : 'Pembagian melampaui batas alamat!');
        return;
      }
      const count = Math.min(divideValue, Math.pow(2, k));
      const size = Math.pow(2, 32 - computedCidr);

      for (let i = 0; i < count; i++) {
        const subNetLong = (networkLong + i * size) >>> 0;
        const subBroadcastLong = (subNetLong + size - 1) >>> 0;
        let rStart = long2ip(subNetLong + 1);
        let rEnd = long2ip(subBroadcastLong - 1);
        if (computedCidr === 32) {
          rStart = long2ip(subNetLong);
          rEnd = long2ip(subNetLong);
        } else if (computedCidr === 31) {
          rStart = long2ip(subNetLong);
          rEnd = long2ip(subBroadcastLong);
        }
        subnetsList.push({
          idx: i + 1,
          net: long2ip(subNetLong),
          start: rStart,
          end: rEnd,
          broadcast: long2ip(subBroadcastLong),
          cidr: computedCidr,
          hosts: computedCidr === 32 ? 1 : computedCidr === 31 ? 2 : size - 2,
        });
      }
    } else {
      let p = Math.ceil(Math.log2(divideValue + 2));
      if (divideValue === 1) p = 1;
      computedCidr = 32 - p;

      if (computedCidr <= cidr) {
        triggerToast(language === 'en' ? 'Host requirement too large for parent block!' : 'Kebutuhan host terlalu besar untuk block induk!');
        return;
      }

      const size = Math.pow(2, p);
      const possibleCount = Math.pow(2, computedCidr - cidr);
      const displayCount = Math.min(possibleCount, 512);

      for (let i = 0; i < displayCount; i++) {
        const subNetLong = (networkLong + i * size) >>> 0;
        const subBroadcastLong = (subNetLong + size - 1) >>> 0;
        let rStart = long2ip(subNetLong + 1);
        let rEnd = long2ip(subBroadcastLong - 1);
        if (computedCidr === 32) {
          rStart = long2ip(subNetLong);
          rEnd = long2ip(subNetLong);
        } else if (computedCidr === 31) {
          rStart = long2ip(subNetLong);
          rEnd = long2ip(subBroadcastLong);
        }
        subnetsList.push({
          idx: i + 1,
          net: long2ip(subNetLong),
          start: rStart,
          end: rEnd,
          broadcast: long2ip(subBroadcastLong),
          cidr: computedCidr,
          hosts: computedCidr === 32 ? 1 : computedCidr === 31 ? 2 : size - 2,
        });
      }
    }
    setDividedSubnets(subnetsList);
  };

  // VLSM Core Calculation Engine
  const calculateVlsm = () => {
    if (!validIp) return;
    // 1. Sort requirements in descending order of size
    const sortedReqs = [...vlsmRequirements]
      .filter(r => r.size > 0)
      .sort((a, b) => b.size - a.size);

    if (sortedReqs.length === 0) return;

    let currentOffset = networkLong;
    const allocations: any[] = [];
    let fits = true;

    for (const req of sortedReqs) {
      // Usable hosts requirement H -> block size needs to fit network + broadcast + hosts
      // Block size must be a power of 2, 2^p >= H + 2 (for subnets <= /30)
      let p = Math.ceil(Math.log2(req.size + 2));
      if (req.size === 1) p = 1;
      const subnetCidr = 32 - p;
      const subnetSize = Math.pow(2, p);

      // Align currentOffset to the subnet block boundary (next multiple of subnetSize)
      if (currentOffset % subnetSize !== 0) {
        currentOffset = (Math.ceil(currentOffset / subnetSize) * subnetSize) >>> 0;
      }

      const subnetNet = currentOffset;
      const subnetBroadcast = (subnetNet + subnetSize - 1) >>> 0;

      // Check if exceeds boundary of original prefix
      if (subnetBroadcast > broadcastLong) {
        fits = false;
        break;
      }

      allocations.push({
        name: req.name,
        size: req.size,
        net: long2ip(subnetNet),
        mask: long2ip(cidr2mask(subnetCidr)),
        cidr: subnetCidr,
        start: long2ip(subnetNet + 1),
        end: long2ip(subnetBroadcast - 1),
        broadcast: long2ip(subnetBroadcast),
        allocatedHosts: subnetCidr === 32 ? 1 : subnetCidr === 31 ? 2 : subnetSize - 2,
      });

      currentOffset = (subnetBroadcast + 1) >>> 0;
    }

    if (!fits) {
      triggerToast(language === 'en' ? 'VLSM exceeds bounds of parent block!' : 'VLSM melampaui batas blok induk!');
      setVlsmResults([]);
    } else {
      setVlsmResults(allocations);
    }
  };

  // Export Subnets list to CSV
  const exportToCsv = () => {
    if (dividedSubnets.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Subnet #,Network Address,First Usable,Last Usable,Broadcast,CIDR,Usable Hosts\n';
    
    dividedSubnets.forEach(sub => {
      csvContent += `${sub.idx},${sub.net},${sub.start},${sub.end},${sub.broadcast},/${sub.cidr},${sub.hosts}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `piro_ipv4_subnets_${ip}_${cidr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyResultsText = () => {
    const text = `
PIRO IPv4 ANALYSIS REPORT
=========================
IP Address: ${ip}/${cidr}
Network Address: ${long2ip(networkLong)}
Broadcast Address: ${long2ip(broadcastLong)}
Subnet Mask: ${long2ip(maskLong)}
Wildcard Mask: ${long2ip(wildcardLong)}
Usable Range: ${rangeStart} - ${rangeEnd}
Total Usable Hosts: ${usableHosts.toLocaleString()}
Network Class: ${ipClass}
Designation: ${designation}
Hex Value: ${hexRepresentation}
    `.trim();

    navigator.clipboard.writeText(text);
    triggerToast(language === 'en' ? 'Calculation copied to clipboard!' : 'Hasil kalkulasi disalin ke papan klip!');
  };

  return (
    <div className="calculator-grid">
      
      {/* Left Input card */}
      <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'}`}>
        <h3 className="card-title font-bold text-xl mb-6 flex items-center gap-2">
          <i className="bi bi-sliders2 text-cyan-400"></i> {t.params}
        </h3>

        <div className="form-group mb-4">
          <label className="block text-sm font-semibold mb-2">{t.address}</label>
          <div className="input-container relative">
            <i className="bi bi-pc-display absolute left-3 top-3 text-gray-500"></i>
            <input
              type="text"
              className={`w-full bg-slate-950/80 border ${validIp ? 'border-gray-800 focus:border-cyan-500' : 'border-red-500'} rounded-xl py-2.5 pl-10 pr-4 outline-none text-white`}
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="e.g. 192.168.1.1"
            />
          </div>
          {!validIp && <span className="text-red-500 text-xs mt-1 block">{t.errIp}</span>}
        </div>

        <div className="form-group mb-4">
          <label className="block text-sm font-semibold mb-2">{t.cidr}</label>
          <div className="input-container relative">
            <i className="bi bi-hash absolute left-3 top-3 text-gray-500"></i>
            <select
              className="w-full bg-slate-950/80 border border-gray-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 outline-none text-white"
              value={cidr}
              onChange={(e) => setCidr(parseInt(e.target.value, 10))}
            >
              {Array.from({ length: 32 }, (_, i) => 32 - i).map((c) => (
                <option key={c} value={c}>
                  /{c} {c === 24 ? '(Class C)' : c === 16 ? '(Class B)' : c === 8 ? '(Class A)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group mb-6">
          <label className="block text-sm font-semibold mb-2">{t.mask}</label>
          <div className="input-container relative">
            <i className="bi bi-shield-check absolute left-3 top-3 text-gray-500"></i>
            <input
              type="text"
              className="w-full bg-slate-950/80 border border-gray-800 focus:border-cyan-500 rounded-xl py-2.5 pl-10 pr-4 outline-none text-white"
              value={maskInput}
              onChange={(e) => handleMaskChange(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => {
              if (validIp) onSaveHistory('ipv4', ip, cidr, 'Manual V4 Calc');
            }}
            disabled={!validIp}
            className="btn-action flex items-center justify-center gap-1.5 bg-slate-900 border border-gray-800 hover:border-cyan-500 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          >
            <Save size={16} /> {t.save}
          </button>
          <button
            onClick={copyResultsText}
            disabled={!validIp}
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

      {/* Right details panel */}
      <div className={`glass-card ${theme === 'dark' ? 'glass-effect-dark' : 'glass-effect-light'}`}>
        <h3 className="card-title font-bold text-xl mb-6 flex items-center gap-2">
          <i className="bi bi-grid-3x3-gap-fill text-cyan-400"></i> {t.netInfo}
        </h3>

        <div className="details-grid mb-6">
          
          <div className="detail-item highlight-panel flex justify-between items-center bg-cyan-950/20 border border-cyan-800/40 p-4 rounded-xl">
            <div>
              <span className="detail-label block text-xs uppercase font-bold text-cyan-400">{t.usableHosts}</span>
              <span className="highlight-value text-3xl font-extrabold text-white font-mono">{usableHosts.toLocaleString()}</span>
            </div>
            <span className="text-xs text-gray-500 font-mono">2<sup>{32 - cidr}</sup> - {cidr <= 30 ? 2 : 0}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.netAddr}</span>
            <span className="detail-value text-white font-bold font-mono text-lg">{long2ip(networkLong)}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.broadcast}</span>
            <span className="detail-value text-white font-bold font-mono text-lg">{long2ip(broadcastLong)}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900 col-span-1 sm:col-span-2">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.usableRange}</span>
            <span className="detail-value text-cyan-400 font-bold font-mono text-lg">{rangeStart} — {rangeEnd}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.mask}</span>
            <span className="detail-value text-white font-bold font-mono text-lg">{long2ip(maskLong)}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.wildcard}</span>
            <span className="detail-value text-white font-bold font-mono text-lg">{long2ip(wildcardLong)}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.ipClass}</span>
            <span className="detail-value text-white font-bold text-md">{ipClass}</span>
          </div>

          <div className="detail-item bg-slate-950/40 p-4 rounded-xl border border-gray-900">
            <span className="detail-label block text-xs uppercase text-gray-400 font-semibold mb-1">{t.addrType}</span>
            <span className="detail-value text-white font-bold text-md">{designation}</span>
          </div>

        </div>

        {/* Binary Breakdown matrix */}
        <div className="binary-matrix-container border-t border-gray-800 pt-6 mb-6">
          <h4 className="detail-label text-xs uppercase font-bold text-gray-400 mb-4 flex items-center gap-1.5">
            <i className="bi bi-cpu text-cyan-400"></i> {t.binaryTitle}
          </h4>

          <div className="binary-row bg-slate-950/60 border border-gray-900/60 p-4 rounded-xl mb-3">
            <div className="binary-row-header flex justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>{t.ipBinary}</span>
              <span className="font-mono">{ip}</span>
            </div>
            <div className="binary-bits-grid flex flex-wrap gap-2 font-mono">
              {Array.from({ length: 4 }).map((_, oIdx) => (
                <div key={oIdx} className="binary-octet flex gap-0.5 bg-slate-900/50 border border-gray-800 px-2 py-1 rounded-lg">
                  {Array.from({ length: 8 }).map((__, bIdx) => {
                    const bPos = oIdx * 8 + bIdx;
                    const isNet = bPos < cidr;
                    return (
                      <span key={bIdx} className={`text-md font-extrabold w-3 text-center ${isNet ? 'text-cyan-400' : 'text-emerald-400'}`}>
                        {ipBin[bPos]}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="binary-row bg-slate-950/60 border border-gray-900/60 p-4 rounded-xl">
            <div className="binary-row-header flex justify-between text-xs text-gray-500 font-semibold mb-2">
              <span>{t.maskBinary}</span>
              <span className="font-mono">{long2ip(maskLong)}</span>
            </div>
            <div className="binary-bits-grid flex flex-wrap gap-2 font-mono">
              {Array.from({ length: 4 }).map((_, oIdx) => (
                <div key={oIdx} className="binary-octet flex gap-0.5 bg-slate-900/50 border border-gray-800 px-2 py-1 rounded-lg">
                  {Array.from({ length: 8 }).map((__, bIdx) => {
                    const bPos = oIdx * 8 + bIdx;
                    const isNet = bPos < cidr;
                    return (
                      <span key={bIdx} className={`text-md font-extrabold w-3 text-center ${isNet ? 'text-cyan-400' : 'text-emerald-400'}`}>
                        {maskBin[bPos]}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Color Indicators */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded"></span> {t.networkPortion}
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded"></span> {t.hostPortion}
            </div>
          </div>
        </div>

        {/* Subnet subdivision generator */}
        <div className="subnet-division border-t border-gray-800 pt-6 mb-6">
          <h4 className="detail-label text-xs uppercase font-bold text-gray-400 mb-4 flex items-center gap-1.5">
            <i className="bi bi-diagram-3 text-cyan-400"></i> {t.divisionTitle}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="form-group">
              <label className="block text-xs text-gray-500 mb-1">{t.divideBy}</label>
              <select
                className="w-full bg-slate-950/80 border border-gray-900 rounded-xl px-3 py-2 outline-none text-white text-sm"
                value={divideType}
                onChange={(e: any) => setDivideType(e.target.value)}
              >
                <option value="subnets">{t.numSubnets}</option>
                <option value="hosts">{t.hostsReq}</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="block text-xs text-gray-500 mb-1">
                {divideType === 'subnets' ? t.numSubnets : t.hostsReq}
              </label>
              <input
                type="number"
                className="w-full bg-slate-950/80 border border-gray-900 rounded-xl px-3 py-2 outline-none text-white text-sm"
                value={divideValue}
                min="1"
                onChange={(e) => setDivideValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>

            <button
              onClick={handleGenerateSubnets}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-sm font-bold h-[38px] mt-5 flex items-center justify-center gap-1 shadow-lg shadow-cyan-950/20"
            >
              <Shuffle size={14} /> {t.generate}
            </button>
          </div>

          {dividedSubnets.length > 0 && (
            <div className="table-wrapper mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">{dividedSubnets.length} subnets generated.</span>
                <button
                  onClick={exportToCsv}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                >
                  <Download size={12} /> {t.exportCsv}
                </button>
              </div>

              <div className="table-container max-h-[300px] overflow-y-auto border border-gray-900 rounded-xl bg-slate-950/40">
                <table className="w-full border-collapse text-sm text-left">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-gray-800 text-gray-500">
                      <th className="p-3 font-semibold">{t.sub} #</th>
                      <th className="p-3 font-semibold">{t.netAddr}</th>
                      <th className="p-3 font-semibold">{t.usableRange}</th>
                      <th className="p-3 font-semibold">{t.broadcast}</th>
                      <th className="p-3 font-semibold">CIDR</th>
                      <th className="p-3 font-semibold">{t.hosts}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {dividedSubnets.map((sub) => (
                      <tr key={sub.idx} className="hover:bg-slate-900/30 font-mono">
                        <td className="p-3 text-gray-500">{sub.idx}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{sub.net}</td>
                        <td className="p-3 text-white text-xs">{sub.start} - {sub.end}</td>
                        <td className="p-3 text-orange-400">{sub.broadcast}</td>
                        <td className="p-3 text-cyan-400">/{sub.cidr}</td>
                        <td className="p-3 text-white font-bold">{sub.hosts.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* VLSM Helper Section */}
        <div className="vlsm-helper border-t border-gray-800 pt-6">
          <h4 className="detail-label text-xs uppercase font-bold text-gray-400 mb-4 flex items-center gap-1.5">
            <i className="bi bi-bezier2 text-cyan-400"></i> {t.vlsmTitle}
          </h4>

          {/* Reqs creator */}
          <div className="vlsm-inputs max-h-[200px] overflow-y-auto border border-gray-900/60 p-4 rounded-xl mb-4 bg-slate-950/20">
            {vlsmRequirements.map((req, idx) => (
              <div key={req.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 items-center bg-slate-950/60 p-2.5 rounded-lg border border-gray-900">
                <input
                  type="text"
                  placeholder={t.vlsmName}
                  className="bg-transparent text-sm border-b border-gray-900 focus:border-cyan-500 outline-none text-white px-1"
                  value={req.name}
                  onChange={(e) => {
                    const newReqs = [...vlsmRequirements];
                    newReqs[idx].name = e.target.value;
                    setVlsmRequirements(newReqs);
                  }}
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder={t.vlsmSize}
                    className="bg-transparent text-sm border-b border-gray-900 focus:border-cyan-500 outline-none text-white px-1 w-full"
                    value={req.size}
                    onChange={(e) => {
                      const newReqs = [...vlsmRequirements];
                      newReqs[idx].size = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setVlsmRequirements(newReqs);
                    }}
                  />
                  <span className="text-xs text-gray-500 font-mono">hosts</span>
                </div>
                <button
                  onClick={() => {
                    setVlsmRequirements(vlsmRequirements.filter(r => r.id !== req.id));
                  }}
                  className="text-red-400 hover:text-red-300 text-xs flex justify-end gap-1 font-bold items-center ml-auto"
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                setVlsmRequirements([
                  ...vlsmRequirements,
                  { id: Date.now().toString(), name: `Subnet ${vlsmRequirements.length + 1}`, size: 10 },
                ]);
              }}
              className="text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center gap-1 mt-2"
            >
              <Plus size={14} /> {t.vlsmAdd}
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={calculateVlsm}
              className="w-full bg-slate-900 border border-gray-800 hover:border-cyan-500 text-white rounded-xl text-sm font-bold py-2 flex items-center justify-center gap-1 transition-all"
            >
              <Shuffle size={14} /> {language === 'en' ? 'Calculate VLSM' : 'Hitung VLSM'}
            </button>
          </div>

          {vlsmResults.length > 0 && (
            <div className="vlsm-results mt-4">
              <h5 className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wide">{t.vlsmResultTable}</h5>
              <div className="table-container max-h-[300px] overflow-y-auto border border-gray-900 rounded-xl bg-slate-950/40">
                <table className="w-full border-collapse text-sm text-left">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-gray-800 text-gray-500">
                      <th className="p-3 font-semibold">Segment</th>
                      <th className="p-3 font-semibold">{t.netAddr}</th>
                      <th className="p-3 font-semibold">Usable Range</th>
                      <th className="p-3 font-semibold">Broadcast</th>
                      <th className="p-3 font-semibold">CIDR</th>
                      <th className="p-3 font-semibold">Req/Alloc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-900">
                    {vlsmResults.map((sub, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/30 font-mono text-xs">
                        <td className="p-3 text-cyan-400 font-bold">{sub.name}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{sub.net}</td>
                        <td className="p-3 text-white">{sub.start} - {sub.end}</td>
                        <td className="p-3 text-orange-400">{sub.broadcast}</td>
                        <td className="p-3 text-cyan-400">/{sub.cidr}</td>
                        <td className="p-3 text-white font-bold">{sub.size} / {sub.allocatedHosts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
