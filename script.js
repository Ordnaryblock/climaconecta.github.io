const apiKey = "4bb6c4a43bf26eef27e849816a12c88b";

// Início automático
document.addEventListener('DOMContentLoaded', () => {
  buscarCidade("Colombo, BR");
  carregarHistorico();
});

// Evento do formulário de busca
document.querySelector('.busca').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.querySelector('#searchInput');
  const cidade = input.value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (cidade !== "") {
    buscarCidade(cidade);
    salvarHistorico(cidade);
    input.value = "";
  }
});

// Busca principal da cidade
async function buscarCidade(cidade) {
  showWarning("Carregando...");

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cidade)}&limit=1&appid=${apiKey}`;

    const [weatherRes, geoRes] = await Promise.all([fetch(url), fetch(geoUrl)]);
    const [data, geoData] = await Promise.all([weatherRes.json(), geoRes.json()]);

    if (!geoData.length || data.cod !== 200) {
      showWarning("Cidade não encontrada.");
      return;
    }

    const { lat, lon } = data.coord;

    showInfo({
      nome: data.name,
      temp: Math.round(data.main.temp),
      descricao: data.weather[0].description,
      icone: data.weather[0].icon,
      vento: data.wind.speed,
      umidade: data.main.humidity,
      sensacao: Math.round(data.main.feels_like),
      lat,
      lon
    });

  buscarAlertas(lat, lon, data.weather[0].description.toLowerCase(), data.weather[0].icon);

    buscarAlertas(lat, lon);
    buscarPrevisao(lat, lon);
    aplicarModoAutomatico();

  } catch (error) {
    console.error(error);
    showWarning("Erro ao obter dados.");
  }
}

// Exibe os dados do tempo atual
function showInfo(dados) {
  document.querySelector('.temp').textContent = `${dados.temp}°C`;
  document.querySelector('.cidade').textContent = dados.nome;
  document.querySelector('.condicao').textContent = dados.descricao;
  document.querySelector('.vento').textContent = `Vento: ${dados.vento} km/h`;
  document.querySelector('.icon-temp').src = `images/${dados.icone}.png`;
  document.querySelector('.umidade').textContent = `Umidade: ${dados.umidade}%`;
  document.querySelector('.sensacao').textContent = `Sensação: ${dados.sensacao}°C`;

  atualizarFundoPorClima(dados.descricao, dados.icone);
  showWarning("");
}

// Mensagem de carregamento ou erro
function showWarning(msg) {
  document.querySelector('.aviso').textContent = msg;
}

// Fundo dinâmico conforme clima
function atualizarFundoPorClima(descricao, icone) {
  const body = document.body;
  const busca = document.querySelector('.busca');
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const cardAvisos = document.querySelector('.card-avisos');


  descricao = descricao.toLowerCase();

  let imagem = '';
  let classe = 'default';

  if (icone.includes('01n')) {
    imagem = "url('images/backmoon.png')";
    classe = 'noite';
  } else if (icone.includes('01d')) {
    imagem = "url('images/backsun.png')";
    classe = 'solardo';
  } else if (icone.includes('03d') || icone.includes("03n") || icone.includes("04n") || icone.includes("04d") || descricao.includes('nublado')) {
    imagem = "url('images/backcloud.png')";
    classe = 'nublado';
  } else if (icone.includes('09d') || icone.includes('09n') || icone.includes('10d') || icone.includes('10n') || descricao.includes('chuva')) {
    imagem = "url('images/backrain.png')";
    classe = 'chuva';
  } else if (icone.includes('11d') || icone.includes('11n') || descricao.includes('raio')) {
    imagem = "url('images/backrainthunder.png')";
    classe = 'raio';
  } else if (icone.includes('02d')) {
    imagem = "url('images/backcloudsun.png')";
    classe = 'algumas';
  } else if (icone.includes('02n')) {
    imagem = "url('images/backcloudmoon.png')";
    classe = 'algumasN';
  } else if (icone.includes('13d') || icone.includes('13n') || descricao.includes('neve')) {
    imagem = "url('images/backneve.png')";
    classe = 'neve';
  } else if (icone.includes('50d') || icone.includes('50n') || descricao.includes('nevoeiro')) {
    imagem = "url('images/backnevoa.png')";
    classe = 'nevoeiro';
  }

 // Após aplicar as classes, personalize o texto de aviso para chuva e raio
const textoAviso = cardAvisos.querySelector('.infoD');
if (classe === 'chuva') {
  textoAviso.textContent = '☔ Atenção: Previsão de chuva hoje. Leve guarda-chuva!';
} else if (classe === 'raio') {
  textoAviso.textContent = '⛈️ Cuidado: Tempestade com raios prevista!';
} else {
  textoAviso.textContent = 'Nenhum alerta meteorológico neste momento.';
}


  body.style.backgroundImage = imagem;
  body.style.backgroundSize = 'cover';
  body.style.backgroundRepeat = 'no-repeat';

  const classes = ['solardo', 'nublado', 'noite', 'chuva', 'default', 'algumas', 'algumasN', 'neve', 'nevoeiro', 'raio'];
  classes.forEach(c => {
    busca.classList.remove(`busca-${c}`);
    header.classList.remove(`header-${c}`);
    footer.classList.remove(`footer-${c}`);
    cardAvisos.classList.remove(`card-avisos-${c}`);
  });

  busca.classList.add(`busca-${classe}`);
  header.classList.add(`header-${classe}`);
  footer.classList.add(`footer-${classe}`);
  cardAvisos.classList.add(`card-avisos-${classe}`);
}


// 🔔 Alertas meteorológicos
async function buscarAlertas() {
  const blocoAlerta = document.querySelector('#alerta');

  // Define estrutura básica do card
  blocoAlerta.className = 'card';
  blocoAlerta.innerHTML = `
    <div class="titulo-card">Alerta do Dia</div>
    <div class="infoD">Carregando alertas...</div>
  `;

  try {
    const resposta = await fetch("https://apiprevmet3.inmet.gov.br/avisos/ativos");
    if (!resposta.ok) throw new Error("Erro na resposta da API");

    const dados = await resposta.json();
    console.log("Dados recebidos da API INMET:", dados);

    const alertas = Object.values(dados);

    if (alertas.length === 0) {
      blocoAlerta.innerHTML = `
        <div class="titulo-card">Alerta do Dia</div>
        <div class="infoD">Nenhum alerta disponível.</div>
      `;
      blocoAlerta.style.backgroundColor = ''; // cor padrão
    } else {
      const alerta = alertas[0];

      // Define cor de fundo com base no nível
      let corFundo = "#f1c40f"; // AMARELO padrão
      if (alerta.nivel === "VERMELHO") corFundo = "#e74c3c";
      else if (alerta.nivel === "LARANJA") corFundo = "#e67e22";

      blocoAlerta.style.backgroundColor = corFundo;
      blocoAlerta.innerHTML = `
        <div class="titulo-card">Alerta do Dia</div>
        <div class="infoD"><strong>Tipo:</strong> ${alerta.tipo}</div>
        <div class="infoD"><strong>Nível:</strong> ${alerta.nivel}</div>
        <div class="infoD"><strong>Mensagem:</strong> ${alerta.mensagem}</div>
        <div class="infoD"><strong>Válido até:</strong> ${alerta.validade}</div>
      `;
    }
  } catch (erro) {
    console.error("Erro ao buscar alertas:", erro);
    blocoAlerta.innerHTML = `
      <div class="titulo-card">Alerta do Dia</div>
      <div class="infoD">Não foi possível obter os alertas.</div>
    `;
    blocoAlerta.style.backgroundColor = '';
  }
}








// 📆 Previsão dos próximos 7 dias
async function buscarPrevisao(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Erro HTTP: " + res.status);
    const data = await res.json();

    exibirPrevisaoDias(data);
  } catch (erro) {
    console.error("Erro ao buscar previsão:", erro);
  }
}

function exibirPrevisaoDias(data) {
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const container = document.getElementById("previsao-dias");
  container.innerHTML = "";

  const diasAdicionados = new Set();

  data.list.forEach((item) => {
    const dataHora = new Date(item.dt * 1000);
    const hora = dataHora.getHours();

    if (hora === 12) {
      const nomeDia = diasSemana[dataHora.getDay()];
      const temp = Math.round(item.main.temp);
      const icone = item.weather[0].icon;

      if (!diasAdicionados.has(nomeDia)) {
        diasAdicionados.add(nomeDia);

        const card = document.createElement("div");
        card.className = "dia";
        card.innerHTML = `
          <p>${nomeDia}</p>
          <img src="images/${icone}.png" alt="${item.weather[0].description}">
          <p>${temp}°C</p>
        `;

        container.appendChild(card);
      }
    }
  });
}

// 💾 Histórico de buscas
function salvarHistorico(cidade) {
  let historico = JSON.parse(localStorage.getItem('historicoBusca')) || [];
  if (!historico.includes(cidade)) {
    historico.unshift(cidade);
    if (historico.length > 5) historico.pop();
    localStorage.setItem('historicoBusca', JSON.stringify(historico));
  }
  carregarHistorico();
}

function carregarHistorico() {
  const historico = JSON.parse(localStorage.getItem('historicoBusca')) || [];
  const histEl = document.querySelector('#historico');
  histEl.innerHTML = "<h3>Histórico de buscas:</h3>";

  historico.forEach(cidade => {
    const btn = document.createElement('button');
    btn.textContent = cidade;
    btn.onclick = () => buscarCidade(cidade);
    histEl.appendChild(btn);
  });
}

// 🌙 Modo escuro automático por horário
function aplicarModoAutomatico() {
  const hora = new Date().getHours();
  document.body.classList.toggle('modo-escuro', hora < 6 || hora >= 18);
}

// mapa meterologico 

// 🗺️ Mapa Meteorológico com OpenWeather + Leaflet
document.addEventListener("DOMContentLoaded", () => {
  const mapaDiv = document.querySelector("#mapa");
  if (mapaDiv) {
    const map = L.map("mapa").setView([-23.5, -46.6], 5); // Centro aproximado do Brasil

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    const openWeatherKey = "4bb6c4a43bf26eef27e849816a12c88b";

    // Camada de nuvens — pode mudar para precipitation_new, pressure_new, etc.
    L.tileLayer(
      `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${openWeatherKey}`,
      {
        attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>'
      }
    ).addTo(map);
  }
});
