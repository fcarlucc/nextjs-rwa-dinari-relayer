'use client';
import { useState } from 'react';

// PoC Configuration
const VAULT_ADDRESS = "0x6233C94F2f6c0d73575335994F4ddEDa12B936FC";
const APPLE_STOCK_ID = "0196ea6d-b6de-70d5-ae41-9525959ef309";

// Profile configuration
type ProfileType = 'self-managed' | 'managed';

interface Profile {
  id: ProfileType;
  label: string;
  emoji: string;
  color: 'blue' | 'green';
  accountId: string;
  vaultAddress?: string;
  isVault: boolean;
  description: string;
}

interface HomeClientProps {
  accountIdSelfManaged: string;
  accountIdManaged: string;
}

export default function HomeClient({ accountIdSelfManaged, accountIdManaged }: HomeClientProps) {
  const PROFILES: Record<ProfileType, Profile> = {
    'self-managed': {
      id: 'self-managed',
      label: 'SELF-MANAGED',
      emoji: '🔐',
      color: 'blue',
      accountId: accountIdSelfManaged,
      vaultAddress: VAULT_ADDRESS,
      isVault: true,
      description: 'EIP-712 with Vault'
    },
    'managed': {
      id: 'managed',
      label: 'MANAGED',
      emoji: '💳',
      color: 'green',
      accountId: accountIdManaged,
      isVault: false,
      description: 'Direct API, no Vault'
    }
  };

  const [activeProfile, setActiveProfile] = useState<ProfileType>('self-managed');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState<string>('');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('100.00');
  const [checkOrderId, setCheckOrderId] = useState('');

  // Active profile shorthand
  const profile = PROFILES[activeProfile];
  const { accountId, isVault, color } = profile;

  const log = (data: any) => {
    setLoading('');
    setResponse(data);
  };

  // Color mapping for buttons
  const colorClasses = {
    blue: {
      primary: 'bg-blue-600 hover:bg-blue-500',
      secondary: 'bg-blue-700 hover:bg-blue-600'
    },
    green: {
      primary: 'bg-green-600 hover:bg-green-500',
      secondary: 'bg-green-700 hover:bg-green-600'
    }
  };

  const testAuth = async () => {
    setLoading('Testing SDK authentication...');
    try {
      const res = await fetch('/api/dinari/permit');
      const data = await res.json();
      log(data);
    } catch (error: any) {
      log({ error: error.message });
    }
  };

  const mintTokens = async () => {
    setLoading(`Minting 1000 USD+ for ${profile.label} account...`);
    try {
      const res = await fetch('/api/fund-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      log(data);
    } catch (error: any) {
      log({ error: error.message });
    }
  };

  const checkPortfolio = async () => {
    setLoading(`Checking portfolio and balances (${profile.label})...`);
    try {
      const res = await fetch('/api/dinari/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      log(data);
    } catch (error: any) {
      log({ error: error.message });
    }
  };

  const placeOrder = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      log({ error: 'Invalid amount' });
      return;
    }

    const flowLabel = isVault ? 'EIP-712 (3-STEP)' : 'Direct API';
    setLoading(`Executing ${orderType} order via ${flowLabel} (${profile.label})...`);
    try {
      const res = await fetch('/api/dinari/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          isVault,
          orderData: {
            orderSide: orderType,
            stockId: APPLE_STOCK_ID,
            amount: orderType === 'BUY' ? amount : "1.00",
            quantity: orderType === 'SELL' ? amount : "0.5",
            price: "150.00",
            paymentToken: "0x665b099132d79739462DfDe6874126AFe840F7a3",
            recipientAccountId: accountId
          }
        })
      });
      const data = await res.json();
      log(data);
    } catch (error: any) {
      log({ error: error.message });
    }
  };

  const listOrders = async () => {
    setLoading(`Fetching all orders (${profile.label})...`);
    try {
      const res = await fetch(`/api/dinari/orders/${accountId}`);
      const data = await res.json();
      log(data);
    } catch (error: any) {
      log({ error: error.message });
    }
  };

  const checkOrderStatus = async () => {
    if (!checkOrderId.trim()) {
      log({ error: 'Please enter an Order ID' });
      return;
    }
    setLoading(`Fetching order ${checkOrderId}...`);
    try {
      const res = await fetch('/api/dinari/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, orderId: checkOrderId })
      });
      const data = await res.json();
      log(data);
    } catch (error: any) {
      log({ error: error.message });
    }
  };

  const awaitOrder = async () => {
    if (!checkOrderId.trim()) {
      log({ error: 'Please enter an Order ID' });
      return;
    }
    setLoading(`Polling order ${checkOrderId} (up to 30 sec)...`);
    try {
      const res = await fetch('/api/dinari/order-await', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, orderId: checkOrderId })
      });
      const data = await res.json();
      log(data);
    } catch (error: any) {
      log({ error: error.message });
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-2xl font-bold mb-2">RWA Settlement PoC V2</h1>
          <p className="text-zinc-500 text-sm">Dinari Permit Flow - Dual Account Testing (DRY Refactored)</p>
          
          {/* Profile Selector */}
          <div className="mt-4 space-y-4">
            <p className="text-xs text-zinc-400">Select Active Profile:</p>
            <div className="flex gap-2">
              {Object.values(PROFILES).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProfile(p.id)}
                  className={`flex-1 px-4 py-3 rounded transition text-sm font-semibold border-2 ${
                    activeProfile === p.id
                      ? `border-${p.color}-500 bg-${p.color}-900/50 text-white`
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {p.emoji} {p.label}
                  <br />
                  <span className="text-xs text-zinc-500">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Profile Info */}
          <div className={`mt-4 p-3 rounded border border-${color}-700/50 bg-${color}-900/30`}>
            <p className={`text-${color}-300 font-semibold mb-1`}>{profile.emoji} {profile.label} - {profile.description}</p>
            {profile.vaultAddress && (
              <p className="text-xs text-zinc-500">Vault: <code className="bg-zinc-900 px-2 py-1 rounded">{profile.vaultAddress}</code></p>
            )}
            <p className="text-xs text-zinc-500">Account: <code className="bg-zinc-900 px-2 py-1 rounded">{accountId}</code></p>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Controls */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Order Type</label>
              <div className="flex gap-2">
                {(['BUY', 'SELL'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`flex-1 px-3 py-2 text-sm rounded transition ${
                      orderType === type
                        ? 'bg-yellow-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Amount {orderType === 'BUY' ? '(USD+)' : '(Shares)'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white focus:border-yellow-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={testAuth}
                disabled={loading !== ''}
                className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition disabled:opacity-50"
              >
                1. Check Auth
              </button>
              
              <button
                onClick={mintTokens}
                disabled={loading !== ''}
                className={`w-full px-4 py-2 rounded text-sm font-semibold transition disabled:opacity-50 text-white ${colorClasses[color].secondary}`}
              >
                2. Mint USD+ ({profile.label})
              </button>

              <button
                onClick={checkPortfolio}
                disabled={loading !== ''}
                className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition disabled:opacity-50"
              >
                3. Check Portfolio
              </button>

              <button
                onClick={placeOrder}
                disabled={loading !== ''}
                className={`w-full px-4 py-2 rounded text-sm font-bold transition disabled:opacity-50 text-white ${colorClasses[color].primary}`}
              >
                4. Execute {orderType} Order
                <br />
                <span className="text-xs">({isVault ? 'EIP-712 3-STEP' : 'Direct API'})</span>
              </button>

              <div className="border-t border-zinc-700 pt-4 mt-4">
                <button
                  onClick={listOrders}
                  disabled={loading !== ''}
                  className={`w-full px-4 py-2 rounded text-sm transition disabled:opacity-50 text-white ${colorClasses[color].secondary}`}
                >
                  5. List Orders
                </button>
              </div>

              <div className="space-y-2 mt-4">
                <input
                  type="text"
                  placeholder="Order ID"
                  value={checkOrderId}
                  onChange={(e) => setCheckOrderId(e.target.value)}
                  disabled={loading !== ''}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white text-sm focus:border-yellow-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={checkOrderStatus}
                  disabled={loading !== ''}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-sm transition disabled:opacity-50"
                >
                  Check Order Status
                </button>
                <button
                  onClick={awaitOrder}
                  disabled={loading !== ''}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition disabled:opacity-50"
                >
                  Wait For Order (30s)
                </button>
              </div>
            </div>
          </div>

          {/* Log Output */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 h-96 overflow-auto">
              {loading && (
                <div className="flex items-center gap-2 text-yellow-400 mb-4">
                  <span className="animate-spin">⟳</span>
                  <span className="text-sm">{loading}</span>
                </div>
              )}
              {response && (
                <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
              {!response && (
                <p className="text-zinc-600 text-sm">No response yet. Click buttons above to start.</p>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="border-t border-zinc-800 pt-6 text-xs text-zinc-600">
          <p>This PoC demonstrates DRY principles with a single interface adapting to profile selection.</p>
        </div>
      </div>
    </main>
  );
}
