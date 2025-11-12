import React from 'react'

type Props = {
  market?: { N?: number; lastEventVi?: string; lastEventId?: string; inflation?: boolean; cryptoCrashFlag?: boolean }
  round?: { index?: number; lockUntilTs?: number }
}

export default function MarketPanel({ market, round }: Props) {
  const [now, setNow] = React.useState(Date.now())
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const remaining = Math.max(0, (round?.lockUntilTs || 0) - now)
  const sec = Math.ceil(remaining / 1000)

  const N = market?.N ?? 0
  const NLabel = N > 0 ? `N +${N}` : `N ${N}`
  const eventName = market?.lastEventVi || market?.lastEventId || '-'

  return (
    <div className="panel">
      <div className="panel-title">Thị trường</div>
      <div className="row">
        <div><b>Vòng:</b> {round?.index ?? '-'}</div>
        <div><b>Đếm ngược:</b> {sec}s</div>
      </div>
      <div className="row">
        <div><b>Chỉ số:</b> {NLabel}</div>
        <div><b>Sự kiện:</b> {eventName}</div>
      </div>
      <div className="badges">
        {market?.inflation && <span className="badge warn">Lạm phát TG</span>}
        {market?.cryptoCrashFlag && <span className="badge danger">Rủi ro Crypto</span>}
      </div>
    </div>
  )
}

