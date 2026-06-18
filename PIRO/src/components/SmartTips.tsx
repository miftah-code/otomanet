import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

interface SmartTipsProps {
  language: 'en' | 'id';
  type: 'ipv4' | 'ipv6';
  ipAddress: string;
  prefix: number;
}

export const SmartTips: React.FC<SmartTipsProps> = ({ language, type, ipAddress, prefix }) => {
  
  // Translation
  const t = {
    en: {
      title: 'Engineer Insights & Subnet Advice',
      ccna: 'CCNA/CCNP Practical Advice',
      public: 'This is a publicly routable IP address space. Make sure proper firewall access lists (ACLs) are configured to protect this network.',
      private: 'This is a private address space (RFC 1918). It is non-routable on the public internet. Network Address Translation (NAT) or Port Address Translation (PAT) is required on your border gateway/router for this block to access internet resources.',
      loopback: 'This is a loopback address. Typically used to test the TCP/IP network stack on a local machine, or assigned to virtual loopback interfaces on routers (like OSPF/BGP router IDs) because loopback interfaces never go down.',
      apipa: 'This is a Link-Local (APIPA) address. If a computer receives this address automatically, it usually indicates a DHCP failure. The machine auto-configured its own IP but will only be able to communicate with hosts on the same local switch.',
      multicast: 'This belongs to the Multicast address space. Multicast is designed for one-to-many communications (e.g. streaming, routing protocols like OSPF/EIGRP). Ensure IGMP Snooping is enabled on your layer 2 switches to avoid multicast packet flooding.',
      slash30: '💡 A /30 prefix is traditionally used for point-to-point router links (allocated 4 IPs: Network, Router A, Router B, Broadcast). However, modern networks (RFC 3021) prefer using /31 masks to double IP conservation, since broadcast addresses are unnecessary on dedicated point-to-point serial/ethernet links.',
      slash24: '✅ A /24 prefix is the gold standard for standard LAN network segments. It provides a clean boundary (254 usable IPs), is extremely easy to calculate in dotted decimal mask (255.255.255.0), and limits broadcast storm impacts.',
      slash16: '⚠️ Warning: A /16 prefix creates an extremely large broadcast domain (65,534 hosts). Running this as a single flat LAN will result in severe performance degradation due to broadcast traffic (ARP requests, DHCP discovery). You should segment this block into smaller subnets (e.g., /24) and assign them to separate VLANs routed by a Core Switch or Router.',
      v6slash64: '✅ A /64 prefix length is the universally recommended segment size for IPv6 LAN networks. SLAAC (Stateless Address Auto-Configuration) and many core IPv6 standards explicitly require a /64 prefix length to function properly.',
      v6slash48: '💡 A /48 prefix is the standard allocation block for medium-to-large enterprise networks. It allows you to build up to 65,536 standard /64 subnets, giving you complete flexibility for multi-site routing and physical segmentation.',
      v6slash128: '🔁 A /128 prefix represents a single IPv6 host address. Typically used for virtual loopback interfaces on routers or server endpoints.',
      linkLocal: 'This is a Link-Local IPv6 address (fe80::/10). It is automatically self-configured by all IPv6 interfaces for local segment communications and OSPFv3 routing neighbors.',
      ula: 'This is a Unique Local Address (ULA, fc00::/7). Used as a private block within an organization, similar to IPv4 private spaces, and is non-routable on the public internet.',
      v6multicast: 'This is an IPv6 Multicast address (ff00::/8). Multicast replaces traditional IPv4 broadcast domains in IPv6 for essential features like Neighbor Discovery (NDP).',
    },
    id: {
      title: 'Wawasan Insinyur & Rekomendasi Subnet',
      ccna: 'Saran Praktis Kelas CCNA/CCNP',
      public: 'Ini adalah ruang IP publik yang dapat dirutekan di internet. Pastikan daftar kontrol akses (ACL) firewall telah dikonfigurasi dengan benar untuk melindungi jaringan ini.',
      private: 'Ini adalah ruang alamat privat (RFC 1918). Alamat ini tidak dapat dirutekan secara publik di internet. Network Address Translation (NAT) atau PAT diperlukan di router gerbang perbatasan Anda agar blok ini dapat mengakses internet.',
      loopback: 'Ini adalah alamat loopback. Biasanya digunakan untuk menguji tumpukan jaringan TCP/IP lokal, atau ditetapkan ke antarmuka loopback virtual di router (seperti Router ID OSPF/BGP) karena antarmuka ini tidak akan pernah mati.',
      apipa: 'Ini adalah alamat Link-Local (APIPA). Jika perangkat mendapatkan IP ini secara otomatis, itu menandakan kegagalan DHCP Server. Komputer mengonfigurasi IP mandiri tetapi hanya bisa berkomunikasi dengan host di switch lokal yang sama.',
      multicast: 'Alamat ini milik ruang alamat Multicast. Multicast dirancang untuk komunikasi satu-ke-banyak (misal: streaming, protokol routing OSPF/EIGRP). Pastikan IGMP Snooping aktif di switch layer 2 Anda untuk menghindari banjir paket multicast.',
      slash30: '💡 Prefix /30 secara tradisional digunakan untuk link point-to-point antar router (mengalokasikan 4 IP: Jaringan, Router A, Router B, Broadcast). Namun, jaringan modern (RFC 3021) lebih memilih masker /31 untuk menghemat IP, karena IP broadcast tidak diperlukan pada link point-to-point khusus.',
      slash24: '✅ Prefix /24 adalah ukuran standar terbaik untuk segmen jaringan lokal (LAN). Menyediakan batas yang bersih (254 IP usable), sangat mudah dihitung (255.255.255.0), dan membatasi dampak badai siaran (broadcast storms).',
      slash16: '⚠️ Peringatan: Jaringan berukuran /16 membuat domain siaran (broadcast domain) yang sangat besar (65.534 host). Menjalankannya sebagai satu LAN datar akan menurunkan performa jaringan karena beban trafik siaran (ARP, DHCP). Segmentasikan blok ini menjadi subnet yang lebih kecil (misal: /24) dan tetapkan ke VLAN terpisah.',
      v6slash64: '✅ Panjang prefix /64 adalah ukuran segmen standar yang direkomendasikan untuk jaringan LAN IPv6. Fitur SLAAC (Stateless Address Auto-Configuration) dan banyak standar inti IPv6 membutuhkan prefix /64 agar dapat berfungsi dengan benar.',
      v6slash48: '💡 Prefix /48 adalah blok alokasi standar untuk jaringan perusahaan menengah hingga besar. Memungkinkan Anda membuat hingga 65.536 subnet /64 standar, memberi Anda fleksibilitas penuh untuk routing multi-lokasi.',
      v6slash128: '🔁 Ukuran prefix /128 mewakili satu alamat host IPv6 tunggal. Biasanya digunakan untuk antarmuka loopback virtual di router atau titik akhir server.',
      linkLocal: 'Ini adalah alamat Link-Local IPv6 (fe80::/10). Dikonfigurasi otomatis oleh semua antarmuka IPv6 untuk komunikasi segmen lokal dan hubungan ketetanggaan OSPFv3.',
      ula: 'Ini adalah Alamat Lokal Unik (ULA, fc00::/7). Digunakan sebagai blok privat dalam organisasi, setara dengan ruang privat IPv4, dan tidak dapat dirutekan di internet publik.',
      v6multicast: 'Ini adalah alamat Multicast IPv6 (ff00::/8). Multicast menggantikan domain broadcast tradisional IPv4 di IPv6 untuk fitur penting seperti Neighbor Discovery (NDP).',
    },
  }[language];

  // Logic to determine which tips to render
  let tips: { type: 'info' | 'warning' | 'success' | 'shield'; text: string }[] = [];

  if (type === 'ipv4') {
    const parts = ipAddress.split('.');
    const octet1 = parseInt(parts[0], 10) || 0;
    const octet2 = parseInt(parts[1], 10) || 0;

    // Private address spaces (RFC 1918)
    const isPrivate = octet1 === 10 || 
                      (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || 
                      (octet1 === 192 && octet2 === 168);
    const isLoopback = octet1 === 127;
    const isApipa = octet1 === 169 && octet2 === 254;
    const isMulticast = octet1 >= 224 && octet1 <= 239;

    // Push base scopes
    if (isPrivate) tips.push({ type: 'shield', text: t.private });
    else if (isLoopback) tips.push({ type: 'info', text: t.loopback });
    else if (isApipa) tips.push({ type: 'warning', text: t.apipa });
    else if (isMulticast) tips.push({ type: 'info', text: t.multicast });
    else if (octet1 > 0 && octet1 < 224) tips.push({ type: 'success', text: t.public });

    // Push mask scopes
    if (prefix <= 16) tips.push({ type: 'warning', text: t.slash16 });
    else if (prefix === 24) tips.push({ type: 'success', text: t.slash24 });
    else if (prefix === 30) tips.push({ type: 'info', text: t.slash30 });

  } else {
    // IPv6
    const cleanIp = ipAddress.toLowerCase();
    const isLoopback = cleanIp === '::1' || cleanIp.startsWith('0000:0000:0000:0000:0000:0000:0000:0001');
    const isLinkLocal = cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb');
    const isUla = cleanIp.startsWith('fc') || cleanIp.startsWith('fd');
    const isMulticast = cleanIp.startsWith('ff');

    if (isLoopback) tips.push({ type: 'info', text: t.v6slash128 });
    if (isLinkLocal) tips.push({ type: 'shield', text: t.linkLocal });
    if (isUla) tips.push({ type: 'shield', text: t.ula });
    if (isMulticast) tips.push({ type: 'info', text: t.v6multicast });
    
    if (prefix === 64) tips.push({ type: 'success', text: t.v6slash64 });
    else if (prefix === 48) tips.push({ type: 'info', text: t.v6slash48 });
    else if (prefix === 128) tips.push({ type: 'info', text: t.v6slash128 });
  }

  if (tips.length === 0) return null;

  return (
    <div className="smart-tips mt-8 animate-fade-in">
      <div className="bg-slate-950/40 border border-gray-900 rounded-2xl p-6 backdrop-blur-md">
        <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="text-yellow-400 shrink-0" size={20} />
          {t.title}
        </h4>

        <div className="space-y-4">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex gap-3 text-sm leading-relaxed items-start text-gray-300">
              {tip.type === 'warning' && <AlertTriangle size={18} className="text-orange-400 shrink-0 mt-0.5" />}
              {tip.type === 'success' && <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
              {tip.type === 'shield' && <Shield size={18} className="text-cyan-400 shrink-0 mt-0.5" />}
              {tip.type === 'info' && <Lightbulb size={18} className="text-blue-400 shrink-0 mt-0.5" />}
              <p>{tip.text}</p>
            </div>
          ))}
        </div>

        {/* Cisco/Juniper insight panel */}
        <div className="insight-panel bg-slate-950/60 border border-gray-900/60 p-4 rounded-xl mt-5 text-xs text-gray-500 font-mono">
          <span className="text-cyan-400 font-bold block mb-1 uppercase tracking-wider">{t.ccna}</span>
          {type === 'ipv4' ? (
            <p>
              # Cisco IOS Subnet Command Example:<br />
              (config-if)# ip address {ipAddress} 255.255.255.0<br />
              (config-router)# network {ipAddress} 0.0.0.255 area 0 (OSPF Wildcard usage)
            </p>
          ) : (
            <p>
              # Cisco IOS IPv6 SLAAC config:<br />
              (config-if)# ipv6 address {ipAddress}/64<br />
              (config-if)# ipv6 nd other-config-flag (Instruct DHCPv6 for DNS)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
