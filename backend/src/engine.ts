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
  roundSeconds: 75,
  totalRounds: 4,
  startingAssets: { TKL: 3, TG: 5, TS: 6, C: 1 },
}

const eventVi: Record<string, string> = {
  CONFIDENCE_WAVE: 'Làn sóng tự tin',
  RUMOR_SPREAD: 'Tin đồn lan rộng',
  PANIC_SELLING: 'Bán tháo hoảng loạn',
  STABLE_MOOD: 'Tâm lý ổn định',
  SURPRISE_INFLATION: 'Lạm phát bất ngờ',
  EXCHANGE_OUTAGE: 'Sàn giao dịch gặp sự cố',
}

const simpleDeck = [
  'CONFIDENCE_WAVE',
  'RUMOR_SPREAD',
  'PANIC_SELLING',
  'STABLE_MOOD',
  'SURPRISE_INFLATION',
  'EXCHANGE_OUTAGE',
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
    market: { N: 0 },
    round: null,
    phase: 'LOBBY',
    config,
    deck: shuffle(simpleDeck),
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
  const player: Player = {
    id,
    name,
    connected: true,
    assets: { ...room.config.startingAssets },
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
  const card = room.deck.shift() || 'STABLE_MOOD'
  let N = room.market.N
  let inflation = false
  let cryptoCrashFlag = false
  switch (card) {
    case 'CONFIDENCE_WAVE':
      N = clampN(N + 1)
      break
    case 'RUMOR_SPREAD':
      N = clampN(N - 1)
      break
    case 'PANIC_SELLING':
      N = clampN(N - 2)
      break
    case 'STABLE_MOOD':
      N = clampN(N + 0)
      break
    case 'SURPRISE_INFLATION':
      inflation = true
      break
    case 'EXCHANGE_OUTAGE':
      cryptoCrashFlag = true
      N = clampN(N - 1)
      break
  }
  room.market = {
    N: N as any,
    lastEventId: card,
    lastEventVi: eventVi[card] || card,
    inflation,
    cryptoCrashFlag,
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
  const N = room.market.N
  const priceTSBump = N >= 1 ? 1 : N <= -1 ? -1 : 0
  const priceCBump = N <= -2 ? 3 : N <= -1 ? 1 : 0

  // Helper to apply CRYPTO_GAMBLE on payload.amountC
  const cryptoGamble = (p: Player, choice?: { payload?: any }) => {
    const amt: number = Math.max(0, Math.min(p.assets.C, Number(choice?.payload?.amountC || 0)))
    if (amt <= 0) return
    const win = Math.random() < 0.5
    if (win) p.assets.C += amt // x2: add same amount
    else p.assets.C -= amt // lose selected amount
  }

  // Default: if someone idle alone, no interaction except gamble
  if (!b) {
    if (ca.action === 'CRYPTO_GAMBLE') cryptoGamble(a, ca)
    return
  }

  // Evaluate pair outcomes
  const A = ca.action
  const B = cb?.action

  if (A === 'CRYPTO_GAMBLE') cryptoGamble(a, ca)
  if (B === 'CRYPTO_GAMBLE') cryptoGamble(b, cb)

  // Joint invest requires each to have 3 TS upfront in this pair evaluation
  const canJoint = (p: Player) => p.assets.TS >= 3

  if (A === 'COOPERATE' && B === 'COOPERATE') {
    a.assets.TS += 5
    b.assets.TS += 5
  } else if (A === 'BETRAY' && B === 'BETRAY') {
    // both suffer trust collapse indirectly via N recalculation after round
    // no direct TS change here beyond later fees
  } else if (A === 'BETRAY' && B === 'COOPERATE') {
    a.assets.TS += 8
    b.assets.TS -= 5
  } else if (A === 'COOPERATE' && B === 'BETRAY') {
    b.assets.TS += 8
    a.assets.TS -= 5
  } else if (A === 'JOINT_INVEST' && B === 'JOINT_INVEST') {
    if (canJoint(a) && canJoint(b)) {
      a.assets.TS -= 3
      b.assets.TS -= 3
      a.assets.TS += 5
      b.assets.TS += 5
    }
  } else if (A === 'JOINT_INVEST' && B !== 'JOINT_INVEST') {
    if (canJoint(a)) a.assets.TS -= 3 // one-sided loss if counterparty doesn’t join
  } else if (B === 'JOINT_INVEST' && A !== 'JOINT_INVEST') {
    if (canJoint(b)) b.assets.TS -= 3
  }

  // Temporary prices affect only in-round trading; MVP: no trading yet
  // We keep bumps available in case we expand.
  void priceTSBump
  void priceCBump
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

  return { fee1Count, fee2Count, deductedTS, cryptoLossCount, feeDetails, cryptoLoss }
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
  const N = room.market.N
  const TS = 2 + (N >= 1 ? 1 : N <= -1 ? -1 : 0)
  const C = 5 + (N <= -2 ? 3 : N <= -1 ? 1 : 0)
  const TKL = 3
  const TG = room.market.inflation ? 0 : 1
  return { TS, C, TKL, TG }
}

// Marketplace logic (player-to-player). We reserve assets on listing.
function priceTSFor(room: Room, asset: 'TKL'|'TG'|'C', amount: number) {
  const p = indicativePrices(room)
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
