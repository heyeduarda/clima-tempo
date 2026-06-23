// Usa a API gratuita Open-Meteo (sem necessidade de chave de API)

const cidadeInput = document.getElementById('cidade-input');
const btnBuscar = document.getElementById('btn-buscar');
const btnLocalizacao = document.getElementById('btn-localizacao');
const mensagemEl = document.getElementById('mensagem');
const resultadoEl = document.getElementById('resultado');

const CODIGOS_TEMPO = {
    0: { desc: 'Céu limpo', icone: '☀️' },
    1: { desc: 'Predominantemente limpo', icone: '🌤️' },
    2: { desc: 'Parcialmente nublado', icone: '⛅' },
    3: { desc: 'Nublado', icone: '☁️' },
    45: { desc: 'Neblina', icone: '🌫️' },
    48: { desc: 'Neblina com geada', icone: '🌫️' },
    51: { desc: 'Garoa leve', icone: '🌦️' },
    53: { desc: 'Garoa moderada', icone: '🌦️' },
    55: { desc: 'Garoa intensa', icone: '🌧️' },
    56: { desc: 'Garoa congelante leve', icone: '🌧️' },
    57: { desc: 'Garoa congelante intensa', icone: '🌧️' },
    61: { desc: 'Chuva leve', icone: '🌧️' },
    63: { desc: 'Chuva moderada', icone: '🌧️' },
    65: { desc: 'Chuva forte', icone: '🌧️' },
    66: { desc: 'Chuva congelante leve', icone: '🌧️' },
    67: { desc: 'Chuva congelante forte', icone: '🌧️' },
    71: { desc: 'Neve leve', icone: '❄️' },
    73: { desc: 'Neve moderada', icone: '❄️' },
    75: { desc: 'Neve forte', icone: '❄️' },
    77: { desc: 'Grãos de neve', icone: '❄️' },
    80: { desc: 'Aguaceiros leves', icone: '🌧️' },
    81: { desc: 'Aguaceiros moderados', icone: '🌧️' },
    82: { desc: 'Aguaceiros fortes', icone: '⛈️' },
    85: { desc: 'Aguaceiros de neve leves', icone: '🌨️' },
    86: { desc: 'Aguaceiros de neve fortes', icone: '🌨️' },
    95: { desc: 'Trovoada', icone: '⛈️' },
    96: { desc: 'Trovoada com granizo leve', icone: '⛈️' },
    99: { desc: 'Trovoada com granizo forte', icone: '⛈️' },
};

function infoTempo(codigo) {
    return CODIGOS_TEMPO[codigo] || { desc: 'Indefinido', icone: '❔' };
}

function mostrarMensagem(texto) {
    mensagemEl.textContent = texto;
    resultadoEl.classList.add('hidden');
}

function limparMensagem() {
    mensagemEl.textContent = '';
}

async function buscarCoordenadas(cidade) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Falha ao buscar a cidade.');
    const dados = await resp.json();
    if (!dados.results || dados.results.length === 0) {
        throw new Error(`Cidade "${cidade}" não encontrada.`);
    }
    const r = dados.results[0];
    let nome = r.name;
    if (r.admin1) nome += `, ${r.admin1}`;
    if (r.country) nome += ` - ${r.country}`;
    return { latitude: r.latitude, longitude: r.longitude, nome };
}

async function buscarPrevisao(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Falha ao buscar a previsão do tempo.');
    return resp.json();
}

function renderizarResultado(nomeLocal, previsao) {
    document.getElementById('nome-cidade').textContent = nomeLocal;

    const agora = new Date(previsao.current.time);
    document.getElementById('atualizado-em').textContent =
        `Atualizado em ${agora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;

    const atual = infoTempo(previsao.current.weather_code);
    document.getElementById('icone-atual').textContent = atual.icone;
    document.getElementById('temp-atual').textContent = `${Math.round(previsao.current.temperature_2m)}°C`;
    document.getElementById('desc-atual').textContent = atual.desc;
    document.getElementById('vento-atual').textContent = Math.round(previsao.current.wind_speed_10m);
    document.getElementById('umidade-atual').textContent = Math.round(previsao.current.relative_humidity_2m);

    const previsaoEl = document.getElementById('previsao');
    previsaoEl.innerHTML = '';

    previsao.daily.time.forEach((dataStr, i) => {
        if (i === 0) return; // pula hoje, já mostrado acima
        const data = new Date(dataStr + 'T12:00:00');
        const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'short' });
        const info = infoTempo(previsao.daily.weather_code[i]);
        const max = Math.round(previsao.daily.temperature_2m_max[i]);
        const min = Math.round(previsao.daily.temperature_2m_min[i]);

        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.innerHTML = `
            <div class="forecast-card__day">${diaSemana}</div>
            <div class="forecast-card__icon">${info.icone}</div>
            <div class="forecast-card__desc">${info.desc}</div>
            <div class="forecast-card__temps"><strong>${max}°</strong> / ${min}°</div>`;
        previsaoEl.appendChild(card);
    });

    resultadoEl.classList.remove('hidden');
}

async function pesquisarCidade(cidade) {
    if (!cidade.trim()) {
        mostrarMensagem('Digite o nome de uma cidade.');
        return;
    }
    mostrarMensagem('Buscando...');
    try {
        const local = await buscarCoordenadas(cidade.trim());
        const previsao = await buscarPrevisao(local.latitude, local.longitude);
        limparMensagem();
        renderizarResultado(local.nome, previsao);
    } catch (erro) {
        mostrarMensagem(erro.message || 'Ocorreu um erro ao buscar a previsão.');
    }
}

async function usarLocalizacaoAtual() {
    if (!navigator.geolocation) {
        mostrarMensagem('Seu navegador não suporta geolocalização.');
        return;
    }
    mostrarMensagem('Obtendo sua localização...');
    navigator.geolocation.getCurrentPosition(
        async (posicao) => {
            try {
                const { latitude, longitude } = posicao.coords;
                const previsao = await buscarPrevisao(latitude, longitude);
                limparMensagem();
                renderizarResultado('Sua localização atual', previsao);
            } catch (erro) {
                mostrarMensagem(erro.message || 'Ocorreu um erro ao buscar a previsão.');
            }
        },
        () => {
            mostrarMensagem('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        }
    );
}

btnBuscar.addEventListener('click', () => pesquisarCidade(cidadeInput.value));
btnLocalizacao.addEventListener('click', usarLocalizacaoAtual);
cidadeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') pesquisarCidade(cidadeInput.value);
});
