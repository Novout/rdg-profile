<script setup lang="ts">
import { ref } from 'vue';
import { listarFichas, criarFicha, salvarFicha, removerFicha, type Ficha } from '../lib/fichas';

const emit = defineEmits<{ selecionar: [id: string] }>();

const fichas = ref<Ficha[]>(listarFichas());

function atualizarLista() {
  fichas.value = listarFichas();
}

function criarPersonagem() {
  const nova = criarFicha();
  salvarFicha(nova);
  emit('selecionar', nova.id);
}

function editarPersonagem(id: string) {
  emit('selecionar', id);
}

function excluirPersonagem(ficha: Ficha) {
  const nome = ficha.descricao.nome || 'este personagem';
  if (!confirm(`Tem certeza que deseja excluir "${nome}"? Essa ação não pode ser desfeita.`)) return;
  removerFicha(ficha.id);
  atualizarLista();
}

function formatarData(timestamp: number): string {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>

<template>
  <div class="lista">
    <header class="lista__topo">
      <h1>Meus Personagens</h1>
      <button type="button" class="botao" @click="criarPersonagem">+ Novo personagem</button>
    </header>

    <p v-if="!fichas.length" class="vazio">Nenhum personagem salvo ainda. Crie o primeiro!</p>

    <ul class="grade-personagens">
      <li v-for="ficha in fichas" :key="ficha.id" class="cartao-personagem">
        <div class="cartao-personagem__info" @click="editarPersonagem(ficha.id)">
          <h2>{{ ficha.descricao.nome || 'Sem nome' }}</h2>
          <p class="cartao-personagem__detalhes">
            {{ ficha.descricao.raca || 'Raça não definida' }} &middot;
            {{ ficha.descricao.classe || 'Classe não definida' }} &middot;
            Nível {{ ficha.descricao.nivel }}
          </p>
          <p class="cartao-personagem__data">Atualizado em {{ formatarData(ficha.atualizadoEm) }}</p>
        </div>
        <div class="cartao-personagem__acoes">
          <button type="button" class="botao" @click="editarPersonagem(ficha.id)">Editar</button>
          <button type="button" class="botao botao--perigo" @click="excluirPersonagem(ficha)">Excluir</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lista {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
  color: var(--cor-texto);
  font-family: 'Segoe UI', 'Georgia', sans-serif;
}

.lista__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.lista__topo h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--cor-azul-celeste-claro);
}

.vazio {
  color: var(--cor-texto-suave);
  font-style: italic;
}

.grade-personagens {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.cartao-personagem {
  background: var(--cor-cinza-escuro);
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cartao-personagem__info {
  cursor: pointer;
}

.cartao-personagem__info h2 {
  margin: 0 0 0.35rem;
  color: var(--cor-azul-celeste-claro);
}

.cartao-personagem__detalhes {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  color: var(--cor-texto);
}

.cartao-personagem__data {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cor-texto-suave);
}

.cartao-personagem__acoes {
  display: flex;
  gap: 0.5rem;
}

.botao {
  cursor: pointer;
  border: 1px solid var(--cor-azul-celeste);
  background: var(--cor-azul-celeste);
  color: var(--cor-preto);
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.botao:hover {
  background: var(--cor-azul-celeste-claro);
  border-color: var(--cor-azul-celeste-claro);
}

.botao--perigo {
  background: transparent;
  color: var(--cor-perigo);
  border: 1px solid var(--cor-perigo);
}

.botao--perigo:hover {
  background: var(--cor-perigo);
  color: var(--cor-preto);
}
</style>
