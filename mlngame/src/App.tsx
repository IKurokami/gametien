import { useEffect, useMemo, useState } from 'react'
import { createRoom, getRoom, joinRoom, listOffers, lockAction, nextPhase, startGame } from './api'
import MarketPanel from './components/MarketPanel'
import PlayersList from './components/PlayersList'
import ActionPanel from './components/ActionPanel'
import MarketPlace from './components/MarketPlace'
import Rules from './components/Rules'

type Asset = { TKL: number; TG: number; TS: number; C: number }

export default function App() {
  const [route, setRoute] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '')
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const isRules = route.startsWith('#/rules')
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

  // const myPair = useMemo(() => {
  //   if (!state?.round || !playerId) return null
  //   const p = state.round.pairings.find((pr: any) => pr.a === playerId || pr.b === playerId)
  //   return p || null
  // }, [state, playerId])

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

  // Full-screen centered layouts for initial steps
  if (isRules) {
    return (
      <div className="min-h-screen w-full grid place-items-center bg-background">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button className="rounded-md border border-dashed border-border px-3 py-2 hover:opacity-90" onClick={() => (window.location.hash = '')}>← Quay lại</button>
        </div>
        <Rules />
      </div>
    )
  }

  if (!roomId) {
    return (
      <div className="min-h-screen w-full grid place-items-center bg-background">
        <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold mb-1">Tạo phòng chơi</h1>
            <p className="opacity-80">Bắt đầu phiên mới hoặc nhập mã phòng để tham gia.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="flex-1 rounded-md border border-input bg-primary text-primary-foreground px-4 py-2.5 hover:opacity-90" onClick={onCreate}>Tạo phòng</button>
            <input className="flex-[2] rounded-md border border-input bg-background px-3 py-2.5" placeholder="Nhập Room ID để tham gia" onChange={(e) => setRoomId(e.target.value.trim())} />
          </div>
          <div className="mt-3 text-xs text-center opacity-70">Nhập Room ID sẽ chuyển bạn tới màn hình nhập tên.</div>
          <div className="mt-4 text-center">
            <button className="text-sm underline opacity-90 hover:opacity-100" onClick={() => (window.location.hash = '#/rules')}>Tìm hiểu luật chơi</button>
          </div>
        </div>
      </div>
    )
  }

  if (roomId && !playerId) {
    return (
      <div className="min-h-screen w-full grid place-items-center bg-background">
        <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm opacity-80">Room: <code className="opacity-100">{roomId}</code></div>
            <button className="rounded-md border border-dashed border-border px-3 py-2 hover:opacity-90" onClick={onResetSession}>Rời phòng / Reset</button>
          </div>
          <h1 className="text-2xl font-bold mb-3 text-center">Nhập tên để tham gia</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <input className="flex-1 rounded-md border border-input bg-background px-3 py-2.5" placeholder="Tên của bạn" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="rounded-md border border-input bg-secondary px-4 py-2.5 hover:bg-secondary/70" onClick={onJoin}>Tham gia phòng</button>
          </div>
          <div className="mt-4 text-center">
            <button className="text-sm underline opacity-90 hover:opacity-100" onClick={() => (window.location.hash = '#/rules')}>Tìm hiểu luật chơi</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto p-4 bg-background">
      <h2 className="text-2xl font-semibold">🎲 Tâm Lý Thị Trường & Niềm Tin Xã Hội</h2>
      {error && <p className="text-red-500">Lỗi: {error}</p>}

      {roomId && playerId && (
        <div>
          <div className="flex gap-3 items-center flex-wrap mb-2">
            <div>Room: <code>{roomId}</code></div>
            <div>Player: <code>{playerId.slice(0, 6)}</code></div>
            <div>Phase: <b>{state?.phase || '...'}</b></div>
            <button className="bg-transparent border border-dashed border-border px-3 py-2 rounded-md" onClick={onResetSession}>Rời phòng / Reset</button>
            <button className="text-sm underline opacity-90 hover:opacity-100" onClick={() => (window.location.hash = '#/rules')}>Luật chơi</button>
          </div>

          {state?.phase === 'LOBBY' && (
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(580px,1fr))] gap-3 items-start">
              <PlayersList players={state.players || {}} me={playerId} />
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="font-bold mb-2">Phòng chờ</div>
                <p className="mb-2">Sẵn sàng? Nhấn bắt đầu để ghép cặp vào vòng 1.</p>
                <button className="rounded-md border border-input bg-primary text-primary-foreground px-3 py-2 hover:opacity-90" onClick={onStart}>Bắt đầu game</button>
              </div>
            </div>
          )}

          {state?.phase === 'IN_ROUND' && (
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(580px,1fr))] gap-3 items-start">
              <MarketPanel market={state.market} round={state.round} indicative={indicative} />             
              <ActionPanel locked={!!myChoice?.locked} onLock={onLock} myTS={myAssets?.TS} indicative={indicative} />
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
            <div className="grid [grid-template-columns:repeat(auto-fit,minmax(580px,1fr))] gap-3 items-start">
              <MarketPanel market={state.market} round={state.round} />
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="font-bold mb-2">Kết quả vòng</div>
                <div className="mb-2">Tài sản — TKL:{myAssets?.TKL} TG:{myAssets?.TG} TS:{myAssets?.TS} C:{myAssets?.C}</div>
                {/* Chỉ hiển thị các nhật ký ảnh hưởng trực tiếp tới người chơi */}
                {!!state.lastRoundLogs?.[playerId]?.length && (
                  <div className="mt-2">
                    <div className="font-bold mb-1">Nhật ký của bạn</div>
                    <ul>
                      {state.lastRoundLogs[playerId].map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button className="mt-2 rounded-md border border-input bg-primary text-primary-foreground px-3 py-2 hover:opacity-90" onClick={onNext}>Tiếp tục vòng sau</button>
              </div>
              <PlayersList players={state.players || {}} me={playerId} />
            </div>
          )}

          {state?.phase === 'ENDED' && (
            <div className="bg-card border border-border rounded-lg p-3 mt-3">
              <div className="font-bold mb-2">Đóng băng thị trường — Bảng điểm</div>
              <ul>
                {Object.values(state.players || {}).map((p: any) => {
                  const a: Asset = p.assets
                  const ind = indicative || { TKL: 3, TG: 1, TS: 2, C: 5 }
                  const score = (a.TKL * (ind.TKL || 0)) + (a.TG * (ind.TG || 0)) + (a.TS * (ind.TS || 0)) + (a.C * (ind.C || 0))
                  return (
                    <li key={p.id}>
                      {p.name} — Giá trị danh mục: <b>{score}</b> (TKL:{a.TKL} TG:{a.TG} TS:{a.TS} C:{a.C})
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
