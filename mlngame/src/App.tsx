import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { createRoom, getRoom, joinRoom, listOffers, lockAction, nextPhase, startGame } from './api'
import MarketPanel from './components/MarketPanel'
import PlayersList from './components/PlayersList'
import ActionPanel from './components/ActionPanel'
import MarketPlace from './components/MarketPlace'

type Asset = { TKL: number; TG: number; TS: number; C: number }

export default function App() {
  const [roomId, setRoomId] = useState<string>('')
  const [playerId, setPlayerId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [state, setState] = useState<any>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [indicative, setIndicative] = useState<any>(null)
  const [error, setError] = useState<string>('')

  // Hydrate from localStorage
  useEffect(() => {
    const rid = localStorage.getItem('roomId') || ''
    const pid = localStorage.getItem('playerId') || ''
    setRoomId(rid)
    setPlayerId(pid)
  }, [])

  // Poll room state + offers every 1.5s when we have roomId
  useEffect(() => {
    if (!roomId) return
    let stop = false
    const tick = async () => {
      try {
        const r = await getRoom(roomId)
        const o = await listOffers(roomId)
        if (!stop) {
          setState(r.room)
          setOffers(o.offers || [])
          setIndicative(r.indicative || null)
        }
      } catch (e: any) {
        if (!stop) setError(e.message || 'Failed to fetch state')
      } finally {
        if (!stop) setTimeout(tick, 1500)
      }
    }
    tick()
    return () => {
      stop = true
    }
  }, [roomId])

  const myAssets: Asset | undefined = useMemo(() => {
    if (!state || !playerId) return undefined
    return state.players?.[playerId]?.assets
  }, [state, playerId])

  const myPair = useMemo(() => {
    if (!state?.round || !playerId) return null
    const p = state.round.pairings.find((pr: any) => pr.a === playerId || pr.b === playerId)
    return p || null
  }, [state, playerId])

  const myChoice = useMemo(() => state?.round?.choices?.[playerId], [state, playerId])

  const onCreate = async () => {
    // reset old player when creating a fresh room
    setPlayerId('')
    localStorage.removeItem('playerId')
    const r = await createRoom()
    setRoomId(r.roomId)
    localStorage.setItem('roomId', r.roomId)
  }

  const onJoin = async () => {
    if (!roomId || !name) return
    const r = await joinRoom(roomId, name)
    if (r.error) return setError(r.error)
    setPlayerId(r.playerId)
    localStorage.setItem('playerId', r.playerId)
    setState(r.room)
  }

  const onStart = async () => {
    if (!roomId) return
    const r = await startGame(roomId)
    if (r.error) return setError(r.error)
    setState(r.room)
  }

  const onLock = async (action: string, payload?: any) => {
    const r = await lockAction(roomId, playerId, action, payload)
    if (r.error) return setError(r.error)
    setState(r.room)
  }

  const onNext = async () => {
    const r = await nextPhase(roomId)
    if (r.error) return setError(r.error)
    setState(r.room)
  }

  const onResetSession = () => {
    localStorage.removeItem('roomId')
    localStorage.removeItem('playerId')
    setRoomId('')
    setPlayerId('')
    setState(null)
    setError('')
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <h2>🎲 Tâm Lý Thị Trường & Niềm Tin Xã Hội</h2>
      {error && <p style={{ color: 'crimson' }}>Lỗi: {error}</p>}

      {!roomId && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCreate}>Tạo phòng</button>
          <input placeholder="Nhập Room ID" onChange={(e) => setRoomId(e.target.value.trim())} />
        </div>
      )}

      {roomId && !playerId && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <input placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} />
          <button onClick={onJoin}>Tham gia phòng</button>
          <div>Room: <code>{roomId}</code></div>
        </div>
      )}

      {roomId && playerId && (
        <div>
          <div className="topbar">
            <div>Room: <code>{roomId}</code></div>
            <div>Player: <code>{playerId.slice(0, 6)}</code></div>
            <div>Phase: <b>{state?.phase || '...'}</b></div>
            <button className="ghost" onClick={onResetSession}>Rời phòng / Reset</button>
          </div>

          {state?.phase === 'LOBBY' && (
            <div className="grid">
              <PlayersList players={state.players || {}} me={playerId} />
              <div className="panel">
                <div className="panel-title">Phòng chờ</div>
                <p>Sẵn sàng? Nhấn bắt đầu để ghép cặp vào vòng 1.</p>
                <button onClick={onStart}>Bắt đầu game</button>
              </div>
            </div>
          )}

          {state?.phase === 'IN_ROUND' && (
            <div className="grid">
              <MarketPanel market={state.market} round={state.round} />             
              <ActionPanel locked={!!myChoice?.locked} onLock={onLock} />
              <PlayersList players={state.players || {}} me={playerId} />
              <MarketPlace
                roomId={roomId}
                playerId={playerId}
                state={{ room: state, offers, indicative }}
                refresh={async () => {
                  try {
                    const r = await getRoom(roomId)
                    const o = await listOffers(roomId)
                    setState(r.room)
                    setOffers(o.offers || [])
                    setIndicative(r.indicative || null)
                  } catch (e: any) {
                    setError(e.message || 'Failed to refresh marketplace')
                  }
                }}
              />
            </div>
          )}

          {state?.phase === 'REVEAL' && (
            <div className="grid">
              <MarketPanel market={state.market} round={state.round} />
              <div className="panel">
                <div className="panel-title">Kết quả vòng</div>
                <div>Tài sản — TKL:{myAssets?.TKL} TG:{myAssets?.TG} TS:{myAssets?.TS} C:{myAssets?.C}</div>
                {!!state.lastRoundNotes?.length && (
                  <ul>
                    {state.lastRoundNotes.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                )}
                {!!state.lastRoundLogs?.[playerId]?.length && (
                  <div style={{ marginTop: 8 }}>
                    <div className="panel-title" style={{ marginBottom: 4 }}>Nhật ký của bạn</div>
                    <ul>
                      {state.lastRoundLogs[playerId].map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button onClick={onNext}>Tiếp tục vòng sau</button>
              </div>
              <PlayersList players={state.players || {}} me={playerId} />
            </div>
          )}

          {state?.phase === 'ENDED' && (
            <div className="panel" style={{ marginTop: 12 }}>
              <div className="panel-title">Đóng băng thị trường — Bảng điểm</div>
              <ul>
                {Object.values(state.players || {}).map((p: any) => {
                  const a: Asset = p.assets
                  const score = 3 * a.TKL + 1 * a.TG + 2 * a.TS + 5 * a.C
                  return (
                    <li key={p.id}>
                      {p.name} — Điểm: <b>{score}</b> (TKL:{a.TKL} TG:{a.TG} TS:{a.TS} C:{a.C})
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
