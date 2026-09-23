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
  rpcPassword?: string;
  network: 'mainnet' | 'testnet' | 'regtest';
  autoSendRpc: boolean;
}

export interface DogeStateResponse {
  isCoreConnected: boolean;
  coreInfo: any;
  coreConfig: DogeCoreConfig;
  coreVaultBalance: number;
  gameWalletAddress: string;
  gameWalletBalance: number;
  currentBlockHeight: number;
  employees: EmployeePlayer[];
  transactionLedger: PayoutTransaction[];
  roundCounter: number;
}

export interface RoundTarget {
  roundNumber: number;
  bountyAmount: number;
  targetAddress: string;
  addressSource: string;
  gameWalletAddress: string;
  hp: number;
  maxHp: number;
}

export interface ShotVisual {
  id: string;
  playerId: string;
  playerIndex: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
  timestamp: number;
}

export interface HitParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}
