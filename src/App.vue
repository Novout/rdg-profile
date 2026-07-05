<script setup lang="ts">
import { ref } from 'vue';
import AppProfile from './components/AppProfile.vue';
import AppCharacterList from './components/AppCharacterList.vue';

const idSelecionado = ref<string | null>(null);

function selecionarPersonagem(id: string) {
  idSelecionado.value = id;
}

function voltarParaLista() {
  idSelecionado.value = null;
}
</script>

<template>
  <AppProfile v-if="idSelecionado" :id="idSelecionado" @voltar="voltarParaLista" />
  <AppCharacterList v-else @selecionar="selecionarPersonagem" />
</template>
