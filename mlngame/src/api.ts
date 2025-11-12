const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export async function createRoom() {
  const r = await fetch(`${API_BASE}/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
  return r.json()
}

export async function joinRoom(roomId: string, name: string) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
  return r.json()
}

export async function getRoom(roomId: string) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}`)
  return r.json()
}

export async function startGame(roomId: string) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/start`, { method: 'POST' })
  return r.json()
}

export async function lockAction(roomId: string, playerId: string, action: string, payload?: any) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/lock-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, action, payload }),
  })
  return r.json()
}

export async function nextPhase(roomId: string) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/next`, { method: 'POST' })
  return r.json()
}

// Marketplace
export async function listOffers(roomId: string) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/offers`)
  return r.json()
}

export async function createOffer(roomId: string, sellerId: string, asset: 'TKL'|'TG'|'C', amount: number) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sellerId, asset, amount }),
  })
  return r.json()
}

export async function cancelOffer(roomId: string, offerId: string, sellerId: string) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/offers/${offerId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sellerId }),
  })
  return r.json()
}

export async function fillOffer(roomId: string, offerId: string, buyerId: string) {
  const r = await fetch(`${API_BASE}/rooms/${roomId}/offers/${offerId}/fill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buyerId }),
  })
  return r.json()
}
