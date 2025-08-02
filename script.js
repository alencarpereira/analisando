document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('btForm');
    const resultadoDiv = document.getElementById('resultado');

    // Função para calcular média de um array numérico
    function calcularMedia(valores) {
        const soma = valores.reduce((acc, val) => acc + val, 0);
        return valores.length ? soma / valores.length : 0;
    }

    // Função para calcular frequências de vitórias, empates e derrotas
    function calcularFrequenciaResultados(golsMarcados, golsSofridos) {
        let v = 0, e = 0, d = 0;
        for (let i = 0; i < golsMarcados.length; i++) {
            if (golsMarcados[i] > golsSofridos[i]) v++;
            else if (golsMarcados[i] === golsSofridos[i]) e++;
            else d++;
        }
        return { v, e, d };
    }

    // Função que calcula a probabilidade de ambos marcarem (BTTS)
    function calcularProbBTTS(golsMarcadosA, golsSofridosA, golsMarcadosB, golsSofridosB, cdGolsTimeA, cdGolsTimeB) {
        const mediaGolsMarcadosA = calcularMedia(golsMarcadosA);
        const mediaGolsSofridosA = calcularMedia(golsSofridosA);
        const mediaGolsMarcadosB = calcularMedia(golsMarcadosB);
        const mediaGolsSofridosB = calcularMedia(golsSofridosB);
        const mediaCDGolsA = calcularMedia(cdGolsTimeA);
        const mediaCDGolsB = calcularMedia(cdGolsTimeB);

        // Probabilidade BTTS com dados gerais
        const probA = mediaGolsMarcadosA * mediaGolsSofridosB;
        const probB = mediaGolsMarcadosB * mediaGolsSofridosA;
        const probGeral = (probA + probB) / 2;

        // Probabilidade BTTS com dados do confronto direto
        const probCD = (mediaCDGolsA + mediaCDGolsB) / 2;

        // Ajuste com frequência resultados: vitórias e empates
        const freqResultadosA = calcularFrequenciaResultados(golsMarcadosA, golsSofridosA);
        const freqResultadosB = calcularFrequenciaResultados(golsMarcadosB, golsSofridosB);
        const totalJogos = golsMarcadosA.length;
        const pontuacaoA = freqResultadosA.v + freqResultadosA.e * 0.5;
        const pontuacaoB = freqResultadosB.v + freqResultadosB.e * 0.5;
        const ajusteResultados = (pontuacaoA + pontuacaoB) / (2 * totalJogos);

        // Pesos para cada parte da fórmula (pode ajustar)
        const pesoMedias = 0.6;
        const pesoResultados = 0.3;
        const pesoConfrontos = 0.1;

        const probTotal = (probGeral * pesoMedias) + (ajusteResultados * pesoResultados) + (probCD * pesoConfrontos);

        // Normaliza para percentual 0 a 100
        const maxValorEsperado = 10;
        let probBTTS = (probTotal / maxValorEsperado) * 100;
        if (probBTTS > 100) probBTTS = 100;
        if (probBTTS < 0) probBTTS = 0;

        return probBTTS;
    }

    // Função que calcula probabilidade de "Ambos NÃO Marcam"
    function calcularProbNaoBTTS(probBTTS) {
        let probNaoBTTS = 100 - probBTTS;
        if (probNaoBTTS < 0) probNaoBTTS = 0;
        if (probNaoBTTS > 100) probNaoBTTS = 100;
        return probNaoBTTS;
    }

    // Evento submit do formulário
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

        // Reusar funções para cálculos auxiliares
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

        const probA = mediaGolsMarcadosA * mediaGolsSofridosB;
        const probB = mediaGolsMarcadosB * mediaGolsSofridosA;
        const probGeral = (probA + probB) / 2;
        const probCD = (mediaCDGolsA + mediaCDGolsB) / 2;

        resultadoDiv.textContent =
            `Probabilidade aproximada de "Ambos os Times Marcam (BTTS)": ${probBTTS.toFixed(2)}%\n` +
            `Probabilidade aproximada de "Ambos os Times NÃO Marcam": ${probNaoBTTS.toFixed(2)}%\n\n` +

            `Frequência ajuste (Vitórias + 0.5 * Empates): ${(ajusteResultados * 100).toFixed(2)}%\n` +
            `Média confronto direto (gols): ${((probCD) * 10).toFixed(2)}%\n\n` +

            `Médias (Gols Marcados / Sofridos):\n` +
            `Time A: ${mediaGolsMarcadosA.toFixed(2)} / ${mediaGolsSofridosA.toFixed(2)}\n` +
            `Time B: ${mediaGolsMarcadosB.toFixed(2)} / ${mediaGolsSofridosB.toFixed(2)}\n\n` +

            `Frequência resultados Time A: V: ${pctVitoriaA.toFixed(1)}% E: ${pctEmpateA.toFixed(1)}% D: ${pctDerrotaA.toFixed(1)}%\n` +
            `Frequência resultados Time B: V: ${pctVitoriaB.toFixed(1)}% E: ${pctEmpateB.toFixed(1)}% D: ${pctDerrotaB.toFixed(1)}%`;
    });

    // Botões preencher e limpar
    const btnPreencher = document.getElementById('btnPreencher');
    const btnLimpar = document.getElementById('btnLimpar');

    btnPreencher.addEventListener('click', () => {
        function preencherClasse(classe, valores) {
            const inputs = document.querySelectorAll(`.${classe}`);
            inputs.forEach((input, i) => {
                if (valores[i] !== undefined) input.value = valores[i];
            });
        }

        preencherClasse('timeA_gols_marcados', [2, 1, 3, 0, 2]);
        preencherClasse('timeA_gols_sofridos', [1, 0, 1, 2, 1]);

        preencherClasse('timeB_gols_marcados', [1, 2, 1, 3, 0]);
        preencherClasse('timeB_gols_sofridos', [2, 1, 2, 1, 3]);

        preencherClasse('cd_gols_timeA', [1, 0, 2, 1, 1]);
        preencherClasse('cd_gols_timeB', [1, 1, 1, 0, 2]);

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












