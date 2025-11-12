import { useState } from 'react'

type Props = {
  locked?: boolean
  onLock: (action: string, payload?: any) => void
  myTS?: number
  indicative?: { TKL?: number; TG?: number; TS?: number; C?: number }
}

export default function ActionPanel({ locked, onLock, myTS = 0, indicative }: Props) {
  const [amountC, setAmountC] = useState(1)
  const priceC = indicative?.C || 5
  const priceTS = indicative?.TS || 2
  const estCostTS = Math.max(1, Math.ceil((priceC * amountC) / (priceTS || 1)))
  const canBuy = estCostTS <= myTS && amountC >= 1
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="font-bold mb-2">Hành động</div>
      <div className="grid grid-cols-2 gap-2">
        <button className="rounded-md border border-input bg-secondary px-3 py-2 hover:bg-secondary/70 disabled:opacity-60" disabled={locked} onClick={() => onLock('COOPERATE')}>🤝 Hợp Tác</button>
        <button className="rounded-md border border-input bg-secondary px-3 py-2 hover:bg-secondary/70 disabled:opacity-60" disabled={locked} onClick={() => onLock('BETRAY')}>💣 Phản Bội</button>
        <div className="flex gap-2 items-center col-span-2">
          <label className="text-sm opacity-80">Mua C:</label>
          <input className="rounded-md border border-input bg-background px-3 py-2 w-24" type="number" min={1} value={amountC} onChange={(e) => setAmountC(Math.max(1, Number(e.target.value||1)))} />
          <span className="text-sm opacity-80">Chi phí ước tính: <b>{estCostTS}</b> TS</span>
          <button className="rounded-md border border-input bg-primary text-primary-foreground px-3 py-2 hover:opacity-90 disabled:opacity-60" disabled={locked || !canBuy} onClick={() => onLock('CRYPTO_GAMBLE', { amountC })}>🚀 Đầu tư Crypto</button>
        </div>
        <div className="col-span-2 text-xs opacity-70">Bạn có: <b>{myTS}</b> TS • Giá vòng: C≈{priceC} • TS≈{priceTS}</div>
      </div>
    </div>
  )
}
