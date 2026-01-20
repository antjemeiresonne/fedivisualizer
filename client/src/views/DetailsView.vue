<script setup lang="ts">
const techStack = [
  {
    name: 'ActivityPub',
    description: 'Live data streams van Mastodon via Server-Sent Events',
    icon: '🐘',
  },
  {
    name: 'Webmentions',
    description: 'Eigen endpoint voor web presence tracking met komeet-effect en sterren',
    icon: '🔗',
  },
  {
    name: 'Linked Data / SPARQL',
    description: 'RDF triple store met Activity Streams 2.0 voor influence tracking',
    icon: '🔮',
  },
  {
    name: 'Three.js',
    description: 'WebGL visualisatie met custom shaders voor planeten en sterren',
    icon: '🌐',
  },
  {
    name: 'Web Audio API',
    description: 'Geluiden en ambient drone per post type',
    icon: '🔊',
  },
  {
    name: 'Node.js + Express',
    description: 'Server voor SSE streaming en data processing',
    icon: '⚡',
  },
  {
    name: 'Vue 3 + TypeScript',
    description: 'Frontend met atomic design composables',
    icon: '💚',
  },
]

const planetColors = [
  { name: 'Nieuwe Posts', color: '#6366f1', description: 'Standaard posts zonder speciale kenmerken' },
  { name: 'Heeft Tags', color: '#8b5cf6', description: 'Posts met hashtags - clusteren samen' },
  { name: 'Heeft Mentions', color: '#ec4899', description: 'Posts die andere gebruikers taggen' },
  { name: 'Heeft Media', color: '#ef4444', description: 'Posts met afbeeldingen of video' },
  { name: 'Replies', color: '#f97316', description: 'Antwoorden - verbonden met lijnen' },
  { name: 'Populair', color: '#eab308', description: 'Posts met veel likes of boosts' },
  { name: 'Geboost', color: '#22c55e', description: 'Posts die gerepost zijn' },
  { name: 'Lange Content', color: '#14b8a6', description: 'Posts met meer dan 200 karakters' },
  { name: 'Korte Content', color: '#06b6d4', description: 'Posts met minder dan 50 karakters' },
  { name: 'Project Hashtag', color: '#3b82f6', description: '#Fedivisualizer posts' },
]

const influencerColors = [
  { name: 'Top 1 Influencer', color: '#ffd700', description: 'Goud - Meeste invloed (reblogs + likes + replies)' },
  { name: 'Top 2 Influencer', color: '#c0c0c0', description: 'Zilver - Tweede hoogste invloed' },
  { name: 'Top 3 Influencer', color: '#cd7f32', description: 'Brons - Derde hoogste invloed' },
  { name: 'Overige Influencers', color: '#8b5cf6', description: 'Paars tot cyaan gradient voor ranks 4+' },
]
</script>

<template>
  <div class="details">
    <div class="container">
      <section class="intro">
        <h1>Over het Project</h1>
        <p class="lead">
          Een immersieve 3D-visualisatie die het fediverse tot leven brengt. Zweef door een
          sterrenstelsel waar elke planeet een post is, en ervaar het gedecentraliseerde
          sociale web als een levend universum.
        </p>
        <p>
          De visualisatie ontvangt real-time data via Server-Sent Events van Mastodon's publieke
          stream. Elke post wordt een gloeiende planeet met unieke kleuren gebaseerd op het type
          content. Reply chains worden verbonden met lichtlijnen, en posts met dezelfde hashtags
          clusteren samen in de ruimte.
        </p>
      </section>

      <section class="features">
        <h2>Interactieve Features</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <h3>🔄 Reply Chains</h3>
            <p>Antwoorden spawnen dichtbij hun parent post en worden verbonden met gloeiende lijnen.</p>
          </div>
          <div class="feature-card">
            <h3>#️⃣ Hashtag Clusters</h3>
            <p>Posts met dezelfde hashtag groeperen samen in de ruimte.</p>
          </div>
          <div class="feature-card">
            <h3>☄️ Webmention Komeet</h3>
            <p>Als de website vermeld wordt, scheurt een komeet door de hemel met een flash effect.</p>
          </div>
          <div class="feature-card">
            <h3>👥 Influencer Orbits</h3>
            <p>Top influencers verschijnen als grote planeten met volgers die eromheen draaien.</p>
          </div>
          <div class="feature-card">
            <h3>⭐ Webmention Sterren</h3>
            <p>Goedgekeurde webmentions verschijnen als twinkelende sterren op de homepage. Hover voor details.</p>
          </div>
        </div>
      </section>

      <section class="visualization-modes">
        <h2>Visualisatie Modi</h2>
        <p>Schakel tussen verschillende weergaven om de data op verschillende manieren te verkennen:</p>
        <div class="mode-grid">
          <div class="mode-card">
            <span class="mode-icon">🌍</span>
            <h3>Posts Modus</h3>
            <p>Bekijk alleen de real-time posts van het fediverse als planeten die verschijnen en verdwijnen.</p>
          </div>
          <div class="mode-card">
            <span class="mode-icon">⭐</span>
            <h3>Influencers Modus</h3>
            <p>Focus op de top influencers - grote planeten met orbiterende volgers gebaseerd op SPARQL queries.</p>
          </div>
          <div class="mode-card">
            <span class="mode-icon">🌌</span>
            <h3>Both Modus</h3>
            <p>Combineer beide visualisaties voor het complete beeld van het fediverse universum.</p>
          </div>
        </div>
      </section>

      <section class="webmentions">
        <h2>Webmentions</h2>
        <p>
          Webmentions zijn een W3C standaard die websites in staat stelt om elkaar te notificeren
          wanneer ze naar elkaar linken - zoals een gedecentraliseerd commentaar systeem.
        </p>
        <div class="webmention-features">
          <div class="wm-feature">
            <span class="wm-icon">⭐</span>
            <div>
              <h4>Sterren op de Homepage</h4>
              <p>Elke goedgekeurde webmention verschijnt als een twinkelende ster op de homepage. Hover om info te zien, klik om de bron te bezoeken.</p>
            </div>
          </div>
          <div class="wm-feature">
            <span class="wm-icon">☄️</span>
            <div>
              <h4>Komeet Effect</h4>
              <p>Wanneer een webmention binnenkomt in de visualisatie, scheurt een komeet door de ruimte met een spectaculair licht- en geluidseffect.</p>
            </div>
          </div>
          <div class="wm-feature">
            <span class="wm-icon">✅</span>
            <div>
              <h4>Verificatie & Goedkeuring</h4>
              <p>Webmentions worden automatisch geverifieerd (de bron moet een link naar deze site bevatten) en wachten op handmatige goedkeuring.</p>
            </div>
          </div>
          <div class="wm-feature">
            <span class="wm-icon">📝</span>
            <div>
              <h4>Stuur een Webmention</h4>
              <p>Bezoek de <router-link to="/profile">profiel pagina</router-link> om zelf een webmention te sturen naar deze site.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="linked-data">
        <h2>Linked Data & SPARQL</h2>
        <p>
          Alle Mastodon posts worden opgeslagen als RDF triples volgens de Activity Streams 2.0
          specificatie. Dit maakt het mogelijk om complexe queries uit te voeren over de data.
        </p>
        <div class="ld-features">
          <div class="ld-card">
            <h4>🔮 RDF Triple Store</h4>
            <p>Posts, auteurs, tags en relaties worden opgeslagen als semantische triples met rdflib</p>
          </div>
          <div class="ld-card">
            <h4>📊 Influence Tracking</h4>
            <p>SPARQL queries berekenen influence scores: reblogs × 3 + favourites × 2 + replies</p>
          </div>
          <div class="ld-card">
            <h4>🛤️ Orbit Relaties</h4>
            <p>Wanneer gebruiker A gebruiker B reblogt of mentioned, "orbiteert" A rond B</p>
          </div>
          <div class="ld-card">
            <h4>🌐 Open Endpoints</h4>
            <p>Export data als Turtle of JSON-LD via /rdf/turtle en /rdf/jsonld</p>
          </div>
        </div>
        <div class="sparql-example">
          <h4>Voorbeeld SPARQL Query</h4>
          <code>
PREFIX as: &lt;https://www.w3.org/ns/activitystreams#&gt;
SELECT ?author ?influence WHERE {
  ?author fedi:influenceScore ?influence
} ORDER BY DESC(?influence) LIMIT 10
          </code>
        </div>
      </section>

      <section class="colors">
        <h2>Post Planeet Kleuren</h2>
        <p>Elke planeet krijgt een kleur gebaseerd op de eigenschappen van de post:</p>
        <div class="color-grid">
          <div
            v-for="planet in planetColors"
            :key="planet.name"
            class="color-item"
          >
            <span class="color-dot" :style="{ background: planet.color, boxShadow: `0 0 15px ${planet.color}` }"></span>
            <div class="color-info">
              <strong>{{ planet.name }}</strong>
              <span>{{ planet.description }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="influencer-colors">
        <h2>Influencer Planeet Kleuren</h2>
        <p>Top influencers krijgen prestigieuze kleuren gebaseerd op hun ranking:</p>
        <div class="color-grid">
          <div
            v-for="influencer in influencerColors"
            :key="influencer.name"
            class="color-item"
          >
            <span class="color-dot" :style="{ background: influencer.color, boxShadow: `0 0 15px ${influencer.color}` }"></span>
            <div class="color-info">
              <strong>{{ influencer.name }}</strong>
              <span>{{ influencer.description }}</span>
            </div>
          </div>
        </div>
        <p class="influencer-note">
          💫 Kleine witte bolletjes die rond influencer planeten draaien representeren gebruikers
          die hen hebben gementioned of gerepost.
        </p>
      </section>

      <section class="tech-stack">
        <h2>Technische Stack</h2>
        <div class="tech-grid">
          <div
            v-for="(tech, index) in techStack"
            :key="tech.name"
            class="tech-card"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <span class="tech-icon">{{ tech.icon }}</span>
            <h3>{{ tech.name }}</h3>
            <p>{{ tech.description }}</p>
          </div>
        </div>
      </section>

      <section class="controls">
        <h2>Bediening</h2>
        <div class="control-grid">
          <div class="control-item">
            <span class="control-key">🖱️ Slepen</span>
            <span>Kijk rond in de ruimte</span>
          </div>
          <div class="control-item">
            <span class="control-key">🔊 / 🔇</span>
            <span>Schakel geluid in/uit</span>
          </div>
          <div class="control-item">
            <span class="control-key">⛶</span>
            <span>Fullscreen modus</span>
          </div>
          <div class="control-item">
            <span class="control-key">🎨</span>
            <span>Wissel visualisatie modus</span>
          </div>
        </div>
      </section>

      <section class="participate">
        <h2>Doe Mee</h2>
        <p>
          Gebruik hashtag <strong>#Fedivisualizer</strong> op Mastodon om deel te nemen aan de
          installatie. Jouw post wordt een planeet in het universum!
        </p>
        <p>
          Of stuur een <strong>webmention</strong> via de <router-link to="/profile">profiel pagina</router-link>
          om een ster toe te voegen aan de homepage.
        </p>
        <router-link to="/visualization" class="cta-button">
          Bekijk de Visualisatie →
        </router-link>
      </section>
    </div>
  </div>
</template>

<style scoped>
.details {
  min-height: 100vh;
  padding: 6rem 2rem 4rem;
  background: linear-gradient(180deg, #0a0a0f 0%, #12121a 100%);
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

section {
  margin-bottom: 4rem;
  animation: fadeIn 0.6s ease-out both;
}

section:nth-child(2) {
  animation-delay: 0.1s;
}
section:nth-child(3) {
  animation-delay: 0.2s;
}
section:nth-child(4) {
  animation-delay: 0.3s;
}

h1 {
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.75rem;
  color: #fff;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid rgba(100, 150, 255, 0.3);
}

h3 {
  font-size: 1.1rem;
  color: #fff;
  margin-bottom: 0.5rem;
}

p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
  margin-bottom: 1rem;
}

.lead {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.85);
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.feature-icon.blue {
  background: linear-gradient(135deg, #4d7cc7, #7ba3e0);
  box-shadow: 0 0 20px rgba(77, 124, 199, 0.4);
}

.feature-icon.purple {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}

.feature-icon.orange {
  background: linear-gradient(135deg, #e67e22, #f39c12);
  box-shadow: 0 0 20px rgba(230, 126, 34, 0.4);
}

.feature-icon.green {
  background: linear-gradient(135deg, #22c55e, #4ade80);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
}


/* Colors section */
.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1rem;
  transition: border-color 0.3s ease;
}

.color-item:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.color-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.color-info strong {
  color: #fff;
  font-size: 0.9rem;
}

.color-info span {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.8rem;
}

/* Controls section */
.control-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem 1.5rem;
}

.control-key {
  font-size: 1.5rem;
}

.control-item span:last-child {
  color: rgba(255, 255, 255, 0.7);
}

/* CTA button */
.cta-button {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #4d7cc7, #7ba3e0);
  color: #fff;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(77, 124, 199, 0.4);
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.tech-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  animation: fadeInUp 0.5s ease-out both;
  transition: border-color 0.3s ease;
}

.tech-card:hover {
  border-color: rgba(100, 150, 255, 0.3);
}

.tech-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

.participate {
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.participate strong {
  color: #7ba3e0;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.mode-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.mode-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.mode-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}

/* Webmentions section */
.webmention-features {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.wm-feature {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1.25rem;
  transition: border-color 0.3s ease;
}

.wm-feature:hover {
  border-color: rgba(255, 255, 255, 0.2);
}

.wm-icon {
  font-size: 1.75rem;
  flex-shrink: 0;
}

.wm-feature h4 {
  color: #fff;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.wm-feature p {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
}

.wm-feature a {
  color: #7ba3e0;
  text-decoration: none;
}

.wm-feature a:hover {
  text-decoration: underline;
}

/* Linked Data section */
.ld-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin: 1.5rem 0;
}

.ld-card {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  padding: 1.25rem;
  transition: border-color 0.3s ease;
}

.ld-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
}

.ld-card h4 {
  color: #fff;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.ld-card p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
}

.sparql-example {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  padding: 1.25rem;
  margin-top: 1.5rem;
}

.sparql-example h4 {
  color: #fff;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
}

.sparql-example code {
  display: block;
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  border-radius: 6px;
  font-family: 'Fira Code', 'Monaco', monospace;
  font-size: 0.8rem;
  color: rgba(139, 92, 246, 0.9);
  white-space: pre-wrap;
  line-height: 1.6;
  overflow-x: auto;
}

/* Influencer colors section */
.influencer-note {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .details {
    padding: 5rem 1rem 2rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  h2 {
    font-size: 1.4rem;
  }
}
</style>
