import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Terminal,
  Send,
  Download,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Radio,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { EmployeePlayer, PayoutTransaction, DogeCoreConfig } from '../types/doge';
import { DogeAddressCard } from './DogeAddressCard';

interface CashOutHubProps {
  gameWalletAddress: string;
  gameWalletBalance: number;
  coreVaultBalance: number;
  employees: EmployeePlayer[];
  transactions: PayoutTransaction[];
  coreConfig: DogeCoreConfig;
  isCoreConnected: boolean;
  onRefresh: () => void;
}

export const CashOutHub: React.FC<CashOutHubProps> = ({
  gameWalletAddress,
  gameWalletBalance,
  coreVaultBalance,
  employees,
  transactions,
  coreConfig,
  isCoreConnected,
  onRefresh,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<EmployeePlayer | null>(employees[0] || null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [broadcastingTxid, setBroadcastingTxid] = useState<string | null>(null);
  const [broadcastResult, setBroadcastResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'employees' | 'game_wallet' | 'how_to_cash_out'>('employees');

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleBroadcastRaw = async (tx: PayoutTransaction) => {
    setBroadcastingTxid(tx.txid);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/doge/broadcast-raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawHex: tx.rawHex, txid: tx.txid }),
      });
      const data = await res.json();
      setBroadcastResult({ txid: tx.txid, data });
    } catch (e: any) {
      setBroadcastResult({ txid: tx.txid, error: e.message });
    } finally {
      setBroadcastingTxid(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'employees'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>8 Employee Wallets ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('game_wallet')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'game_wallet'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Game Vault & Escrow Wallet</span>
        </button>

        <button
          onClick={() => setActiveTab('how_to_cash_out')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
            activeTab === 'how_to_cash_out'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Go Online & Cash Out Guide</span>
        </button>
      </div>

      {/* TAB 1: 8 Employee Wallets */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Player List */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
              Select Employee Wallet
            </h3>
            {employees.map((emp) => {
              const isSelected = selectedPlayer?.id === emp.id;
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedPlayer(emp)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500/60 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                      {emp.name}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      {emp.dogeAddress.slice(0, 10)}...{emp.dogeAddress.slice(-6)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold font-tabular text-amber-400">
                      {emp.balance.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">DOGE</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Player Detailed View, QR & Cashout options */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {selectedPlayer && (
              <>
                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                        Player #{selectedPlayer.playerNumber} Profile
                      </span>
                      <h2 className="text-lg font-bold text-slate-100">{selectedPlayer.name}</h2>
                    </div>
                    <div className="text-right bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Winnings</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold font-tabular text-amber-400">
                          {selectedPlayer.balance.toFixed(2)}
                        </span>
                        <span className="text-xs font-bold text-amber-500">DOGE</span>
                      </div>
                    </div>
                  </div>

                  {/* Scannable Doge Card */}
                  <DogeAddressCard
                    address={selectedPlayer.dogeAddress}
                    label={`${selectedPlayer.name}'s Dogecoin Address`}
                    balance={selectedPlayer.balance}
                    highlight
                  />

                  {/* Quick Terminal Command to Pay from Dogecoin Core 1.14.9 */}
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-amber-400" />
                        Dogecoin Core 1.14.9 Intranet CLI Command
                      </span>
                      <button
                        onClick={() =>
                          copy(
                            `dogecoin-cli sendtoaddress "${selectedPlayer.dogeAddress}" 100.0 "Manual Payout"`,
                            'cli-pay'
                          )
                        }
                        className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedText === 'cli-pay' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedText === 'cli-pay' ? 'Copied' : 'Copy Command'}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-amber-300/90 break-all select-all">
                      dogecoin-cli sendtoaddress "{selectedPlayer.dogeAddress}" 100.0 "Manual Payout"
                    </div>
                  </div>
                </div>

                {/* Player's Transaction Ledger */}
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Winnings & Payout Receipts ({transactions.filter((t) => t.toAddress === selectedPlayer.dogeAddress).length})
                  </h3>

                  {transactions.filter((t) => t.toAddress === selectedPlayer.dogeAddress).length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      No payouts recorded yet for {selectedPlayer.name}. Win a round in the Shootout Arena to receive DOGE!
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {transactions
                        .filter((t) => t.toAddress === selectedPlayer.dogeAddress)
                        .map((tx) => (
                          <div
                            key={tx.txid}
                            className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Round #{tx.roundNumber} Payout: +{tx.amount} DOGE
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                Block #{tx.blockHeight}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                              <span className="truncate max-w-[260px]">TXID: {tx.txid}</span>
                              <button
                                onClick={() => copy(tx.txid, tx.txid)}
                                className="text-amber-400 hover:text-amber-300 transition-colors"
                              >
                                {copiedText === tx.txid ? 'Copied' : 'Copy TXID'}
                              </button>
                            </div>

                            {/* Broadcast button */}
                            <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-mono">
                                Raw Hex: {tx.rawHex.slice(0, 20)}...
                              </span>
                              <button
                                onClick={() => handleBroadcastRaw(tx)}
                                disabled={broadcastingTxid === tx.txid}
                                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              >
                                <Radio className="w-3 h-3" />
                                <span>{broadcastingTxid === tx.txid ? 'Broadcasting...' : 'Broadcast to Mainnet'}</span>
                              </button>
                            </div>

                            {broadcastResult && broadcastResult.txid === tx.txid && (
                              <div className="mt-2 p-2 bg-slate-900 rounded border border-amber-500/30 text-[11px] text-amber-300">
                                <p className="font-semibold mb-1">Broadcast Ready:</p>
                                <p className="text-slate-300">
                                  {broadcastResult.data?.notice || 'Ready for public broadcast when online.'}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Game Vault & Escrow Wallet */}
      {activeTab === 'game_wallet' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Core Node Vault Info */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Dogecoin Core v1.14.9 Intranet Daemon
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-1 mb-3">Mined Core Vault</h3>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-extrabold font-tabular text-amber-400">
                    {coreVaultBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-sm font-bold text-amber-500">DOGE</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Originally mined 9,000 DOGE on the offline intranet node. As players breach targets in the
                  shootout arena, dogecoins are transferred directly to their personal employee wallets.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Node Version: 1.14.9</span>
                <span className="text-emerald-400">Offline Intranet Sync</span>
              </div>
            </div>

            {/* Official Website Game Wallet */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Configured Game Doge Wallet
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-1 mb-3">Escrow & Payout Hub</h3>
              <DogeAddressCard
                address={gameWalletAddress}
                label="Official Game Dogecoin Wallet"
                balance={gameWalletBalance}
                highlight
              />
              <p className="text-xs text-slate-400 mt-3">
                Used to pool, receive, and escrow DOGE both from the Core and participating players.
              </p>
            </div>
          </div>

          {/* Intranet Node Configuration Form */}
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" />
              Dogecoin Core Intranet RPC Bridge Settings
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Configure connection parameters to your intranet Dogecoin Core 1.14.9 daemon (dogecoind).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Daemon Host / IP</label>
                <input
                  type="text"
                  defaultValue={coreConfig.host}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  readOnly
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">RPC Port</label>
                <input
                  type="number"
                  defaultValue={coreConfig.port}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  readOnly
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">RPC Username</label>
                <input
                  type="text"
                  defaultValue={coreConfig.rpcUser}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                  readOnly
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Core Connection Status</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isCoreConnected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-semibold text-slate-200">
                    {isCoreConnected ? 'Connected (Live RPC)' : 'Intranet Offline Mode'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: How to Go Online & Cash Out */}
      {activeTab === 'how_to_cash_out' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Globe className="w-5 h-5" />
              <h2 className="text-base font-bold text-slate-100">
                Guide: How to Cash Out Your Intranet Dogecoin Online
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Step-by-step instructions for employees to transfer their won DOGE from the offline intranet
              environment to public wallets or exchanges (Coinbase, Binance, Kraken, Robinhood) once online.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-3">
                  1
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-1.5">Export Keys or Backup Wallet</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  In your Dogecoin Core 1.14.9 console or intranet terminal, use the command:
                </p>
                <div className="mt-2 p-2 bg-slate-900 rounded font-mono text-[11px] text-amber-300">
                  dogecoin-cli dumpprivkey &lt;YOUR_ADDRESS&gt;
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Or click "Backup Wallet" in the Dogecoin Core GUI menu to save <code>wallet.dat</code> to a
                  USB flash drive.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-3">
                  2
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-1.5">Connect to Online Network</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When the machine or USB is connected to an internet-enabled computer, your Dogecoin Core node
                  will sync with the global Dogecoin blockchain network, or you can import the private key into
                  a mobile app (Exodus, Trust Wallet, Dogecoin Android Wallet, Coinomi).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs mb-3">
                  3
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-1.5">Cash Out to Any Exchange / Bank</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send your DOGE from your imported wallet to your deposit address on Binance, Kraken, or Coinbase,
                  then sell for USD/EUR and transfer to your bank account.
                </p>
              </div>
            </div>
          </div>

          {/* Quick CLI Reference Table */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              Essential Dogecoin Core 1.14.9 Commands for Intranet Administrators
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-900 gap-2">
                <span className="text-amber-300">dogecoin-cli getbalance</span>
                <span className="text-slate-400 text-[11px] font-sans">Check total mined DOGE in the node</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-900 gap-2">
                <span className="text-amber-300">dogecoin-cli getnewaddress "ShootoutBounty"</span>
                <span className="text-slate-400 text-[11px] font-sans">Generate a fresh target address</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-900 gap-2">
                <span className="text-amber-300">dogecoin-cli sendtoaddress &lt;player_addr&gt; &lt;amount&gt;</span>
                <span className="text-slate-400 text-[11px] font-sans">Execute actual on-chain payout to winner</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-900 gap-2">
                <span className="text-amber-300">dogecoin-cli backupwallet "/media/usb/wallet.dat"</span>
                <span className="text-slate-400 text-[11px] font-sans">Export wallet to portable USB for online cash-out</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
