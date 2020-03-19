<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar-title class="flex flex-center">Public Key Message Decrypt</q-toolbar-title>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>

export default {
  name: "MainLayout",

  components: {},

  data() {
    return {};
  }
};
</script>