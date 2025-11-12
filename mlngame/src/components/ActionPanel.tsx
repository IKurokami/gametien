import React from 'react'

type Props = {
  locked?: boolean
  onLock: (action: string, payload?: any) => void
}

export default function ActionPanel({ locked, onLock }: Props) {
  const [amountC, setAmountC] = React.useState(1)
  return (
    <div className="panel">
      <div className="panel-title">Hành động</div>
      <div className="actions">
        <button disabled={locked} onClick={() => onLock('COOPERATE')}>🤝 Hợp Tác</button>
        <button disabled={locked} onClick={() => onLock('BETRAY')}>💣 Phản Bội</button>
        <button disabled={locked} onClick={() => onLock('JOINT_INVEST')}>🎁 Đầu Tư Chung</button>
        <div className="crypto-row">
          <input type="number" min={1} value={amountC} onChange={(e) => setAmountC(Math.max(1, Number(e.target.value||1)))} />
          <button disabled={locked} onClick={() => onLock('CRYPTO_GAMBLE', { amountC })}>🚀 Đầu Cơ Crypto</button>
        </div>
      </div>
    </div>
  )
}

