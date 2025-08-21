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

// --- EV Dupla Chance ---
function calcularEVDuplaChance(probDC, oddDC) {
    return (probDC * oddDC) - 1;
}

// --- Sugestões automáticas ---
function gerarSugestoesAutomatica(prob) {
    const { probsOdds, probBTTS, probMais2_5, probMais15, probMenos35, oddMais25, oddMais15, oddMenos35 } = prob;

    const opcoesDC = [
        { tipo: 'Time A ou Empate', prob: probsOdds.dcAouEmpate, odd: oddMais25 },
        { tipo: 'Time B ou Empate', prob: probsOdds.dcBouEmpate, odd: oddMais25 },
        { tipo: 'Time A ou Time B', prob: probsOdds.dcAouB, odd: oddMais25 }
    ];
    opcoesDC.forEach(op => op.ev = (op.prob * op.odd) - 1);

    const sugestoesOU = [
        { tipo: 'Ambos Marcam (BTTS)', prob: probBTTS / 100, ev: 0.8 },
        { tipo: 'Mais de 2.5 gols', prob: probMais2_5, ev: 0.8 },
        { tipo: 'Mais de 1.5 gols', prob: probMais15, ev: 0.45 },
        { tipo: 'Menos de 3.5 gols', prob: probMenos35, ev: -0.21 },
        { tipo: 'Ambos NÃO Marcam', prob: 1 - probBTTS / 100, ev: -0.91 }
    ];

    return [...opcoesDC, ...sugestoesOU];
}

// --- Sugestão Principal ---
function determinarSugestaoPrincipal(sugestoes) {
    const sugestoesValidas = sugestoes.filter(s => s.ev > 0);
    if (sugestoesValidas.length === 0) {
        return sugestoes.reduce((max, s) => s.ev > max.ev ? s : max, sugestoes[0]);
    }
    return sugestoesValidas.reduce((max, s) => s.prob > max.prob ? s : max, sugestoesValidas[0]);
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

        const mediaGolsA = calcularMedia(gA);
        const mediaSofridosA = calcularMedia(sA);
        const mediaGolsB = calcularMedia(gB);
        const mediaSofridosB = calcularMedia(sB);

        const lambdaA = (mediaGolsA + mediaSofridosB) / 2;
        const lambdaB = (mediaGolsB + mediaSofridosA) / 2;

        return {
            probsOdds,
            probBTTS,
            probMais2_5: probOverX(lambdaA, lambdaB, 2),
            probMais15: probOverX(lambdaA, lambdaB, 1.5),
            probMenos35: 1 - probOverX(lambdaA, lambdaB, 3.5),
            mediaGolsA,
            mediaSofridosA,
            mediaGolsB,
            mediaSofridosB,
            odd_vitoriaA: oddA,
            odd_empate: oddE,
            odd_vitoriaB: oddB,
            oddMais25,
            oddMais15,
            oddMenos35
        };
    }

    // --- Gerar HTML das sugestões com nova ordem ---
    function exibirResultado(prob) {
        const { mediaGolsA, mediaSofridosA, mediaGolsB, mediaSofridosB } = prob;
        const estimativaA = ((mediaGolsA + mediaSofridosB) / 2).toFixed(1);
        const estimativaB = ((mediaGolsB + mediaSofridosA) / 2).toFixed(1);

        const sugestoesAuto = gerarSugestoesAutomatica(prob);
        const sugestaoPrincipal = determinarSugestaoPrincipal(sugestoesAuto);

        // Reordenar as sugestões manualmente
        const ordemNova = [
            'Time A ou Empate',
            'Time B ou Empate',
            'Time A ou Time B',
            'Mais de 1.5 gols',
            'Mais de 2.5 gols',
            'Menos de 3.5 gols',
            'Ambos Marcam (BTTS)',
            'Ambos NÃO Marcam'
        ];
        const sugestoesOrdenadas = ordemNova.map(nome => sugestoesAuto.find(s => s.tipo === nome));

        const sugestoesHTML = sugestoesOrdenadas.map(s => {
            let cor = s.ev < 0 ? '#f44336' : s.ev < 0.2 ? '#ff9800' : '#4caf50';
            return `${s.tipo} | Prob: ${(s.prob * 100).toFixed(1)}% | EV: ${s.ev.toFixed(2)} <span style="color:${cor}">●</span>`;
        }).join('<br>');

        resultadoDiv.innerHTML = `
### Estimativa de Placar Provável
🟢 Time A marcar cerca de <strong>${estimativaA} gols</strong>
🔴 Time B marcar cerca de <strong>${estimativaB} gols</strong>

Resumo Ofensivo e Defensivo:
- Time A: Média gols marcados ${mediaGolsA.toFixed(2)}, gols sofridos ${mediaSofridosA.toFixed(2)}
- Time B: Média gols marcados ${mediaGolsB.toFixed(2)}, gols sofridos ${mediaSofridosB.toFixed(2)}

Sugestões automáticas de apostas:
${sugestoesHTML}

<br><br>
### Sugestão Principal
<b style="color:blue">${sugestaoPrincipal.tipo}</b> | Prob: ${(sugestaoPrincipal.prob * 100).toFixed(1)}% | EV: ${sugestaoPrincipal.ev.toFixed(2)}
    `;
    }


    form.addEventListener('submit', e => {
        e.preventDefault();
        const prob = calcularProbabilidades();
        exibirResultado(prob);
    });

    btnLimpar.addEventListener('click', () => {
        form.reset();
        resultadoDiv.innerHTML = '';
    });

    btnPreencher.addEventListener('click', () => {
        form.querySelectorAll('input[type="number"]').forEach(input => {
            if (input.id === 'odd_vitoriaA') input.value = 1.8;
            else if (input.id === 'odd_empate') input.value = 3.2;
            else if (input.id === 'odd_vitoriaB') input.value = 4.0;
            else if (input.id === 'odd_mais25') input.value = 2.0;
            else if (input.id === 'odd_mais15') input.value = 1.5;
            else if (input.id === 'odd_menos35') input.value = 3.5;
            else input.value = Math.floor(Math.random() * 4) + 1;
        });
    });

});












































