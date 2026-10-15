'use strict';

const $ = (selector) => document.querySelector(selector);
const STORAGE = { tasks: 'daylight.tasks.v1', deadlines: 'daylight.deadlines.v1', theme: 'daylight.theme.v1' };
const quotes = [
  { text: 'The secret of getting ahead is getting started.', author: 'MARK TWAIN' },
  { text: 'You do not have to see the whole staircase, just take the first step.', author: 'MARTIN LUTHER KING JR.' },
  { text: 'Great things are done by a series of small things brought together.', author: 'VINCENT VAN GOGH' },
  { text: 'It always seems impossible until it is done.', author: 'NELSON MANDELA' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'ARTHUR ASHE' },
  { text: 'Action is the foundational key to all success.', author: 'PABLO PICASSO' }
];
let tasks = readStorage(STORAGE.tasks, []);
let deadlines = readStorage(STORAGE.deadlines, []);
let lastQuote = -1;

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(fallback) && !Array.isArray(value) ? fallback : (value ?? fallback);
  } catch { return fallback; }
}
function saveStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { announce('Storage is unavailable in this browser session.'); }
}
function announce(message) {
  let status = $('#appStatus');
  if (!status) {
    status = document.createElement('p'); status.id = 'appStatus'; status.className = 'sr-only'; status.setAttribute('role', 'status');
    document.body.append(status);
  }
  status.textContent = message;
}

function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const splitAt = time.lastIndexOf(':');
  $('#clock').innerHTML = `${escapeHTML(time.slice(0, splitAt))}<span>:${escapeHTML(time.slice(splitAt + 1))}</span>`;
  $('#fullDate').textContent = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  $('#clockPeriod').textContent = now.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  $('#timezone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'LOCAL TIME';
  const hour = now.getHours();
  $('#greeting').textContent = hour < 12 ? 'GOOD MORNING, ONE STEP AT A TIME' : hour < 17 ? 'A FRESH AFTERNOON START' : 'MAKE TONIGHT COUNT';
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}
function renderTasks() {
  const list = $('#taskList');
  const complete = tasks.filter(task => task.completed).length;
  const percent = tasks.length ? Math.round(complete / tasks.length * 100) : 0;
  $('#taskCount').textContent = tasks.length;
  $('#taskSummary').textContent = tasks.length ? `${complete} of ${tasks.length} completed. Keep your momentum.` : 'Your next small win is waiting.';
  $('#focusPercent').innerHTML = `${percent}<span>%</span>`;
  $('#progressBar').style.width = `${percent}%`;
  if (!tasks.length) {
    list.innerHTML = '<li class="empty-state">Add your first task above. Future you says thanks. ✨</li>';
    return;
  }
  list.innerHTML = tasks.map(task => `<li class="task-item ${task.completed ? 'completed' : ''}">
    <input class="task-check" type="checkbox" data-task-id="${escapeHTML(task.id)}" ${task.completed ? 'checked' : ''} aria-label="Mark ${escapeHTML(task.text)} as ${task.completed ? 'incomplete' : 'complete'}">
    <span class="task-text">${escapeHTML(task.text)}</span>
    <button class="delete-task" type="button" data-delete-task="${escapeHTML(task.id)}" aria-label="Delete task: ${escapeHTML(task.text)}" title="Delete task">×</button>
  </li>`).join('');
}
$('#taskForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('#taskInput'); const text = input.value.trim();
  if (!text) return;
  tasks.unshift({ id: makeId(), text, completed: false, createdAt: Date.now() });
  saveStorage(STORAGE.tasks, tasks); renderTasks(); input.value = ''; input.focus(); announce('Task added.');
});
$('#taskList').addEventListener('change', (event) => {
  if (!event.target.matches('[data-task-id]')) return;
  const task = tasks.find(item => item.id === event.target.dataset.taskId);
  if (task) { task.completed = event.target.checked; saveStorage(STORAGE.tasks, tasks); renderTasks(); }
});
$('#taskList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-task]');
  if (!button) return;
  tasks = tasks.filter(task => task.id !== button.dataset.deleteTask); saveStorage(STORAGE.tasks, tasks); renderTasks(); announce('Task deleted.');
});
$('#clearCompleted').addEventListener('click', () => {
  const before = tasks.length; tasks = tasks.filter(task => !task.completed); saveStorage(STORAGE.tasks, tasks); renderTasks();
  announce(before === tasks.length ? 'There are no completed tasks to clear.' : 'Completed tasks cleared.');
});

function makeId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
function deadlineTimestamp(deadline) { return new Date(`${deadline.date}T${deadline.time}:00`).getTime(); }
function renderDeadlines() {
  $('#deadlineCount').textContent = deadlines.length;
  const list = $('#deadlineList');
  if (!deadlines.length) { list.innerHTML = '<p class="empty-state" style="grid-column:1/-1">No deadlines yet. Add one to start your countdown.</p>'; return; }
  list.innerHTML = deadlines.slice().sort((a,b) => deadlineTimestamp(a)-deadlineTimestamp(b)).map(deadline => `<article class="deadline-card">
    <div class="deadline-symbol">◷</div><div class="deadline-details"><div class="deadline-top"><p class="deadline-name">${escapeHTML(deadline.name)}</p><button class="delete-deadline" data-delete-deadline="${escapeHTML(deadline.id)}" type="button" aria-label="Delete deadline: ${escapeHTML(deadline.name)}" title="Delete deadline">×</button></div>
    <p class="deadline-due">Due ${escapeHTML(new Date(deadlineTimestamp(deadline)).toLocaleString([], { dateStyle:'medium', timeStyle:'short' }))}</p><p class="countdown" data-countdown="${escapeHTML(deadline.id)}">Calculating…</p></div>
  </article>`).join('');
  updateCountdowns();
}
function updateCountdowns() {
  const now = Date.now();
  document.querySelectorAll('[data-countdown]').forEach(element => {
    const deadline = deadlines.find(item => item.id === element.dataset.countdown);
    if (!deadline) return;
    let distance = deadlineTimestamp(deadline) - now;
    element.classList.remove('urgent', 'past');
    if (Number.isNaN(distance)) { element.textContent = 'Invalid date'; return; }
    if (distance <= 0) { element.textContent = distance > -86400000 ? 'Deadline passed' : 'Past deadline'; element.classList.add('past'); return; }
    const days = Math.floor(distance / 86400000); distance %= 86400000;
    const hours = Math.floor(distance / 3600000); distance %= 3600000;
    const minutes = Math.floor(distance / 60000); distance %= 60000;
    const seconds = Math.floor(distance / 1000);
    element.textContent = days ? `${days}d ${hours}h ${minutes}m left` : `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')} left`;
    if (days < 2) element.classList.add('urgent');
  });
}
$('#deadlineForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#deadlineName').value.trim(); const date = $('#deadlineDate').value; const time = $('#deadlineTime').value;
  if (!name || !date || !time) return;
  if (new Date(`${date}T${time}:00`).getTime() <= Date.now()) { announce('Choose a deadline in the future.'); $('#deadlineDate').focus(); return; }
  deadlines.push({ id: makeId(), name, date, time }); saveStorage(STORAGE.deadlines, deadlines); renderDeadlines(); event.target.reset(); $('#deadlineTime').value = '23:59'; announce('Deadline added.');
});
$('#deadlineList').addEventListener('click', (event) => {
  const button = event.target.closest('[data-delete-deadline]');
  if (!button) return;
  deadlines = deadlines.filter(deadline => deadline.id !== button.dataset.deleteDeadline); saveStorage(STORAGE.deadlines, deadlines); renderDeadlines(); announce('Deadline deleted.');
});

function setTheme(theme) {
  const dark = theme === 'dark'; document.body.classList.toggle('dark', dark);
  $('#themeIcon').textContent = dark ? '☀' : '☾';
  $('#themeToggle').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem(STORAGE.theme, dark ? 'dark' : 'light'); } catch {}
}
$('#themeToggle').addEventListener('click', () => setTheme(document.body.classList.contains('dark') ? 'light' : 'dark'));

$('#newQuote').addEventListener('click', () => {
  if (quotes.length < 2) return;
  let index; do { index = Math.floor(Math.random() * quotes.length); } while (index === lastQuote);
  lastQuote = index; $('#dailyQuote').textContent = quotes[index].text; $('.quote-author').textContent = `— ${quotes[index].author}`;
});

const weatherCodes = {
  0:['Clear sky','☀'],1:['Mostly clear','🌤'],2:['Partly cloudy','⛅'],3:['Overcast','☁'],45:['Foggy','🌫'],48:['Icy fog','🌫'],
  51:['Light drizzle','🌦'],53:['Drizzle','🌦'],55:['Heavy drizzle','🌧'],56:['Freezing drizzle','🌧'],57:['Freezing drizzle','🌧'],
  61:['Light rain','🌦'],63:['Rain','🌧'],65:['Heavy rain','🌧'],66:['Freezing rain','🌧'],67:['Freezing rain','🌧'],
  71:['Light snow','🌨'],73:['Snow','🌨'],75:['Heavy snow','❄'],77:['Snow grains','🌨'],80:['Rain showers','🌦'],81:['Rain showers','🌧'],82:['Heavy showers','⛈'],
  85:['Snow showers','🌨'],86:['Heavy snow showers','❄'],95:['Thunderstorm','⛈'],96:['Thunderstorm with hail','⛈'],99:['Thunderstorm with hail','⛈']
};
function weatherDescription(code) { return weatherCodes[code] || ['Conditions unavailable','☁']; }
async function loadWeather() {
  const status = $('#weatherStatus'); const refresh = $('#refreshWeather');
  refresh.disabled = true; refresh.textContent = 'Refreshing…'; status.textContent = 'Connecting to Open-Meteo…';
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=30.0444&longitude=31.2357&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=Africa%2FCairo';
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Weather service returned an error.');
    const data = await response.json(); const current = data.current; const daily = data.daily;
    const [condition, icon] = weatherDescription(current.weather_code);
    $('#weatherCondition').textContent = condition; $('#weatherArt').textContent = icon;
    $('#temperature').textContent = Math.round(current.temperature_2m);
    $('#feelsLike').textContent = `${Math.round(current.apparent_temperature)}°`;
    $('#windSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    $('#humidity').textContent = `${current.relative_humidity_2m}%`;
    $('#weatherRange').textContent = `H ${Math.round(daily.temperature_2m_max[0])}°  ·  L ${Math.round(daily.temperature_2m_min[0])}° today`;
    const currentHour = new Date(current.time).getHours();
    const slots = data.hourly.time.map((time, index) => ({ time, index, hour: new Date(time).getHours() })).filter(slot => slot.hour >= currentHour && slot.hour <= currentHour + 9).filter((slot, index) => index % 2 === 0).slice(0,4);
    $('#hourlyForecast').innerHTML = slots.map(slot => {
      const [desc, hourIcon] = weatherDescription(data.hourly.weather_code[slot.index]);
      const label = slot.hour === currentHour ? 'Now' : new Date(slot.time).toLocaleTimeString([], { hour:'numeric' });
      return `<div class="hour-item" title="${escapeHTML(desc)}"><span>${escapeHTML(label)}</span><div class="hour-icon" aria-hidden="true">${hourIcon}</div><strong>${Math.round(data.hourly.temperature_2m[slot.index])}°</strong></div>`;
    }).join('') || '<p class="muted-copy">Hourly forecast is unavailable.</p>';
    status.textContent = `Updated ${new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} · Cairo, Egypt`;
  } catch (error) {
    status.textContent = 'Could not load live weather. Check your connection and try again.';
    $('#weatherCondition').textContent = 'Forecast unavailable';
    $('#hourlyForecast').innerHTML = '<p class="muted-copy">Weather data needs an internet connection. You can retry below.</p>';
  } finally { refresh.disabled = false; refresh.textContent = 'Refresh weather ↻'; }
}
$('#refreshWeather').addEventListener('click', loadWeather);

const savedTheme = (() => { try { return localStorage.getItem(STORAGE.theme); } catch { return null; } })();
setTheme(savedTheme === 'dark' ? 'dark' : 'light');
const today = new Date();
$('#deadlineDate').min = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
updateClock(); setInterval(updateClock, 1000); renderTasks(); renderDeadlines(); setInterval(updateCountdowns, 1000); loadWeather();
