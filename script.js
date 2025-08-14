// --- Funções auxiliares ---
function calcularPesosOddsDuplaChance(oddVitoriaA, oddEmpate, oddVitoriaB) {
    const probVitoriaA = 1 / oddVitoriaA;
    const probEmpate = 1 / oddEmpate;
    const probVitoriaB = 1 / oddVitoriaB;
    const somaProbs = probVitoriaA + probEmpate + probVitoriaB;
    return {
        dcAouEmpate: (probVitoriaA + probEmpate) / somaProbs,
        dcBouEmpate: (probVitoriaB + probEmpate) / somaProbs,
        dcAouB: (probVitoriaA + probVitoriaB) / somaProbs
    };
}

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

function calcularProbBTTS(gA, sA, gB, sB, cdA, cdB) {
    const mediaGolsMarcadosA = calcularMedia(gA);
    const mediaGolsSofridosA = calcularMedia(sA);
    const mediaGolsMarcadosB = calcularMedia(gB);
    const mediaGolsSofridosB = calcularMedia(sB);
    const mediaCDGolsA = calcularMedia(cdA);
    const mediaCDGolsB = calcularMedia(cdB);

    const probGeral = ((mediaGolsMarcadosA * mediaGolsSofridosB) + (mediaGolsMarcadosB * mediaGolsSofridosA)) / 2;
    const probCD = (mediaCDGolsA + mediaCDGolsB) / 2;

    const freqA = calcularFrequenciaResultados(gA, sA);
    const freqB = calcularFrequenciaResultados(gB, sB);
    const ajusteResultados = ((freqA.v + freqA.e * 0.5) + (freqB.v + freqB.e * 0.5)) / (2 * gA.length);

    const pesoMedias = 0.6;
    const pesoResultados = 0.3;
    const pesoConfrontos = 0.1;

    const probTotal = (probGeral * pesoMedias) + (ajusteResultados * pesoResultados) + (probCD * pesoConfrontos);

    const maxProbTotal = (Math.max(mediaGolsMarcadosA * mediaGolsSofridosB, mediaGolsMarcadosB * mediaGolsSofridosA) * 2 * pesoMedias) + (1 * pesoResultados) + (5 * pesoConfrontos);
    let probBTTS = (probTotal / maxProbTotal) * 100;
    probBTTS = Math.min(Math.max(probBTTS, 0), 100);
    return probBTTS;
}

function calcularProbNaoBTTS(probBTTS) { return Math.min(Math.max(100 - probBTTS, 0), 100); }

function factorial(n) { if (n === 0) return 1; let f = 1; for (let i = 1; i <= n; i++) f *= i; return f; }
function poisson(k, lambda) { return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k); }
function probOverX(lambdaA, lambdaB, x) {
    let prob = 0;
    const maxGols = 10;
    for (let golsA = 0; golsA <= maxGols; golsA++) {
        for (let golsB = 0; golsB <= maxGols; golsB++) {
            if (golsA + golsB > x) prob += poisson(golsA, lambdaA) * poisson(golsB, lambdaB);
        }
    }
    return prob * 100;
}
function pegarValoresClasse(classe) {
    return Array.from(document.querySelectorAll(`.${classe}`)).map(input => parseFloat(input.value) || 0);
}

// Sugestão combinada
function gerarSugestaoCombinada(probTimeAouEmpate, pontA, probTimeBouEmpate, pontB, probTimeAouB, pontA2, pontB2, probsOdds, probMais2_5) {
    const pesoHistorico = 0.6;
    const pesoOdds = 0.4;
    const scoreAouEmpate = (((probTimeAouEmpate + pontA) / 2) * pesoHistorico) + (probsOdds.dcAouEmpate * pesoOdds);
    const scoreBouEmpate = (((probTimeBouEmpate + pontB) / 2) * pesoHistorico) + (probsOdds.dcBouEmpate * pesoOdds);
    const scoreAouB = (((probTimeAouB + ((pontA2 + pontB2) / 2)) / 2) * pesoHistorico) + (probsOdds.dcAouB * pesoOdds);

    const opcoesDC = [
        { tipo: 'Time A ou Empate', score: scoreAouEmpate },
        { tipo: 'Time B ou Empate', score: scoreBouEmpate },
        { tipo: 'Time A ou Time B', score: scoreAouB }
    ];
    opcoesDC.sort((a, b) => b.score - a.score);
    const melhorDC = opcoesDC[0];
    const limiar = 65;
    if (melhorDC.score < limiar) {
        const segundaOpcao = opcoesDC[1];
        return `Sugestão combinada segura: <strong>${melhorDC.tipo} + Menos de 3.5 gols</strong><br>` +
            `Sugestão combinada alternativa: <strong>${segundaOpcao.tipo} + Menos de 3.5 gols</strong>`;
    }
    let apostaGols = probMais2_5 >= 70 ? 'Mais de 2.5 gols' : (probMais2_5 >= 50 ? 'Mais de 1.5 gols' : 'Menos de 3.5 gols');
    return `Sugestão combinada: <strong>${melhorDC.tipo} + ${apostaGols}</strong>`;
}

// --- DOM e eventos ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('btForm');
    const resultadoDiv = document.getElementById('resultado');
    const btnPreencher = document.getElementById('btnPreencher');
    const btnLimpar = document.getElementById('btnLimpar');

    function calcularProbabilidades() {
        const gA = pegarValoresClasse('timeA_gols_marcados');
        const sA = pegarValoresClasse('timeA_gols_sofridos');
        const gB = pegarValoresClasse('timeB_gols_marcados');
        const sB = pegarValoresClasse('timeB_gols_sofridos');
        const cdA = pegarValoresClasse('cd_gols_timeA');
        const cdB = pegarValoresClasse('cd_gols_timeB');

        const oddA = parseFloat(document.getElementById('odd_vitoriaA').value) || 0;
        const oddE = parseFloat(document.getElementById('odd_empate').value) || 0;
        const oddB = parseFloat(document.getElementById('odd_vitoriaB').value) || 0;

        const probsOdds = calcularPesosOddsDuplaChance(oddA, oddE, oddB);
        const probBTTS = calcularProbBTTS(gA, sA, gB, sB, cdA, cdB);
        const probNaoBTTS = calcularProbNaoBTTS(probBTTS);

        const mediaGolsA = calcularMedia(gA);
        const mediaSofridosA = calcularMedia(sA);
        const mediaGolsB = calcularMedia(gB);
        const mediaSofridosB = calcularMedia(sB);

        const lambdaA = (mediaGolsA + mediaSofridosB) / 2;
        const lambdaB = (mediaGolsB + mediaSofridosA) / 2;
        const probMais2_5 = probOverX(lambdaA, lambdaB, 2);

        return { probBTTS, probNaoBTTS, probsOdds, probMais2_5, mediaGolsA, mediaSofridosA, mediaGolsB, mediaSofridosB };
    }

    function gerarSugestoes(prob) {
        const { probBTTS, probsOdds, probMais2_5 } = prob;
        const sugestaoBTTS = probBTTS >= 60 ? "Boa chance de ambos os times marcarem (BTTS)." :
            probBTTS >= 40 ? "Probabilidade moderada para BTTS." :
                "Baixa chance de ambos os times marcarem.";

        // Sugestão Dupla Chance dinâmica
        const opcoesDC = [
            { tipo: 'Time A ou Empate', score: probsOdds.dcAouEmpate },
            { tipo: 'Time B ou Empate', score: probsOdds.dcBouEmpate },
            { tipo: 'Time A ou Time B', score: probsOdds.dcAouB }
        ];
        opcoesDC.sort((a, b) => b.score - a.score);
        const sugestaoDC = opcoesDC[0].tipo;

        const sugestaoCombinada = gerarSugestaoCombinada(50, 50, 50, 50, 50, 50, 50, probsOdds, probMais2_5);
        return { sugestaoBTTS, sugestaoDC, sugestaoCombinada };
    }

    function exibirResultado(prob, sug) {
        const { mediaGolsA, mediaSofridosA, mediaGolsB, mediaSofridosB, probBTTS, probNaoBTTS, probMais2_5 } = prob;
        const { sugestaoBTTS, sugestaoDC, sugestaoCombinada } = sug;

        const estimativaA = ((mediaGolsA + mediaSofridosB) / 2).toFixed(1);
        const estimativaB = ((mediaGolsB + mediaSofridosA) / 2).toFixed(1);

        const texto = `
            ### Estimativa de Placar Provável
            O jogo tende a ser equilibrado, com chances de:
            🟢 Time A marcar cerca de <strong>${estimativaA} gols</strong>
            🔴 Time B marcar cerca de <strong>${estimativaB} gols</strong>

            Probabilidade aproximada de "Ambos os Times Marcam (BTTS)": ${probBTTS.toFixed(2)}%
            Probabilidade aproximada de "Ambos os Times NÃO Marcam": ${probNaoBTTS.toFixed(2)}%

            Probabilidade aproximada de Over/Under +2.5 Gols:
            - Mais de 2.5 gols: ${probMais2_5.toFixed(2)}%
            - Menos de 2.5 gols: ${(100 - probMais2_5).toFixed(2)}%

            Resumo Ofensivo e Defensivo:
            - Time A: Média gols marcados ${mediaGolsA.toFixed(2)}, gols sofridos ${mediaSofridosA.toFixed(2)}
            - Time B: Média gols marcados ${mediaGolsB.toFixed(2)}, gols sofridos ${mediaSofridosB.toFixed(2)}

            Sugestão de aposta BTTS: <strong>${sugestaoBTTS}</strong><br>
            Sugestão Dupla Chance: <strong>${sugestaoDC}</strong><br>
            Sugestão combinada:<br>
            ${sugestaoCombinada}
        `;
        resultadoDiv.innerHTML = texto.replace(/\n/g, '<br>');
    }

    btnPreencher.addEventListener('click', () => {
        document.querySelectorAll('input[type="number"]').forEach(i => i.value = Math.floor(Math.random() * 4) + 1);
        document.getElementById('odd_vitoriaA').value = '1.80';
        document.getElementById('odd_empate').value = '3.30';
        document.getElementById('odd_vitoriaB').value = '4.20';
        resultadoDiv.innerHTML = '';
    });

    btnLimpar.addEventListener('click', () => {
        document.querySelectorAll('input').forEach(i => i.value = '');
        resultadoDiv.innerHTML = '';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const prob = calcularProbabilidades();
        const sug = gerarSugestoes(prob);
        exibirResultado(prob, sug);
    });
});
















