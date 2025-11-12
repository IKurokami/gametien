import { useEffect, useState } from 'react'

type Props = {
  market?: { N?: number; lastEventVi?: string; lastEventId?: string; inflation?: boolean; cryptoCrashFlag?: boolean; events?: { id: string; title: string; description: string }[] }
  round?: { index?: number; lockUntilTs?: number }
  indicative?: { TKL?: number; TG?: number; TS?: number; C?: number }
}

export default function MarketPanel({ market, round, indicative }: Props) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const remaining = Math.max(0, (round?.lockUntilTs || 0) - now)
  const sec = Math.ceil(remaining / 1000)

  const N = market?.N ?? 0
  const NLabel = N > 0 ? `N +${N}` : `N ${N}`
  const eventName = market?.lastEventVi || market?.lastEventId || '-'

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="font-bold mb-2">Thị trường</div>
      <div className="flex gap-4 flex-wrap">
        <div><b>Vòng:</b> {round?.index ?? '-'}</div>
        <div><b>Đếm ngược:</b> {sec}s</div>
      </div>
      <div className="flex gap-4 flex-wrap">
        <div><b>Chỉ số:</b> {NLabel}</div>
        <div><b>Sự kiện:</b> {eventName}</div>
      </div>
      {!!market?.events?.length && (
        <div className="mt-2 space-y-1">
          {market.events.map((ev) => (
            <div key={ev.id} className="text-sm opacity-90">
              <b>{ev.title}:</b> {ev.description}
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-sm opacity-90">
        <div className="font-semibold mb-1">Bảng giá hiện hành</div>
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-md border border-border px-2 py-1 text-center">TKL ≈ {indicative?.TKL ?? '-'}</div>
          <div className="rounded-md border border-border px-2 py-1 text-center">TG ≈ {indicative?.TG ?? '-'}</div>
          <div className="rounded-md border border-border px-2 py-1 text-center">TS ≈ {indicative?.TS ?? '-'}</div>
          <div className="rounded-md border border-border px-2 py-1 text-center">C ≈ {indicative?.C ?? '-'}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-1.5">
        {market?.inflation && (
          <span className="px-2 py-0.5 rounded-full text-xs border border-[#7a5b00] bg-[#3b2f00] text-[#ffd666]">Lạm phát TG</span>
        )}
        {market?.cryptoCrashFlag && (
          <span className="px-2 py-0.5 rounded-full text-xs border border-[#7a0000] bg-[#3b0000] text-[#ff9a9a]">Rủi ro Crypto</span>
        )}
      </div>
    </div>
  )
}
