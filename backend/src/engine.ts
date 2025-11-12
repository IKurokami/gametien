import { nanoid } from 'nanoid'
import type {
  Action,
  MarketState,
  Pairing,
  Player,
  PlayerId,
  PublicRoomState,
  Room,
  RoomConfig,
} from './types'

const clampN = (n: number) => (n < -2 ? -2 : n > 2 ? 2 : (n as -2 | -1 | 0 | 1 | 2))

export const defaultConfig: RoomConfig = {
  maxPlayers: 8,
  roundSeconds: 300,
  totalRounds: 4,
  // Tăng tổng tài sản khởi đầu; sẽ phân bổ lại ngẫu nhiên khi join
  startingAssets: { TKL: 4, TG: 10, TS: 15, C: 1 },
}

const eventVi: Record<string, string> = {
  CONFIDENCE_WAVE: 'Làn sóng tự tin',
  RUMOR_SPREAD: 'Tin đồn lan rộng',
  PANIC_SELLING: 'Bán tháo hoảng loạn',
  STABLE_MOOD: 'Tâm lý ổn định',
  SURPRISE_INFLATION: 'Lạm phát bất ngờ',
  EXCHANGE_OUTAGE: 'Sàn giao dịch gặp sự cố',
}

// Baseline prices for realism
const BASE_PRICES = { TS: 5, TG: 5, TKL: 20, C: 60 }

const generalEvents = [
  { id: 'CONFIDENCE_WAVE', title: 'Làn sóng tự tin', desc: '+TS, +TKL nhẹ', eff: { TS: +1, TKL: +2 } },
  { id: 'RUMOR_SPREAD', title: 'Tin đồn lan rộng', desc: '-TS nhẹ', eff: { TS: -1 } },
  { id: 'PANIC_SELLING', title: 'Bán tháo hoảng loạn', desc: '-TKL vừa', eff: { TKL: -3 } },
  { id: 'STABLE_MOOD', title: 'Tâm lý ổn định', desc: 'Không đổi', eff: {} },
  { id: 'SURPRISE_INFLATION', title: 'Lạm phát bất ngờ', desc: '-TG mạnh', eff: { TG: -3 } },
]

const cryptoEvents = [
  { id: 'C_PUMP', title: 'Crypto tăng tốc', desc: '+C mạnh', eff: { C: +10 }, cryptoCrashFlag: false },
  { id: 'C_DIP', title: 'Crypto điều chỉnh', desc: '-C nhẹ', eff: { C: -5 }, cryptoCrashFlag: false },
  { id: 'EXCHANGE_OUTAGE', title: 'Sàn giao dịch gặp sự cố', desc: '-C vừa, rủi ro giữ ≥4C: -1C cuối vòng', eff: { C: -8 }, cryptoCrashFlag: true },
]

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function createRoom(cfg?: Partial<RoomConfig>): Room {
  const id = nanoid(8)
  const config: RoomConfig = { ...defaultConfig, ...(cfg || {}) }
  const room: Room = {
    id,
    players: {},
    roles: {},
    market: { N: 0, prices: { ...BASE_PRICES } },
    round: null,
    phase: 'LOBBY',
    config,
    deck: shuffle(generalEvents.map((e) => e.id)),
    offers: [],
    currentRoundLogs: {},
  }
  return room
}

export function joinRoom(room: Room, name: string): Player {
  if (Object.keys(room.players).length >= room.config.maxPlayers) {
    throw new Error('Room full')
  }
  const id = nanoid(10)
  // Generate varied starting portfolio with equal total value (based on BASE_PRICES)
  const targetValue =
    room.config.startingAssets.TKL * BASE_PRICES.TKL +
    room.config.startingAssets.TG * BASE_PRICES.TG +
    room.config.startingAssets.TS * BASE_PRICES.TS +
    room.config.startingAssets.C * BASE_PRICES.C

  // Work in units of 5 to keep integers: 4*T + 12*C + G + S = W
  let W = Math.floor(targetValue / 5)
  // Rule: TS phải đủ để mua được 1 C theo giá nền
  const minTSForOneC = Math.ceil(BASE_PRICES.C / BASE_PRICES.TS) // 60/5 = 12
  const Smin = Math.min(W, minTSForOneC)
  let R = W - Smin

  const maxC = Math.floor(R / 12)
  const C = Math.floor(Math.random() * (maxC + 1))
  const rem1 = R - 12 * C
  const maxT = Math.floor(rem1 / 4)
  const TKL = Math.floor(Math.random() * (maxT + 1))
  const rem2 = rem1 - 4 * TKL
  const G = Math.floor(Math.random() * (rem2 + 1))
  const Sextra = rem2 - G
  const TG = G
  const TS = Smin + Sextra

  const player: Player = {
    id,
    name,
    connected: true,
    assets: { TKL, TG, TS, C },
  }
  room.players[id] = player
  return player
}

export function startGame(room: Room) {
  if (room.phase !== 'LOBBY') throw new Error('Game already started')
  if (Object.keys(room.players).length < 2) throw new Error('Need at least 2 players')
  startRound(room, 1)
}

function buildPairings(players: PlayerId[]): Pairing[] {
  const res: Pairing[] = []
  const a = players.slice()
  for (let i = 0; i < a.length; i += 2) {
    const p1 = a[i]
    const p2 = a[i + 1]
    if (p1 && p2) res.push({ a: p1, b: p2 })
    else res.push({ a: p1 })
  }
  return res
}

function drawEventAndUpdateMarket(room: Room): MarketState {
  // Draw one general event
  const generalId = room.deck.shift() || 'STABLE_MOOD'
  if (room.deck.length < 1) room.deck = shuffle(generalEvents.map((e) => e.id))
  const g = generalEvents.find((e) => e.id === generalId) || generalEvents[3]
  // Draw one crypto event
  const c = cryptoEvents[Math.floor(Math.random() * cryptoEvents.length)]

  // Start from base prices every round, then apply deltas
  const next = { ...BASE_PRICES }
  const applyDelta = (target: typeof next, eff: any) => {
    ;(['TS','TG','TKL','C'] as const).forEach((k) => {
      const d = eff?.[k]
      if (typeof d === 'number') target[k] = Math.max(1, target[k] + d)
    })
  }
  applyDelta(next, g.eff)
  applyDelta(next, c.eff)

  const events = [
    { id: g.id, title: g.title, description: g.desc },
    { id: c.id, title: c.title, description: c.desc },
  ]

  room.market = {
    N: room.market.N, // retained for compatibility, not used for pricing now
    lastEventId: `${g.id}+${c.id}`,
    lastEventVi: `${g.title} & ${c.title}`,
    inflation: g.id === 'SURPRISE_INFLATION',
    cryptoCrashFlag: !!c.cryptoCrashFlag,
    prices: next,
    events,
  }
  return room.market
}

export function startRound(room: Room, index: number) {
  const now = Date.now()
  const players = Object.keys(room.players)
  const pairings = buildPairings(shuffle(players))
  const lockUntilTs = now + room.config.roundSeconds * 1000
  drawEventAndUpdateMarket(room)
  // Reset marketplace each round (offers only valid within a round)
  room.offers = []
  room.currentRoundLogs = {}
  room.round = {
    index,
    pairings,
    lockUntilTs,
    choices: Object.fromEntries(players.map((p) => [p, { locked: false }])),
    revealed: false,
  }
  room.phase = 'IN_ROUND'
}

function addLog(room: Room, playerId: PlayerId, msg: string) {
  if (!room.currentRoundLogs[playerId]) room.currentRoundLogs[playerId] = []
  room.currentRoundLogs[playerId].push(msg)
}

export function lockAction(room: Room, playerId: PlayerId, action: Action, payload?: any) {
  if (room.phase !== 'IN_ROUND' || !room.round) throw new Error('Not accepting actions')
  const entry = room.round.choices[playerId]
  if (!entry) throw new Error('Player not in round')
  room.round.choices[playerId] = { action, payload, locked: true }

  const everyoneLocked = Object.values(room.round.choices).every((c) => c.locked)
  const timePassed = Date.now() >= room.round.lockUntilTs
  if (everyoneLocked || timePassed) revealRound(room)
}

function applyOutcomeForPair(room: Room, a: Player, b?: Player) {
  const rc = room.round!
  const ca = rc.choices[a.id]
  const cb = b ? rc.choices[b.id] : undefined
  // Helper to buy Crypto using TS at current round prices
  const buyCrypto = (p: Player, choice?: { payload?: any }) => {
    const wantC: number = Math.floor(Number(choice?.payload?.amountC || 0))
    if (!Number.isFinite(wantC) || wantC <= 0) return
    const costTS = priceTSFor(room, 'C', wantC)
    if (p.assets.TS < costTS) return
    p.assets.TS -= costTS
    p.assets.C += wantC
    addLog(room, p.id, `Đầu tư Crypto: mua ${wantC} C với giá ${costTS} TS`)
  }

  // Default: if someone idle alone, no interaction except gamble
  if (!b) {
    if (ca.action === 'CRYPTO_GAMBLE') buyCrypto(a, ca)
    return
  }

  // Evaluate pair outcomes
  const A = ca.action
  const B = cb?.action

  if (A === 'CRYPTO_GAMBLE') buyCrypto(a, ca)
  if (B === 'CRYPTO_GAMBLE') buyCrypto(b, cb)
  // Compute TS deltas for clear logging
  if (b) {
    let dA = 0
    let dB = 0
    let summary = ''
    if (A === 'COOPERATE' && B === 'COOPERATE') {
      dA += 5
      dB += 5
      summary = 'Cả hai COOPERATE: mỗi người +5 TS'
    } else if (A === 'BETRAY' && B === 'BETRAY') {
      // No direct TS change, only trust index may move later
      summary = 'Cả hai BETRAY: không cộng/trừ TS trực tiếp'
    } else if (A === 'BETRAY' && B === 'COOPERATE') {
      dA += 8
      dB -= 5
      summary = 'Bạn BETRAY, đối thủ COOPERATE: bạn +8 TS, đối thủ -5 TS'
    } else if (A === 'COOPERATE' && B === 'BETRAY') {
      dB += 8
      dA -= 5
      summary = 'Bạn COOPERATE, đối thủ BETRAY: đối thủ +8 TS, bạn -5 TS'
    }

    // Apply and log per player
    const fmt = (d: number) => (d > 0 ? `+${d}` : d < 0 ? `${d}` : '0')
    a.assets.TS += dA
    b.assets.TS += dB
    addLog(
      room,
      a.id,
      `Kết quả với ${b.name}: Bạn ${A || '—'}, ${b.name} ${B || '—'} → ${fmt(dA)} TS (${summary})`,
    )
    addLog(
      room,
      b.id,
      `Kết quả với ${a.name}: Bạn ${B || '—'}, ${a.name} ${A || '—'} → ${fmt(dB)} TS (${summary})`,
    )
  }
}

function applyEndOfRoundFees(room: Room) {
  // Gold custody fee
  const feeFor = (tkl: number) => (tkl >= 12 ? 2 : tkl >= 8 ? 1 : 0)
  let fee1Count = 0
  let fee2Count = 0
  let deductedTS = 0
  const feeDetails: Array<{ id: PlayerId; fee: number }> = []
  Object.values(room.players).forEach((p) => {
    const fee = feeFor(p.assets.TKL)
    if (fee > 0) {
      if (fee === 1) fee1Count++
      if (fee === 2) fee2Count++
      const before = p.assets.TS
      p.assets.TS = Math.max(0, p.assets.TS - fee)
      deductedTS += Math.min(fee, before)
      feeDetails.push({ id: p.id, fee })
    }
  })

  // Crypto crash card in effect: lose 1 C immediately if holding >= 4
  let cryptoLossCount = 0
  const cryptoLoss: PlayerId[] = []
  if (room.market.cryptoCrashFlag) {
    Object.values(room.players).forEach((p) => {
      if (p.assets.C >= 4) {
        p.assets.C -= 1
        cryptoLossCount++
        cryptoLoss.push(p.id)
      }
    })
  }
  // Optional: slight TG erosion under inflation event (without breaking TG>=1 pricing rule)
  if (room.market.inflation) {
    Object.values(room.players).forEach((p) => {
      // represent erosion as a small TS fee if holding much TG
      if (p.assets.TG >= 10) p.assets.TS = Math.max(0, p.assets.TS - 1)
    })
  }

  return { fee1Count, fee2Count, deductedTS, cryptoLossCount, feeDetails, cryptoLoss }
}

// Ensure players have minimum TS by auto-converting other assets into TS at current prices
function ensureMinimumTS(room: Room, minTS = 1) {
  const order: Array<'TG'|'TKL'|'C'> = ['TG', 'TKL', 'C']
  Object.values(room.players).forEach((p) => {
    while (p.assets.TS < minTS) {
      // Find first asset available to convert
      const asset = order.find((k) => p.assets[k] > 0)
      if (!asset) break
      // Convert 1 unit of that asset to TS using current price
      const tsGain = priceTSFor(room, asset, 1)
      p.assets[asset] -= 1
      p.assets.TS += tsGain
      addLog(room, p.id, `Tự động quy đổi 1 ${asset} → +${tsGain} TS (đảm bảo tối thiểu TS)`)    
    }
  })
}

function recalcNFromOutcomes(room: Room) {
  const rc = room.round!
  let coop = 0
  let betray = 0
  rc.pairings.forEach(({ a, b }) => {
    const A = rc.choices[a]?.action
    const B = b ? rc.choices[b]?.action : undefined
    if (A === 'COOPERATE') coop++
    if (B === 'COOPERATE') coop++
    if (A === 'BETRAY') betray++
    if (B === 'BETRAY') betray++
  })
  if (coop > betray) room.market.N = clampN((room.market.N as number) + 1)
  else if (betray > coop) room.market.N = clampN((room.market.N as number) - 1)
}

export function revealRound(room: Room) {
  if (!room.round || room.phase !== 'IN_ROUND') return
  // Apply outcomes per pair
  for (const { a, b } of room.round.pairings) {
    const pa = room.players[a]
    const pb = b ? room.players[b] : undefined
    if (pa) applyOutcomeForPair(room, pa, pb)
  }
  const fees = applyEndOfRoundFees(room)
  // Enforce minimum TS rule after fees and crypto risks
  ensureMinimumTS(room, 1)
  const prevN = room.market.N
  recalcNFromOutcomes(room)
  const notes: string[] = []
  if (fees.fee1Count || fees.fee2Count) {
    const parts = [] as string[]
    if (fees.fee1Count) parts.push(`-1 TS: ${fees.fee1Count} người (8–11 TKL)`)
    if (fees.fee2Count) parts.push(`-2 TS: ${fees.fee2Count} người (≥12 TKL)`)
    notes.push(`Phí giữ vàng áp dụng (${parts.join(', ')}), tổng trừ ${fees.deductedTS} TS.`)
  } else {
    notes.push('Không ai chịu phí giữ vàng vòng này.')
  }
  if (room.market.cryptoCrashFlag) {
    notes.push(`Rủi ro Crypto kích hoạt: ${fees.cryptoLossCount} người giữ ≥4 C đã mất 1 C.`)
  }
  if (prevN !== room.market.N) {
    notes.push(`Chỉ số N điều chỉnh từ ${prevN > 0 ? '+' + prevN : prevN} → ${room.market.N > 0 ? '+' + room.market.N : room.market.N}.`)
  } else {
    notes.push('Chỉ số N không đổi sau vòng này.')
  }
  // Per-player logs (actions + fees + crypto + trades)
  const roundLogs: Record<PlayerId, string[]> = {}
  const push = (id: PlayerId, msg: string) => {
    if (!roundLogs[id]) roundLogs[id] = []
    roundLogs[id].push(msg)
  }
  if (room.round) {
    Object.keys(room.round.choices).forEach((pid) => {
      const a = room.round!.choices[pid].action
      if (a) push(pid, `Bạn đã chọn hành động: ${a}`)
    })
  }
  fees.feeDetails.forEach(({ id, fee }) => push(id, `Phí giữ vàng: -${fee} TS`))
  fees.cryptoLoss.forEach((id) => push(id, 'Rủi ro Crypto: -1 C (giữ ≥4 C)'))
  Object.entries(room.currentRoundLogs).forEach(([pid, arr]) => {
    arr.forEach((m) => push(pid as PlayerId, m))
  })
  room.lastRoundLogs = roundLogs
  room.lastRoundNotes = notes
  room.phase = 'REVEAL'
  room.round.revealed = true
}

export function nextRoundOrEnd(room: Room) {
  if (!room.round) throw new Error('No current round')
  const next = room.round.index + 1
  if (next > room.config.totalRounds) {
    room.phase = 'ENDED'
    room.round = null
  } else {
    startRound(room, next)
  }
}

export function publicState(room: Room): PublicRoomState {
  const { deck, roles, ...rest } = room
  return rest
}

// Indicative temporary prices for guidance only (not enforced)
export function indicativePrices(room: Room) {
  // Now indicative equals the authoritative per-round prices
  return { ...room.market.prices }
}

// Marketplace logic (player-to-player). We reserve assets on listing.
function priceTSFor(room: Room, asset: 'TKL'|'TG'|'C', amount: number) {
  const p = room.market.prices
  const assetPts = asset === 'TKL' ? p.TKL : asset === 'TG' ? p.TG : p.C
  const tsPts = p.TS || 1
  const totalPts = assetPts * amount
  // Convert points to TS units, minimum 1
  const priceTS = Math.max(1, Math.ceil(totalPts / tsPts))
  return priceTS
}

export function createOffer(
  room: Room,
  sellerId: PlayerId,
  asset: 'TKL' | 'TG' | 'TS' | 'C',
  amount: number,
) {
  if (room.phase !== 'IN_ROUND' || !room.round) throw new Error('Chỉ giao dịch trong vòng đang diễn ra')
  if (Date.now() >= room.round.lockUntilTs) throw new Error('Hết thời gian đàm phán vòng này')
  const seller = room.players[sellerId]
  if (!seller) throw new Error('Người bán không tồn tại')
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Số lượng không hợp lệ')
  if (asset === 'TS') throw new Error('Không bán TS trực tiếp (TS là đơn vị thanh toán)')
  amount = Math.floor(amount)
  if (seller.assets[asset] < amount) throw new Error('Không đủ tài sản để rao bán')
  const priceTS = priceTSFor(room, asset, amount)
  // Reserve
  seller.assets[asset] -= amount
  const offer = {
    id: nanoid(8),
    sellerId,
    asset,
    amount,
    priceTS,
    createdAt: Date.now(),
    status: 'OPEN' as const,
  }
  room.offers.push(offer)
  const assetName = asset === 'TKL' ? 'Vàng (TKL)' : asset === 'TG' ? 'Tiền giấy (TG)' : 'Crypto (C)'
  addLog(room, sellerId, `Đăng bán ${amount} ${assetName} với giá ${priceTS} TS`)
  return offer
}

export function cancelOffer(room: Room, sellerId: PlayerId, offerId: string) {
  const offer = room.offers.find((o) => o.id === offerId)
  if (!offer) throw new Error('Offer không tồn tại')
  if (offer.sellerId !== sellerId) throw new Error('Chỉ người bán mới được hủy')
  if (offer.status !== 'OPEN') throw new Error('Offer đã không còn mở')
  offer.status = 'CANCELLED'
  // Refund reserved asset
  room.players[sellerId].assets[offer.asset] += offer.amount
}

export function fillOffer(room: Room, buyerId: PlayerId, offerId: string) {
  if (room.phase !== 'IN_ROUND' || !room.round) throw new Error('Chỉ giao dịch trong vòng đang diễn ra')
  if (Date.now() >= room.round.lockUntilTs) throw new Error('Hết thời gian đàm phán vòng này')
  const buyer = room.players[buyerId]
  if (!buyer) throw new Error('Người mua không tồn tại')
  const offer = room.offers.find((o) => o.id === offerId)
  if (!offer) throw new Error('Offer không tồn tại')
  if (offer.status !== 'OPEN') throw new Error('Offer đã được khớp hoặc hủy')
  if (offer.sellerId === buyerId) throw new Error('Không thể tự mua offer của mình')
  if (buyer.assets.TS < offer.priceTS) throw new Error('Không đủ TS để mua')
  // Transfer
  buyer.assets.TS -= offer.priceTS
  room.players[offer.sellerId].assets.TS += offer.priceTS
  buyer.assets[offer.asset] += offer.amount
  offer.status = 'FILLED'
  // Optionally prune filled offers to avoid client-side confusion
  room.offers = room.offers.filter((o) => o.status === 'OPEN')
  const assetName = offer.asset === 'TKL' ? 'Vàng (TKL)' : offer.asset === 'TG' ? 'Tiền giấy (TG)' : 'Crypto (C)'
  addLog(room, buyerId, `Mua ${offer.amount} ${assetName} với giá ${offer.priceTS} TS từ ${room.players[offer.sellerId]?.name || offer.sellerId}`)
  addLog(room, offer.sellerId, `Bán ${offer.amount} ${assetName} nhận ${offer.priceTS} TS cho ${room.players[buyerId]?.name || buyerId}`)
}
