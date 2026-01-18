<script setup lang="ts">
import 'solid-vcard-business-card'
</script>

<template>
  <div class="profile">
    <div class="container">
      <div class="profile-card">
        <div class="avatar-wrapper">
          <div class="avatar-placeholder">
            <span>AM</span>
          </div>
        </div>

        <div class="profile-info">
          <h1>Antje Meiresonne</h1>
          <p class="role">Creator / Developer</p>

          <div class="bio">
            <p>
              Antje Meiresonne is student Webtopics Advanced (lees: vrijwillig ingewikkelde dingen
              doen) in de richting web development aan Odisee Gent. Ze bouwt liever systemen dan
              pagina’s en maakt projecten die het internet niet alleen laten werken, maar ook laten
              bewegen, klinken en ademen.
            </p>
            <p>
              Haar recentste project (aka het hoekje van het internet waar je je nu bevind) is een
              audiovisuele installatie die real-time activiteit in het fediverse visualiseert door
              ActivityPub-streams en Webmentions om te zetten in dynamische patronen en geluiden via
              TouchDesigner (maar dan omgezet naar three.js wegens het jammerlijk ontbreken van een
              GPU in haar laptop).
            </p>
          </div>

          <div class="business-card-wrapper">
            <solid-business-card
              src="https://antjemeiresonne.solidcommunity.net/profile/card#me"
            ></solid-business-card>
          </div>

          <div class="project-link">
            <h3>Current Project</h3>
            <router-link to="/details" class="project-badge">
              <span class="badge-icon">🌐</span>
              <span>Fediverse Audiovisuele Installatie</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile {
  min-height: 100vh;
  padding: 6rem 2rem 4rem;
  background: linear-gradient(180deg, #0a0a0f 0%, #12121a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 800px;
  width: 100%;
}

.profile-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 3rem;
  animation: fadeIn 0.6s ease-out;
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.avatar-placeholder {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4d7cc7, #7ba3e0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 0 40px rgba(77, 124, 199, 0.3);
  animation: pulse 3s ease-in-out infinite;
}

h1 {
  font-size: 2.5rem;
  color: #fff;
  text-align: center;
  margin-bottom: 0.5rem;
}

.role {
  color: rgba(100, 150, 255, 0.8);
  text-align: center;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.bio {
  margin-bottom: 2rem;
}

.bio p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
  margin-bottom: 1rem;
  text-align: center;
}

.business-card-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.project-link {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 2rem;
  text-align: center;
}

.project-link h3 {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 1rem;
}

.project-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.2);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.project-badge:hover {
  background: rgba(100, 150, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(100, 150, 255, 0.2);
}

.badge-icon {
  font-size: 1.25rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 40px rgba(77, 124, 199, 0.3);
  }
  50% {
    box-shadow: 0 0 60px rgba(77, 124, 199, 0.5);
  }
}

@media (max-width: 768px) {
  .profile {
    padding: 5rem 1rem 2rem;
  }

  .profile-card {
    padding: 2rem 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
  }

  .avatar-placeholder {
    width: 120px;
    height: 120px;
    font-size: 2.5rem;
  }
}
</style>
