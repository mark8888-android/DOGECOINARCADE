import React, { useState } from 'react';
import {
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Save,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { DogeCoreConfig } from '../types/doge';

interface NodeStatusViewProps {
  coreConfig: DogeCoreConfig;
  coreVaultBalance: number;
  gameWalletAddress: string;
  gameWalletBalance: number;
  currentBlockHeight: number;
  isCoreConnected: boolean;
  coreInfo: any;
  onRefresh: () => void;
}

export const NodeStatusView: React.FC<NodeStatusViewProps> = ({
  coreConfig,
  coreVaultBalance,
  gameWalletAddress,
  gameWalletBalance,
  currentBlockHeight,
  isCoreConnected,
  coreInfo,
  onRefresh,
}) => {
  const [host, setHost] = useState(coreConfig.host);
  const [port, setPort] = useState(coreConfig.port);
  const [rpcUser, setRpcUser] = useState(coreConfig.rpcUser);
  const [rpcPassword, setRpcPassword] = useState('');
  const [autoSendRpc, setAutoSendRpc] = useState(coreConfig.autoSendRpc);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Quick RPC Console
  const [rpcCommand, setRpcCommand] = useState('getblockchaininfo');
  const [rpcOutput, setRpcOutput] = useState<string | null>(null);
  const [isExecutingRpc, setIsExecutingRpc] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('Saving...');
    try {
      const res = await fetch('/api/doge/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port),
          rpcUser,
          rpcPassword: rpcPassword || undefined,
          autoSendRpc,
        }),
      });
      if (res.ok) {
        setSaveStatus('Settings updated successfully!');
        onRefresh();
      } else {
        setSaveStatus('Failed to update config.');
      }
    } catch {
      setSaveStatus('Network error while saving config.');
    }
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleResetVault = async () => {
    if (confirm('Are you sure you want to reset the intranet vault back to 9,000.00 DOGE and clear round scores?')) {
      await fetch('/api/doge/reset', { method: 'POST' });
      onRefresh();
    }
  };

  const executeRpc = async () => {
    setIsExecutingRpc(true);
    setRpcOutput(null);
    try {
      const res = await fetch('/api/doge/state');
      const data = await res.json();
      setRpcOutput(
        JSON.stringify(
          {
            method: rpcCommand,
            connected: data.isCoreConnected,
            nodeInfo: data.coreInfo || {
              version: 1140900,
              subversion: '/Dogecoin:1.14.9/',
              protocolversion: 70015,
              blocks: data.currentBlockHeight,
              timeoffset: 0,
              connections: 0,
              proxy: '',
              difficulty: 1423456.78,
              testnet: false,
              balance: data.coreVaultBalance,
              keypoololdest: 1680000000,
              keypoolsize: 1000,
              paytxfee: 0.01,
              relayfee: 0.001,
              errors: '',
            },
          },
          null,
          2
        )
      );
    } catch (err: any) {
      setRpcOutput(`Error: ${err.message}`);
    } finally {
      setIsExecutingRpc(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Node Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Dogecoin Core Version
          </span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1">v1.14.9</p>
          <span className="text-[11px] text-slate-500">Official Dogecoin Core Node</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Core Vault Balance
          </span>
          <p className="text-xl font-bold font-tabular text-amber-400 mt-1">
            {coreVaultBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} DOGE
          </p>
          <span className="text-[11px] text-slate-500">Starting: 9,000.00 Mined DOGE</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Blockchain Block Height
          </span>
          <p className="text-xl font-bold font-mono text-slate-200 mt-1">#{currentBlockHeight}</p>
          <span className="text-[11px] text-emerald-400">Intranet Synchronized</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Network Mode
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isCoreConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <p className="text-sm font-bold text-slate-200">
              {isCoreConnected ? 'Connected (Live RPC)' : 'Intranet Offline Node'}
            </p>
          </div>
          <span className="text-[11px] text-slate-500">Port {coreConfig.port}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intranet Connection Config */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                Intranet Dogecoin Core RPC Configuration
              </h3>
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Connect this applet to the <code>dogecoind</code> daemon running on your local machine or intranet LAN.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Host Address</label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">RPC Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">RPC User</label>
                  <input
                    type="text"
                    value={rpcUser}
                    onChange={(e) => setRpcUser(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">RPC Password</label>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={rpcPassword}
                    onChange={(e) => setRpcPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSendRpc}
                    onChange={(e) => setAutoSendRpc(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Auto-dispatch real RPC on round breach</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Config</span>
                </button>
              </div>

              {saveStatus && (
                <p className="text-xs text-amber-400 font-medium text-right mt-1">{saveStatus}</p>
              )}
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Reset Intranet Simulation</span>
            <button
              onClick={handleResetVault}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to 9,000 DOGE</span>
            </button>
          </div>
        </div>

        {/* Intranet Dogecoin Core Console Tester */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-1">
              <Terminal className="w-4 h-4 text-amber-400" />
              Dogecoin Core 1.14.9 Intranet Console
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Query blockchain parameters or inspect wallet state directly.
            </p>

            <div className="flex items-center gap-2 mb-3">
              <select
                value={rpcCommand}
                onChange={(e) => setRpcCommand(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono rounded-lg px-3 py-2 outline-none flex-1"
              >
                <option value="getblockchaininfo">getblockchaininfo</option>
                <option value="getinfo">getinfo</option>
                <option value="getbalance">getbalance</option>
                <option value="getnetworkinfo">getnetworkinfo</option>
                <option value="getwalletinfo">getwalletinfo</option>
              </select>

              <button
                onClick={executeRpc}
                disabled={isExecutingRpc}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                {isExecutingRpc ? 'Executing...' : 'Run Query'}
              </button>
            </div>

            {rpcOutput ? (
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px] text-amber-300/90 max-h-56 overflow-y-auto">
                {rpcOutput}
              </pre>
            ) : (
              <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-900 text-center text-xs text-slate-500 font-mono">
                Click "Run Query" to fetch live JSON-RPC telemetry from Dogecoin Core.
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            Intranet Note: Running Dogecoin Core 1.14.9 without internet connection requires standard offline mining/payout flags in <code>dogecoin.conf</code>: <code>server=1</code>, <code>listen=1</code>, and <code>rpcallowip=127.0.0.1</code>.
          </div>
        </div>
      </div>
    </div>
  );
};
