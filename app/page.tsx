'use client';
import { useState } from 'react';

// --- POC CONFIGURATION ---
const DEPLOYED_VAULT = "0x77DbB5eBc222a2B0A9155D3032116Ad227dA7c84";
const APPLE_STOCK_ID = "0196ea6d-b6de-70d5-ae41-9525959ef309";

const PROFILES = {
  VAULT: {
    id: "019d63fa-442d-784a-86ec-35f87dcb2957",
    label: "Smart Vault (Non-Custodial)",
    desc: "Self-Custody via Smart Contract. EIP-1271 Verified.",
    color: "blue",
    tag: "SECURE"
  },
  MANAGED: {
    id: "019d62d3-80d0-783e-825e-d88318280e58",
    label: "Managed Account (Custodial)",
    desc: "Custody delegated to provider. Standard API Auth.",
    color: "zinc",
    tag: "STANDARD"
  }
};

export default function Home() {
  const [activeProfile, setActiveProfile] = useState(PROFILES.VAULT);
  const [accountId, setAccountId] = useState<string>(PROFILES.VAULT.id);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<string>('');

  const updateLog = (data: any) => {
    setLoading('');
    setResponse(data);
  };

  const testConnection = async () => {
    setLoading('Initializing SDK & Auth Check...');
    try {
      const res = await fetch('/api/dinari/permit');
      const data = await res.json();
      updateLog(data);
    } catch (error) {
      updateLog({ error: 'Relayer connection error' });
    }
  };

  const fundAccount = async () => {
    setLoading('Requesting Testnet USD+ Faucet...');
    try {
      const res = await fetch('/api/fund-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      updateLog(data);
    } catch (error) {
      updateLog({ error: 'Faucet Error' });
    }
  };

  const createOrder = async () => {
    setLoading(`Generating EIP-712 Permit for ${activeProfile.tag}...`);
    try {
      const isVaultFlow = activeProfile.id === PROFILES.VAULT.id;
  
      const res = await fetch('/api/dinari/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accountId: accountId,
          isVault: isVaultFlow,
          orderData: {
            stockId: APPLE_STOCK_ID,
            amount: "100.000000000000000000",
            quantity: "1.00",
            price: "150.00",
            paymentToken: DEPLOYED_VAULT
          }
        })
      });
      const data = await res.json();
      updateLog(data);
    } catch (error) {
      updateLog({ error: 'Cryptographic Permit Error' });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-black text-zinc-300 font-mono">
      <div className="max-w-5xl w-full">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tighter italic">RWA // SETTLEMENT_GATEWAY_V2</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] mt-1">Proof of Concept: Smart Vault Integration</p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="text-[9px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              NETWORK: SEPOLIA_TESTNET
            </span>
            <span className="text-[8px] text-zinc-600 uppercase">Latency: --ms</span>
          </div>
        </div>

        {/* Profile Switcher & Context */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <section>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Select Architecture Mode</label>
              <div className="flex flex-col gap-3">
                {Object.values(PROFILES).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProfile(p);
                      setAccountId(p.id);
                      setResponse(null);
                    }}
                    className={`p-4 rounded-lg border text-left transition-all duration-300 ${
                      activeProfile.id === p.id 
                        ? `bg-${p.color}-900/10 border-${p.color}-500/50 ring-1 ring-${p.color}-500/30` 
                        : 'bg-zinc-900/30 border-zinc-800 opacity-40 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-black uppercase ${activeProfile.id === p.id ? `text-${p.color}-400` : 'text-zinc-500'}`}>
                        {p.label}
                      </span>
                      {activeProfile.id === p.id && <span className="text-[8px] animate-pulse">● LIVE</span>}
                    </div>
                    <p className="text-[9px] text-zinc-500 leading-relaxed">{p.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            <section className="pt-4 border-t border-zinc-900">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 block">Execution Actions</label>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={testConnection} className="flex justify-between items-center p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] font-bold text-zinc-400 group transition-all">
                  01. AUTH_CHECK <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button onClick={fundAccount} className="flex justify-between items-center p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-[11px] font-bold text-zinc-400 group transition-all">
                  02. MINT_USD+ <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button onClick={createOrder} className="flex justify-between items-center p-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/40 rounded text-[11px] font-bold text-blue-400 group transition-all">
                  03. GENERATE_PERMIT <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </section>
          </div>

          {/* Terminal & Details */}
          <div className="lg:col-span-8 space-y-4">
            
            <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${activeProfile.id === PROFILES.VAULT.id ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-700'}`}></div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Vault Contract Deployment</span>
                </div>
                <a href={`https://sepolia.etherscan.io/address/${DEPLOYED_VAULT}`} target="_blank" className="text-[9px] text-zinc-600 hover:text-blue-400 underline">Etherscan_Link</a>
              </div>
              <div className="bg-black/50 p-2 rounded font-mono text-[10px] text-zinc-500 flex justify-between items-center border border-zinc-800/50">
                <span className="truncate mr-4">{DEPLOYED_VAULT}</span>
                <span className="text-emerald-900 font-bold shrink-0">EIP-1271_OK</span>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="flex flex-col h-[460px]">
              <div className="bg-zinc-900 rounded-t border-t border-l border-r border-zinc-800 px-4 py-2 flex justify-between items-center">
                <div className="flex gap-4">
                  <span className="text-[9px] font-bold text-zinc-500 tracking-widest uppercase">Console.log</span>
                  <span className="text-[9px] font-mono text-zinc-700">Account: {accountId.slice(0,8)}...</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                </div>
              </div>
              <div className="flex-grow bg-[#050505] p-6 border border-zinc-800 rounded-b font-mono text-[11px] overflow-auto relative scrollbar-hide">
                {loading && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <span className="text-[9px] text-blue-500 uppercase tracking-[0.3em] font-bold">{loading}</span>
                  </div>
                )}
                <pre className="text-blue-400/90 leading-6">
                  {response ? JSON.stringify(response, null, 2) : `// System Architecture PoC Console
                    // Status: Ready
                    // Selected_Mode: ${activeProfile.label}
                    // Target_Asset: AAPL.D (Apple Inc.)

                    Waiting for instruction...`
                  }
                </pre>
              </div>
            </div>

          </div>
        </div>

        <footer className="mt-8 pt-6 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] text-zinc-700 tracking-widest uppercase">
        </footer>
      </div>
    </main>
  );
}