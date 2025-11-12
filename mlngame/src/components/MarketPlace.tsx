import React from 'react'
import { cancelOffer, createOffer, fillOffer } from '../api'

type Offer = { id: string; sellerId: string; asset: 'TKL'|'TG'|'TS'|'C'; amount: number; priceTS: number; status: string }

export default function MarketPlace({
  roomId,
  playerId,
  state,
  refresh,
}: { roomId: string; playerId: string; state: any; refresh: () => void }) {
  const [asset, setAsset] = React.useState<'TKL'|'TG'|'C'>('TKL')
  const [amount, setAmount] = React.useState(1)

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
    <div className="panel">
      <div className="panel-title">Chợ giao dịch (TS là đơn vị thanh toán)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>Bán:</span>
        <select value={asset} onChange={(e) => setAsset(e.target.value as any)}>
          <option value="TKL">TKL (Vàng)</option>
          <option value="TG">TG (Tiền giấy)</option>
          <option value="C">C (Crypto)</option>
        </select>
        <input type="number" min={1} max={myHold} value={amount} onChange={(e) => setAmount(Math.max(1, Math.min(myHold, Number(e.target.value||1))))} />
        <span>→ Giá dự kiến: <b>{estPriceTS}</b> TS</span>
        <button onClick={submitOffer} disabled={!canSubmit}>Đăng bán</button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
        Giá trị tạm thời vòng này (theo N): TKL≈{indicative?.TKL ?? '-'} • TG≈{indicative?.TG ?? '-'} • TS≈{indicative?.TS ?? '-'} • C≈{indicative?.C ?? '-'}
        — Chợ sẽ reset khi sang vòng mới.
      </div>
      <div style={{ marginTop: 6, fontSize: 12 }}>TS của bạn: <b>{myAssets?.TS ?? state?.room?.players?.[playerId]?.assets?.TS ?? '-'}</b></div>
      <div className="table" style={{ marginTop: 4 }}>
        <div className="thead"><div>Người bán</div><div>Tài sản</div><div>SL</div><div>Giá (TS)</div><div>Thao tác</div></div>
        {rows?.filter((o) => o.status === 'OPEN').map((o) => (
          <div className="trow" key={o.id}>
            <div>{players?.[o.sellerId]?.name || o.sellerId.slice(0,6)}</div>
            <div>{o.asset}</div>
            <div>{o.amount}</div>
            <div>{o.priceTS}</div>
            <div>
              {o.sellerId === playerId ? (
                <button className="ghost" onClick={() => onCancel(o.id)}>Hủy</button>
              ) : (
                <button onClick={() => onFill(o.id)} disabled={(myAssets?.TS ?? 0) < o.priceTS}>Mua</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
