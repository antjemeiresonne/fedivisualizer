# Fedivisualizer 🪐

Een immersieve 3D-visualisatie die het fediverse tot leven brengt. Zweef door een sterrenstelsel waar elke post een planeet is, en ervaar het gedecentraliseerde sociale web als een levend universum.

## Features

### Real-time Visualisatie
- **ActivityPub Integratie** - Live posts van Mastodon verschijnen als gloeiende planeten
- **Reply Chains** - Antwoorden spawnen dichtbij hun parent post en worden verbonden met gloeiende lijnen
- **Hashtag Clusters** - Posts met dezelfde hashtag groeperen samen in de ruimte
- **Influencer Orbits** - Top influencers verschijnen als grote planeten met volgers die eromheen draaien

### Webmentions
- **Komeet Effect** - Inkomende webmentions scheuren als komeet door de visualisatie
- **Homepage Sterren** - Goedgekeurde webmentions verschijnen als twinkelende sterren op de homepage
- **Verificatie & Goedkeuring** - Automatische verificatie met handmatige admin-goedkeuring
- **Interactieve Tooltips** - Hover over sterren voor details, klik om de bron te bezoeken

### Linked Data / SPARQL
- **RDF Triple Store** - Posts worden opgeslagen als Activity Streams 2.0 RDF triples
- **Influence Tracking** - SPARQL queries berekenen influence scores
- **Open Endpoints** - Export data als Turtle of JSON-LD

### Audio
- **Generatieve Geluiden** - Elke post type heeft een uniek geluid
- **Ambient Drone** - Achtergrond audio die reageert op activiteit
- **Komeet Effecten** - Geluidseffecten bij webmentions

## 🛠️ Technologieën

### Frontend (Client)
| Technologie | Doel |
|-------------|------|
| **Vue 3** | UI Framework met Composition API |
| **TypeScript** | Type-safe development |
| **Three.js** | WebGL 3D visualisatie |
| **Vite** | Build tool & dev server |
| **Vue Router** | Client-side routing |
| **Web Audio API** | Generatieve audio |

### Backend (Server)
| Technologie | Doel |
|-------------|------|
| **Node.js** | Runtime environment |
| **Express 5** | Web framework |
| **TypeScript** | Type-safe development |
| **rdflib** | RDF/SPARQL triple store |
| **bcryptjs** | Wachtwoord hashing |
| **WebSocket** | Mastodon streaming |
| **SSE** | Real-time client updates |

## 📁 Project Structuur

```
project_website/
├── client/                     # Frontend Vue applicatie
│   ├── public/                 # Statische bestanden
│   │   ├── favicon.svg         # ⭐ emoji favicon
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/
│   │   │   └── images/         # Afbeeldingen (profielfoto)
│   │   ├── components/
│   │   │   ├── atoms/          # Basis componenten
│   │   │   │   ├── FullscreenButton.vue
│   │   │   │   ├── FullscreenHint.vue
│   │   │   │   ├── LegendDot.vue
│   │   │   │   ├── SoundToggle.vue
│   │   │   │   └── WebmentionStars.vue
│   │   │   ├── molecules/      # Samengestelde componenten
│   │   │   │   ├── LegendItem.vue
│   │   │   │   ├── VisualizationLegend.vue
│   │   │   │   └── WebmentionForm.vue
│   │   │   ├── organisms/      # Complexe componenten
│   │   │   │   └── VisualizationOverlay.vue
│   │   │   └── NavHeader.vue
│   │   ├── composables/        # Herbruikbare logica
│   │   │   ├── useWebmentions.ts
│   │   │   └── visualization/
│   │   │       ├── index.ts
│   │   │       ├── types.ts
│   │   │       ├── useComets.ts
│   │   │       ├── useInfluenceOrbits.ts
│   │   │       ├── useInfluenceVisualization.ts
│   │   │       ├── usePlanets.ts
│   │   │       ├── useSounds.ts
│   │   │       └── useThreeScene.ts
│   │   ├── router/
│   │   │   └── index.ts        # Vue Router configuratie
│   │   ├── stores/
│   │   │   └── counter.ts      # Pinia store (voorbeeld)
│   │   ├── views/
│   │   │   ├── DetailsView.vue
│   │   │   ├── HomeView.vue
│   │   │   ├── ProfileView.vue
│   │   │   └── VisualizationView.vue
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                     # Backend Node.js applicatie
│   ├── app.ts                  # Express app configuratie
│   ├── server.ts               # Hoofdserver met alle endpoints
│   ├── mastodon.ts             # Mastodon WebSocket streaming
│   ├── rdf-store.ts            # RDF triple store & SPARQL
│   ├── package.json
│   └── tsconfig.json
│
├── .env                        # Environment variabelen
├── package.json                # Root package (workspaces)
├── pnpm-workspace.yaml         # PNPM workspace configuratie
└── README.md
```

## 🚀 Developer Guide

### Vereisten
- Node.js 18+
- pnpm 8+

### Installatie

```bash
# Clone repository
git clone <repo-url>
cd project_website

# Installeer dependencies (root, client & server)
pnpm install
```

### Environment Variables

Maak een `.env` bestand in de `server/` map:

```env
PORT=3000
ADMIN_SECRET_HASH=$2b$10$... # bcrypt hash van admin wachtwoord
```

Genereer een wachtwoord hash:
```bash
node -e "require('bcryptjs').hash('jouw-wachtwoord', 10).then(h => console.log(h))"
```

### Development

**Start beide servers (aanbevolen):**
```bash
# Terminal 1: Backend server
cd server
pnpm dev

# Terminal 2: Frontend dev server
cd client
pnpm dev
```

De frontend draait op `http://localhost:5173` met hot reload.
De backend draait op `http://localhost:3000`.

Vite proxied automatisch API calls naar de backend.

### Production Build

```bash
# Build frontend
cd client
pnpm build

# Build backend
cd ../server
pnpm build

# Start production server
pnpm start
```

De server serveert automatisch de gebouwde frontend vanuit `client/dist`.

## 📡 API Endpoints

### Publiek

| Endpoint | Methode | Beschrijving |
|----------|---------|--------------|
| `/events` | GET | SSE stream voor real-time updates |
| `/health` | GET | Server health check |
| `/mentions/approved` | GET | Goedgekeurde webmentions |
| `/webmention` | POST | Ontvang webmention |

### RDF / Linked Data

| Endpoint | Methode | Beschrijving |
|----------|---------|--------------|
| `/rdf/stats` | GET | Triple store statistieken |
| `/rdf/influencers` | GET | Top influencers |
| `/rdf/influence-graph` | GET | Volledige influence graph |
| `/rdf/turtle` | GET | Export als Turtle |
| `/rdf/jsonld` | GET | Export als JSON-LD |
| `/sparql?query=...` | GET | SPARQL queries |

### Admin (Authenticatie vereist)

| Endpoint | Methode | Beschrijving |
|----------|---------|--------------|
| `/admin/login` | POST | Admin login |
| `/mentions` | GET | Alle webmentions |
| `/mentions/:id/approve` | POST | Webmention goedkeuren |
| `/mentions/:id/reject` | POST | Webmention afwijzen |

### Test Endpoints

| Endpoint | Methode | Beschrijving |
|----------|---------|--------------|
| `/test-webmention` | POST | Test webmention (auto-approved) |
| `/test-webmention-pending` | POST | Test webmention (pending) |

## 🎨 Visualisatie Modi

De visualisatie ondersteunt drie modi:

1. **Posts** - Alleen real-time Mastodon posts
2. **Influencers** - Alleen influencer planeten met orbiters
3. **Both** - Beide visualisaties gecombineerd

## 🎵 Planeet Kleuren

| Kleur | Type |
|-------|------|
| 🟣 Indigo | Nieuwe posts |
| 🟪 Paars | Posts met hashtags |
| 🩷 Roze | Posts met mentions |
| 🔴 Rood | Posts met media |
| 🟠 Oranje | Replies |
| 🟡 Geel | Populaire posts |
| 🟢 Groen | Geboostte posts |
| 🩵 Teal | Lange content |
| 🔵 Cyaan | Korte content |
| 💙 Blauw | #Fedivisualizer hashtag |

## 🏆 Influencer Kleuren

| Rang | Kleur |
|------|-------|
| #1 | 🥇 Goud |
| #2 | 🥈 Zilver |
| #3 | 🥉 Brons |
| #4+ | Paars → Cyaan gradient |

## 📝 Webmention Sturen

### Via het formulier
Bezoek de [profiel pagina](/profile) en vul het webmention formulier in.

### Via cURL
```bash
curl -X POST https://jouw-domein.be/webmention \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "source=https://jouw-blog.com/post&target=https://jouw-domein.be/"
```

**Let op:** De source URL moet een link naar de target bevatten voor verificatie.

## 🤝 Bijdragen

1. Fork de repository
2. Maak een feature branch (`git checkout -b feature/amazing-feature`)
3. Commit je wijzigingen (`git commit -m 'Add amazing feature'`)
4. Push naar de branch (`git push origin feature/amazing-feature`)
5. Open een Pull Request

## 📄 Licentie

Dit project is gemaakt voor Webtopics Advanced aan Odisee Gent.

---

Gemaakt met ❤️ door Antje Meiresonne

