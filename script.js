document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('btForm');
    const resultadoDiv = document.getElementById('resultado');
    const btnPreencher = document.getElementById('btnPreencher');
    const btnLimpar = document.getElementById('btnLimpar');

    // Calcula média de um array numérico
    function calcularMedia(valores) {
        const soma = valores.reduce((acc, val) => acc + val, 0);
        return valores.length ? soma / valores.length : 0;
    }

    // Conta frequência de resultados: vitórias, empates, derrotas
    function calcularFrequenciaResultados(golsMarcados, golsSofridos) {
        let v = 0, e = 0, d = 0;
        for (let i = 0; i < golsMarcados.length; i++) {
            if (golsMarcados[i] > golsSofridos[i]) v++;
            else if (golsMarcados[i] === golsSofridos[i]) e++;
            else d++;
        }
        return { v, e, d };
    }

    // Calcula probabilidade BTTS ponderada
    function calcularProbBTTS(golsMarcadosA, golsSofridosA, golsMarcadosB, golsSofridosB, cdGolsTimeA, cdGolsTimeB) {
        const mediaGolsMarcadosA = calcularMedia(golsMarcadosA);
        const mediaGolsSofridosA = calcularMedia(golsSofridosA);
        const mediaGolsMarcadosB = calcularMedia(golsMarcadosB);
        const mediaGolsSofridosB = calcularMedia(golsSofridosB);
        const mediaCDGolsA = calcularMedia(cdGolsTimeA);
        const mediaCDGolsB = calcularMedia(cdGolsTimeB);

        // Probabilidades base
        const probA = mediaGolsMarcadosA * mediaGolsSofridosB;
        const probB = mediaGolsMarcadosB * mediaGolsSofridosA;
        const probGeral = (probA + probB) / 2;

        // Média confronto direto
        const probCD = (mediaCDGolsA + mediaCDGolsB) / 2;

        // Frequência resultados para ajuste
        const freqResultadosA = calcularFrequenciaResultados(golsMarcadosA, golsSofridosA);
        const freqResultadosB = calcularFrequenciaResultados(golsMarcadosB, golsSofridosB);
        const totalJogos = golsMarcadosA.length;
        const pontuacaoA = freqResultadosA.v + freqResultadosA.e * 0.5;
        const pontuacaoB = freqResultadosB.v + freqResultadosB.e * 0.5;
        const ajusteResultados = (pontuacaoA + pontuacaoB) / (2 * totalJogos);

        // Pesos
        const pesoMedias = 0.6;
        const pesoResultados = 0.3;
        const pesoConfrontos = 0.1;

        // Probabilidade total ponderada
        const probTotal = (probGeral * pesoMedias) + (ajusteResultados * pesoResultados) + (probCD * pesoConfrontos);

        // Normaliza para percentual (máximo esperado = 4)
        const maxValorEsperado = 4;
        let probBTTS = (probTotal / maxValorEsperado) * 100;
        if (probBTTS > 100) probBTTS = 100;
        if (probBTTS < 0) probBTTS = 0;

        return probBTTS;
    }

    // Probabilidade de não BTTS (complementar)
    function calcularProbNaoBTTS(probBTTS) {
        let probNaoBTTS = 100 - probBTTS;
        if (probNaoBTTS < 0) probNaoBTTS = 0;
        if (probNaoBTTS > 100) probNaoBTTS = 100;
        return probNaoBTTS;
    }

    // Conta quantos jogos tiveram +2.5 gols
    function contarJogosOver25(marcados, sofridos) {
        let count = 0;
        for (let i = 0; i < marcados.length; i++) {
            if ((marcados[i] + sofridos[i]) > 2.5) count++;
        }
        return count;
    }

    // Função para pegar valores das inputs de uma classe, retornando array numérico
    function pegarValoresClasse(classe) {
        const inputs = Array.from(document.querySelectorAll(`.${classe}`));
        return inputs.map(input => parseFloat(input.value) || 0);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Pega os dados
        const golsMarcadosA = pegarValoresClasse('timeA_gols_marcados');
        const golsSofridosA = pegarValoresClasse('timeA_gols_sofridos');
        const golsMarcadosB = pegarValoresClasse('timeB_gols_marcados');
        const golsSofridosB = pegarValoresClasse('timeB_gols_sofridos');
        const cdGolsTimeA = pegarValoresClasse('cd_gols_timeA');
        const cdGolsTimeB = pegarValoresClasse('cd_gols_timeB');

        const totalJogos = golsMarcadosA.length;

        // Calcula médias ofensivas/defensivas
        const mediaGolsMarcadosA = calcularMedia(golsMarcadosA);
        const mediaGolsSofridosA = calcularMedia(golsSofridosA);
        const mediaGolsMarcadosB = calcularMedia(golsMarcadosB);
        const mediaGolsSofridosB = calcularMedia(golsSofridosB);

        const mediaCDGolsA = calcularMedia(cdGolsTimeA);
        const mediaCDGolsB = calcularMedia(cdGolsTimeB);

        // Frequência resultados
        const freqResultadosA = calcularFrequenciaResultados(golsMarcadosA, golsSofridosA);
        const freqResultadosB = calcularFrequenciaResultados(golsMarcadosB, golsSofridosB);

        const pctVitoriaA = (freqResultadosA.v / totalJogos) * 100;
        const pctEmpateA = (freqResultadosA.e / totalJogos) * 100;
        const pctDerrotaA = (freqResultadosA.d / totalJogos) * 100;

        const pctVitoriaB = (freqResultadosB.v / totalJogos) * 100;
        const pctEmpateB = (freqResultadosB.e / totalJogos) * 100;
        const pctDerrotaB = (freqResultadosB.d / totalJogos) * 100;

        // Pesos para Dupla Chance
        const pesoVitoria = 0.5;
        const pesoEmpate = 0.3;
        const pesoDerrota = 0.2;

        // Calcula pontuação ponderada dos resultados para cada time
        const pontuacaoPonderadaA = (pctVitoriaA * pesoVitoria) + (pctEmpateA * pesoEmpate) + (pctDerrotaA * pesoDerrota);
        const pontuacaoPonderadaB = (pctVitoriaB * pesoVitoria) + (pctEmpateB * pesoEmpate) + (pctDerrotaB * pesoDerrota);

        // Calcula as probabilidades simples para cada tipo de dupla chance:
        const probTimeAouEmpate = pctVitoriaA + pctEmpateA;
        const probTimeBouEmpate = pctVitoriaB + pctEmpateB;
        const probTimeAouTimeB = pctVitoriaA + pctVitoriaB;

        // Função para gerar sugestão simples baseada na maior probabilidade
        function gerarSugestaoDuplaChance() {
            const probabilidades = [
                { tipo: 'Time A ou Empate', valor: probTimeAouEmpate },
                { tipo: 'Time B ou Empate', valor: probTimeBouEmpate },
                { tipo: 'Time A ou Time B (qualquer um vence)', valor: probTimeAouTimeB },
            ];

            probabilidades.sort((a, b) => b.valor - a.valor);
            const melhor = probabilidades[0];
            return `Sugestão de aposta Dupla Chance: **${melhor.tipo}** com probabilidade de ${melhor.valor.toFixed(1)}%`;
        }

        // Probabilidade BTTS
        const probBTTS = calcularProbBTTS(golsMarcadosA, golsSofridosA, golsMarcadosB, golsSofridosB, cdGolsTimeA, cdGolsTimeB);
        const probNaoBTTS = calcularProbNaoBTTS(probBTTS);

        // Estimativa placar provável (baseado nas médias)
        const estimativaGolsA = ((mediaGolsMarcadosA + mediaGolsSofridosB) / 2).toFixed(1);
        const estimativaGolsB = ((mediaGolsMarcadosB + mediaGolsSofridosA) / 2).toFixed(1);

        const placarProvavel =
            `### Estimativa de Placar Provável\n` +
            `O jogo tende a ser equilibrado, com chances de:\n` +
            `🟢 Time A marcar cerca de **${estimativaGolsA} gols**\n` +
            `🔴 Time B marcar cerca de **${estimativaGolsB} gols**\n\n`;

        // Frequência real +2.5 gols
        const overA = contarJogosOver25(golsMarcadosA, golsSofridosA);
        const overB = contarJogosOver25(golsMarcadosB, golsSofridosB);
        const freqReal = ((overA + overB) / (totalJogos * 2)) * 100;

        // Média total gols ofensivos + defensivos
        const mediaTotalGols = mediaGolsMarcadosA + mediaGolsSofridosA + mediaGolsMarcadosB + mediaGolsSofridosB;

        // Média gols confronto direto
        const mediaConfrontoGols = mediaCDGolsA + mediaCDGolsB;

        // Probabilidade Over 2.5 gols (ponderado)
        let probMais2_5 = (freqReal * 0.4) + (mediaTotalGols * 10 * 0.3) + (mediaConfrontoGols * 10 * 0.3);
        if (probMais2_5 > 100) probMais2_5 = 100;
        if (probMais2_5 < 0) probMais2_5 = 0;

        const probMenos2_5 = 100 - probMais2_5;

        // Sugestões baseadas nas probabilidades
        let sugestaoBTTS = "";
        if (probBTTS >= 60) sugestaoBTTS = "Boa chance de ambos os times marcarem (BTTS).";
        else if (probBTTS >= 40) sugestaoBTTS = "Probabilidade moderada para BTTS.";
        else sugestaoBTTS = "Baixa chance de ambos os times marcarem.";

        let sugestaoOver25 = "";
        if (probMais2_5 >= 70) sugestaoOver25 = "Alta probabilidade de mais de 2.5 gols (Over 2.5).";
        else if (probMais2_5 >= 50) sugestaoOver25 = "Chance razoável de mais de 2.5 gols.";
        else sugestaoOver25 = "Jogo com tendência a poucos gols (Under 2.5).";

        const sugestaoDuplaChance = gerarSugestaoDuplaChance();

        // Ajuste frequência (Vitórias + 0.5 * Empates)
        const pontuacaoA = freqResultadosA.v + freqResultadosA.e * 0.5;
        const pontuacaoB = freqResultadosB.v + freqResultadosB.e * 0.5;
        const ajusteResultados = (pontuacaoA + pontuacaoB) / (2 * totalJogos);

        // Monta texto final
        const textoFinal =
            placarProvavel +

            `Probabilidade aproximada de "Ambos os Times Marcam (BTTS)": ${probBTTS.toFixed(2)}%\n` +
            `Probabilidade aproximada de "Ambos os Times NÃO Marcam": ${probNaoBTTS.toFixed(2)}%\n\n` +

            `Probabilidade aproximada de Over/Under +2.5 Gols:\n` +
            `- Mais de 2.5 gols: ${probMais2_5.toFixed(2)}%\n` +
            `- Menos de 2.5 gols: ${probMenos2_5.toFixed(2)}%\n\n` +

            `Resumo Ofensivo e Defensivo:\n` +
            `- Time A: Média gols marcados ${mediaGolsMarcadosA.toFixed(2)}, gols sofridos ${mediaGolsSofridosA.toFixed(2)}\n` +
            `- Time B: Média gols marcados ${mediaGolsMarcadosB.toFixed(2)}, gols sofridos ${mediaGolsSofridosB.toFixed(2)}\n\n` +

            `Frequência de Resultados:\n` +
            `- Time A: ${pctVitoriaA.toFixed(1)}% vitórias, ${pctEmpateA.toFixed(1)}% empates, ${pctDerrotaA.toFixed(1)}% derrotas\n` +
            `- Time B: ${pctVitoriaB.toFixed(1)}% vitórias, ${pctEmpateB.toFixed(1)}% empates, ${pctDerrotaB.toFixed(1)}% derrotas\n\n` +

            `Confronto Direto:\n` +
            `- Média combinada de gols nos últimos ${totalJogos} jogos diretos: ${mediaConfrontoGols.toFixed(2)} gols por jogo\n\n` +

            `Ajuste frequência (Vitórias + 0.5 * Empates): ${(ajusteResultados * 100).toFixed(2)}%\n\n` +

            `Sugestões:\n${sugestaoBTTS}\n${sugestaoOver25}\n${sugestaoDuplaChance}`;

        resultadoDiv.textContent = textoFinal;
    });

    // Preencher automático com dados exemplo
    btnPreencher.addEventListener('click', () => {
        function preencherClasse(classe, valores) {
            const inputs = document.querySelectorAll(`.${classe}`);
            inputs.forEach((input, i) => {
                input.value = valores[i] !== undefined ? valores[i] : '';
            });
        }

        preencherClasse('timeA_gols_marcados', [3, 2, 4, 3, 2]);
        preencherClasse('timeA_gols_sofridos', [1, 2, 2, 1, 1]);

        preencherClasse('timeB_gols_marcados', [2, 3, 3, 2, 3]);
        preencherClasse('timeB_gols_sofridos', [2, 1, 1, 2, 1]);

        preencherClasse('cd_gols_timeA', [2, 3, 1, 2, 2]);
        preencherClasse('cd_gols_timeB', [2, 2, 1, 1, 3]);

        resultadoDiv.textContent = '';
    });

    // Limpar todos os campos
    btnLimpar.addEventListener('click', () => {
        function limparClasse(classe) {
            const inputs = document.querySelectorAll(`.${classe}`);
            inputs.forEach(input => input.value = '');
        }

        limparClasse('timeA_gols_marcados');
        limparClasse('timeA_gols_sofridos');
        limparClasse('timeB_gols_marcados');
        limparClasse('timeB_gols_sofridos');
        limparClasse('cd_gols_timeA');
        limparClasse('cd_gols_timeB');

        resultadoDiv.textContent = '';
    });
});















