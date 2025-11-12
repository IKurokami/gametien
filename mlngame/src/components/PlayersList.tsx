import React from 'react'

type Asset = { TKL: number; TG: number; TS: number; C: number }
type Player = { id: string; name: string; assets: Asset }

export default function PlayersList({ players, me }: { players: Record<string, Player>; me?: string }) {
  const entries = Object.values(players || {})
  return (
    <div className="panel">
      <div className="panel-title">Người chơi ({entries.length})</div>
      <div className="table">
        <div className="thead"><div>Tên</div><div>TKL</div><div>TG</div><div>TS</div><div>C</div></div>
        {entries.map((p) => (
          <div key={p.id} className={`trow ${me === p.id ? 'me' : ''}`}>
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

