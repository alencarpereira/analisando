// --- Constantes do programa ---
const MAX_BTTS = 25;        // escala BTTS
const MIN_BTTS = 5;
const MAX_GOALS_POISSON = 10;
const LIMITE_ESCANTEIOS = 6;
const LIMITE_CARTOES = 4.5;

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

// --- Escanteios e Cartões ---
function calcularProbabilidadesEscanteiosCartoes() {
    const oddEscanteios = parseFloat(document.getElementById("odd_escanteios").value || 1);
    const oddCartoes = parseFloat(document.getElementById("odd_cartoes").value || 1);

    // ✅ Garantindo que 0 é aceito como valor válido
    const timeA_escanteios = parseFloat(document.querySelector(".timeA_escanteios").value) || 0;
    const timeB_escanteios = parseFloat(document.querySelector(".timeB_escanteios").value) || 0;
    const timeA_cartoes = parseFloat(document.querySelector(".timeA_cartoes").value) || 0;
    const timeB_cartoes = parseFloat(document.querySelector(".timeB_cartoes").value) || 0;

    const mediaTotalEscanteios = timeA_escanteios + timeB_escanteios;
    const mediaTotalCartoes = timeA_cartoes + timeB_cartoes;

    const probEscanteiosCasa = 1 / oddEscanteios;
    const probCartoesCasa = 1 / oddCartoes;

    let probFinalEscanteios = Math.min((mediaTotalEscanteios / (LIMITE_ESCANTEIOS * 2)) * probEscanteiosCasa * 1.5, 1);
    let probFinalCartoes = Math.min((mediaTotalCartoes / (LIMITE_CARTOES * 2)) * probCartoesCasa * 1.5, 1);

    return {
        escanteios: probFinalEscanteios,
        cartoes: probFinalCartoes,
        limiteEscanteios: LIMITE_ESCANTEIOS,
        limiteCartoes: LIMITE_CARTOES
    };
}

// --- BTTS e gols ---
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

    return Math.min(Math.max(probTotal * MAX_BTTS, MIN_BTTS), 95);
}

function calcularProbNaoBTTS(probBTTS) {
    return 100 - probBTTS;
}

// --- Funções de Poisson ---
function factorial(n) { if (n === 0) return 1; let f = 1; for (let i = 1; i <= n; i++) f *= i; return f; }
function poisson(k, lambda) { return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k); }

function probOverX(lambdaA, lambdaB, x) {
    let prob = 0;
    for (let golsA = 0; golsA <= MAX_GOALS_POISSON; golsA++) {
        for (let golsB = 0; golsB <= MAX_GOALS_POISSON; golsB++) {
            if (golsA + golsB > x) prob += poisson(golsA, lambdaA) * poisson(golsB, lambdaB);
        }
    }
    return Math.min(Math.max(prob, 0), 1);
}

function pegarValoresClasse(classe) {
    return Array.from(document.querySelectorAll(`.${classe}`)).map(input => parseFloat(input.value) || 0);
}

// --- Dupla Chance Ajustada ---
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

// --- Sugestão Principal ---
function determinarSugestaoPrincipal(sugestoes) {
    const boas = sugestoes.filter(s => s.ev > 0);
    boas.sort((a, b) => b.prob - a.prob);
    return boas.slice(0, 3);
}

// --- Sugestões Automáticas ---
function gerarSugestoesAutomatica(prob) {
    const { probsOdds, probBTTS, probMais2_5, probMais15, probMenos35 } = prob;
    const escCart = calcularProbabilidadesEscanteiosCartoes();

    const oddMais15 = parseFloat(document.getElementById("odd_mais15").value || 1);
    const oddMais25 = parseFloat(document.getElementById("odd_mais25").value || 1);
    const oddMenos35 = parseFloat(document.getElementById("odd_menos35").value || 1);

    const sugestoes = [
        { tipo: 'Time A ou Empate', prob: probsOdds.dcAouEmpate, ev: (probsOdds.dcAouEmpate * 1.8) - 1 },
        { tipo: 'Time B ou Empate', prob: probsOdds.dcBouEmpate, ev: (probsOdds.dcBouEmpate * 1.8) - 1 },
        { tipo: 'Time A ou Time B', prob: probsOdds.dcAouB, ev: (probsOdds.dcAouB * 1.8) - 1 },
        { tipo: 'Mais de 1.5 gols', prob: probMais15, ev: (probMais15 * oddMais15) - 1 },
        { tipo: 'Mais de 2.5 gols', prob: probMais2_5, ev: (probMais2_5 * oddMais25) - 1 },
        { tipo: 'Menos de 3.5 gols', prob: probMenos35, ev: (probMenos35 * oddMenos35) - 1 },
        { tipo: 'Ambos Marcam (BTTS)', prob: probBTTS / 100, ev: (probBTTS / 100 * 1.8) - 1 },
        { tipo: 'Ambos NÃO Marcam', prob: 1 - probBTTS / 100, ev: ((1 - probBTTS / 100) * 1.8) - 1 },
        { tipo: `Mais de ${escCart.limiteEscanteios} Escanteios`, prob: escCart.escanteios, ev: (escCart.escanteios * 1.9) - 1 },
        { tipo: `Mais de ${escCart.limiteCartoes} Cartão(ões)`, prob: escCart.cartoes, ev: (escCart.cartoes * 1.9) - 1 }
    ];
    return sugestoes;
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

        const oddA = parseFloat(document.getElementById('odd_vitoriaA').value) || 1;
        const oddE = parseFloat(document.getElementById('odd_empate').value) || 1;
        const oddB = parseFloat(document.getElementById('odd_vitoriaB').value) || 1;

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
            odd_vitoriaB: oddB
        };
    }

    function exibirResultado(prob) {
        const sugestoesAuto = gerarSugestoesAutomatica(prob);
        const sugestaoPrincipal = determinarSugestaoPrincipal(sugestoesAuto);

        // Sugestão Principal
        const sugestoesHTML = sugestaoPrincipal.map(s => {
            let cor = s.ev < 0 ? '#f44336' : s.ev < 0.2 ? '#ff9800' : '#4caf50';
            return `${s.tipo} | Prob: ${(s.prob * 100).toFixed(1)}% | EV: ${s.ev.toFixed(2)} <span style="color:${cor}">●</span>`;
        }).join('<br>');

        // Todas Sugestões
        const todasSugestoesHTML = sugestoesAuto.map(s => {
            let cor = s.ev < 0 ? '#f44336' : s.ev < 0.2 ? '#ff9800' : '#4caf50';
            return `${s.tipo} | Prob: ${(s.prob * 100).toFixed(1)}% | EV: ${s.ev.toFixed(2)} <span style="color:${cor}">●</span>`;
        }).join('<br>');

        resultadoDiv.innerHTML = `
<h3>Sugestões Principais</h3>
${sugestoesHTML}
<hr>
<h3>Todas Sugestões</h3>
${todasSugestoesHTML}
<div style="margin-top:20px;">
    <canvas id="graficoEV" width="400" height="200"></canvas>
</div>
    `;

        // --- Gerar gráfico ---
        const ctx = document.getElementById('graficoEV').getContext('2d');

        const sugestoesOrdenadas = [...sugestoesAuto].sort((a, b) => b.ev - a.ev);
        const top3 = sugestoesOrdenadas.slice(0, 3);

        const labels = sugestoesAuto.map(s => s.tipo);
        const probValues = sugestoesAuto.map(s => (s.prob * 100).toFixed(1));
        const evValues = sugestoesAuto.map(s => s.ev.toFixed(2));

        const barColors = sugestoesAuto.map(s => top3.includes(s) ? 'rgba(75, 192, 192, 0.7)' : 'rgba(200, 200, 200, 0.5)');
        const probColors = sugestoesAuto.map(s => 'rgba(54, 162, 235, 0.5)');

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Probabilidade (%)',
                        data: probValues,
                        backgroundColor: probColors,
                        yAxisID: 'y1',
                    },
                    {
                        label: 'EV',
                        data: evValues,
                        backgroundColor: barColors,
                        yAxisID: 'y2',
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y1: {
                        type: 'linear',
                        position: 'left',
                        min: 0,
                        max: 100,
                        title: { display: true, text: 'Probabilidade (%)' }
                    },
                    y2: {
                        type: 'linear',
                        position: 'right',
                        min: -1,
                        max: 1,
                        title: { display: true, text: 'EV' }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const datasetLabel = context.dataset.label || '';
                                const value = context.raw;
                                return `${datasetLabel}: ${value}`;
                            }
                        }
                    }
                }
            }
        });
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
            else if (input.id === 'odd_escanteios') input.value = 1.9;
            else if (input.id === 'odd_cartoes') input.value = 1.9;
            else input.value = Math.floor(Math.random() * 4) + 1;
        });
    });
});
















































