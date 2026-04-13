<script setup lang="ts">
import KycPanel from './components/KycPanel.vue';
import { getStandaloneRuntime } from './lib/runtime';

const runtime = getStandaloneRuntime();
</script>

<template>
  <KycPanel :api-base="runtime.apiBase" :token="runtime.token" />
</template>
