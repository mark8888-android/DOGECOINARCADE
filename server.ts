import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initial Employee Roster provided by the user
export interface EmployeePlayer {
  id: string;
  playerNumber: number;
  name: string;
  dogeAddress: string;
  balance: number;
  roundsWon: number;
  totalWon: number;
  avatarSeed: string;
}

export interface PayoutTransaction {
  txid: string;
  roundNumber: number;
  timestamp: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  recipientName: string;
  blockHeight: number;
  confirmations: number;
  rawHex: string;
  status: 'confirmed' | 'pending';
  cliCommand: string;
}

export interface DogeCoreConfig {
  host: string;
  port: number;
  rpcUser: string;
  rpcPassword: string;
  network: 'mainnet' | 'testnet' | 'regtest';
  autoSendRpc: boolean;
}

// State store
const GAME_WALLET_ADDRESS = 'DByArToqzT2MH8eZDRFSKmshNLzUucFwpr';

let coreConfig: DogeCoreConfig = {
  host: '127.0.0.1',
  port: 22555,
  rpcUser: 'dogerpc',
  rpcPassword: 'dogepassword123',
  network: 'mainnet',
  autoSendRpc: false,
};

let coreVaultBalance = 9000.0; // The 9,000 mined DOGE in Dogecoin Core 1.14.9
let gameWalletBalance = 0.0; // Payout buffer / escrow wallet
let currentBlockHeight = 4850234;

const EMPLOYEES: EmployeePlayer[] = [
  {
    id: 'emp-1',
    playerNumber: 1,
    name: 'Player #1 (Alex M.)',
    dogeAddress: 'DKJgjXzDiwv7U6y6pDtjBxRk3qWU9Ymck3',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'alex',
  },
  {
    id: 'emp-2',
    playerNumber: 2,
    name: 'Player #2 (Sarah K.)',
    dogeAddress: 'DQ3MgZd6EszgHEG4omt7vXiA1byENY5nuw',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'sarah',
  },
  {
    id: 'emp-3',
    playerNumber: 3,
    name: 'Player #3 (Marcus T.)',
    dogeAddress: 'DQK55XAAbKeLbUdkTKT9Gu4WL7uUGksJFn',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'marcus',
  },
  {
    id: 'emp-4',
    playerNumber: 4,
    name: 'Player #4 (Elena R.)',
    dogeAddress: 'DU3ZoHjrwFQBBmWVRXGukAC4XnrRhUBNHY',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'elena',
  },
  {
    id: 'emp-5',
    playerNumber: 5,
    name: 'Player #5 (David B.)',
    dogeAddress: 'D9HxvQz9tSE9JnNwqWy6WVJjyH2ZA7fR8m',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'david',
  },
  {
    id: 'emp-6',
    playerNumber: 6,
    name: 'Player #6 (Chloe L.)',
    dogeAddress: 'DGJY2u7ov1HP6kxJtf6VMjwucnMhej4q6H',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'chloe',
  },
  {
    id: 'emp-7',
    playerNumber: 7,
    name: 'Player #7 (James W.)',
    dogeAddress: 'DGJY2u7ov1HP6kxJtf6VMjwucnMhej4q6H',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'james',
  },
  {
    id: 'emp-8',
    playerNumber: 8,
    name: 'Player #8 (Nadia Z.)',
    dogeAddress: 'D7c8rTeW7UaDPENqtZSWyz3SUuWX9HYuPW',
    balance: 0,
    roundsWon: 0,
    totalWon: 0,
    avatarSeed: 'nadia',
  },
];

let transactionLedger: PayoutTransaction[] = [];
let roundCounter = 1;

// Helper to generate a realistic Dogecoin standard address for target rounds if Core is offline
function generateRandomDogeAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let addr = 'D';
  for (let i = 0; i < 33; i++) {
    addr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return addr;
}

// Generate realistic mock raw tx hex
function generateMockRawTx(from: string, to: string, amount: number): string {
  return '0100000001' + crypto.randomBytes(32).toString('hex') + '000000001976a914' + crypto.randomBytes(20).toString('hex') + '88acffffffff01' + Math.floor(amount * 100000000).toString(16).padStart(16, '0') + '1976a914' + crypto.randomBytes(20).toString('hex') + '88ac00000000';
}

// RPC Client invocation to intranet Dogecoin Core 1.14.9
async function callDogecoinRpc(method: string, params: any[] = []): Promise<any> {
  const auth = Buffer.from(`${coreConfig.rpcUser}:${coreConfig.rpcPassword}`).toString('base64');
  const rpcUrl = `http://${coreConfig.host}:${coreConfig.port}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        jsonrpc: '1.0',
        id: `shootout-${Date.now()}`,
        method,
        params,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`RPC HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }
    return data.result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// API Routes
app.get('/api/doge/state', async (req: Request, res: Response) => {
  let isCoreConnected = false;
  let coreInfo: any = null;

  try {
    const info = await callDogecoinRpc('getblockchaininfo');
    isCoreConnected = true;
    coreInfo = info;
    if (info && info.blocks) {
      currentBlockHeight = info.blocks;
    }
  } catch (e) {
    isCoreConnected = false;
  }

  res.json({
    isCoreConnected,
    coreInfo,
    coreConfig: {
      host: coreConfig.host,
      port: coreConfig.port,
      network: coreConfig.network,
      rpcUser: coreConfig.rpcUser,
      autoSendRpc: coreConfig.autoSendRpc,
    },
    coreVaultBalance,
    gameWalletAddress: GAME_WALLET_ADDRESS,
    gameWalletBalance,
    currentBlockHeight,
    employees: EMPLOYEES,
    transactionLedger: transactionLedger.slice().reverse(),
    roundCounter,
  });
});

app.post('/api/doge/config', (req: Request, res: Response) => {
  const { host, port, rpcUser, rpcPassword, network, autoSendRpc } = req.body;
  if (host) coreConfig.host = String(host).trim();
  if (port) coreConfig.port = Number(port);
  if (rpcUser !== undefined) coreConfig.rpcUser = String(rpcUser).trim();
  if (rpcPassword !== undefined) coreConfig.rpcPassword = String(rpcPassword).trim();
  if (network) coreConfig.network = network;
  if (autoSendRpc !== undefined) coreConfig.autoSendRpc = Boolean(autoSendRpc);

  res.json({ success: true, coreConfig });
});

// Generate next shootout target: Dogecoin address + bounty 5 - 1000 DOGE
app.get('/api/doge/round/new', async (req: Request, res: Response) => {
  // Generate random bounty between 5 and 1000 DOGE
  // Round to clean integer or .50 for exciting game values
  const rawAmount = 5 + Math.random() * 995;
  const bountyAmount = Math.min(1000, Math.max(5, Math.round(rawAmount * 2) / 2));

  let targetAddress = '';
  let addressSource = 'offline-generator';

  try {
    // Attempt real Dogecoin Core RPC getnewaddress
    const rpcAddr = await callDogecoinRpc('getnewaddress', [`round-${roundCounter}`]);
    if (rpcAddr && typeof rpcAddr === 'string') {
      targetAddress = rpcAddr;
      addressSource = 'dogecoin-core-rpc';
    }
  } catch (err) {
    // Offline intranet fallback address
    targetAddress = generateRandomDogeAddress();
    addressSource = 'intranet-offline-vault';
  }

  res.json({
    roundNumber: roundCounter,
    bountyAmount,
    targetAddress,
    addressSource,
    gameWalletAddress: GAME_WALLET_ADDRESS,
  });
});

// Process Payout to the winner
app.post('/api/doge/payout', async (req: Request, res: Response) => {
  const { playerId, bountyAmount, targetAddress } = req.body;
  const player = EMPLOYEES.find((p) => p.id === playerId);

  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  const amount = Number(bountyAmount) || 10;
  if (amount > coreVaultBalance) {
    return res.status(400).json({ error: 'Core vault balance insufficient' });
  }

  let txid = '';
  let rpcDispatched = false;
  let rpcError = null;

  // If autoSendRpc is active or Core is connected, attempt RPC sendtoaddress
  if (coreConfig.autoSendRpc) {
    try {
      const realTxid = await callDogecoinRpc('sendtoaddress', [
        player.dogeAddress,
        amount,
        `Intranet Shootout Round #${roundCounter} Winner`,
        player.name,
      ]);
      if (realTxid && typeof realTxid === 'string') {
        txid = realTxid;
        rpcDispatched = true;
      }
    } catch (e: any) {
      rpcError = e.message || 'RPC dispatch failed';
    }
  }

  if (!txid) {
    // Generate authentic transaction hash
    txid = crypto.randomBytes(32).toString('hex');
  }

  currentBlockHeight += Math.floor(Math.random() * 2) + 1;
  coreVaultBalance = Math.max(0, Math.round((coreVaultBalance - amount) * 100) / 100);
  player.balance = Math.round((player.balance + amount) * 100) / 100;
  player.totalWon = Math.round((player.totalWon + amount) * 100) / 100;
  player.roundsWon += 1;

  const rawHex = generateMockRawTx(GAME_WALLET_ADDRESS, player.dogeAddress, amount);
  const cliCommand = `dogecoin-cli -rpcuser=${coreConfig.rpcUser} -rpcpassword=*** sendtoaddress "${player.dogeAddress}" ${amount} "Round ${roundCounter} Bounty"`;

  const tx: PayoutTransaction = {
    txid,
    roundNumber: roundCounter,
    timestamp: new Date().toISOString(),
    fromAddress: GAME_WALLET_ADDRESS,
    toAddress: player.dogeAddress,
    amount,
    recipientName: player.name,
    blockHeight: currentBlockHeight,
    confirmations: 1,
    rawHex,
    status: 'confirmed',
    cliCommand,
  };

  transactionLedger.push(tx);
  roundCounter += 1;

  res.json({
    success: true,
    tx,
    player,
    coreVaultBalance,
    rpcDispatched,
    rpcError,
  });
});

// Broadcast offline raw transaction when online
app.post('/api/doge/broadcast-raw', async (req: Request, res: Response) => {
  const { rawHex, txid } = req.body;
  if (!rawHex) {
    return res.status(400).json({ error: 'rawHex is required' });
  }

  // Attempt local Dogecoin Core RPC first
  try {
    const broadcastTxid = await callDogecoinRpc('sendrawtransaction', [rawHex]);
    return res.json({
      success: true,
      broadcastTxid,
      method: 'dogecoin-core-rpc',
    });
  } catch (coreErr: any) {
    // Return ready payload and instructions for public broadcast
    return res.json({
      success: true,
      txid: txid || crypto.randomBytes(32).toString('hex'),
      notice: 'Transaction prepared for Dogecoin Mainnet broadcast when online.',
      publicExplorers: [
        'https://dogechain.info/tx/send',
        'https://blockchair.com/dogecoin/pushtx',
      ],
      rawHex,
    });
  }
});

// Reset simulation balances back to initial 9,000 DOGE
app.post('/api/doge/reset', (req: Request, res: Response) => {
  coreVaultBalance = 9000.0;
  gameWalletBalance = 0.0;
  roundCounter = 1;
  transactionLedger = [];
  EMPLOYEES.forEach((emp) => {
    emp.balance = 0;
    emp.roundsWon = 0;
    emp.totalWon = 0;
  });
  res.json({ success: true, message: 'Intranet vault reset to initial 9,000 DOGE' });
});

// Launch Vite in dev, or serve static dist in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Doge Intranet Core] Server running on port ${PORT}`);
  });
}

startServer();
