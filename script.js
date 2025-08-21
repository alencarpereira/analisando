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

    return Math.min(Math.max(probTotal * 25, 5), 95);
}

function calcularProbNaoBTTS(probBTTS) {
    return 100 - probBTTS;
}

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
    return Math.min(Math.max(prob, 0), 1);
}

function pegarValoresClasse(classe) {
    return Array.from(document.querySelectorAll(`.${classe}`)).map(input => parseFloat(input.value) || 0);
}

// --- Dupla Chance ajustada com histórico ---
function calcularDuplaChanceAjustada(oddVitoriaA, oddEmpate, oddVitoriaB, freqA, freqB, cdA, cdB) {
    const probVitoriaA = 1 / oddVitoriaA;
    const probEmpate = 1 / oddEmpate;
    const probVitoriaB = 1 / oddVitoriaB;
    const somaProbs = probVitoriaA + probEmpate + probVitoriaB;

    const oddsA = probVitoriaA / somaProbs;
    const oddsE = probEmpate / somaProbs;
    const oddsB = probVitoriaB / somaProbs;

    const totalA = freqA.v + freqA.e + freqA.d;
    const totalB = freqB.v + freqB.e + freqB.d;
    const histA = (freqA.v + freqA.e * 0.5) / totalA;
    const histB = (freqB.v + freqB.e * 0.5) / totalB;

    const freqCD = calcularFrequenciaResultados(cdA, cdB);
    const totalCD = freqCD.v + freqCD.e + freqCD.d;
    const histCD_AouE = (freqCD.v + freqCD.e * 0.5) / totalCD;
    const histCD_BouE = (freqCD.d + freqCD.e * 0.5) / totalCD;
    const histCD_AouB = (freqCD.v + freqCD.d) / totalCD;

    const pesoOdds = 0.4;
    const pesoHistorico = 0.4;
    const pesoCD = 0.2;

    const dcAouEmpate = Math.min((pesoOdds * (oddsA + oddsE)) + (pesoHistorico * histA) + (pesoCD * histCD_AouE), 1);
    const dcBouEmpate = Math.min((pesoOdds * (oddsB + oddsE)) + (pesoHistorico * histB) + (pesoCD * histCD_BouE), 1);
    const dcAouB = Math.min((pesoOdds * (oddsA + oddsB)) + (pesoHistorico * ((histA + histB) / 2)) + (pesoCD * histCD_AouB), 1);

    return { dcAouEmpate, dcBouEmpate, dcAouB };
}

// --- Sugestões combinadas com EV ajustadas ---
function gerarSugestoesCombinadas(probsOdds, probMais25, probMais15, probMenos35, oddMais25, oddMais15, oddMenos35) {
    const dcSegura = probsOdds.dcAouEmpate;
    const dcAlt = probsOdds.dcAouB;

    const probSeguraFinal = Math.min(dcSegura * probMais25, 1);
    const probMais15Final = Math.min(dcAlt * probMais15, 1);
    const probMenos35Final = Math.min(dcAlt * probMenos35, 1);

    const evSegura = (probSeguraFinal * oddMais25) - 1;
    const evMais15Alt = (probMais15Final * oddMais15) - 1;
    const evMenos35Alt = (probMenos35Final * oddMenos35) - 1;

    function formatarSugestao(texto, ev) {
        let cor = '';
        if (ev < 0) cor = 'red';
        else if (ev < 0.2) cor = 'orange';
        else cor = 'green';
        return `<span style="color:${cor}">${texto} | EV: ${ev.toFixed(2)}</span>`;
    }

    return [
        formatarSugestao(`Sugestão combinada segura: Time A ou Empate + +2.5 gols → ${(probSeguraFinal * 100).toFixed(1)}%`, evSegura),
        formatarSugestao(`Sugestão combinada alternativa: Time A ou Time B + +1.5 gols → ${(probMais15Final * 100).toFixed(1)}%`, evMais15Alt),
        formatarSugestao(`Sugestão combinada alternativa: Time A ou Time B + -3.5 gols → ${(probMenos35Final * 100).toFixed(1)}%`, evMenos35Alt)
    ];
}

// --- DOM e eventos ---
document.addEventListener('DOMContentLoaded', () => {
    const btnPreencher = document.getElementById('btnPreencher');
    const btnLimpar = document.getElementById('btnLimpar');
    const form = document.getElementById('btForm');
    const resultadoDiv = document.getElementById('resultado');

    function calcularProbabilidades() {
        const gA = pegarValoresClasse('timeA_gols_marcados');
        const sA = pegarValoresClasse('timeA_gols_sofridos');
        const gB = pegarValoresClasse('timeB_gols_marcados');
        const sB = pegarValoresClasse('timeB_gols_sofridos');
        const cdA = pegarValoresClasse('cd_gols_timeA');
        const cdB = pegarValoresClasse('cd_gols_timeB');

        const oddA = parseFloat(document.getElementById('odd_vitoriaA').value) || 1;
        const oddE = parseFloat(document.getElementById('odd_empate').value) || 1;
        const oddB = parseFloat(document.getElementById('odd_vitoriaB').value) || 1;

        const oddMais25 = parseFloat(document.getElementById('odd_mais25').value) || 2.0;
        const oddMais15 = parseFloat(document.getElementById('odd_mais15').value) || 1.5;
        const oddMenos35 = parseFloat(document.getElementById('odd_menos35').value) || 3.5;

        const probsOdds = calcularDuplaChanceAjustada(
            oddA, oddE, oddB,
            calcularFrequenciaResultados(gA, sA),
            calcularFrequenciaResultados(gB, sB),
            cdA, cdB
        );

        const probBTTS = calcularProbBTTS(gA, sA, gB, sB, cdA, cdB);
        const probNaoBTTS = calcularProbNaoBTTS(probBTTS);

        const mediaGolsA = calcularMedia(gA);
        const mediaSofridosA = calcularMedia(sA);
        const mediaGolsB = calcularMedia(gB);
        const mediaSofridosB = calcularMedia(sB);

        const lambdaA = (mediaGolsA + mediaSofridosB) / 2;
        const lambdaB = (mediaGolsB + mediaSofridosA) / 2;

        return {
            probBTTS,
            probNaoBTTS,
            probsOdds,
            probMais2_5: probOverX(lambdaA, lambdaB, 2),
            probMais15: probOverX(lambdaA, lambdaB, 1.5),
            probMenos35: 1 - probOverX(lambdaA, lambdaB, 3.5),
            mediaGolsA,
            mediaSofridosA,
            mediaGolsB,
            mediaSofridosB,
            oddMais25,
            oddMais15,
            oddMenos35
        };
    }

    function gerarSugestoes(prob) {
        const { probBTTS, probsOdds, probMais2_5, probMais15, probMenos35, oddMais25, oddMais15, oddMenos35 } = prob;

        const sugestaoBTTS = probBTTS >= 60 ? "Boa chance de ambos os times marcarem (BTTS)." :
            probBTTS >= 40 ? "Probabilidade moderada para BTTS." :
                "Baixa chance de ambos os times marcarem.";

        const sugestaoCombinada = gerarSugestoesCombinadas(probsOdds, probMais2_5, probMais15, probMenos35, oddMais25, oddMais15, oddMenos35);

        const opcoesDC = [
            { tipo: 'Time A ou Empate', score: probsOdds.dcAouEmpate },
            { tipo: 'Time B ou Empate', score: probsOdds.dcBouEmpate },
            { tipo: 'Time A ou Time B', score: probsOdds.dcAouB }
        ];
        opcoesDC.sort((a, b) => b.score - a.score);
        const melhorDC = opcoesDC[0].tipo;

        return { sugestaoBTTS, sugestaoDC: melhorDC, sugestaoCombinada };
    }

    function exibirResultado(prob, sug) {
        const { mediaGolsA, mediaSofridosA, mediaGolsB, mediaSofridosB, probBTTS, probNaoBTTS, probMais2_5, probMais15, probMenos35 } = prob;
        const { sugestaoBTTS, sugestaoDC, sugestaoCombinada } = sug;

        const freqA = calcularFrequenciaResultados(pegarValoresClasse('timeA_gols_marcados'), pegarValoresClasse('timeA_gols_sofridos'));
        const freqB = calcularFrequenciaResultados(pegarValoresClasse('timeB_gols_marcados'), pegarValoresClasse('timeB_gols_sofridos'));

        const estimativaA = ((mediaGolsA + mediaSofridosB) / 2).toFixed(1);
        const estimativaB = ((mediaGolsB + mediaSofridosA) / 2).toFixed(1);

        resultadoDiv.innerHTML = `
### Estimativa de Placar Provável
🟢 Time A marcar cerca de <strong>${estimativaA} gols</strong>
🔴 Time B marcar cerca de <strong>${estimativaB} gols</strong>

Probabilidade aproximada de "Ambos os Times Marcam (BTTS)": ${probBTTS.toFixed(2)}%
Probabilidade aproximada de "Ambos os Times NÃO Marcam": ${probNaoBTTS.toFixed(2)}%

Probabilidade aproximada de Over/Under:
- Mais de 2.5 gols: ${(probMais2_5 * 100).toFixed(2)}%
- Mais de 1.5 gols: ${(probMais15 * 100).toFixed(2)}%
- Menos de 3.5 gols: ${(probMenos35 * 100).toFixed(2)}%

Resumo Ofensivo e Defensivo:
- Time A: Média gols marcados ${mediaGolsA.toFixed(2)}, gols sofridos ${mediaSofridosA.toFixed(2)}, V/E/D: ${freqA.v}/${freqA.e}/${freqA.d}
- Time B: Média gols marcados ${mediaGolsB.toFixed(2)}, gols sofridos ${mediaSofridosB.toFixed(2)}, V/E/D: ${freqB.v}/${freqB.e}/${freqB.d}

Sugestão de aposta BTTS: <strong>${sugestaoBTTS}</strong><br>
Sugestão Dupla Chance: <strong>${sugestaoDC}</strong><br>
Sugestão combinada:<br>${sugestaoCombinada.join('<br>')}
        `;
    }

    btnPreencher.addEventListener('click', () => {
        document.querySelectorAll('input[type="number"]').forEach(i => i.value = Math.floor(Math.random() * 4) + 1);
        document.getElementById('odd_vitoriaA').value = '1.80';
        document.getElementById('odd_empate').value = '3.30';
        document.getElementById('odd_vitoriaB').value = '4.20';
        document.getElementById('odd_mais25').value = '2.0';
        document.getElementById('odd_mais15').value = '1.5';
        document.getElementById('odd_menos35').value = '3.5';
        resultadoDiv.innerHTML = '';
    });

    btnLimpar.addEventListener('click', () => {
        form.reset();
        resultadoDiv.innerHTML = '';
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const prob = calcularProbabilidades();
        const sug = gerarSugestoes(prob);
        exibirResultado(prob, sug);
    });
});








































