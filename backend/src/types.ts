export type Asset = { TKL: number; TG: number; TS: number; C: number };
export type PlayerId = string;
export type RoomId = string;
export type NLevel = -2 | -1 | 0 | 1 | 2;
export type Action = 'COOPERATE' | 'BETRAY' | 'CRYPTO_GAMBLE' | 'BUY_TKL';

export interface Player {
  id: PlayerId;
  name: string;
  assets: Asset;
  connected: boolean;
}

export interface Pairing { a: PlayerId; b?: PlayerId }

export interface RoundState {
  index: number; // 1..4
  lockUntilTs: number; // deadline lật thẻ
  pairings: Pairing[];
  choices: Record<PlayerId, { action?: Action; payload?: any; locked: boolean }>;
  revealed: boolean;
}

export interface MarketState {
  N: NLevel;
  lastEventId?: string;
  lastEventVi?: string;
  inflation?: boolean;
  cryptoCrashFlag?: boolean;
  prices: Asset; // authoritative per-round prices for scoring/trade conversion
  events?: Array<{ id: string; title: string; description: string }>; // two events per round (1 crypto-specific)
}

export interface RoomConfig {
  maxPlayers: number;
  roundSeconds: number;
  totalRounds: number;
  startingAssets: Asset;
}

export type Role = 'PLAYER' | 'GAME_MASTER';

export interface Room {
  id: RoomId;
  gameMasterId?: PlayerId;
  players: Record<PlayerId, Player>;
  roles: Record<PlayerId, Role>;
  market: MarketState;
  round: RoundState | null;
  config: RoomConfig;
  phase: 'LOBBY' | 'IN_ROUND' | 'REVEAL' | 'ENDED';
  deck: string[]; // simple event names for MVP
  lastRoundNotes?: string[]; // messages explaining fees/risks applied at reveal
  offers: TradeOffer[];
  // Per-player logs: accumulated during a round and snapshot at reveal
  currentRoundLogs: Record<PlayerId, string[]>;
  lastRoundLogs?: Record<PlayerId, string[]>;
}

export type AssetKey = 'TKL' | 'TG' | 'TS' | 'C'

export interface TradeOffer {
  id: string;
  sellerId: PlayerId;
  asset: AssetKey; // what is being sold
  amount: number;  // integer units
  priceTS: number; // total TS the buyer pays
  createdAt: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
}

export interface PublicRoomState extends Omit<Room, 'deck' | 'roles'> {}
