<script setup lang="ts">
import { getMockKycStatus } from '@mfe/mock-api';

const status = getMockKycStatus('user-002');
</script>

<template>
  <main style="font-family: sans-serif; padding: 2rem">
    <h1>KYC (Vue 3)</h1>
    <p>Micro frontend remote application</p>
    <p>
      Sample KYC status:
      <strong>{{ status.status }}</strong>
    </p>
  </main>
</template>
