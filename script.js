// --- Constantes do programa ---
const MAX_BTTS = 25;
const MIN_BTTS = 5;
const MAX_GOALS_POISSON = 10;
const LIMITE_ESCANTEIOS = 6;
const LIMITE_CARTOES = 4.5;

const PROB_MINIMA = 0.55;
const PROB_DUPLA_MINIMA = 0.7;
const EV_MINIMA = 0;

// --- Histórico de apostas ---
let historicoApostas = JSON.parse(localStorage.getItem('historicoApostas')) || [];

// --- Funções auxiliares ---
function pegarFloat(id, defaultValue = 1) {
    const val = parseFloat(document.getElementById(id)?.value);
    return isNaN(val) ? defaultValue : val;
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

function pegarValoresClasse(classe) {
    return Array.from(document.querySelectorAll(`.${classe}`)).map(input => parseFloat(input.value) || 0);
}

// --- Escanteios e Cartões ---
function calcularProbabilidadesEscanteiosCartoes() {
    const oddEscanteios = pegarFloat("odd_escanteios");
    const oddCartoes = pegarFloat("odd_cartoes");

    const timeA_escanteios = pegarValoresClasse("timeA_escanteios").reduce((a, b) => a + b, 0);
    const timeB_escanteios = pegarValoresClasse("timeB_escanteios").reduce((a, b) => a + b, 0);
    const timeA_cartoes = pegarValoresClasse("timeA_cartoes").reduce((a, b) => a + b, 0);
    const timeB_cartoes = pegarValoresClasse("timeB_cartoes").reduce((a, b) => a + b, 0);

    const probEscanteiosCasa = 1 / oddEscanteios;
    const probCartoesCasa = 1 / oddCartoes;

    return {
        escanteios: Math.min((timeA_escanteios + timeB_escanteios) / (LIMITE_ESCANTEIOS * 2) * probEscanteiosCasa * 1.5, 1),
        cartoes: Math.min((timeA_cartoes + timeB_cartoes) / (LIMITE_CARTOES * 2) * probCartoesCasa * 1.5, 1),
        limiteEscanteios: LIMITE_ESCANTEIOS,
        limiteCartoes: LIMITE_CARTOES
    };
}

// --- BTTS e Poisson ---
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

    return Math.min(Math.max((probGeral * pesoMedias) + (ajusteResultados * pesoResultados) + (probCD * pesoConfrontos), 0), 1);
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

    const pesoOdds = 0.2;
    const pesoHistorico = 0.5;
    const pesoCD = 0.3;

    return {
        dcAouEmpate: Math.min((pesoOdds * (oddsA + oddsE)) + (pesoHistorico * histA) + (pesoCD * histCD_AouE), 1),
        dcBouEmpate: Math.min((pesoOdds * (oddsB + oddsE)) + (pesoHistorico * histB) + (pesoCD * histCD_BouE), 1),
        dcAouB: Math.min((pesoOdds * (oddsA + oddsB)) + (pesoHistorico * ((histA + histB) / 2)) + (pesoCD * histCD_AouB), 1)
    };
}

// --- Gerar todas apostas e destacar a mais recomendada ---
function gerarSugestoesComDestaque(prob) {
    const { probsOdds, probBTTS, probMais2_5, probMais15, probMenos35 } = prob;
    const escCart = calcularProbabilidadesEscanteiosCartoes();
    const oddEV = pegarFloat("odd_vitoriaA");
    const oddMais15 = pegarFloat("odd_mais15");
    const oddMais25 = pegarFloat("odd_mais25");
    const oddMenos35 = pegarFloat("odd_menos35");

    const apostas = [
        { tipo: 'Ambos Marcam (BTTS)', prob: probBTTS, ev: (probBTTS * oddEV) - 1 },
        { tipo: 'Time A ou Empate', prob: probsOdds.dcAouEmpate, ev: (probsOdds.dcAouEmpate * oddEV) - 1 },
        { tipo: 'Time B ou Empate', prob: probsOdds.dcBouEmpate, ev: (probsOdds.dcBouEmpate * oddEV) - 1 },
        { tipo: 'Time A ou Time B', prob: probsOdds.dcAouB, ev: (probsOdds.dcAouB * oddEV) - 1 },
        { tipo: 'Mais de 1.5 gols', prob: probMais15, ev: (probMais15 * oddMais15) - 1 },
        { tipo: 'Mais de 2.5 gols', prob: probMais2_5, ev: (probMais2_5 * oddMais25) - 1 },
        { tipo: 'Menos de 3.5 gols', prob: probMenos35, ev: (probMenos35 * oddMenos35) - 1 },
        { tipo: `Mais de ${escCart.limiteEscanteios} Escanteios`, prob: escCart.escanteios, ev: (escCart.escanteios * oddMais25) - 1 },
        { tipo: `Mais de ${escCart.limiteCartoes} Cartão(ões)`, prob: escCart.cartoes, ev: (escCart.cartoes * oddMais25) - 1 }
    ];

    // Encontrar a mais recomendada (maior probabilidade)
    const recomendada = apostas.reduce((a, b) => b.prob > a.prob ? b : a);
    const apostaSalva = { ...recomendada, data: new Date().toLocaleString(), resultado: "" };
    historicoApostas.push(apostaSalva);
    localStorage.setItem('historicoApostas', JSON.stringify(historicoApostas));

    // Marcar a mais recomendada para destaque
    return apostas.map(a => ({ ...a, destaque: a.tipo === recomendada.tipo }));
}

// --- Atualizar resultado manual ---
function atualizarResultado(idx, valor) {
    historicoApostas[idx].resultado = valor;
    localStorage.setItem('historicoApostas', JSON.stringify(historicoApostas));
}

// --- DOM e eventos ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('btForm');
    const resultadoDiv = document.getElementById('resultado');
    const btnPreencher = document.getElementById('btnPreencher');
    const btnLimpar = document.getElementById('btnLimpar');
    const historicoDiv = document.getElementById('historico');

    function calcularProbabilidades() {
        const gA = pegarValoresClasse('timeA_gols_marcados');
        const sA = pegarValoresClasse('timeA_gols_sofridos');
        const gB = pegarValoresClasse('timeB_gols_marcados');
        const sB = pegarValoresClasse('timeB_gols_sofridos');
        const cdA = pegarValoresClasse('cd_gols_timeA');
        const cdB = pegarValoresClasse('cd_gols_timeB');

        const oddA = pegarFloat('odd_vitoriaA');
        const oddE = pegarFloat('odd_empate');
        const oddB = pegarFloat('odd_vitoriaB');

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

        return {
            probsOdds,
            probBTTS,
            probMais2_5: probOverX(lambdaA, lambdaB, 2),
            probMais15: probOverX(lambdaA, lambdaB, 1.5),
            probMenos35: 1 - probOverX(lambdaA, lambdaB, 3.5)
        };
    }

    function exibirResultado(prob) {
        const apostas = gerarSugestoesComDestaque(prob);
        resultadoDiv.innerHTML = `<h3>Sugestões de Aposta</h3>` + apostas.map(a =>
            `<div style="margin-bottom:5px;${a.destaque ? 'font-weight:bold; color:green;' : ''}">
                ${a.tipo} | Prob: ${(a.prob * 100).toFixed(1)}% | EV: ${a.ev.toFixed(2)} ●
            </div>`).join('');

        // Atualizar histórico
        atualizarHistorico();
    }

    function atualizarHistorico() {
        if (!historicoDiv) return;
        historicoDiv.innerHTML = `<h3>Histórico de Apostas</h3>` + historicoApostas.map((a, idx) =>
            `<div style="margin-bottom:5px;">
                ${idx + 1}. ${a.tipo} | Prob: ${(a.prob * 100).toFixed(1)}% | EV: ${a.ev.toFixed(2)} | ${a.data} 
                | Resultado: 
                <select onchange="atualizarResultado(${idx}, this.value)">
                    <option value="" ${!a.resultado ? 'selected' : ''}>--</option>
                    <option value="ganhou" ${a.resultado === 'ganhou' ? 'selected' : ''}>Ganhou</option>
                    <option value="perdeu" ${a.resultado === 'perdeu' ? 'selected' : ''}>Perdeu</option>
                </select>
            </div>`).join('');
    }

    form.addEventListener('submit', e => {
        e.preventDefault();
        const prob = calcularProbabilidades();
        exibirResultado(prob);
    });

    btnLimpar.addEventListener('click', () => {
        form.reset();
        resultadoDiv.innerHTML = '';
        historicoDiv.innerHTML = '';
        historicoApostas = [];
        localStorage.removeItem('historicoApostas');
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

    // Exibir histórico ao carregar a página
    atualizarHistorico();
});
























































