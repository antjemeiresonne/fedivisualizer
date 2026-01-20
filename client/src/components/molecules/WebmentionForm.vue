<script setup lang="ts">
import { ref } from 'vue'
import { useWebmentions } from '@/composables/useWebmentions'

const { sendWebmention } = useWebmentions()

const source = ref('')
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const successMessage = ref('')
const submitError = ref('')

const siteUrl = window.location.origin

async function handleSubmit() {
  if (!source.value.trim()) {
    submitError.value = 'Vul een URL in'
    return
  }

  try {
    new URL(source.value)
  } catch {
    submitError.value = 'Ongeldige URL'
    return
  }

  isSubmitting.value = true
  submitError.value = ''
  submitSuccess.value = false
  successMessage.value = ''

  const result = await sendWebmention(source.value, siteUrl)

  if (result.success) {
    submitSuccess.value = true
    successMessage.value = result.message || 'Webmention ontvangen!'
    source.value = ''
  } else {
    submitError.value = result.error || 'Kon webmention niet versturen'
  }

  isSubmitting.value = false
}
</script>

<template>
  <div class="webmention-form">
    <h3>Stuur een Webmention</h3>
    <p class="description">
      Heb je iets geschreven over deze site? Laat het me weten door de URL van jouw artikel hieronder in te vullen.
      Zorg ervoor dat je pagina een link naar <code>{{ siteUrl }}</code> bevat.
    </p>

    <form @submit.prevent="handleSubmit">
      <div class="input-group">
        <input
          v-model="source"
          type="url"
          placeholder="https://jouw-site.com/artikel"
          :disabled="isSubmitting"
        />
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Versturen...' : 'Verstuur' }}
        </button>
      </div>

      <p v-if="submitSuccess" class="success">
        ✓ {{ successMessage }}
      </p>
      <p v-if="submitError" class="error">
        ✕ {{ submitError }}
      </p>
    </form>

    <div class="info">
      <h4>Wat is een Webmention?</h4>
      <p>
        Webmentions zijn een open standaard waarmee websites met elkaar kunnen communiceren.
        Wanneer je schrijft over deze site en een webmention stuurt, wordt jouw vermelding
        zichtbaar als een stralende ster op de homepage.
      </p>
    </div>
  </div>
</template>

<style scoped>
.webmention-form {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2rem;
}

h3 {
  color: #fff;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.description code {
  background: rgba(100, 150, 255, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.85em;
}

form {
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  gap: 0.75rem;
}

input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: rgba(100, 150, 255, 0.5);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

button {
  background: rgba(100, 150, 255, 0.3);
  border: 1px solid rgba(100, 150, 255, 0.5);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover:not(:disabled) {
  background: rgba(100, 150, 255, 0.4);
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.success {
  color: #4ade80;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.error {
  color: #f87171;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.info {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
}

.info h4 {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.info p {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.85rem;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .input-group {
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>

