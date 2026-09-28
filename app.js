const form = document.querySelector('#search-form');
const input = document.querySelector('#city-input');
const button = form.querySelector('button');
const status = document.querySelector('#status');
const weather = document.querySelector('#weather');

const descriptions = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Foggy', '🌫️'], 48: ['Rime fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'], 71: ['Light snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy snow', '❄️'],
  80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Heavy showers', '⛈️'], 95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Severe thunderstorm', '⛈️']
};

const show = (selector, value) => { document.querySelector(selector).textContent = value; };
const weatherInfo = code => descriptions[code] || ['Unknown conditions', '🌡️'];
const formatDay = date => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${date}T12:00:00`));

async function getWeather(city) {
  const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  if (!geoResponse.ok) throw new Error('The location service is unavailable.');
  const geo = await geoResponse.json();
  if (!geo.results?.length) throw new Error(`No location found for “${city}”.`);
  const place = geo.results[0];
  const params = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, timezone: 'auto', forecast_days: 5, current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min' });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error('The weather service is unavailable.');
  return { place, data: await response.json() };
}

function render({ place, data }) {
  const current = data.current;
  const [summary, icon] = weatherInfo(current.weather_code);
  show('#location-name', `${place.name}, ${place.country_code}`);
  show('#updated', `Updated ${new Date(current.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);
  show('#current-icon', icon); show('#current-temperature', `${Math.round(current.temperature_2m)}°C`); show('#current-summary', summary);
  show('#feels-like', `${Math.round(current.apparent_temperature)}°C`); show('#humidity', `${current.relative_humidity_2m}%`); show('#wind', `${Math.round(current.wind_speed_10m)} km/h`);
  document.querySelector('#forecast').innerHTML = data.daily.time.map((date, i) => { const [desc, emoji] = weatherInfo(data.daily.weather_code[i]); return `<article class="forecast-card"><h3>${formatDay(date)}</h3><span class="weather-icon" aria-label="${desc}">${emoji}</span><span class="high">${Math.round(data.daily.temperature_2m_max[i])}°</span><span class="low">${Math.round(data.daily.temperature_2m_min[i])}°</span></article>`; }).join('');
  weather.hidden = false;
}

form.addEventListener('submit', async event => { event.preventDefault(); const city = input.value.trim(); if (!city) return; button.disabled = true; status.textContent = 'Loading weather…'; try { render(await getWeather(city)); status.textContent = ''; } catch (error) { weather.hidden = true; status.textContent = error.message; } finally { button.disabled = false; } });
