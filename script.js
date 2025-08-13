// --- Funções auxiliares ---

function calcularPesosOddsDuplaChance(oddVitoriaA, oddEmpate, oddVitoriaB) {
    const probVitoriaA = 1 / oddVitoriaA;
    const probEmpate = 1 / oddEmpate;
    const probVitoriaB = 1 / oddVitoriaB;

    const somaProbs = probVitoriaA + probEmpate + probVitoriaB;

    const pA = probVitoriaA / somaProbs;
    const pE = probEmpate / somaProbs;
    const pB = probVitoriaB / somaProbs;

    return {
        dcAouEmpate: pA + pE,
        dcBouEmpate: pB + pE,
        dcAouB: pA + pB
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

    const maxProbGeral = Math.max(
        mediaGolsMarcadosA * mediaGolsSofridosB,
        mediaGolsMarcadosB * mediaGolsSofridosA
    ) * 2;

    const maxAjusteResultados = 1;
    const maxProbCD = 5;

    const maxValorEsperado =
        (maxProbGeral * pesoMedias) +
        (maxAjusteResultados * pesoResultados) +
        (maxProbCD * pesoConfrontos);

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

function contarJogosOver25(marcados, sofridos) {
    let count = 0;
    for (let i = 0; i < marcados.length; i++) {
        if ((marcados[i] + sofridos[i]) > 2.5) count++;
    }
    return count;
}

function pegarValoresClasse(classe) {
    const inputs = Array.from(document.querySelectorAll(`.${classe}`));
    return inputs.map(input => parseFloat(input.value) || 0);
}

function factorial(n) {
    if (n === 0) return 1;
    let f = 1;
    for (let i = 1; i <= n; i++) f *= i;
    return f;
}

function poisson(k, lambda) {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function probOverX(lambdaA, lambdaB, x) {
    let prob = 0;
    const maxGols = 10;
    for (let golsA = 0; golsA <= maxGols; golsA++) {
        for (let golsB = 0; golsB <= maxGols; golsB++) {
            if ((golsA + golsB) > x) {
                prob += poisson(golsA, lambdaA) * poisson(golsB, lambdaB);
            }
        }
    }
    return prob * 100;
}

// --- Função principal que gera sugestão combinada ---

function gerarSugestaoCombinada(
    probTimeAouEmpate, pontuacaoPonderadaA,
    probTimeBouEmpate, pontuacaoPonderadaB,
    probTimeAouTimeB, pontuacaoPonderadaA2, pontuacaoPonderadaB2,
    probsOdds,
    probMais2_5
) {
    const pesoHistorico = 0.6;
    const pesoOdds = 0.4;

    const scoreAouEmpate = (((probTimeAouEmpate + pontuacaoPonderadaA) / 2) * pesoHistorico) + (probsOdds.dcAouEmpate * pesoOdds);
    const scoreBouEmpate = (((probTimeBouEmpate + pontuacaoPonderadaB) / 2) * pesoHistorico) + (probsOdds.dcBouEmpate * pesoOdds);
    const scoreAouB = (((probTimeAouTimeB + ((pontuacaoPonderadaA2 + pontuacaoPonderadaB2) / 2)) / 2) * pesoHistorico) + (probsOdds.dcAouB * pesoOdds);

    const opcoesDC = [
        { tipo: 'Time A ou Empate', score: scoreAouEmpate },
        { tipo: 'Time B ou Empate', score: scoreBouEmpate },
        { tipo: 'Time A ou Time B', score: scoreAouB }
    ];

    opcoesDC.sort((a, b) => b.score - a.score);
    const melhorDC = opcoesDC[0];

    const limiar = 65; // Só sugere se o score for maior que isso

    if (melhorDC.score < limiar) {
        const segundaOpcao = opcoesDC[1];
        const apostaGolsSegura = 'Menos de 3.5 gols';
        return `Sugestão combinada segura: <strong>${melhorDC.tipo} + ${apostaGolsSegura}</strong><br>` +
            `Sugestão combinada alternativa: <strong>${segundaOpcao.tipo} + ${apostaGolsSegura}</strong>`;
    }

    let apostaGols = '';
    if (probMais2_5 >= 70) {
        apostaGols = 'Mais de 2.5 gols';
    } else if (probMais2_5 >= 50) {
        apostaGols = 'Mais de 1.5 gols';
    } else {
        apostaGols = 'Menos de 3.5 gols';
    }

    return `Sugestão combinada: <strong>${melhorDC.tipo} + ${apostaGols}</strong>`;
}

// --- Evento DOMContentLoaded e manipulação do form ---

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('btForm');
    const resultadoDiv = document.getElementById('resultado');
    const btnPreencher = document.getElementById('btnPreencher');
    const btnLimpar = document.getElementById('btnLimpar');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Pegar valores dos inputs
        const golsMarcadosA = pegarValoresClasse('timeA_gols_marcados');
        const golsSofridosA = pegarValoresClasse('timeA_gols_sofridos');
        const golsMarcadosB = pegarValoresClasse('timeB_gols_marcados');
        const golsSofridosB = pegarValoresClasse('timeB_gols_sofridos');
        const cdGolsTimeA = pegarValoresClasse('cd_gols_timeA');
        const cdGolsTimeB = pegarValoresClasse('cd_gols_timeB');

        const totalJogos = golsMarcadosA.length;

        const oddVitoriaA = parseFloat(document.getElementById('odd_vitoriaA').value) || 0;
        const oddEmpate = parseFloat(document.getElementById('odd_empate').value) || 0;
        const oddVitoriaB = parseFloat(document.getElementById('odd_vitoriaB').value) || 0;

        // Médias dos times
        const mediaGolsMarcadosA = calcularMedia(golsMarcadosA);
        const mediaGolsSofridosA = calcularMedia(golsSofridosA);
        const mediaGolsMarcadosB = calcularMedia(golsMarcadosB);
        const mediaGolsSofridosB = calcularMedia(golsSofridosB);

        const mediaCDGolsA = calcularMedia(cdGolsTimeA);
        const mediaCDGolsB = calcularMedia(cdGolsTimeB);

        // Frequência de resultados
        const freqResultadosA = calcularFrequenciaResultados(golsMarcadosA, golsSofridosA);
        const freqResultadosB = calcularFrequenciaResultados(golsMarcadosB, golsSofridosB);

        // Porcentagens
        const pctVitoriaA = (freqResultadosA.v / totalJogos) * 100;
        const pctEmpateA = (freqResultadosA.e / totalJogos) * 100;
        const pctDerrotaA = (freqResultadosA.d / totalJogos) * 100;

        const pctVitoriaB = (freqResultadosB.v / totalJogos) * 100;
        const pctEmpateB = (freqResultadosB.e / totalJogos) * 100;
        const pctDerrotaB = (freqResultadosB.d / totalJogos) * 100;

        // Pesos para pontuação ponderada
        const pesoVitoria = 0.5;
        const pesoEmpate = 0.3;
        const pesoDerrota = 0.2;

        const pontuacaoPonderadaA = (pctVitoriaA * pesoVitoria) + (pctEmpateA * pesoEmpate) + (pctDerrotaA * pesoDerrota);
        const pontuacaoPonderadaB = (pctVitoriaB * pesoVitoria) + (pctEmpateB * pesoEmpate) + (pctDerrotaB * pesoDerrota);

        const probTimeAouEmpate = pctVitoriaA + pctEmpateA;
        const probTimeBouEmpate = pctVitoriaB + pctEmpateB;
        const probTimeAouTimeB = pctVitoriaA + pctVitoriaB;

        const probsOdds = calcularPesosOddsDuplaChance(oddVitoriaA, oddEmpate, oddVitoriaB);

        // Sugestão Dupla Chance
        function gerarSugestaoDuplaChance() {
            const scoreTimeAouEmpate = (probTimeAouEmpate + pontuacaoPonderadaA) * probsOdds.dcAouEmpate;
            const scoreTimeBouEmpate = (probTimeBouEmpate + pontuacaoPonderadaB) * probsOdds.dcBouEmpate;
            const scoreTimeAouTimeB = (probTimeAouTimeB + ((pontuacaoPonderadaA + pontuacaoPonderadaB) / 2)) * probsOdds.dcAouB;

            const opcoes = [
                { tipo: 'Time A ou Empate', valor: probTimeAouEmpate, score: scoreTimeAouEmpate },
                { tipo: 'Time B ou Empate', valor: probTimeBouEmpate, score: scoreTimeBouEmpate },
                { tipo: 'Time A ou Time B (qualquer um vence)', valor: probTimeAouTimeB, score: scoreTimeAouTimeB },
            ];

            opcoes.sort((a, b) => b.score - a.score);

            const diff12 = Math.abs(opcoes[0].valor - opcoes[1].valor);
            if (diff12 < 2) {
                return `Sugestão de aposta Dupla Chance: <strong>${opcoes[0].tipo}</strong> com probabilidade de ${opcoes[0].valor.toFixed(1)}% (desempate por performance)`;
            }

            return `Sugestão de aposta Dupla Chance: <strong>${opcoes[0].tipo}</strong> com probabilidade de ${opcoes[0].valor.toFixed(1)}%`;
        }

        const probBTTS = calcularProbBTTS(golsMarcadosA, golsSofridosA, golsMarcadosB, golsSofridosB, cdGolsTimeA, cdGolsTimeB);
        const probNaoBTTS = calcularProbNaoBTTS(probBTTS);

        const estimativaGolsA = ((mediaGolsMarcadosA + mediaGolsSofridosB) / 2).toFixed(1);
        const estimativaGolsB = ((mediaGolsMarcadosB + mediaGolsSofridosA) / 2).toFixed(1);

        const placarProvavel =
            `### Estimativa de Placar Provável\n` +
            `O jogo tende a ser equilibrado, com chances de:\n` +
            `🟢 Time A marcar cerca de <strong>${estimativaGolsA} gols</strong>\n` +
            `🔴 Time B marcar cerca de <strong>${estimativaGolsB} gols</strong>\n\n`;

        const overA = contarJogosOver25(golsMarcadosA, golsSofridosA);
        const overB = contarJogosOver25(golsMarcadosB, golsSofridosB);
        const freqReal = ((overA + overB) / (totalJogos * 2)) * 100;

        const lambdaA = (mediaGolsMarcadosA + mediaGolsSofridosB) / 2;
        const lambdaB = (mediaGolsMarcadosB + mediaGolsSofridosA) / 2;
        const probMais2_5 = probOverX(lambdaA, lambdaB, 2);
        const probMenos2_5 = 100 - probMais2_5;

        let sugestaoGols = "";
        if (probMais2_5 >= 70) {
            sugestaoGols = `Alta probabilidade de mais de 2.5 gols (${probMais2_5.toFixed(1)}%).\n\n`;
        } else if (probMais2_5 >= 50) {
            sugestaoGols = `Chance razoável de mais de 2.5 gols (${probMais2_5.toFixed(1)}%).\n\n`;
        } else {
            sugestaoGols = `Jogo com menor probabilidade de mais de 2.5 gols (${probMais2_5.toFixed(1)}%).\n\n`;
        }

        let sugestaoBTTS = "";
        if (probBTTS >= 60) sugestaoBTTS = "Boa chance de ambos os times marcarem (BTTS).";
        else if (probBTTS >= 40) sugestaoBTTS = "Probabilidade moderada para BTTS.";
        else sugestaoBTTS = "Baixa chance de ambos os times marcarem.";

        const sugestaoDuplaChance = gerarSugestaoDuplaChance();

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

            `Sugestão de aposta BTTS: <strong>${sugestaoBTTS}</strong><br>` +
            `${sugestaoDuplaChance}<br><br>` +

            `Sugestão combinada:<br>` +
            `${gerarSugestaoCombinada(
                probTimeAouEmpate, pontuacaoPonderadaA,
                probTimeBouEmpate, pontuacaoPonderadaB,
                probTimeAouTimeB, pontuacaoPonderadaA, pontuacaoPonderadaB,
                probsOdds,
                probMais2_5
            )}`;

        resultadoDiv.innerHTML = textoFinal.replace(/\n/g, '<br>');
    });

    btnPreencher.addEventListener('click', () => {
        // Exemplos rápidos para testar
        document.querySelectorAll('.timeA_gols_marcados').forEach((el, i) => el.value = [2, 1, 3, 0, 2][i] || 0);
        document.querySelectorAll('.timeA_gols_sofridos').forEach((el, i) => el.value = [1, 0, 1, 1, 0][i] || 0);
        document.querySelectorAll('.timeB_gols_marcados').forEach((el, i) => el.value = [1, 2, 0, 2, 1][i] || 0);
        document.querySelectorAll('.timeB_gols_sofridos').forEach((el, i) => el.value = [2, 1, 3, 0, 2][i] || 0);

        document.querySelectorAll('.cd_gols_timeA').forEach((el, i) => el.value = [2, 1, 2, 1, 2][i] || 0);
        document.querySelectorAll('.cd_gols_timeB').forEach((el, i) => el.value = [1, 1, 0, 2, 1][i] || 0);

        document.getElementById('odd_vitoriaA').value = '1.80';
        document.getElementById('odd_empate').value = '3.30';
        document.getElementById('odd_vitoriaB').value = '4.20';

        resultadoDiv.innerHTML = '';
    });

    btnLimpar.addEventListener('click', () => {
        document.querySelectorAll('input').forEach(input => input.value = '');
        resultadoDiv.innerHTML = '';
    });
});




// apagar aqui --><!-- -->















