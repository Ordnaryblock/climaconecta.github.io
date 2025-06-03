const apiKey = "4bb6c4a43bf26eef27e849816a12c88b";

document.querySelector('.busca').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.querySelector('#searchInput').value.trim().toLowerCase().replace(/\s+/g, ' ');

  if (input !== "") {
    showWarning("Carregando...");

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(input)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(input)}&limit=1&appid=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (geoData.length === 0) {
        showWarning("Cidade não encontrada.");
        return;
      }
      if (data.cod === 200) {
        showInfo({
          nome: data.name,
          temp: Math.round(data.main.temp),
          descricao: data.weather[0].description,
          icone: data.weather[0].icon,
          vento: data.wind.speed
        });
      } else {
        showWarning("Cidade não encontrada.");
      }
      
    } catch (error) {
      showWarning("Erro ao obter dados.");
      console.error(error);
    }
  }
});
const { lat, lon, name } = geoData[0];

function showInfo(dados) {
  document.querySelector('.temp').textContent = `${dados.temp}°C`;
  document.querySelector('.cidade').textContent = dados.nome;
  document.querySelector('.condicao').textContent = dados.descricao;
  document.querySelector('.vento').textContent = `Vento: ${dados.vento} km/h`;
  document.querySelector('.icon-temp').src = `https://openweathermap.org/img/wn/${dados.icone}@2x.png`; // <-- usando CDN da OpenWeather

  atualizarFundoPorClima(dados.descricao);
  showWarning(""); // limpa aviso
}

function showWarning(msg) {
  document.querySelector('.aviso').textContent = msg;
}

function atualizarFundoPorClima(descricao) {
  const body = document.body;
  descricao = descricao.toLowerCase();

  let imagem = '';

if (descricao.includes('nublado')) {
  imagem = "url('images/backcloud.png')";
} else if (descricao.includes('chuva')) {
  imagem = "url('images/backrain.png')";
} else if (descricao.includes('noite')) {
  imagem = "url('images/backmoon.png')";
} else if (descricao.includes('sol') || descricao.includes('ensolarado') || descricao.includes('céu limpo')) {
  imagem = "url('images/sun.png')";
} else {
  imagem = "url('images/sol.jpg')";
}

// APLICA A IMAGEM COMO FUNDO DO BODY
document.body.style.backgroundImage = imagem;
document.body.style.backgroundSize = 'cover';
document.body.style.backgroundRepeat = 'no-repeat';
}