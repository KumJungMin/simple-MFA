<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { AuthUser, KycStatusResponse } from '@mfe/shared-contracts';
import { completeKyc, fetchKycStatus, verifyAuth } from '../lib/api';

const props = withDefaults(
  defineProps<{
    apiBase: string;
    token: string;
    embedded?: boolean;
  }>(),
  {
    embedded: false
  }
);

const loading = ref(true);
const submitting = ref(false);
const error = ref<string | null>(null);
const user = ref<AuthUser | null>(null);
const status = ref<KycStatusResponse | null>(null);

const modeLabel = computed(() => (props.embedded ? 'Shell-mounted remote' : 'Standalone KYC app'));
const actionLabel = computed(() =>
  status.value?.status === 'approved' ? 'Reset to pending' : 'Complete KYC'
);

async function loadState() {
  loading.value = true;
  error.value = null;

  try {
    user.value = await verifyAuth(props.apiBase, props.token);
    status.value = await fetchKycStatus(props.apiBase, props.token);
  } catch (requestError) {
    user.value = null;
    status.value = null;
    error.value = requestError instanceof Error ? requestError.message : 'Failed to load KYC state.';
  } finally {
    loading.value = false;
  }
}

async function handleComplete() {
  submitting.value = true;
  error.value = null;

  try {
    status.value = await completeKyc(props.apiBase, props.token);
  } catch (requestError) {
    error.value = requestError instanceof Error ? requestError.message : 'Failed to update KYC status.';
  } finally {
    submitting.value = false;
  }
}

watch(
  () => [props.apiBase, props.token],
  () => {
    void loadState();
  },
  { immediate: true }
);
</script>

<template>
  <section class="kyc-panel" :data-embedded="props.embedded">
    <header class="kyc-header">
      <div>
        <p class="kyc-eyebrow">{{ modeLabel }}</p>
        <h2>KYC Domain App</h2>
      </div>
      <span class="kyc-chip">{{ props.embedded ? 'Remote element' : 'Standalone page' }}</span>
    </header>

    <p class="kyc-copy">
      This Vue app owns the KYC UI and talks to the Express mock API over HTTP instead of sharing in-memory logic with the shell.
    </p>

    <div v-if="loading" class="kyc-state">
      <strong>Loading KYC state...</strong>
      <span>Verifying the token and fetching the current KYC status.</span>
    </div>

    <div v-else-if="error" class="kyc-state kyc-state-error">
      <strong>Something went wrong.</strong>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="user && status" class="kyc-stack">
      <section class="kyc-grid">
        <article class="kyc-card">
          <p class="kyc-label">User</p>
          <strong>{{ user.name }}</strong>
          <span>{{ user.email }}</span>
        </article>
        <article class="kyc-card">
          <p class="kyc-label">Channel</p>
          <strong>{{ user.channel }}</strong>
          <span>{{ user.id }}</span>
        </article>
        <article class="kyc-card">
          <p class="kyc-label">KYC status</p>
          <strong>{{ status.status }}</strong>
          <span>{{ status.updatedAt }}</span>
        </article>
      </section>

      <div class="kyc-actions">
        <button class="kyc-button" type="button" :disabled="submitting" @click="handleComplete">
          {{ submitting ? 'Updating...' : actionLabel }}
        </button>
        <span class="kyc-hint">API base: {{ props.apiBase }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.kyc-panel {
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: 24px;
  color: #f6f1eb;
  background:
    radial-gradient(circle at top right, rgba(90, 154, 255, 0.22), transparent 28%),
    linear-gradient(150deg, #12161d 0%, #1d2430 52%, #11161d 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
}

.kyc-panel[data-embedded='true'] {
  background:
    radial-gradient(circle at top right, rgba(255, 188, 107, 0.2), transparent 28%),
    linear-gradient(150deg, #16171e 0%, #222633 52%, #12161d 100%);
}

.kyc-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.kyc-eyebrow,
.kyc-label {
  margin: 0;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(246, 241, 235, 0.72);
}

.kyc-header h2,
.kyc-copy,
.kyc-state,
.kyc-state strong,
.kyc-state span {
  margin: 0;
}

.kyc-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.82rem;
}

.kyc-copy {
  color: rgba(246, 241, 235, 0.82);
}

.kyc-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.kyc-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.kyc-card strong,
.kyc-card span,
.kyc-state strong,
.kyc-state span {
  display: block;
}

.kyc-card span,
.kyc-state span,
.kyc-hint {
  color: rgba(246, 241, 235, 0.72);
  font-size: 0.92rem;
}

.kyc-stack {
  display: grid;
  gap: 16px;
}

.kyc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.kyc-button {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #ffcd75, #fb7f5e);
  color: #171b22;
  font-weight: 700;
  cursor: pointer;
}

.kyc-button:disabled {
  cursor: progress;
  opacity: 0.72;
}

.kyc-state {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
}

.kyc-state-error {
  background: rgba(146, 34, 39, 0.28);
  border: 1px solid rgba(255, 133, 137, 0.2);
}

@media (max-width: 640px) {
  .kyc-panel {
    padding: 18px;
  }

  .kyc-header,
  .kyc-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
