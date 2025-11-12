import { useState } from 'react'
import { cancelOffer, createOffer, fillOffer } from '../api'

type Offer = { id: string; sellerId: string; asset: 'TKL'|'TG'|'TS'|'C'; amount: number; priceTS: number; status: string }

export default function MarketPlace({
  roomId,
  playerId,
  state,
  refresh,
}: { roomId: string; playerId: string; state: any; refresh: () => void }) {
  const [asset, setAsset] = useState<'TKL'|'TG'|'C'>('TKL')
  const [amount, setAmount] = useState(1)

  const room = state?.room || state
  const players = room?.players || {}
  const myAssets = players?.[playerId]?.assets
  const indicative = state?.indicative

  const submitOffer = async () => {
    const r = await createOffer(roomId, playerId, asset, amount)
    if (r.error) alert(r.error)
    refresh()
  }

  const onFill = async (offerId: string) => {
    const r = await fillOffer(roomId, offerId, playerId)
    if (r.error) alert(r.error)
    refresh()
  }

  const onCancel = async (offerId: string) => {
    const r = await cancelOffer(roomId, offerId, playerId)
    if (r.error) alert(r.error)
    refresh()
  }

  const rows = (state?.offers ?? room?.offers ?? []) as Offer[]

  const myHold = (players?.[playerId]?.assets || {})[asset] || 0
  const tsPts = indicative?.TS || 2
  const assetPts = asset === 'TKL' ? indicative?.TKL : asset === 'TG' ? indicative?.TG : indicative?.C
  const estPriceTS = Math.max(1, Math.ceil(((assetPts || 1) * amount) / (tsPts || 1)))
  const canSubmit = amount >= 1 && amount <= myHold

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="font-bold mb-2">Chợ giao dịch (TS là đơn vị thanh toán)</div>
      <div className="flex gap-2 flex-wrap items-center">
        <span>Bán:</span>
        <select className="rounded-md border border-input bg-background px-2 py-1" value={asset} onChange={(e) => setAsset(e.target.value as any)}>
          <option value="TKL">TKL (Vàng)</option>
          <option value="TG">TG (Tiền giấy)</option>
          <option value="C">C (Crypto)</option>
        </select>
        <input className="rounded-md border border-input bg-background px-2 py-1 w-24" type="number" min={1} max={myHold} value={amount} onChange={(e) => setAmount(Math.max(1, Math.min(myHold, Number(e.target.value||1))))} />
        <span>→ Giá dự kiến: <b>{estPriceTS}</b> TS</span>
        <button className="rounded-md border border-input bg-secondary px-3 py-2 hover:bg-secondary/70 disabled:opacity-60" onClick={submitOffer} disabled={!canSubmit}>Đăng bán</button>
      </div>
      <div className="mt-2 text-xs opacity-80">
        Giá trị tạm thời vòng này (theo N): TKL≈{indicative?.TKL ?? '-'} • TG≈{indicative?.TG ?? '-'} • TS≈{indicative?.TS ?? '-'} • C≈{indicative?.C ?? '-'}
        — Chợ sẽ reset khi sang vòng mới.
      </div>
      <div className="mt-1.5 text-xs">TS của bạn: <b>{myAssets?.TS ?? state?.room?.players?.[playerId]?.assets?.TS ?? '-'}</b></div>
      <div className="grid gap-1 mt-1">
        <div className="grid [grid-template-columns:1fr_48px_48px_48px_48px] gap-2 font-bold opacity-80"><div>Người bán</div><div>Tài sản</div><div>SL</div><div>Giá (TS)</div><div>Thao tác</div></div>
        {rows?.filter((o) => o.status === 'OPEN').map((o) => (
          <div className="grid [grid-template-columns:1fr_48px_48px_48px_48px] gap-2" key={o.id}>
            <div>{players?.[o.sellerId]?.name || o.sellerId.slice(0,6)}</div>
            <div>{o.asset}</div>
            <div>{o.amount}</div>
            <div>{o.priceTS}</div>
            <div>
              {o.sellerId === playerId ? (
                <button className="bg-transparent border border-dashed border-border px-2 py-1 rounded-md" onClick={() => onCancel(o.id)}>Hủy</button>
              ) : (
                <button className="rounded-md border border-input bg-primary text-primary-foreground px-2 py-1 hover:opacity-90 disabled:opacity-60" onClick={() => onFill(o.id)} disabled={(myAssets?.TS ?? 0) < o.priceTS}>Mua</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
