<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';
import {
  ATRIBUTOS_LABEL,
  CHAVES_ATRIBUTOS,
  criarFicha,
  obterFicha,
  salvarFicha,
  removerFicha,
  type ChaveAtributo,
  type Ficha,
  type Pericia,
} from '../lib/fichas';

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ voltar: [] }>();

const ficha = reactive<Ficha>(obterFicha(props.id) ?? criarFicha());

watch(
  ficha,
  (valor) => {
    salvarFicha(valor);
  },
  { deep: true },
);

function modificador(score: number): number {
  return score
}

function formatarModificador(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const bonusProficiencia = computed(() => {
  const nivel = ficha.descricao.nivel || 1;
  return Math.floor((nivel - 1) / 4) + 2;
});

const iniciativa = computed(() => modificador(ficha.atributos.agilidade) + (ficha.combate.iniciativaBonus || 0));

const percentualVida = computed(() => {
  const max = ficha.combate.pontosDeVidaMax;
  if (!max || max <= 0) return 0;
  const percentual = (ficha.combate.pontosDeVidaAtual / max) * 100;
  return Math.min(100, Math.max(0, percentual));
});

function valorPericia(pericia: Pericia): number {
  const base = modificador(ficha.atributos[pericia.atributo]);
  return pericia.proficiente ? base + bonusProficiencia.value : base;
}

const FACES_DADO = [4, 6, 8, 10, 12, 20, 100];

const facesDado = ref(20);
const quantidadeDados = ref(1);

interface ResultadoRolagem {
  dados: number[];
  modificador: number;
  total: number;
}

const resultados = reactive<Partial<Record<ChaveAtributo, ResultadoRolagem>>>({});

function rolarDados(): number[] {
  const quantidade = Math.min(10, Math.max(1, quantidadeDados.value || 1));
  return Array.from({ length: quantidade }, () => 1 + Math.floor(Math.random() * facesDado.value));
}

function rolarAtributo(chave: ChaveAtributo) {
  const dados = rolarDados();
  const somaDados = dados.reduce((soma, valor) => soma + valor, 0);
  const mod = modificador(ficha.atributos[chave]);
  resultados[chave] = { dados, modificador: mod, total: somaDados + mod };
}

const resultadosPericias = reactive<Record<string, ResultadoRolagem>>({});

function rolarPericia(pericia: Pericia) {
  const dados = rolarDados();
  const somaDados = dados.reduce((soma, valor) => soma + valor, 0);
  const mod = valorPericia(pericia);
  resultadosPericias[pericia.id] = { dados, modificador: mod, total: somaDados + mod };
}

function novoItemEquipamento() {
  ficha.equipamento.push({
    id: crypto.randomUUID(),
    nome: '',
    quantidade: 1,
    peso: '',
    observacoes: '',
  });
}

function removerItemEquipamento(id: string) {
  ficha.equipamento = ficha.equipamento.filter((item) => item.id !== id);
}

function novaHabilidade() {
  ficha.habilidades.push({ id: crypto.randomUUID(), nome: '', descricao: '' });
}

function removerHabilidade(id: string) {
  ficha.habilidades = ficha.habilidades.filter((habilidade) => habilidade.id !== id);
}

function novoTalento() {
  ficha.talentos.push({ id: crypto.randomUUID(), nome: '', descricao: '' });
}

function removerTalento(id: string) {
  ficha.talentos = ficha.talentos.filter((talento) => talento.id !== id);
}

function limparFicha() {
  if (!confirm('Tem certeza que deseja apagar todos os dados e começar do zero?')) return;
  const nova = criarFicha();
  nova.id = ficha.id;
  nova.criadoEm = ficha.criadoEm;
  Object.assign(ficha, nova);
}

function excluirPersonagem() {
  if (!confirm('Tem certeza que deseja excluir este personagem? Essa ação não pode ser desfeita.')) return;
  removerFicha(ficha.id);
  emit('voltar');
}
</script>

<template>
  <img class="image" src="/src/assets/icon512.png"/>
  <div class="ficha">
    <header class="ficha__topo">
      <button type="button" class="botao botao--secundario" @click="emit('voltar')">&larr; Voltar à lista</button>
      <h1>{{ ficha.descricao.nome || 'Ficha de Personagem' }}</h1>
      <div class="ficha__acoes">
        <button type="button" class="botao botao--perigo" @click="limparFicha">Limpar dados</button>
        <button type="button" class="botao botao--perigo" @click="excluirPersonagem">Excluir personagem</button>
      </div>
    </header>

    <!-- Pontos de Vida -->
    <section class="destaque-vida">
      <span class="destaque-vida__label">Pontos de Vida</span>
      <div class="destaque-vida__valores">
        <input v-model.number="ficha.combate.pontosDeVidaAtual" type="number" class="destaque-vida__campo destaque-vida__campo--atual" />
        <span class="destaque-vida__separador">/</span>
        <input v-model.number="ficha.combate.pontosDeVidaMax" type="number" min="0" class="destaque-vida__campo destaque-vida__campo--max" />
      </div>
      <div class="destaque-vida__barra">
        <div class="destaque-vida__barra-preenchida" :style="{ width: percentualVida + '%' }"></div>
      </div>
    </section>

    <!-- Descrição -->
    <section class="cartao">
      <h2>Descrição</h2>
      <div class="grade grade--descricao">
        <label class="campo">
          <span>Nome do personagem</span>
          <input v-model="ficha.descricao.nome" type="text" placeholder="Ex: Aria Ventoclaro" />
        </label>
        <label class="campo">
          <span>Jogador</span>
          <input v-model="ficha.descricao.jogador" type="text" placeholder="Seu nome" />
        </label>
        <label class="campo">
          <span>Classe</span>
          <input v-model="ficha.descricao.classe" type="text" placeholder="Ex: Guerreiro" />
        </label>
        <label class="campo">
          <span>Subclasse</span>
          <input v-model="ficha.descricao.subclasse" type="text" placeholder="Ex: Cavaleiro Sagrado" />
        </label>
        <label class="campo">
          <span>Raça</span>
          <input v-model="ficha.descricao.raca" type="text" placeholder="Ex: Humano" />
        </label>
        <label class="campo">
          <span>Nível</span>
          <input v-model.number="ficha.descricao.nivel" type="number" min="1" max="20" />
        </label>
        <label class="campo">
          <span>Antecedente</span>
          <input v-model="ficha.descricao.antecedente" type="text" placeholder="Ex: Órfão" />
        </label>
        <label class="campo">
          <span>Alinhamento</span>
          <input v-model="ficha.descricao.alinhamento" type="text" placeholder="Ex: Neutro e Bom" />
        </label>
      </div>
      <label class="campo campo--largo">
        <span>História / Notas</span>
        <textarea v-model="ficha.descricao.historia" rows="4" placeholder="Personalidade, ideais, vínculos, defeitos, história..."></textarea>
      </label>
      <label class="campo campo--largo">
        <span>Ponto de Quebra (Ruptura)</span>
        <textarea v-model="ficha.descricao.quebra" rows="4" placeholder="O momento que o seu personagem virou a chave..."></textarea>
      </label>
      <div class="grade grade--combate">
        <label class="campo">
          <span>PV temporário</span>
          <input v-model.number="ficha.combate.pontosDeVidaTemp" type="number" min="0" />
        </label>
        <label class="campo">
          <span>Defesa</span>
          <input v-model.number="ficha.combate.classeDeArmadura" type="number" min="0" />
        </label>
        <label class="campo">
          <span>Distancia</span>
          <input v-model.number="ficha.combate.deslocamento" type="number" min="0" />
        </label>
        <label class="campo">
          <span>Bônus de Iniciativa</span>
          <input v-model.number="ficha.combate.iniciativaBonus" type="number" />
        </label>
        <div class="campo campo--somente-leitura">
          <span>Iniciativa</span>
          <strong>{{ formatarModificador(iniciativa) }}</strong>
        </div>
      </div>
    </section>

    <!-- Atributos -->
    <section class="cartao">
      <div class="cartao__cabecalho">
        <h2>Atributos</h2>
        <div class="rolador-config">
          <label>
            Dado
            <select v-model.number="facesDado">
              <option v-for="faces in FACES_DADO" :key="faces" :value="faces">d{{ faces }}</option>
            </select>
          </label>
          <label>
            Qtd.
            <input v-model.number="quantidadeDados" type="number" min="1" max="10" />
          </label>
        </div>
      </div>
      <div class="grade grade--atributos">
        <div v-for="chave in CHAVES_ATRIBUTOS" :key="chave" class="atributo">
          <span class="atributo__nome">{{ ATRIBUTOS_LABEL[chave] }}</span>
          <input v-model.number="ficha.atributos[chave]" type="number" min="-1" max="30" class="atributo__valor" />
          <button type="button" class="botao botao--dado" @click="rolarAtributo(chave)">
            🎲 {{ quantidadeDados }}d{{ facesDado }}
          </button>
          <span v-if="resultados[chave]" class="atributo__resultado">
            {{ resultados[chave]!.dados.join(' + ') }}
            {{ formatarModificador(resultados[chave]!.modificador) }}
            = <strong>{{ resultados[chave]!.total }}</strong>
          </span>
        </div>
      </div>

      <h3>Perícias</h3>
      <ul class="lista-pericias">
        <li v-for="pericia in ficha.pericias" :key="pericia.id" class="pericia">
          <label>
            <input v-model="pericia.proficiente" type="checkbox" />
            {{ pericia.nome }}
            <span v-if="ATRIBUTOS_LABEL[pericia.atributo]" class="pericia__atributo">({{ ATRIBUTOS_LABEL[pericia.atributo].slice(0, 3) }})</span>
          </label>
          <div class="pericia__acoes">
            <span class="pericia__valor">{{ formatarModificador(valorPericia(pericia)) }}</span>
            <button type="button" class="botao botao--dado" @click="rolarPericia(pericia)">
              🎲 {{ quantidadeDados }}d{{ facesDado }}
            </button>
            <span v-if="resultadosPericias[pericia.id]" class="pericia__resultado">
              {{ resultadosPericias[pericia.id].dados.join(' + ') }}
              {{ formatarModificador(resultadosPericias[pericia.id].modificador) }}
              = <strong>{{ resultadosPericias[pericia.id].total }}</strong>
            </span>
          </div>
        </li>
      </ul>
    </section>

    <!-- Equipamento -->
    <section class="cartao">
      <div class="cartao__cabecalho">
        <h2>Equipamento</h2>
        <button type="button" class="botao" @click="novoItemEquipamento">+ Adicionar item</button>
      </div>
      <p v-if="!ficha.equipamento.length" class="vazio">Nenhum item adicionado ainda.</p>
      <div v-for="item in ficha.equipamento" :key="item.id" class="linha-equipamento">
        <input v-model="item.nome" type="text" placeholder="Nome do item" class="linha-equipamento__nome" />
        <input v-model.number="item.quantidade" type="number" min="0" placeholder="Qtd" class="linha-equipamento__qtd" />
        <input v-model="item.peso" type="text" placeholder="Peso" class="linha-equipamento__peso" />
        <input v-model="item.observacoes" type="text" placeholder="Observações" class="linha-equipamento__obs" />
        <button type="button" class="botao botao--icone" title="Remover item" @click="removerItemEquipamento(item.id)">✕</button>
      </div>
    </section>

    <!-- Habilidades -->
    <section class="cartao">
      <div class="cartao__cabecalho">
        <h2>Habilidades</h2>
        <button type="button" class="botao" @click="novaHabilidade">+ Adicionar habilidade</button>
      </div>
      <p v-if="!ficha.habilidades.length" class="vazio">Nenhuma habilidade de classe/raça adicionada ainda.</p>
      <div v-for="habilidade in ficha.habilidades" :key="habilidade.id" class="cartao-lista-item">
        <div class="cartao-lista-item__cabecalho">
          <input v-model="habilidade.nome" type="text" placeholder="Nome da habilidade" />
          <button type="button" class="botao botao--icone" title="Remover habilidade" @click="removerHabilidade(habilidade.id)">✕</button>
        </div>
        <textarea v-model="habilidade.descricao" rows="2" placeholder="Descrição da habilidade"></textarea>
      </div>
    </section>

    <!-- Talentos -->
    <section class="cartao">
      <div class="cartao__cabecalho">
        <h2>Talentos</h2>
        <button type="button" class="botao" @click="novoTalento">+ Adicionar talento</button>
      </div>
      <p v-if="!ficha.talentos.length" class="vazio">Nenhum talento (feat) adicionado ainda.</p>
      <div v-for="talento in ficha.talentos" :key="talento.id" class="cartao-lista-item">
        <div class="cartao-lista-item__cabecalho">
          <input v-model="talento.nome" type="text" placeholder="Nome do talento" />
          <button type="button" class="botao botao--icone" title="Remover talento" @click="removerTalento(talento.id)">✕</button>
        </div>
        <textarea v-model="talento.descricao" rows="2" placeholder="Descrição do talento"></textarea>
      </div>
    </section>
  </div>
</template>

<style scoped>
.image {
  position: absolute;
  top: 6rem;
  left: 300px;
  transform: translateX(-50%);
  opacity: 0.5;
  border-radius: 9999px;
  width: min(400px, 70vw);
  max-width: 100%;
  pointer-events: none;
}

@media (max-width: 640px) {
  .image {
    top: 3rem;
    left: 50%;
    width: 55vw;
    opacity: 0.35;
  }
}

.ficha {
  position: relative;
  z-index: 0;
  max-width: 940px;
  margin: 0 auto;
  padding: 1.5rem;
  color: var(--cor-texto);
  font-family: 'Segoe UI', 'Georgia', sans-serif;
}

.ficha__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.ficha__topo h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--cor-azul-celeste-claro);
  flex: 1;
  text-align: center;
}

.ficha__acoes {
  display: flex;
  gap: 0.5rem;
}

.botao--secundario {
  background: transparent;
  color: var(--cor-azul-celeste);
  border: 1px solid var(--cor-azul-celeste);
}

.botao--secundario:hover {
  background: var(--cor-cinza);
}

.destaque-vida {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--cor-cinza-escuro);
  border: 1px solid var(--cor-azul-celeste);
  border-radius: 10px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}

.destaque-vida__label {
  font-weight: 700;
  color: var(--cor-azul-celeste-claro);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.85rem;
}

.destaque-vida__valores {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
}

.destaque-vida__campo {
  font-family: inherit;
  font-weight: 700;
  text-align: center;
  background: var(--cor-preto);
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  padding: 0.2rem 0.4rem;
  width: 4.5rem;
}

.destaque-vida__campo--atual {
  font-size: 1.75rem;
  color: var(--cor-azul-celeste);
}

.destaque-vida__campo--max {
  font-size: 1.25rem;
  color: var(--cor-texto);
}

.destaque-vida__campo:focus {
  outline: none;
  border-color: var(--cor-azul-celeste);
}

.destaque-vida__separador {
  font-size: 1.5rem;
  color: var(--cor-texto-suave);
}

.destaque-vida__barra {
  flex: 1;
  height: 0.6rem;
  background: var(--cor-preto);
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 999px;
  overflow: hidden;
}

.destaque-vida__barra-preenchida {
  height: 100%;
  background: linear-gradient(90deg, var(--cor-azul-celeste), var(--cor-azul-celeste-claro));
  transition: width 0.2s ease;
}

.cartao {
  background: var(--cor-cinza-escuro);
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 10px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.cartao__cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.cartao h2 {
  margin: 0 0 0.75rem;
  color: var(--cor-azul-celeste-claro);
  border-bottom: 2px solid var(--cor-cinza-claro);
  padding-bottom: 0.35rem;
}

.cartao h3 {
  margin: 1rem 0 0.5rem;
  color: var(--cor-azul-celeste-claro);
}

.grade {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.grade--descricao {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.grade--combate {
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}

.grade--atributos {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.campo span {
  font-weight: 600;
  color: var(--cor-texto-suave);
}

.campo input,
.campo textarea {
  font-family: inherit;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  background: var(--cor-preto);
  color: var(--cor-texto);
}

.campo input:focus,
.campo textarea:focus {
  outline: none;
  border-color: var(--cor-azul-celeste);
}

.campo--largo {
  margin-bottom: 0.75rem;
}

.campo--somente-leitura {
  justify-content: center;
  align-items: center;
  background: var(--cor-cinza);
  border-radius: 6px;
  padding: 0.4rem;
  color: var(--cor-azul-celeste-claro);
}

.atributo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  background: var(--cor-cinza);
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 8px;
  padding: 0.75rem 0.5rem;
  text-align: center;
}

.atributo__nome {
  font-weight: 700;
  color: var(--cor-azul-celeste-claro);
}

.atributo__valor {
  width: 4rem;
  text-align: center;
  font-size: 1.1rem;
  padding: 0.25rem;
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  background: var(--cor-preto);
  color: var(--cor-texto);
}

.atributo__mod {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--cor-azul-celeste);
}

.rolador-config {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.rolador-config label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--cor-texto-suave);
}

.rolador-config select,
.rolador-config input {
  font-family: inherit;
  padding: 0.25rem 0.4rem;
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  background: var(--cor-preto);
  color: var(--cor-texto);
  width: 3.5rem;
}

.rolador-config select {
  width: auto;
}

.botao--dado {
  font-size: 0.75rem;
  padding: 0.3rem 0.5rem;
}

.atributo__resultado {
  font-size: 0.8rem;
  color: var(--cor-azul-celeste-claro);
  text-align: center;
}

.atributo__salvaguarda {
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.lista-pericias {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.4rem;
}

.pericia {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.4rem;
  background: var(--cor-cinza);
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
}

.pericia label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pericia__atributo {
  color: var(--cor-texto-suave);
  font-size: 0.75rem;
}

.pericia__acoes {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.pericia__valor {
  font-weight: 700;
  color: var(--cor-azul-celeste);
}

.pericia__resultado {
  font-size: 0.75rem;
  color: var(--cor-azul-celeste-claro);
}

.vazio {
  color: var(--cor-texto-suave);
  font-style: italic;
}

.linha-equipamento {
  display: grid;
  grid-template-columns: 2fr 0.6fr 0.8fr 2fr auto;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.linha-equipamento input {
  font-family: inherit;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  background: var(--cor-preto);
  color: var(--cor-texto);
}

.linha-equipamento input:focus {
  outline: none;
  border-color: var(--cor-azul-celeste);
}

.cartao-lista-item {
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 8px;
  padding: 0.6rem;
  margin-bottom: 0.6rem;
  background: var(--cor-cinza);
}

.cartao-lista-item__cabecalho {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.cartao-lista-item__cabecalho input {
  flex: 1;
  font-family: inherit;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  background: var(--cor-preto);
  color: var(--cor-texto);
}

.cartao-lista-item textarea {
  width: 100%;
  font-family: inherit;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--cor-cinza-claro);
  border-radius: 6px;
  background: var(--cor-preto);
  color: var(--cor-texto);
  resize: vertical;
  box-sizing: border-box;
}

.cartao-lista-item input:focus,
.cartao-lista-item textarea:focus {
  outline: none;
  border-color: var(--cor-azul-celeste);
}

.botao {
  cursor: pointer;
  border: 1px solid var(--cor-preto);
  background: var(--cor-cinza-claro);
  color: white;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
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

.botao--icone {
  padding: 0.3rem 0.6rem;
}
</style>
