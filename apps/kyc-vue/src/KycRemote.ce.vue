<script setup lang="ts">
import KycPanel from './components/KycPanel.vue';

const props = withDefaults(
  defineProps<{
    apiBase?: string;
    token?: string;
  }>(),
  {
    apiBase: '/api',
    token: 'valid-token-user-001'
  }
);
</script>

<template>
  <KycPanel :api-base="props.apiBase" :token="props.token" embedded />
</template>

<style>
:host {
  display: block;
}
</style>
