import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Wallet,
  FileText,
  Globe,
  Server,
  Zap,
  RefreshCw,
  Coins,
  ShieldCheck,
  Award,
  Users,
} from 'lucide-react';
import { DogeStateResponse, EmployeePlayer, PayoutTransaction } from './types/doge';
import { ShootoutArena } from './components/ShootoutArena';
import { CashOutHub } from './components/CashOutHub';
import { TransactionLedgerView } from './components/TransactionLedgerView';
import { NodeStatusView } from './components/NodeStatusView';
import { DogeAddressCard } from './components/DogeAddressCard';

export default function App() {
  const [activeTab, setActiveTab] = useState<'arena' | 'wallets' | 'ledger' | 'cashout' | 'nodestatus'>('arena');
  const [state, setState] = useState<DogeStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentWinnerAlert, setRecentWinnerAlert] = useState<{ name: string; amount: number } | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch('/api/doge/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Failed to load Doge state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
    // Poll every 5 seconds to stay in sync with background intranet events
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePayoutComplete = (payoutData: any) => {
    if (payoutData?.player && payoutData?.tx) {
      setRecentWinnerAlert({
        name: payoutData.player.name,
        amount: payoutData.tx.amount,
      });
      setTimeout(() => setRecentWinnerAlert(null), 6000);
    }
    fetchState();
  };

  if (loading && !state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono">Synchronizing with Dogecoin Core 1.14.9 Intranet Node...</p>
      </div>
    );
  }

  const coreVault = state?.coreVaultBalance ?? 9000;
  const gameWallet = state?.gameWalletAddress ?? 'DByArToqzT2MH8eZDRFSKmshNLzUucFwpr';
  const gameBalance = state?.gameWalletBalance ?? 0;
  const employees = state?.employees ?? [];
  const ledger = state?.transactionLedger ?? [];
  const blockHeight = state?.currentBlockHeight ?? 4850234;
  const isConnected = state?.isCoreConnected ?? false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Universal Top Bar Contract: Zone 1 (Brand) - Zone 2 (4-6 links) - Zone 3 (1-2 primary actions) */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => setActiveTab('arena')}
          className="text-base font-bold tracking-tight text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Coins className="w-4 h-4" />
          </div>
          <span>DOGECOIN ARENA</span>
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('arena')}
            className={`transition-colors hover:text-slate-100 pb-0.5 ${
              activeTab === 'arena' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : ''
            }`}
          >
            Shootout Arena
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`transition-colors hover:text-slate-100 pb-0.5 ${
              activeTab === 'wallets' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : ''
            }`}
          >
            Employee Wallets (8)
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`transition-colors hover:text-slate-100 pb-0.5 ${
              activeTab === 'ledger' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : ''
            }`}
          >
            Blockchain Ledger
          </button>
          <button
            onClick={() => setActiveTab('cashout')}
            className={`transition-colors hover:text-slate-100 pb-0.5 ${
              activeTab === 'cashout' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : ''
            }`}
          >
            Cash Out & Online Sync
          </button>
          <button
            onClick={() => setActiveTab('nodestatus')}
            className={`transition-colors hover:text-slate-100 pb-0.5 ${
              activeTab === 'nodestatus' ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : ''
            }`}
          >
            Core Node v1.14.9
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <div className="flex items-baseline gap-1 text-xs">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Vault:</span>
              <span className="font-bold font-tabular text-amber-400">
                {coreVault.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-amber-500 font-bold">DOGE</span>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('arena');
              fetchState();
            }}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-amber-500/20"
          >
            Play Round
          </button>
        </div>
      </header>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-900/90 border-b border-slate-800 px-2 py-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('arena')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'arena' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          Arena
        </button>
        <button
          onClick={() => setActiveTab('wallets')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'wallets' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          8 Wallets
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'ledger' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          Ledger
        </button>
        <button
          onClick={() => setActiveTab('cashout')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'cashout' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          Cash Out
        </button>
        <button
          onClick={() => setActiveTab('nodestatus')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'nodestatus' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
          }`}
        >
          Node
        </button>
      </div>

      {/* Floating Winner Toast Notification */}
      {recentWinnerAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border-2 border-amber-500 rounded-xl p-4 shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Jackpot Dispatched!</p>
            <p className="text-sm font-semibold text-slate-100">
              {recentWinnerAlert.name} received +{recentWinnerAlert.amount} DOGE
            </p>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        {/* Intranet Banner & Context Header */}
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                100% Offline Intranet Arena
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400 font-mono">Dogecoin Core v1.14.9</span>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-100">
              Mined 9,000 DOGE Intranet Giveaway & Target Shootout
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Connects to your offline Dogecoin Core node. Spawns random target addresses with 5 - 1,000 DOGE
              bounties. Up to 4 active employee stations compete simultaneously to breach the Core and win the bounty!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Game Escrow Wallet</p>
              <p className="font-mono text-xs text-amber-400" title={gameWallet}>
                {gameWallet.slice(0, 8)}...{gameWallet.slice(-6)}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('wallets')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>Wallets</span>
            </button>
          </div>
        </div>

        {/* View Routing */}
        {activeTab === 'arena' && (
          <ShootoutArena
            employees={employees}
            coreVaultBalance={coreVault}
            gameWalletAddress={gameWallet}
            isCoreConnected={isConnected}
            onPayoutComplete={handlePayoutComplete}
            onRefreshState={fetchState}
          />
        )}

        {(activeTab === 'wallets' || activeTab === 'cashout') && (
          <CashOutHub
            gameWalletAddress={gameWallet}
            gameWalletBalance={gameBalance}
            coreVaultBalance={coreVault}
            employees={employees}
            transactions={ledger}
            coreConfig={
              state?.coreConfig ?? {
                host: '127.0.0.1',
                port: 22555,
                rpcUser: 'dogerpc',
                network: 'mainnet',
                autoSendRpc: false,
              }
            }
            isCoreConnected={isConnected}
            onRefresh={fetchState}
          />
        )}

        {activeTab === 'ledger' && (
          <TransactionLedgerView
            transactions={ledger}
            currentBlockHeight={blockHeight}
          />
        )}

        {activeTab === 'nodestatus' && (
          <NodeStatusView
            coreConfig={
              state?.coreConfig ?? {
                host: '127.0.0.1',
                port: 22555,
                rpcUser: 'dogerpc',
                network: 'mainnet',
                autoSendRpc: false,
              }
            }
            coreVaultBalance={coreVault}
            gameWalletAddress={gameWallet}
            gameWalletBalance={gameBalance}
            currentBlockHeight={blockHeight}
            isCoreConnected={isConnected}
            coreInfo={state?.coreInfo}
            onRefresh={fetchState}
          />
        )}
      </main>

      {/* Quiet, clean footer in accordance with guidelines */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 px-4 md:px-8 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>Dogecoin Core 1.14.9 Intranet Shootout</span>
          <span>·</span>
          <span>Offline Intranet Environment</span>
          <span>·</span>
          <span className="font-mono text-amber-500/80">Vault: {coreVault} DOGE</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <button onClick={() => setActiveTab('arena')} className="hover:text-amber-400 transition-colors">
            Play Game
          </button>
          <button onClick={() => setActiveTab('cashout')} className="hover:text-amber-400 transition-colors">
            Cash Out Guide
          </button>
          <button onClick={() => setActiveTab('nodestatus')} className="hover:text-amber-400 transition-colors">
            Node RPC
          </button>
        </div>
      </footer>
    </div>
  );
}
