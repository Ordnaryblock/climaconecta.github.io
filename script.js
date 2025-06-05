const apiKey = "4bb6c4a43bf26eef27e849816a12c88b";

// Início automático
document.addEventListener('DOMContentLoaded', () => {
  buscarCidade("Colombo");
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
  
  descricao = descricao.toLowerCase();

  let imagem = '';
  let classe = 'default';

  if (icone) {
    if (icone.endsWith('n')) {
      imagem = "url('images/backmoon.png')";
      classe = 'noite';
    } else if (icone === '01d') {
      imagem = "url('images/backsun.png')";
      classe = 'solardo';
    } else if (icone === '02d') {
      imagem = "url('images/backcloudsun.png')";
      classe = 'algumas';
    } else if (icone === '02n') {
      imagem = "url('images/backcloudmoon.png')";
      classe = 'algumasN';
    } else if (['03d','03n','04d','04n'].includes(icone)) {
      imagem = "url('images/backcloud.png')";
      classe = 'nublado';
    } else if (['09d','09n','10d','10n'].includes(icone)) {
      imagem = "url('images/backrain.png')";
      classe = 'chuva';
    } else if (['11d','11n'].includes(icone)) {
      imagem = "url('images/backrainthunder.png')";
      classe = 'raio';
    } else if (['13d','13n'].includes(icone)) {
      imagem = "url('images/backneve.png')";
      classe = 'neve';
    } else if (['50d','50n'].includes(icone)) {
      imagem = "url('images/backnevoa.png')";
      classe = 'nevoeiro';
    }
  } else {
    // fallback por descrição se icone não estiver definido
    if (descricao.includes('sol')) {
      imagem = "url('images/backsun.png')";
      classe = 'solardo';
    } else if (descricao.includes('nublado')) {
      imagem = "url('images/backcloud.png')";
      classe = 'nublado';
    } else if (descricao.includes('chuva')) {
      imagem = "url('images/backrain.png')";
      classe = 'chuva';
    }
    // etc... adicione conforme desejar
  }

  body.style.backgroundImage = imagem;
  body.style.backgroundSize = 'cover';
  body.style.backgroundRepeat = 'no-repeat';

  const classes = ['solardo', 'nublado', 'noite', 'chuva', 'default', 'algumas', 'algumasN', 'neve', 'nevoeiro', 'raio'];
  classes.forEach(c => {
    busca.classList.remove(`busca-${c}`);
    header.classList.remove(`header-${c}`);
    footer.classList.remove(`footer-${c}`);
  });

  busca.classList.add(`busca-${classe}`);
  header.classList.add(`header-${classe}`);
  footer.classList.add(`footer-${classe}`);
}


// 🔔 Alertas meteorológicos
async function buscarAlertas(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&lang=pt_br`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const alertaEl = document.querySelector('#alerta');

    if (data.alerts && data.alerts.length > 0) {
      const alerta = data.alerts[0];
      alertaEl.innerHTML = `
        <h3>Alerta do Dia</h3>
        <p><strong>${alerta.event}</strong></p>
        <p>${alerta.description}</p>
        <a href="#" class="btn-alerta">Veja como se preparar</a>
      `;
      alertaEl.style.backgroundColor = "#FF8C00";
    } else {
      alertaEl.innerHTML = `<h3>Alerta do Dia</h3><p>Sem alertas para hoje.</p>`;
      alertaEl.style.backgroundColor = "#F8F8FF";
    }

  } catch (error) {
    console.error("Erro ao buscar alertas:", error);
    document.querySelector('#alerta').innerHTML = `<h3>Alerta do Dia</h3><p>Não foi possível obter os alertas.</p>`;
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
