document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('btForm');
    const resultadoDiv = document.getElementById('resultado');

    function calcularMedia(valores) {
        const soma = valores.reduce((acc, val) => acc + val, 0);
        return valores.length ? soma / valores.length : 0;
    }

    function calcularFrequenciaResultados(golsMarcados, golsSofridos) {
        let v = 0, e = 0, d = 0;
        for (let i = 0; i < golsMarcados.length; i++) {
            if (golsMarcados[i] > golsSofridos[i]) v++;
            else if (golsMarcados[i] === golsSofridos[i]) e++;
            else d++;
        }
        return { v, e, d };
    }

    function calcularProbBTTS(golsMarcadosA, golsSofridosA, golsMarcadosB, golsSofridosB, cdGolsTimeA, cdGolsTimeB) {
        const mediaGolsMarcadosA = calcularMedia(golsMarcadosA);
        const mediaGolsSofridosA = calcularMedia(golsSofridosA);
        const mediaGolsMarcadosB = calcularMedia(golsMarcadosB);
        const mediaGolsSofridosB = calcularMedia(golsSofridosB);
        const mediaCDGolsA = calcularMedia(cdGolsTimeA);
        const mediaCDGolsB = calcularMedia(cdGolsTimeB);

        const probA = mediaGolsMarcadosA * mediaGolsSofridosB;
        const probB = mediaGolsMarcadosB * mediaGolsSofridosA;
        const probGeral = (probA + probB) / 2;

        const probCD = (mediaCDGolsA + mediaCDGolsB) / 2;

        const freqResultadosA = calcularFrequenciaResultados(golsMarcadosA, golsSofridosA);
        const freqResultadosB = calcularFrequenciaResultados(golsMarcadosB, golsSofridosB);
        const totalJogos = golsMarcadosA.length;
        const pontuacaoA = freqResultadosA.v + freqResultadosA.e * 0.5;
        const pontuacaoB = freqResultadosB.v + freqResultadosB.e * 0.5;
        const ajusteResultados = (pontuacaoA + pontuacaoB) / (2 * totalJogos);

        const pesoMedias = 0.6;
        const pesoResultados = 0.3;
        const pesoConfrontos = 0.1;

        const probTotal = (probGeral * pesoMedias) + (ajusteResultados * pesoResultados) + (probCD * pesoConfrontos);

        // Ajuste no maxValorEsperado para normalização
        const maxValorEsperado = 4;  // Alterado de 10 para 4
        let probBTTS = (probTotal / maxValorEsperado) * 100;
        if (probBTTS > 100) probBTTS = 100;
        if (probBTTS < 0) probBTTS = 0;

        return probBTTS;
    }

    function calcularProbNaoBTTS(probBTTS) {
        let probNaoBTTS = 100 - probBTTS;
        if (probNaoBTTS < 0) probNaoBTTS = 0;
        if (probNaoBTTS > 100) probNaoBTTS = 100;
        return probNaoBTTS;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const golsMarcadosA = Array.from(document.querySelectorAll('.timeA_gols_marcados')).map(i => parseInt(i.value) || 0);
        const golsSofridosA = Array.from(document.querySelectorAll('.timeA_gols_sofridos')).map(i => parseInt(i.value) || 0);

        const golsMarcadosB = Array.from(document.querySelectorAll('.timeB_gols_marcados')).map(i => parseInt(i.value) || 0);
        const golsSofridosB = Array.from(document.querySelectorAll('.timeB_gols_sofridos')).map(i => parseInt(i.value) || 0);

        const cdGolsTimeA = Array.from(document.querySelectorAll('.cd_gols_timeA')).map(i => parseInt(i.value) || 0);
        const cdGolsTimeB = Array.from(document.querySelectorAll('.cd_gols_timeB')).map(i => parseInt(i.value) || 0);

        const probBTTS = calcularProbBTTS(golsMarcadosA, golsSofridosA, golsMarcadosB, golsSofridosB, cdGolsTimeA, cdGolsTimeB);
        const probNaoBTTS = calcularProbNaoBTTS(probBTTS);

        const totalJogos = golsMarcadosA.length;

        // Médias e frequências
        const mediaGolsMarcadosA = calcularMedia(golsMarcadosA);
        const mediaGolsSofridosA = calcularMedia(golsSofridosA);
        const mediaGolsMarcadosB = calcularMedia(golsMarcadosB);
        const mediaGolsSofridosB = calcularMedia(golsSofridosB);

        const mediaCDGolsA = calcularMedia(cdGolsTimeA);
        const mediaCDGolsB = calcularMedia(cdGolsTimeB);

        const freqResultadosA = calcularFrequenciaResultados(golsMarcadosA, golsSofridosA);
        const freqResultadosB = calcularFrequenciaResultados(golsMarcadosB, golsSofridosB);

        const pctVitoriaA = (freqResultadosA.v / totalJogos) * 100;
        const pctEmpateA = (freqResultadosA.e / totalJogos) * 100;
        const pctDerrotaA = (freqResultadosA.d / totalJogos) * 100;

        const pctVitoriaB = (freqResultadosB.v / totalJogos) * 100;
        const pctEmpateB = (freqResultadosB.e / totalJogos) * 100;
        const pctDerrotaB = (freqResultadosB.d / totalJogos) * 100;

        const pontuacaoA = freqResultadosA.v + freqResultadosA.e * 0.5;
        const pontuacaoB = freqResultadosB.v + freqResultadosB.e * 0.5;
        const ajusteResultados = (pontuacaoA + pontuacaoB) / (2 * totalJogos);

        // Média combinada gols confronto direto
        const mediaConfrontoGols = mediaCDGolsA + mediaCDGolsB;

        // Construindo a sugestão simples
        let sugestaoBTTS = "";
        if (probBTTS >= 60) sugestaoBTTS = "Boa chance de ambos os times marcarem (BTTS).";
        else if (probBTTS >= 40) sugestaoBTTS = "Probabilidade moderada para BTTS.";
        else sugestaoBTTS = "Baixa chance de ambos os times marcarem.";

        // Montando texto completo com explicações
        resultadoDiv.textContent =
            `Probabilidade aproximada de "Ambos os Times Marcam (BTTS)": ${probBTTS.toFixed(2)}%\n` +
            `Probabilidade aproximada de "Ambos os Times NÃO Marcam": ${probNaoBTTS.toFixed(2)}%\n\n` +

            `Resumo Ofensivo e Defensivo:\n` +
            `- Time A: Média gols marcados ${mediaGolsMarcadosA.toFixed(2)}, gols sofridos ${mediaGolsSofridosA.toFixed(2)}\n` +
            `- Time B: Média gols marcados ${mediaGolsMarcadosB.toFixed(2)}, gols sofridos ${mediaGolsSofridosB.toFixed(2)}\n\n` +

            `Frequência de Resultados:\n` +
            `- Time A: ${pctVitoriaA.toFixed(1)}% vitórias, ${pctEmpateA.toFixed(1)}% empates, ${pctDerrotaA.toFixed(1)}% derrotas\n` +
            `- Time B: ${pctVitoriaB.toFixed(1)}% vitórias, ${pctEmpateB.toFixed(1)}% empates, ${pctDerrotaB.toFixed(1)}% derrotas\n\n` +

            `Confronto Direto:\n` +
            `- Média combinada de gols nos últimos ${totalJogos} jogos diretos: ${mediaConfrontoGols.toFixed(2)} gols por jogo\n\n` +

            `Ajuste frequência (Vitórias + 0.5 * Empates): ${(ajusteResultados * 100).toFixed(2)}%\n\n` +

            `Sugestão:\n${sugestaoBTTS}`;
    });


    const btnPreencher = document.getElementById('btnPreencher');
    const btnLimpar = document.getElementById('btnLimpar');

    btnPreencher.addEventListener('click', () => {
        function preencherClasse(classe, valores) {
            const inputs = document.querySelectorAll(`.${classe}`);
            inputs.forEach((input, i) => {
                if (valores[i] !== undefined) input.value = valores[i];
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












