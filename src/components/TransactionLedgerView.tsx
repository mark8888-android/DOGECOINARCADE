import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { PayoutTransaction } from '../types/doge';

interface TransactionLedgerViewProps {
  transactions: PayoutTransaction[];
  currentBlockHeight: number;
}

export const TransactionLedgerView: React.FC<TransactionLedgerViewProps> = ({
  transactions,
  currentBlockHeight,
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = transactions.filter(
    (tx) =>
      tx.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      tx.toAddress.toLowerCase().includes(search.toLowerCase()) ||
      tx.txid.toLowerCase().includes(search.toLowerCase()) ||
      String(tx.roundNumber).includes(search)
  );

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dogecoin-intranet-ledger-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">Dogecoin Intranet Blockchain Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified payouts dispatched from Dogecoin Core 1.14.9 to employee winners. Current Block #{currentBlockHeight}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipient, address, TXID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg w-64 outline-none focus:border-amber-500/50"
            />
          </div>

          <button
            onClick={exportJSON}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-slate-900">
          No transactions match your search filter or no shootout rounds have concluded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Round</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Doge Address</th>
                <th className="py-3 px-4 text-right">Bounty Won</th>
                <th className="py-3 px-4">Block Height</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.map((tx) => (
                <tr key={tx.txid} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-200 font-sans">
                    #{tx.roundNumber}
                  </td>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                    {tx.recipientName}
                  </td>
                  <td className="py-3 px-4 text-amber-300 truncate max-w-[160px]" title={tx.toAddress}>
                    {tx.toAddress.slice(0, 8)}...{tx.toAddress.slice(-6)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-tabular text-amber-400 font-sans">
                    +{tx.amount.toFixed(2)} DOGE
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    #{tx.blockHeight}
                  </td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[160px]" title={tx.txid}>
                    {tx.txid.slice(0, 10)}...{tx.txid.slice(-6)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => copy(tx.txid, tx.txid)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-sans font-medium transition-colors"
                    >
                      {copiedId === tx.txid ? 'Copied' : 'Copy TXID'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
