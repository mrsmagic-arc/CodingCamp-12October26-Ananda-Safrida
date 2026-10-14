/* ============================================================
   LIFE DASHBOARD — app.js
   Single JavaScript file. Vanilla JS, no frameworks.
   Covers: Clock, Greeting, Focus Timer, To-Do List,
           Quick Links, Dark/Light Mode, Settings (custom name).
   ============================================================ */

/* ============================================================
   STORAGE HELPERS
   ============================================================ */
const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ============================================================
   CLOCK & DATE
   ============================================================ */
const clockEl   = document.getElementById('clock');
const dateEl    = document.getElementById('date-display');
const greetingEl = document.getElementById('greeting');

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = ((h % 12) || 12);
  clockEl.textContent = `${h12}:${m}:${s} ${ampm}`;

  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function updateGreeting() {
  const h    = new Date().getHours();
  const name = store.get('customName', '');

  let salutation, emoji;
  if (h >= 5 && h < 12) {
    salutation = 'Good Morning';
    emoji      = '☀️';
  } else if (h >= 12 && h < 17) {
    salutation = 'Good Afternoon';
    emoji      = '🌤️';
  } else if (h >= 17 && h < 21) {
    salutation = 'Good Evening';
    emoji      = '🌸';
  } else {
    salutation = 'Good Night';
    emoji      = '🌙';
  }

  // Use a <span> inside so gradient text renders reliably across browsers
  const text = name
    ? `${emoji} ${salutation}, ${name}!`
    : `${emoji} ${salutation}!`;

  greetingEl.innerHTML = `<span>${text}</span>`;
}

updateClock();
updateGreeting();
setInterval(updateClock, 1000);
// Refresh greeting when minute changes (in case hour flips)
setInterval(updateGreeting, 60_000);

/* ============================================================
   THEME (LIGHT / DARK)
   ============================================================ */
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIconEl    = document.getElementById('theme-icon');
const html           = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeIconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
  store.set('theme', theme);
}

// Load saved theme
applyTheme(store.get('theme', 'light'));

themeToggleBtn.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ============================================================
   SETTINGS MODAL (custom name)
   ============================================================ */
const settingsBtn    = document.getElementById('settings-btn');
const settingsModal  = document.getElementById('settings-modal');
const settingsClose  = document.getElementById('settings-close');
const settingsSave   = document.getElementById('settings-save');
const customNameInput = document.getElementById('custom-name');

function openSettings() {
  customNameInput.value = store.get('customName', '');
  settingsModal.hidden = false;
  customNameInput.focus();
}

function closeSettings() { settingsModal.hidden = true; }

settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsModal.addEventListener('click', e => { if (e.target === settingsModal) closeSettings(); });

settingsSave.addEventListener('click', () => {
  const name = customNameInput.value.trim();
  store.set('customName', name);
  updateGreeting();
  closeSettings();
});

// Close modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !settingsModal.hidden) closeSettings();
});

/* ============================================================
   FOCUS TIMER (Pomodoro)
   ============================================================ */
const timerDisplay   = document.getElementById('timer-display');
const startBtn       = document.getElementById('timer-start');
const stopBtn        = document.getElementById('timer-stop');
const resetBtn       = document.getElementById('timer-reset');
const sessionCountEl = document.getElementById('session-count');
const modeTabs       = document.querySelectorAll('.mode-tab');
const pomodoroInput  = document.getElementById('pomodoro-duration');
const shortInput     = document.getElementById('short-duration');
const longInput      = document.getElementById('long-duration');

// Load saved durations
const savedDurations = store.get('timerDurations', { pomodoro: 25, short: 5, long: 15 });
pomodoroInput.value = savedDurations.pomodoro;
shortInput.value    = savedDurations.short;
longInput.value     = savedDurations.long;

let timerInterval   = null;
let currentMode     = 'pomodoro';
let secondsLeft     = savedDurations.pomodoro * 60;
let isRunning       = false;
let sessionCount    = store.get('sessionCount', 0);

sessionCountEl.textContent = sessionCount;

function getDurations() {
  return {
    pomodoro: Math.max(1, parseInt(pomodoroInput.value) || 25),
    short:    Math.max(1, parseInt(shortInput.value)    || 5),
    long:     Math.max(1, parseInt(longInput.value)     || 15)
  };
}

function saveDurations() {
  const d = getDurations();
  store.set('timerDurations', d);
  return d;
}

function getDurationForMode(mode) {
  const d = getDurations();
  const map = { pomodoro: d.pomodoro, short: d.short, long: d.long };
  return map[mode] * 60;
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(secondsLeft);
  document.title = `${formatTime(secondsLeft)} — Life Dashboard`;
}

function setTimerState(state) {
  // state: 'idle' | 'running' | 'paused'
  timerDisplay.classList.toggle('running', state === 'running');
  timerDisplay.classList.toggle('paused',  state === 'paused');
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  setTimerState('running');
  timerInterval = setInterval(() => {
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      if (currentMode === 'pomodoro') {
        sessionCount++;
        sessionCountEl.textContent = sessionCount;
        store.set('sessionCount', sessionCount);
      }
      setTimerState('idle');
      playBeep();
      return;
    }
    secondsLeft--;
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerInterval);
  isRunning = false;
  setTimerState('paused');
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  secondsLeft = getDurationForMode(currentMode);
  setTimerState('idle');
  renderTimer();
  document.title = 'Life Dashboard';
}

function switchMode(mode) {
  currentMode = mode;
  modeTabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  resetTimer();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

modeTabs.forEach(tab => {
  tab.addEventListener('click', () => switchMode(tab.dataset.mode));
});

// Save durations on change & reset timer if not running
[pomodoroInput, shortInput, longInput].forEach(input => {
  input.addEventListener('change', () => {
    saveDurations();
    if (!isRunning) resetTimer();
  });
});

// Simple audio beep using Web Audio API
function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1);
  } catch { /* audio not available */ }
}

// Init display
renderTimer();

/* ============================================================
   TO-DO LIST
   ============================================================ */
const todoInput    = document.getElementById('todo-input');
const todoAddBtn   = document.getElementById('todo-add-btn');
const todoListEl   = document.getElementById('todo-list');
const todoCountEl  = document.getElementById('todo-count');
const clearDoneBtn = document.getElementById('clear-done-btn');
const filterBtns   = document.querySelectorAll('.filter-btn');

let todos       = store.get('todos', []);
let todoFilter  = 'all';
let editingId   = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function saveTodos() { store.set('todos', todos); }

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.unshift({ id: generateId(), text: trimmed, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; saveTodos(); renderTodos(); }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function startEdit(id) {
  editingId = id;
  renderTodos();
}

function saveEdit(id, newText) {
  const trimmed = newText.trim();
  if (trimmed) {
    const t = todos.find(t => t.id === id);
    if (t) t.text = trimmed;
  }
  editingId = null;
  saveTodos();
  renderTodos();
}

function clearDone() {
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
}

function getFilteredTodos() {
  if (todoFilter === 'active') return todos.filter(t => !t.done);
  if (todoFilter === 'done')   return todos.filter(t => t.done);
  return todos;
}

function renderTodos() {
  const filtered = getFilteredTodos();
  const active   = todos.filter(t => !t.done).length;

  todoCountEl.textContent = `${active} task${active !== 1 ? 's' : ''} left`;
  todoListEl.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'todo-empty';
    empty.textContent = todoFilter === 'done'
      ? "No completed tasks yet."
      : todoFilter === 'active'
      ? "Nothing to do — enjoy! 🎉"
      : "Add your first task above.";
    todoListEl.appendChild(empty);
    return;
  }

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type  = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked   = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleTodo(task.id));

    // Text or edit input
    if (editingId === task.id) {
      const editInput = document.createElement('input');
      editInput.type      = 'text';
      editInput.className = 'todo-edit-input';
      editInput.value     = task.text;
      editInput.maxLength = 120;
      editInput.addEventListener('keydown', e => {
        if (e.key === 'Enter')  saveEdit(task.id, editInput.value);
        if (e.key === 'Escape') { editingId = null; renderTodos(); }
      });
      editInput.addEventListener('blur', () => saveEdit(task.id, editInput.value));
      li.appendChild(checkbox);
      li.appendChild(editInput);
      // Confirm button
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'todo-action-btn';
      confirmBtn.textContent = '✓';
      confirmBtn.title = 'Save';
      confirmBtn.setAttribute('aria-label', 'Save edit');
      confirmBtn.addEventListener('click', () => saveEdit(task.id, editInput.value));
      li.appendChild(confirmBtn);
      // Append to DOM then focus
      todoListEl.appendChild(li);
      editInput.focus();
      editInput.select();
      return; // skip normal actions row
    } else {
      const textSpan = document.createElement('span');
      textSpan.className = 'todo-text';
      textSpan.textContent = task.text;
      textSpan.title = 'Double-click to edit';
      textSpan.addEventListener('dblclick', () => startEdit(task.id));
      li.appendChild(checkbox);
      li.appendChild(textSpan);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'todo-action-btn';
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit "${task.text}"`);
    editBtn.addEventListener('click', () => startEdit(task.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'todo-action-btn delete';
    delBtn.textContent = '🗑';
    delBtn.title = 'Delete task';
    delBtn.setAttribute('aria-label', `Delete "${task.text}"`);
    delBtn.addEventListener('click', () => deleteTodo(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(actions);
    todoListEl.appendChild(li);
  });
}

// Add task on button click or Enter key
todoAddBtn.addEventListener('click', () => addTodo(todoInput.value));
todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo(todoInput.value);
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    todoFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle('active', b === btn));
    renderTodos();
  });
});

clearDoneBtn.addEventListener('click', clearDone);

renderTodos();

/* ============================================================
   QUICK LINKS
   ============================================================ */
const linksGrid    = document.getElementById('links-grid');
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAddBtn    = document.getElementById('link-add-btn');

let links = store.get('quickLinks', [
  { id: generateId(), name: 'Google',  url: 'https://google.com' },
  { id: generateId(), name: 'YouTube', url: 'https://youtube.com' },
  { id: generateId(), name: 'GitHub',  url: 'https://github.com' }
]);

function saveLinks() { store.set('quickLinks', links); }

function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch { return null; }
}

function addLink(name, url) {
  const trimName = name.trim();
  let   trimUrl  = url.trim();
  if (!trimName || !trimUrl) return;
  // Prepend https if missing
  if (!/^https?:\/\//i.test(trimUrl)) trimUrl = 'https://' + trimUrl;
  links.push({ id: generateId(), name: trimName, url: trimUrl });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:var(--text-muted);font-size:0.85rem;grid-column:1/-1;';
    empty.textContent = 'No links yet. Add one below!';
    linksGrid.appendChild(empty);
    return;
  }

  links.forEach(link => {
    const a = document.createElement('a');
    a.className = 'link-item';
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');
    a.setAttribute('title', link.url);

    const faviconUrl = getFaviconUrl(link.url);
    if (faviconUrl) {
      const img = document.createElement('img');
      img.className = 'link-favicon';
      img.src = faviconUrl;
      img.alt = '';
      img.onerror = () => img.remove();
      a.appendChild(img);
    }

    const label = document.createElement('span');
    label.textContent = link.name;
    a.appendChild(label);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.textContent = '×';
    delBtn.title = `Remove ${link.name}`;
    delBtn.setAttribute('aria-label', `Remove ${link.name}`);
    delBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });
    a.appendChild(delBtn);

    linksGrid.appendChild(a);
  });
}

linkAddBtn.addEventListener('click', () => addLink(linkNameInput.value, linkUrlInput.value));

linkUrlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addLink(linkNameInput.value, linkUrlInput.value);
});

linkNameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') linkUrlInput.focus();
});

renderLinks();

/* ============================================================
   END OF app.js
   ============================================================ */
