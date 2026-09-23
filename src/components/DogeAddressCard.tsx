import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode as QrIcon, ExternalLink } from 'lucide-react';

interface DogeAddressCardProps {
  address: string;
  label?: string;
  balance?: number;
  highlight?: boolean;
  compact?: boolean;
}

export const DogeAddressCard: React.FC<DogeAddressCardProps> = ({
  address,
  label,
  balance,
  highlight = false,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(`dogecoin:${address}`, {
      width: 220,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#f8fafc',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [address]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
        <span className="font-mono text-amber-400 truncate max-w-[200px]" title={address}>
          {address.slice(0, 8)}...{address.slice(-6)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={copyToClipboard}
            className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
            title="Copy address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
            title="View QR Code"
          >
            <QrIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {showQrModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-sm font-semibold text-slate-200 mb-1">{label || 'Dogecoin Address'}</h4>
              <p className="text-xs font-mono text-amber-400 break-all mb-4 px-2 py-1 bg-slate-950 rounded">
                {address}
              </p>
              {qrDataUrl && (
                <div className="bg-white p-3 rounded-lg inline-block mx-auto mb-4 shadow-md">
                  <img src={qrDataUrl} alt="Dogecoin QR Code" className="w-48 h-48 mx-auto" />
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative p-4 rounded-xl border transition-all ${
        highlight
          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/5'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          {label && <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>}
          {balance !== undefined && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-tabular text-amber-400">
                {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </span>
              <span className="text-xs font-semibold text-amber-500/80">DOGE</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowQrModal(true)}
            className="p-1.5 rounded-md bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title="Scan QR Code"
          >
            <QrIcon className="w-4 h-4" />
          </button>
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded-md bg-slate-800/80 text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title="Copy address"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-300 truncate" title={address}>
          {address}
        </span>
        <button
          onClick={copyToClipboard}
          className="text-xs text-amber-400/80 hover:text-amber-300 whitespace-nowrap shrink-0 transition-colors"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-base font-semibold text-slate-100 mb-1">{label || 'Dogecoin Wallet Address'}</h4>
            <p className="text-xs text-slate-400 mb-3">Scan with Dogecoin Core, mobile wallet, or cash-out exchange</p>
            {qrDataUrl && (
              <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-4 shadow-inner">
                <img src={qrDataUrl} alt="Dogecoin QR Code" className="w-52 h-52 mx-auto" />
              </div>
            )}
            <p className="text-xs font-mono text-amber-400 break-all mb-4 px-3 py-2 bg-slate-950 rounded-lg border border-slate-800">
              {address}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-semibold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Address'}
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
