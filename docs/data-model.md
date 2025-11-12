# Mô hình dữ liệu (server authoritative)

Thực thể cốt lõi (TypeScript gợi ý):

```ts
type Asset = { TKL: number; TG: number; TS: number; C: number };

type PlayerId = string;
type RoomId = string;

type NLevel = number; // ... -2, -1, 0, +1, +2

type Action = 'COOPERATE' | 'BETRAY' | 'JOINT_INVEST' | 'CRYPTO_GAMBLE';

interface Player {
  id: PlayerId;
  name: string;
  assets: Asset;
  connected: boolean;
}

interface Pairing { a: PlayerId; b: PlayerId } // cặp đấu trong 1 vòng; nếu lẻ, một người có thể nghỉ (b = undefined)

interface RoundState {
  index: number; // 1..4
  lockUntilTs: number; // deadline lật thẻ
  pairings: Pairing[]; // hệ thống tự động ghép cặp
  choices: Record<PlayerId, { action?: Action; payload?: any; locked: boolean }>;
  revealed: boolean;
}

interface MarketState {
  N: NLevel;
  lastEvent?: string; // mô tả thẻ sự kiện rút được
}

interface RoomConfig {
  maxPlayers: number; // tối đa 8
  roundSeconds: number; // 60..120
  totalRounds: number; // mặc định 4
  startingAssets: Asset; // TKL=3,TG=5,TS=6,C=1
}

type Role = 'PLAYER' | 'GAME_MASTER'; // GAME_MASTER: xem trận, không can thiệp kết quả

interface Room {
  id: RoomId;
  gameMasterId?: PlayerId; // tuỳ chọn
  players: Record<PlayerId, Player>;
  roles: Record<PlayerId, Role>;
  market: MarketState;
  round: RoundState | null;
  config: RoomConfig;
  phase: 'LOBBY' | 'IN_ROUND' | 'REVEAL' | 'ENDED';
}
```

Quy tắc cập nhật state:
- Máy chủ là nguồn sự thật: mọi thao tác đi qua GameEngine.
- Hệ thống tự động ghép cặp mỗi vòng (round.pairings) dựa trên danh sách người chơi đang hoạt động. Nếu số người lẻ → 1 người được nghỉ vòng (không hành động).
- Người chơi chỉ lock hành động với đối thủ đã được hệ thống ghép; không chọn đối tác thủ công.
- Tính toán N dựa trên số Hợp tác vs Phản bội sau khi reveal.
- Áp dụng phí TKL và rủi ro C sau mỗi vòng theo luật.
- Không được đổi tài sản ở phase `ENDED`.
