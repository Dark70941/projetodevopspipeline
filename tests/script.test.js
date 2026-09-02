const {
    obterFraseAleatoria,
    formatarData,
    adicionarAoHistorico,
    salvarHistorico,
    limparHistorico,
    obterContador,
    incrementarContador,
    CHAVE_HISTORICO,
    CHAVE_CONTADOR
} = require("../script");

describe("Gerador de frases", () => {

    beforeEach(() => {
        localStorage.clear();
    });

    test("deve retornar uma frase da lista", () => {
        const frases = [
            { texto: "Frase 1", categoria: "teste" },
            { texto: "Frase 2", categoria: "teste" },
            { texto: "Frase 3", categoria: "teste" }
        ];

        const resultado = obterFraseAleatoria(frases);

        expect(frases).toContainEqual(resultado);
    });

    test("deve retornar mensagem quando não existem frases", () => {
        const resultado = obterFraseAleatoria([]);

        expect(resultado).toEqual({
            texto: "Nenhuma frase disponível.",
            categoria: "vazio"
        });
    });

    test("deve aceitar lista de strings legada", () => {
        const frases = ["Frase A", "Frase B"];
        const resultado = obterFraseAleatoria(frases);

        expect(frases).toContain(resultado.texto);
        expect(resultado.categoria).toBe("geral");
    });

    test("deve formatar data em pt-BR", () => {
        const data = formatarData("2026-09-02T15:30:00.000Z");

        expect(data).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    test("deve adicionar frase ao histórico", () => {
        const frase = { texto: "Nova frase", categoria: "motivacao" };
        const historico = adicionarAoHistorico(frase);

        expect(historico).toHaveLength(1);
        expect(historico[0].texto).toBe("Nova frase");
        expect(historico[0].categoria).toBe("motivacao");
        expect(historico[0].geradaEm).toBeDefined();
    });

    test("deve respeitar limite máximo do histórico", () => {
        const entradas = Array.from({ length: 55 }, (_, i) => ({
            texto: `Frase ${i}`,
            categoria: "teste",
            geradaEm: new Date().toISOString()
        }));

        const historico = salvarHistorico(entradas);

        expect(historico).toHaveLength(50);
    });

    test("deve incrementar e limpar contador", () => {
        expect(obterContador()).toBe(0);

        incrementarContador();
        incrementarContador();

        expect(obterContador()).toBe(2);

        limparHistorico();

        expect(obterContador()).toBe(0);
        expect(localStorage.getItem(CHAVE_HISTORICO)).toBeNull();
        expect(localStorage.getItem(CHAVE_CONTADOR)).toBeNull();
    });

});
