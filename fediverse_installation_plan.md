# Fediverse Audiovisuele Installatie - 4-Dagen Projectplan

## Projectoverzicht

Een audiovisuele installatie die real-time activiteit in het fediverse visualiseert door ActivityPub streams en Webmentions om te zetten in dynamische patronen en geluiden via TouchDesigner.

### Technische Stack
- **ActivityPub**: Publieke Mastodon API (geen eigen server nodig)
- **Webmentions**: Eigen endpoint + statische website
- **Middleware**: Node.js server (lokaal of gratis hosting)
- **Visualisatie**: TouchDesigner
- **Kosten**: €0-10 (optioneel domein)

---

## DAG 1: Infrastructuur & Data Pipeline (8-10 uur)

### Ochtend Deel 1: Website + Webmention Endpoint (3 uur)

#### 1. Statische Website Maken (45 min)

**GitHub Pages setup:**
```bash
# Maak repository
mkdir fediverse-installation
cd fediverse-installation
git init
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fediverse Audiovisuele Installatie</title>
  
  <!-- WEBMENTION ENDPOINT -->
  <link rel="webmention" href="https://jouw-middleware.onrender.com/webmention" />
  
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { color: #2c3e50; }
    .project-info { background: #ecf0f1; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Live Fediverse Visualisatie</h1>
  
  <div class="project-info">
    <h2>Over het Project</h2>
    <p>Deze audiovisuele installatie brengt gedecentraliseerde sociale netwerken tot leven door real-time activiteit in het fediverse te visualiseren.</p>
    
    <p>Elke post, reply, en boost wordt omgezet in dynamische patronen en geluiden via TouchDesigner.</p>
    
    <h3>Technologie</h3>
    <ul>
      <li><strong>ActivityPub</strong>: Live data van Mastodon servers</li>
      <li><strong>Webmentions</strong>: Tracking van web presence</li>
      <li><strong>Linked Data</strong>: Semantische verbindingen tussen posts</li>
      <li><strong>TouchDesigner</strong>: Generatieve visuals en audio</li>
    </ul>
    
    <h3>Volg het Project</h3>
    <p>Gebruik hashtag <strong>#FediverseVisualisatie</strong> op Mastodon om deel te nemen aan de installatie!</p>
  </div>
  
  <footer style="margin-top: 40px; color: #7f8c8d;">
    <p>Link naar deze pagina op sociale media om een webmention te triggeren en onderdeel te worden van de visualisatie.</p>
  </footer>
</body>
</html>
```

**Deploy:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
# Enable GitHub Pages in repository settings
# URL: https://jouwnaam.github.io/fediverse-installation
```

#### 2. Webmention Endpoint Implementatie (2 uur)

**server.js:**
```javascript
const express = require('express');
const WebSocket = require('ws');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// WebSocket server voor TouchDesigner
const wss = new WebSocket.Server({ port: 8080 });

// In-memory storage
let webmentions = [];
let lastMentionId = 0;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WEBMENTION ENDPOINT
app.post('/webmention', async (req, res) => {
  const { source, target } = req.body;
  
  console.log('📨 Webmention ontvangen:', { source, target });
  
  if (!source || !target) {
    return res.status(400).json({ 
      error: 'Missing source or target parameter' 
    });
  }
  
  res.status(202).json({ 
    message: 'Webmention accepted',
    status: 'pending'
  });
  
  verifyWebmention(source, target);
});

async function verifyWebmention(source, target) {
  try {
    const response = await fetch(source);
    const html = await response.text();
    const isValid = html.includes(target);
    
    if (isValid) {
      const mention = {
        id: ++lastMentionId,
        source: source,
        target: target,
        verified: true,
        timestamp: new Date().toISOString(),
        content: extractContent(html, target)
      };
      
      webmentions.push(mention);
      console.log('✅ Webmention geverifieerd:', mention);
      
      broadcastToTouchDesigner({
        type: 'webmention',
        data: mention
      });
    }
  } catch (error) {
    console.error('Webmention verificatie error:', error);
  }
}

function extractContent(html, target) {
  const index = html.indexOf(target);
  if (index === -1) return '';
  
  const start = Math.max(0, index - 200);
  const end = Math.min(html.length, index + 200);
  return html.substring(start, end).replace(/<[^>]*>/g, '').trim();
}

// API endpoints
app.get('/mentions', (req, res) => {
  res.json({
    count: webmentions.length,
    mentions: webmentions
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

function broadcastToTouchDesigner(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Webmention server: http://localhost:${PORT}`);
  console.log(`📡 WebSocket server: port 8080`);
});
```

**package.json:**
```json
{
  "name": "fediverse-webmention-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "node-fetch": "^2.7.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Testen:**
```bash
npm install
npm start

# Test:
curl -X POST http://localhost:3000/webmention \
  -d "source=https://example.com&target=https://jouwnaam.github.io/fediverse-installation"
```

### Ochtend Deel 2: ActivityPub Stream Setup (2 uur)

**Voeg toe aan server.js:**

```javascript
const WebSocket = require('ws');

let mastodonStream = null;

function connectMastodon() {
  console.log('🐘 Verbinden met Mastodon public stream...');
  
  mastodonStream = new WebSocket('wss://mastodon.social/api/v1/streaming/public');
  
  mastodonStream.on('open', () => {
    console.log('✅ Mastodon stream verbonden');
  });
  
  mastodonStream.on('message', (data) => {
    try {
      const event = JSON.parse(data);
      
      if (event.event === 'update') {
        const post = JSON.parse(event.payload);
        
        const processedPost = {
          id: post.id,
          content: post.content.replace(/<[^>]*>/g, ''),
          author: post.account.username,
          avatar: post.account.avatar,
          createdAt: post.created_at,
          favourites: post.favourites_count,
          reblogs: post.reblogs_count,
          replies: post.replies_count,
          tags: post.tags.map(t => t.name),
          mentions: post.mentions.map(m => m.username),
          mediaAttachments: post.media_attachments.length,
          inReplyTo: post.in_reply_to_id,
          url: post.url
        };
        
        broadcastToTouchDesigner({
          type: 'activitypub',
          data: processedPost
        });
        
        console.log(`📝 @${processedPost.author}: ${processedPost.content.substring(0, 50)}...`);
      }
    } catch (error) {
      console.error('Error processing Mastodon message:', error);
    }
  });
  
  mastodonStream.on('error', (error) => {
    console.error('❌ Mastodon stream error:', error);
  });
  
  mastodonStream.on('close', () => {
    console.log('🔌 Mastodon stream gesloten, herverbinden in 5 sec...');
    setTimeout(connectMastodon, 5000);
  });
}

connectMastodon();

// Hashtag monitoring
async function pollHashtag() {
  try {
    const response = await fetch('https://mastodon.social/api/v1/timelines/tag/FediverseVisualisatie?limit=20');
    const posts = await response.json();
    
    posts.forEach(post => {
      broadcastToTouchDesigner({
        type: 'project_hashtag',
        data: {
          id: post.id,
          author: post.account.username,
          content: post.content.replace(/<[^>]*>/g, ''),
          createdAt: post.created_at,
          url: post.url
        }
      });
    });
    
    console.log(`#️⃣ Hashtag check: ${posts.length} posts`);
  } catch (error) {
    console.error('Hashtag poll error:', error);
  }
}

setInterval(pollHashtag, 30000);
pollHashtag();
```

### Middag: Deployment (2 uur)

**Render.com (Gratis)**

1. Maak account op render.com
2. New → Web Service
3. Connect GitHub repository
4. Build: `npm install`
5. Start: `node server.js`
6. Deploy
7. Noteer URL: `https://jouw-app.onrender.com`

**Update index.html:**
```html
<link rel="webmention" href="https://jouw-app.onrender.com/webmention" />
```

### Avond: Testen & Debuggen (2 uur)

**Test 1: Webmention**
```bash
# Via Telegraph: https://telegraph.p3k.io/

# Of curl:
curl -X POST https://jouw-app.onrender.com/webmention \
  -d "source=https://test.com&target=https://jouwnaam.github.io/fediverse-installation"
```

**Test 2: Echte Webmention**
1. Post je GitHub Pages URL op Mastodon
2. Gebruik Bridgy (brid.gy) voor social→webmention conversie
3. Vraag iemand je URL te delen

**Test 3: ActivityPub Stream**
```bash
curl https://jouw-app.onrender.com/health

# WebSocket test (browser console):
const ws = new WebSocket('wss://jouw-app.onrender.com:8080');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

**Deliverable Dag 1:**
- ✅ Live website met webmention endpoint
- ✅ Server die ActivityPub + Webmentions ontvangt
- ✅ WebSocket stream voor TouchDesigner
- ✅ Gedocumenteerde endpoints

---

## DAG 2: TouchDesigner Basis Setup (8-10 uur)

### Ochtend: TouchDesigner Fundamentals (3 uur)

#### 1. Installatie & Basics (1 uur)
- Download TouchDesigner (gratis non-commercial)
- **Tutorials** (30 min each):
  - "Introduction to TouchDesigner" - Matthew Ragan
  - "Working with CHOPs and Real-time Data"

#### 2. WebSocket Verbinding (1 uur)

**Network Setup:**
```python
# Add: Web Client DAT
# Parameters:
# - Request: ws://jouw-app.onrender.com:8080
# - Active: ON
# - Auto Reconnect: ON

# Add: DAT Execute (link to Web Client DAT)
```

**DAT Execute script:**
```python
def onReceiveText(dat, msg):
    import json
    
    try:
        data = json.loads(msg)
        msg_type = data.get('type')
        payload = data.get('data')
        
        if msg_type == 'activitypub':
            op('activitypub_data').text = json.dumps(payload, indent=2)
            op('trigger_post').click()
            
        elif msg_type == 'webmention':
            op('webmention_data').text = json.dumps(payload, indent=2)
            op('trigger_mention').click()
            
        elif msg_type == 'project_hashtag':
            op('hashtag_data').text = json.dumps(payload, indent=2)
            op('trigger_highlight').click()
            
    except Exception as e:
        print(f"Error: {e}")
```

#### 3. Data → CHOPs Conversie (1 uur)

```python
# Add: Text DAT (naam: activitypub_data)
# Add: Convert DAT (JSON → Table)
# Add: DAT to CHOP

def extractData(dat):
    import json
    
    try:
        data = json.loads(dat.text)
        
        channels = {
            'favourites': data.get('favourites', 0),
            'reblogs': data.get('reblogs', 0),
            'replies': data.get('replies', 0),
            'has_media': 1 if data.get('mediaAttachments', 0) > 0 else 0,
            'tag_count': len(data.get('tags', [])),
            'is_reply': 1 if data.get('inReplyTo') else 0
        }
        
        return channels
    except:
        return {}
```

### Middag: Eerste Visualisatie (3 uur)

#### Basis Visuele Structuur

**Network:**
```
WebSocket → DAT Execute → Text DAT → Convert → CHOP
                                                  ↓
Circle TOP ← Noise TOP ← Math CHOP ← Filter CHOP ←┘
```

**Circle TOP parameters:**
```python
# Resolution: 512x512
# Radius: CHOP channel 'post_size'
# Color: RGB channels 'post_color_*'
```

**Noise TOP:**
```python
# Type: Perlin
# Amplitude: 0.3
# Speed: 0.5
```

**Math CHOP mapping:**
```python
# Favourites → grootte
out = fit(in, 0, 100, 0.1, 1.0)

# Tag count → kleur
hue = fit(in, 0, 10, 0, 360)
```

#### Event System

```python
# Add: Count CHOP (triggered by DAT Execute)
# Add: Speed CHOP (detect changes)
# Add: Logic CHOP (pulse on change)

def onReceiveText(dat, msg):
    # ... parsing ...
    counter = op('event_counter')
    counter.par.value = counter.par.value.eval() + 1
```

**Particle system:**
```python
# Add: SOP (geometry)
# Add: Instance SOP
# - Target: Circle TOP
# - Points: CHOP positions

# Posities:
x = noise(post_id, time) * 2 - 1
y = sin(time + post_id) * 0.5
z = 0
```

### Avond: Type Differentiatie (2-3 uur)

#### ActivityPub Posts (Blauw)
```python
# Circle TOP
# Color: RGB(0.2, 0.4, 0.8)
# Radius: favourites * 0.01
# Lifetime: 10 sec
# Fade: laatste 2 sec
```

#### Webmentions (Rood/Oranje)
```python
# Rectangle TOP
# Color: RGB(0.9, 0.3, 0.1)
# Size: larger
# Position: center → radiate
# Lifetime: 20 sec
# Effect: pulse
```

#### Project Hashtag (Geel)
```python
# Custom shape
# Color: RGB(1.0, 0.9, 0.1)
# Effect: Bloom TOP (glow)
# Position: center
```

**Composite layers:**
```
Background Noise     → Layer 0
ActivityPub (blue)   → Layer 1
Webmentions (red)    → Layer 2 (blend: Add)
Hashtag (yellow)     → Layer 3 (blend: Screen)
```

**Deliverable Dag 2:**
- ✅ TouchDesigner met live WebSocket
- ✅ Werkende visualisatie (posts = circles)
- ✅ 3 visuele types (ActivityPub, Webmention, Hashtag)
- ✅ Real-time reactie op data

---

## DAG 3: Linked Data & Audio (8-10 uur)

### Ochtend: Linked Data Visualisatie (4 uur)

#### Reply Chains (Conversatie Threads)

**Server.js enhancement:**
```javascript
const postCache = new Map();

function processPost(post) {
  postCache.set(post.id, post);
  
  if (post.in_reply_to_id && postCache.has(post.in_reply_to_id)) {
    const parent = postCache.get(post.in_reply_to_id);
    
    broadcastToTouchDesigner({
      type: 'connection',
      data: {
        from: post.id,
        to: post.in_reply_to_id,
        fromAuthor: post.account.username,
        toAuthor: parent.account.username
      }
    });
  }
}
```

**TouchDesigner - Lijnen:**
```python
def createConnection(fromId, toId):
    fromPos = op(f'post_{fromId}').par.t
    toPos = op(f'post_{toId}').par.t
    
    line = op('connections').appendRow([
        fromPos[0], fromPos[1], fromPos[2],
        toPos[0], toPos[1], toPos[2]
    ])
    
    animateLine(line)
```

**SOP Network:**
```
Add SOP (post positions)
  ↓
Line SOP (reply connections)
  ↓
Tube SOP (thickness)
  ↓
Material (glow, color)
```

#### Hashtag Clustering

```python
def calculateHashtagPosition(tags):
    positions = []
    for tag in tags:
        hash_val = hash(tag) % 360
        x = cos(radians(hash_val))
        y = sin(radians(hash_val))
        positions.append((x, y))
    
    if positions:
        avg_x = sum(p[0] for p in positions) / len(positions)
        avg_y = sum(p[1] for p in positions) / len(positions)
        return (avg_x, avg_y)
    
    return (0, 0)
```

**Force-directed graph:**
```python
# Add: Force SOP
# - Same hashtag: attract (0.5)
# - Different: repel (0.1)
# - Center: weak attract (0.05)
```

#### Mention Network

```python
for mention in post.mentions:
    create_link(post.author, mention, style='dashed')

# Visueel:
# - Solid lines = replies
# - Dashed lines = mentions
# - Thickness = frequency
```

### Middag: Audio Synthese (4 uur)

#### Basis Audio Setup

```python
# Add: Audio Oscillator CHOP
# Type: Sine wave
# Frequency: CHOP controlled

# Add: Audio Filter CHOP
# Type: Lowpass
# Cutoff: activity based

# Add: Audio Device Out CHOP
```

#### Data → Sound Mapping

**ActivityPub:**
```python
# Frequency mapping
freq = fit(favourites, 0, 100, 200, 800)

# Harmonics
harmonics = min(tag_count, 5)

# Percussive for replies
if is_reply:
    trigger_drum_hit()

# Oscillator CHOP:
# Base: op('post_data')['favourites'] * 6 + 200
```

**Webmentions:**
```python
freq = 150  # Bass
duration = 2.0
envelope = 'bell'

# Envelope CHOP:
# Attack: 0.1
# Decay: 0.3
# Sustain: 0.5
# Release: 1.1
```

**Project Hashtag:**
```python
# Major chord
frequencies = [440, 554.37, 659.25]  # A major
duration = 3.0
effect = 'chorus'
```

#### Polyphonie

```python
class VoiceManager:
    def __init__(self, max_voices=8):
        self.voices = []
        self.max_voices = max_voices
    
    def trigger(self, freq, duration, type):
        if len(self.voices) >= self.max_voices:
            self.voices.pop(0)
        
        voice = {
            'osc': op(f'osc_{len(self.voices)}'),
            'freq': freq,
            'duration': duration,
            'type': type
        }
        self.voices.append(voice)
```

**Mixing:**
```python
# Math CHOP (Mix)
activity_level = len(active_voices) / max_voices
master_volume = fit(activity_level, 0, 1, 0.3, 0.8)
```

#### Spatiale Audio

```python
def calculate_pan(x_position):
    return x_position  # -1 (left) to 1 (right)

# Audio Para CHOP
# Pan per voice based on visual position
```

### Avond: Integratie & Testing (2 uur)

**Sync audio + visual:**
```python
# Per post:
# 1. Visual spawn
# 2. Audio trigger
# 3. Same duration/envelope

visual_lifetime = 10  # sec
audio_duration = 2    # sec (begin only)
```

**Performance testing:**
```javascript
// server.js test mode
if (process.env.TEST_MODE) {
    setInterval(() => {
        broadcastToTouchDesigner({
            type: 'activitypub',
            data: generateFakePost()
        });
    }, 100); // 10 posts/sec
}
```

**Optimization:**
```python
if active_particles > 150:
    reduce_visual_quality()

# - Max particles: 200
# - Cull old: >30 sec
# - Reduce resolution on load
# - LOD system
```

**Deliverable Dag 3:**
- ✅ Reply chains (lijnen tussen posts)
- ✅ Hashtag clustering
- ✅ Audio systeem (3 geluiden)
- ✅ Audio-visual sync
- ✅ Performance tested

---

## DAG 4: Polish, Stabiliteit & Presentatie (8-10 uur)

### Ochtend: Stabiliteit & Error Handling (3 uur)

#### Server Hardening

**Reconnect logica:**
```javascript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function connectMastodon() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Max reconnect bereikt');
        startPollingMode();
        return;
    }
    
    mastodonStream = new WebSocket('wss://mastodon.social/api/v1/streaming/public');
    
    mastodonStream.on('open', () => {
        console.log('✅ Verbonden');
        reconnectAttempts = 0;
    });
    
    mastodonStream.on('close', () => {
        reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`🔄 Herverbinden in ${delay/1000}s`);
        setTimeout(connectMastodon, delay);
    });
}

function startPollingMode() {
    console.log('📡 Polling mode');
    setInterval(async () => {
        const posts = await fetch('https://mastodon.social/api/v1/timelines/public?limit=40')
            .then(r => r.json());
        posts.forEach(processPost);
    }, 5000);
}
```

**Rate limiting:**
```javascript
const messageQueue = [];
const MESSAGE_INTERVAL = 100; // ms

setInterval(() => {
    if (messageQueue.length > 0) {
        const msg = messageQueue.shift();
        broadcastToTouchDesigner(msg);
    }
}, MESSAGE_INTERVAL);

function queueMessage(msg) {
    messageQueue.push(msg);
    if (messageQueue.length > 100) {
        messageQueue.shift(); // Drop oldest
    }
}
```

#### TouchDesigner Stabiliteit

**Graceful degradation:**
```python
fps = op('fps_monitor').par.value

if fps < 30:
    op('render_quality').par.value = 'medium'
    op('max_particles').par.value = 100
elif fps < 20:
    op('render_quality').par.value = 'low'
    op('max_particles').par.value = 50
else:
    op('render_quality').par.value = 'high'
    op('max_particles').par.value = 200
```

**Connection monitoring:**
```python
def onDisconnect(dat):
    print("⚠️ Verbinding verloren")
    op('connection_status').par.display = True
    op('status_text').text = "Reconnecting..."
    
    op('web_client').par.active = False
    op('web_client').par.active = True

def onConnect(dat):
    print("✅ Verbinding hersteld")
    op('connection_status').par.display = False
```

**Data validation:**
```python
def validateData(data):
    required_fields = ['id', 'author', 'content']
    
    for field in required_fields:
        if field not in data:
            print(f"⚠️ Missing: {field}")
            return False
    
    if not isinstance(data.get('favourites', 0), (int, float)):
        data['favourites'] = 0
    
    return True
```

### Middag: Visual Polish (3 uur)

#### Color Grading

```python
# Color palette
BACKGROUND = (0.05, 0.05, 0.1)
ACTIVITYPUB = (0.3, 0.5, 0.9)
WEBMENTION = (0.9, 0.4, 0.2)
HASHTAG = (1.0, 0.9, 0.3)
CONNECTIONS = (0.5, 0.7, 0.9, 0.3)

# Post-processing:
# Base → Bloom → Color Correct → Sharpen → Output
```

#### Camera Movement

```python
# Camera COMP - slow orbit
time = me.time.seconds
radius = 3.0
height = 1.5

cam_x = cos(time * 0.1) * radius
cam_y = height
cam_z = sin(time * 0.1) * radius

op('cam').par.tx = cam_x
op('cam').par.ty = cam_y
op('cam').par.tz = cam_z
```

#### UI Overlay

```python
# Add: Text TOP
# Display:
# - Connection status
# - Current activity count
# - Recent hashtags
# - FPS counter

# Minimal, top-right corner
# Semi-transparent background
```

### Avond: Documentatie & Backup (2-3 uur)

#### Project Documentatie

**README.md:**
```markdown
# Fediverse Audiovisuele Installatie

## Setup
1. Clone repository
2. `npm install`
3. `npm start`
4. Open TouchDesigner project
5. Connect WebSocket

## Endpoints
- Webmention: POST /webmention
- Health: GET /health
- Mentions: GET /mentions

## Testing
- Webmention: https://telegraph.p3k.io/
- ActivityPub: auto-connects to mastodon.social

## Troubleshooting
- Check server logs
- Verify WebSocket connection
- Test endpoints with curl
```

#### Backup Strategy

```bash
# TouchDesigner
# File → Save As → backup_v1.toe
# File → Save As → backup_v2.toe

# Git commit
git add .
git commit -m "Final working version"
git push

# Screen recording (OBS)
# Record 5-10 min demo
```

#### Contingency Plan

**Fallback data:**
```javascript
// If live stream fails
const FALLBACK_DATA = [
    // Pre-recorded sample data
];

if (connectionFailed) {
    playbackFallbackData();
}
```

**Manual trigger:**
```python
# TouchDesigner button
# Manually trigger events for demo
```

### Final Check (1 uur)

**Checklist:**
- [ ] Server deployed en bereikbaar
- [ ] Website live op GitHub Pages
- [ ] Webmentions worden ontvangen
- [ ] ActivityPub stream werkt
- [ ] TouchDesigner verbindt met WebSocket
- [ ] Visuals reageren op data
- [ ] Audio werkt (test speakers!)
- [ ] 3 data types hebben unieke visuals