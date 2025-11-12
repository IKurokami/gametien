Game: Tâm Lý Thị Trường & Niềm Tin Xã Hội

Monorepo structure
- backend: Node.js + Express (TypeScript), in-memory game engine.
- mlngame: React + TypeScript (Vite) frontend.
- docs: Game rules and design notes.
  - See docs/rules.md for luật chơi.
  - See docs/why.md for "điểm hay" và mục tiêu trải nghiệm.

Run locally
1) Backend
   - cd backend
   - npm install
   - npm run dev
   - Serves at http://localhost:4000

2) Frontend
   - cd mlngame
   - cp .env.example .env (adjust VITE_API_BASE if needed)
   - npm install
   - npm run dev
   - Open the printed localhost URL (typically http://localhost:5173)

Quick flow
- Create a room in the UI (or POST /rooms).
- Share the Room ID with players; each joins with a name.
- Click "Bắt đầu game" to start round 1.
- Each player picks an action per round. Auto-reveal when everyone locks or when time is up.
- Click "Tiếp tục vòng sau" to advance until the game ends and scores are shown.

Notes
- MVP deck: subset of events affecting N, inflation, crypto crash.
- Pairing auto-assigns opponents each round; odd player rests.
- Assets and fees follow the rules in docs.
