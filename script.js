const CHAVE_HISTORICO = "gerador-frases-historico";
const CHAVE_CONTADOR = "gerador-frases-contador";

const frasesPadrao = [
    { texto: "O sucesso é a soma de pequenos esforços.", categoria: "motivacao" },
    { texto: "A prática leva à evolução.", categoria: "aprendizado" },
    { texto: "Aprender é construir novas possibilidades.", categoria: "aprendizado" },
    { texto: "Grandes projetos começam com pequenas ideias.", categoria: "inspiracao" },
    { texto: "Não tenha medo de começar.", categoria: "motivacao" }
];

let configuracao = {
    app: { nome: "Gerador de Frases", versao: "2.0.0", max_historico: 50 },
    frases: frasesPadrao
};

let ultimaFrase = null;

function obterFraseAleatoria(lista) {
    if (!lista || lista.length === 0) {
        return { texto: "Nenhuma frase disponível.", categoria: "vazio" };
    }

    const indice = Math.floor(Math.random() * lista.length);
    const item = lista[indice];

    if (typeof item === "string") {
        return { texto: item, categoria: "geral" };
    }

    return item;
}

function formatarData(isoString) {
    const data = new Date(isoString);

    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function carregarHistorico() {
    try {
        const salvo = localStorage.getItem(CHAVE_HISTORICO);
        return salvo ? JSON.parse(salvo) : [];
    } catch {
        return [];
    }
}

function salvarHistorico(historico) {
    const limite = configuracao.app.max_historico || 50;
    const historicoLimitado = historico.slice(0, limite);
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historicoLimitado));
    return historicoLimitado;
}

function obterContador() {
    const valor = localStorage.getItem(CHAVE_CONTADOR);
    return valor ? Number(valor) : 0;
}

function incrementarContador() {
    const novoValor = obterContador() + 1;
    localStorage.setItem(CHAVE_CONTADOR, String(novoValor));
    return novoValor;
}

function adicionarAoHistorico(frase) {
    const entrada = {
        texto: frase.texto,
        categoria: frase.categoria,
        geradaEm: new Date().toISOString()
    };

    const historico = [entrada, ...carregarHistorico()];
    return salvarHistorico(historico);
}

function limparHistorico() {
    localStorage.removeItem(CHAVE_HISTORICO);
    localStorage.removeItem(CHAVE_CONTADOR);
}

function renderizarHistorico(historico) {
    const lista = document.getElementById("lista-historico");
    const vazio = document.getElementById("historico-vazio");

    lista.innerHTML = "";

    if (historico.length === 0) {
        vazio.hidden = false;
        return;
    }

    vazio.hidden = true;

    historico.forEach((item, indice) => {
        const li = document.createElement("li");
        li.className = "item-historico";

        const texto = document.createElement("span");
        texto.className = "item-historico-texto";
        texto.textContent = item.texto;

        const meta = document.createElement("span");
        meta.className = "item-historico-meta";
        meta.textContent = `#${indice + 1} · ${item.categoria} · ${formatarData(item.geradaEm)}`;

        li.appendChild(texto);
        li.appendChild(meta);
        lista.appendChild(li);
    });
}

function atualizarContador(valor) {
    const elemento = document.getElementById("contador");
    elemento.textContent = `Frases geradas: ${valor}`;
}

function exibirFrase() {
    const frase = obterFraseAleatoria(configuracao.frases);
    ultimaFrase = frase;

    document.getElementById("frase").textContent = frase.texto;

    const categoria = document.getElementById("categoria");
    categoria.textContent = frase.categoria;
    categoria.hidden = frase.categoria === "vazio";

    const historico = adicionarAoHistorico(frase);
    const contador = incrementarContador();

    renderizarHistorico(historico);
    atualizarContador(contador);
}

async function copiarFraseAtual() {
    if (!ultimaFrase) {
        return false;
    }

    const texto = ultimaFrase.texto;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(texto);
        return true;
    }

    return false;
}

function aplicarConfiguracao(config) {
    configuracao = config;

    document.getElementById("titulo-app").textContent = config.app.nome;
    document.getElementById("versao-app").textContent = `v${config.app.versao}`;
    document.title = config.app.nome;
}

async function carregarConfiguracao() {
    if (typeof fetch === "undefined") {
        return configuracao;
    }

    try {
        const resposta = await fetch("config/app.json");

        if (!resposta.ok) {
            return configuracao;
        }

        return await resposta.json();
    } catch {
        return configuracao;
    }
}

async function inicializarApp() {
    const config = await carregarConfiguracao();
    aplicarConfiguracao(config);

    const historico = carregarHistorico();
    renderizarHistorico(historico);
    atualizarContador(obterContador());

    document.getElementById("botao").addEventListener("click", exibirFrase);

    document.getElementById("copiar").addEventListener("click", async () => {
        const copiado = await copiarFraseAtual();
        const botao = document.getElementById("copiar");

        if (copiado) {
            const textoOriginal = botao.textContent;
            botao.textContent = "Copiado!";
            setTimeout(() => {
                botao.textContent = textoOriginal;
            }, 1500);
        }
    });

    document.getElementById("limpar-historico").addEventListener("click", () => {
        limparHistorico();
        ultimaFrase = null;
        renderizarHistorico([]);
        atualizarContador(0);
        document.getElementById("frase").textContent = "Clique no botão para gerar uma frase.";
        document.getElementById("categoria").hidden = true;
    });
}

if (typeof document !== "undefined") {
    inicializarApp();
}

if (typeof module !== "undefined") {
    module.exports = {
        obterFraseAleatoria,
        formatarData,
        carregarHistorico,
        salvarHistorico,
        adicionarAoHistorico,
        limparHistorico,
        obterContador,
        incrementarContador,
        CHAVE_HISTORICO,
        CHAVE_CONTADOR
    };
}
