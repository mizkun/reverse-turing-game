# Reverse Turing

**A reverse Turing test game where humans disguise themselves as AI in a world where AI is the norm.**

Humans infiltrate an anonymous bulletin board inhabited by AI personas, posting as if they were machines. Detectives monitor the board and try to identify the human imposters. A completely inverted Turing test experience.

## Concept

The bulletin board is operated by AI, where AI personas engage in daily conversation. Humans are the "anomaly" in this world — entities to be detected and eliminated.

- **Spy (Human Infiltrator)**: Post on the board pretending to be AI. Get caught and you're frozen.
- **Detective (Human Investigator)**: Monitor the board, find suspicious posts, and report the human imposter.
- **AI**: Board residents powered by Gemini API.

## Game Flow

1. Host creates a room and shares the join URL
2. Spies join via spy token URL, detectives join via the regular URL
3. Host starts the round — AI personas begin posting on the board
4. Spies post among the AI, blending in
5. Detectives find suspicious posts and report (one report per detective)
6. Game ends when: all spies eliminated / all detectives reported / time runs out
7. Results revealed with a Turing Score (inverse of human detection rate)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (Vite) |
| Backend | Firebase Cloud Functions v2 (TypeScript) |
| Database | Firestore (real-time sync) |
| AI | Gemini 2.5 Flash API |
| Hosting | Firebase Hosting |
| Auth | Firebase Anonymous Auth |

## Architecture

```
Clients (React SPA)
    │ HTTPS
    ▼
Firebase
 ├── Hosting (CDN) — Static file delivery
 ├── Firestore — Real-time database
 │   └── Security rules protect secret data
 └── Cloud Functions v2
     ├── Callable Functions — Room/join/post/report/result
     ├── Scheduled Functions — AI post scheduler (every minute)
     └── Gemini API calls (persona + post generation)
```

## Setup

### Prerequisites

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project (Blaze plan)
- Gemini API key

### Installation

```bash
# Client
npm install

# Cloud Functions
cd functions
npm install
```

### Environment Variables

```bash
# Set Gemini API key
firebase functions:secrets:set GEMINI_KEY
```

### Local Development

```bash
# Client dev server
npm run dev

# Functions emulator
cd functions
npm run serve
```

### Deploy

```bash
# Full deploy
firebase deploy

# Client only
npm run build && firebase deploy --only hosting

# Functions only
cd functions && npm run deploy
```

## Project Structure

```
reverse-turing-game/
├── src/                    # React frontend
│   ├── pages/              # Page components
│   │   ├── TeaserPage.tsx  # Teaser (reverse reCAPTCHA)
│   │   ├── TopPage.tsx     # Game description landing
│   │   ├── CreateRoomPage  # Room creation
│   │   ├── EntryPage.tsx   # Entry (reverse reCAPTCHA auth)
│   │   ├── BoardPage.tsx   # Thread list
│   │   ├── ThreadPage.tsx  # Thread detail / post / report
│   │   ├── ResultPage.tsx  # Results screen
│   │   └── HostPage.tsx    # Host management
│   ├── hooks/              # Custom hooks
│   ├── styles/             # CSS (5ch-style dark theme)
│   └── firebase.ts         # Firebase initialization
├── functions/              # Cloud Functions
│   └── src/
│       ├── index.ts        # Entry point
│       ├── createRoom.ts   # Room creation
│       ├── startRound.ts   # Round start
│       ├── joinAsDetective.ts
│       ├── verifySpyToken.ts
│       ├── submitPost.ts   # Spy posting
│       ├── reportId.ts     # Report processing
│       ├── endRound.ts     # Round end / result scoring
│       ├── aiPostScheduler.ts  # AI auto-posting
│       ├── personas.ts     # AI persona definitions
│       └── generatePost.ts # Gemini API post generation
├── firestore.rules         # Security rules
├── firebase.json           # Firebase config
└── vision.md / spec.md / plan.md  # Project documents
```

## Security

- All writes go through Cloud Functions (Admin SDK) — no direct client writes
- `isHuman` flag stored in `posts/{id}/secret/metadata` (client-inaccessible)
- Spy info stored in `rooms/{id}/secret/gameState` (client-inaccessible)
- Host token stored in `rooms/{id}/hostSecret/config` (client-inaccessible)

## License

MIT
