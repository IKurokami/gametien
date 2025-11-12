import express from 'express'
import cors from 'cors'
import { cancelOffer, createOffer, createRoom, fillOffer, indicativePrices, joinRoom, lockAction, nextRoundOrEnd, publicState, startGame } from './engine.js'
import type { Action } from './types'

const app = express()
app.use(cors())
app.use(express.json())

const rooms: Record<string, ReturnType<typeof createRoom>> = {}

// Create a room
app.post('/rooms', (req, res) => {
  const cfg = req.body?.config || {}
  const room = createRoom(cfg)
  rooms[room.id] = room
  res.json({ roomId: room.id })
})

// Join a room
app.post('/rooms/:roomId/join', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  try {
    const p = joinRoom(room, req.body?.name || 'Player')
    res.json({ playerId: p.id, room: publicState(room) })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// Start game
app.post('/rooms/:roomId/start', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  try {
    startGame(room)
    res.json({ room: publicState(room) })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// Get state
app.get('/rooms/:roomId', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json({ room: publicState(room), indicative: indicativePrices(room) })
})

// Lock an action for this round
app.post('/rooms/:roomId/lock-action', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const { playerId, action, payload } = req.body || {}
  if (!playerId || !action) return res.status(400).json({ error: 'playerId and action required' })
  try {
    lockAction(room, String(playerId), String(action) as Action, payload)
    res.json({ room: publicState(room) })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// Move to next round or end
app.post('/rooms/:roomId/next', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  try {
    nextRoundOrEnd(room)
    res.json({ room: publicState(room) })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

// Marketplace
app.get('/rooms/:roomId/offers', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  res.json({ offers: room.offers.filter((o) => o.status === 'OPEN') })
})

app.post('/rooms/:roomId/offers', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const { sellerId, asset, amount } = req.body || {}
  try {
    const offer = createOffer(room, sellerId, asset, Number(amount))
    res.json({ offer, room: publicState(room) })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

app.post('/rooms/:roomId/offers/:offerId/cancel', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const { sellerId } = req.body || {}
  try {
    cancelOffer(room, sellerId, req.params.offerId)
    res.json({ room: publicState(room) })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

app.post('/rooms/:roomId/offers/:offerId/fill', (req, res) => {
  const room = rooms[req.params.roomId]
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const { buyerId } = req.body || {}
  try {
    fillOffer(room, buyerId, req.params.offerId)
    res.json({ room: publicState(room) })
  } catch (e: any) {
    res.status(400).json({ error: e.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Game backend listening on http://localhost:${PORT}`))
