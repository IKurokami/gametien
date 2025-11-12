
type Asset = { TKL: number; TG: number; TS: number; C: number }
type Player = { id: string; name: string; assets: Asset }

export default function PlayersList({ players, me }: { players: Record<string, Player>; me?: string }) {
  const entries = Object.values(players || {})
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="font-bold mb-2">Người chơi ({entries.length})</div>
      <div className="grid gap-1">
        <div className="grid [grid-template-columns:1fr_48px_48px_48px_48px] gap-2 font-bold opacity-80"><div>Tên</div><div>TKL</div><div>TG</div><div>TS</div><div>C</div></div>
        {entries.map((p) => (
          <div key={p.id} className={`grid [grid-template-columns:1fr_48px_48px_48px_48px] gap-2 ${me === p.id ? 'bg-[rgba(100,149,237,0.12)] rounded-md' : ''}`}>
            <div title={p.id}>{p.name}</div>
            <div>{p.assets.TKL}</div>
            <div>{p.assets.TG}</div>
            <div>{p.assets.TS}</div>
            <div>{p.assets.C}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
