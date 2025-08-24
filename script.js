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

    let resultado = (probGeral * pesoMedias) + (ajusteResultados * pesoResultados) + (probCD * pesoConfrontos);
    if (resultado > 0.95) resultado = 0.95;
    return Math.min(Math.max(resultado, 0), 1);
}

// --- Dupla Chance Ajustada ---
// --- Dupla Chance Ajustada (corrigida) ---
function calcularDuplaChanceAjustada(oddVitoriaA, oddEmpate, oddVitoriaB, freqA, freqB, cdA, cdB) {
    // Probabilidades implícitas da casa
    const probVitoriaA = 1 / oddVitoriaA;
    const probEmpate = 1 / oddEmpate;
    const probVitoriaB = 1 / oddVitoriaB;
    const somaProbs = probVitoriaA + probEmpate + probVitoriaB;

    const oddsA = probVitoriaA / somaProbs;
    const oddsE = probEmpate / somaProbs;
    const oddsB = probVitoriaB / somaProbs;

    // Frequência histórica dos times
    const totalA = freqA.v + freqA.e + freqA.d;
    const totalB = freqB.v + freqB.e + freqB.d;
    const histA = (freqA.v + freqA.e * 0.5) / totalA;
    const histB = (freqB.v + freqB.e * 0.5) / totalB;

    // Confrontos diretos
    const freqCD = calcularFrequenciaResultados(cdA, cdB);
    const totalCD = freqCD.v + freqCD.e + freqCD.d;
    const histCD_AouE = (freqCD.v + freqCD.e * 0.5) / totalCD;
    const histCD_BouE = (freqCD.d + freqCD.e * 0.5) / totalCD;
    const histCD_AouB = (freqCD.v + freqCD.d) / totalCD;

    // Pesos
    const pesoOdds = 0.2;
    const pesoHistorico = 0.5;
    const pesoCD = 0.3;

    // Probabilidades finais ajustadas
    const dcAouEmpate = Math.min((pesoOdds * (oddsA + oddsE)) + (pesoHistorico * histA) + (pesoCD * histCD_AouE), 1);
    const dcBouEmpate = Math.min((pesoOdds * (oddsB + oddsE)) + (pesoHistorico * histB) + (pesoCD * histCD_BouE), 1);
    const dcAouB = Math.min((pesoOdds * (oddsA + oddsB)) + (pesoHistorico * ((histA + histB) / 2)) + (pesoCD * histCD_AouB), 1);

    // Retorna apenas combinações válidas
    return { dcAouEmpate, dcBouEmpate, dcAouB };
}


// --- Funções de Probabilidade Poisson ---
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

// --- Gerar todas apostas e destaque ---
function gerarSugestoesComDestaque(prob) {
    const { probsOdds, probBTTS, probMais2_5, probMais15, probMenos35 } = prob;
    const escCart = calcularProbabilidadesEscanteiosCartoes();

    const oddEV = pegarFloat("odd_vitoriaA");
    const oddMais15 = pegarFloat("odd_mais15");
    const oddMais25 = pegarFloat("odd_mais25");
    const oddMenos35 = pegarFloat("odd_menos35");

    // --- Apostas individuais ---
    let apostas = [
        { categoria: "Gols", tipo: 'Ambos Marcam (BTTS)', prob: probBTTS, ev: (probBTTS * oddEV) - 1 },
        { categoria: "Dupla Chance", tipo: 'Time A ou Empate', prob: probsOdds.dcAouEmpate, ev: (probsOdds.dcAouEmpate * oddEV) - 1 },
        { categoria: "Dupla Chance", tipo: 'Time B ou Empate', prob: probsOdds.dcBouEmpate, ev: (probsOdds.dcBouEmpate * oddEV) - 1 },
        { categoria: "Dupla Chance", tipo: 'Time A ou Time B', prob: probsOdds.dcAouB, ev: (probsOdds.dcAouB * oddEV) - 1 },
        { categoria: "Gols", tipo: 'Mais de 1.5 gols', prob: probMais15, ev: (probMais15 * oddMais15) - 1 },
        { categoria: "Gols", tipo: 'Mais de 2.5 gols', prob: probMais2_5, ev: (probMais2_5 * oddMais25) - 1 },
        { categoria: "Gols", tipo: 'Menos de 3.5 gols', prob: probMenos35, ev: (probMenos35 * oddMenos35) - 1 },
        { categoria: "Escanteios/Cartões", tipo: `Mais de ${escCart.limiteEscanteios} Escanteios`, prob: escCart.escanteios, ev: (escCart.escanteios * oddMais25) - 1 },
        { categoria: "Escanteios/Cartões", tipo: `Mais de ${escCart.limiteCartoes} Cartão(ões)`, prob: escCart.cartoes, ev: (escCart.cartoes * oddMais25) - 1 }
    ];

    // --- Combinada BTTS + Mais de 1.5 gols (apenas se não houver conflito) ---
    const pesoBTTS = 0.6;
    const pesoMais15 = 0.4;
    let probCombinada = (pesoBTTS * probBTTS) + (pesoMais15 * probMais15);

    if (!(probBTTS > 0.9 && probMais15 > 0.9)) { // Evita conflito se ambos forem muito altos
        const evCombinada = (probCombinada * ((oddEV + oddMais15) / 2)) - 1;
        if (evCombinada > 0) {
            apostas.push({ categoria: "Gols", tipo: 'Combinada BTTS + Mais de 1.5 gols', prob: probCombinada, ev: evCombinada });
        }
    }

    // --- Filtrar apostas com EV positivo ---
    let apostasValidas = apostas.filter(a => a.ev > 0);

    // --- Destacar até duas apostas principais ---
    let destaque = [];
    if (apostasValidas.length > 0) {
        apostasValidas.sort((a, b) => b.prob - a.prob);
        destaque = apostasValidas.slice(0, 2);
    }

    // --- Marcar destaque ---
    apostas = apostas.map(a => ({ ...a, destaque: destaque.some(d => d.tipo === a.tipo) }));

    // --- Salvar histórico ---
    destaque.forEach(a => {
        const apostaSalva = { ...a, data: new Date().toLocaleString(), resultado: "" };
        historicoApostas.push(apostaSalva);
    });
    localStorage.setItem('historicoApostas', JSON.stringify(historicoApostas));

    return apostas;
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
        const probMais15 = probOverX(calcularMedia(gA), calcularMedia(gB), 1);
        const probMais25 = probOverX(calcularMedia(gA), calcularMedia(gB), 2);
        const probMenos35 = 1 - probMais25;

        return { probsOdds, probBTTS, probMais2_5: probMais25, probMais15, probMenos35 };
    }

    function exibirResultado(prob) {
        const apostas = gerarSugestoesComDestaque(prob);

        if (!apostas.length) {
            resultadoDiv.innerHTML = `<p style="color:red; font-weight:bold;">Nenhuma aposta confiável encontrada.</p>`;
            return;
        }

        // Filtrar apenas as Dupla Chance válidas
        const resultadosJogo = apostas.filter(a => ['Time A ou Empate', 'Time B ou Empate', 'Time A ou Time B'].includes(a.tipo));
        const outrasApostas = apostas.filter(a => !['Time A ou Empate', 'Time B ou Empate', 'Time A ou Time B'].includes(a.tipo));

        let html = `<h3 style="margin-bottom:10px;">Sugestões de Aposta</h3>`;

        // Seção Probabilidades do Jogo
        if (resultadosJogo.length) {
            html += `<h4 style="margin:5px 0; color:#1e90ff;">Probabilidades do Jogo</h4>`;
            resultadosJogo.forEach(a => {
                html += `<div style="margin-bottom:5px; padding:4px 8px; border-radius:5px; background-color:#f0f8ff;">
                        <strong>${a.tipo}:</strong> ${(a.prob * 100).toFixed(1)}%
                     </div>`;
            });
        }

        // Outras apostas (gols, escanteios, cartões)
        if (outrasApostas.length) {
            html += `<h4 style="margin:5px 0; color:#1e90ff;">Outras Apostas</h4>`;
            outrasApostas.forEach(a => {
                html += `<div style="margin-bottom:5px; padding:4px 8px; border-radius:5px; 
                        ${a.destaque ? 'font-weight:bold; background-color:#d4edda; color:#155724;' : 'background-color:#f8f9fa; color:#333;'}">
                        ${a.tipo} | Prob: ${(a.prob * 100).toFixed(1)}% | EV: ${a.ev.toFixed(2)}
                     </div>`;
            });
        }

        resultadoDiv.innerHTML = html;
        atualizarHistorico();
    }


    function atualizarHistorico() {
        historicoDiv.innerHTML = '';
        historicoApostas.slice(-10).forEach((a, idx) => {
            const div = document.createElement('div');
            div.style.margin = '2px 0';
            div.innerHTML = `<strong>${a.tipo}</strong> | Prob: ${(a.prob * 100).toFixed(1)}% | EV: ${a.ev.toFixed(2)}
                             <select onchange="atualizarResultado(${historicoApostas.length - 10 + idx}, this.value)">
                                <option value="">---</option>
                                <option value="Acertou">Acertou</option>
                                <option value="Errou">Errou</option>
                             </select>`;
            historicoDiv.appendChild(div);
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

    atualizarHistorico();
});





























































