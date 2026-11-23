/* Healthy Living - a personal, offline-first wellness tracker.
 * All data stays in this browser (localStorage). No server, no accounts.
 */
'use strict';

// ---------- Storage ----------
const KEY_PROFILE = 'hl.profile';
const KEY_LOGS = 'hl.logs';

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      toast('Could not save on this device. Is private browsing on?');
      return false;
    }
  }
};

let profile = store.get(KEY_PROFILE, null);
let logs = store.get(KEY_LOGS, {});
const saveProfile = () => store.set(KEY_PROFILE, profile);
const saveLogs = () => store.set(KEY_LOGS, logs);

// ---------- Helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const app = $('#app');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { t.hidden = true; }, 2600);
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function parseKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(k, n) {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
const todayKey = () => dateKey(new Date());
function prettyDate(k) {
  const t = todayKey();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  return parseKey(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function daysBetween(a, b) {
  return Math.round((parseKey(b) - parseKey(a)) / 86400000);
}

function timeToMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(min) {
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
function sleepHours(bed, wake) {
  const b = timeToMin(bed), w = timeToMin(wake);
  if (b == null || w == null) return null;
  let diff = w - b;
  if (diff <= 0) diff += 1440;
  return diff / 60;
}
const round1 = (n) => Math.round(n * 10) / 10;

// ---------- Units ----------
const KG_PER_LB = 0.45359237;
const ML_PER_OZ = 29.5735;
const GLASS_ML = 250;

const isUS = () => (profile ? profile.units : draft.units) === 'us';
function fmtWeight(kg, units) {
  if (kg == null || kg === '') return '-';
  return units === 'us' ? `${Math.round(kg / KG_PER_LB)} lb` : `${round1(kg)} kg`;
}
function fmtWater(ml, units) {
  return units === 'us' ? `${Math.round(ml / ML_PER_OZ)} oz` : `${(ml / 1000).toFixed(1)} L`;
}
function fmtHeight(cm, units) {
  if (!cm) return '-';
  if (units === 'us') {
    const inches = Math.round(cm / 2.54);
    return `${Math.floor(inches / 12)} ft ${inches % 12} in`;
  }
  return `${Math.round(cm)} cm`;
}

// ---------- Questionnaire definition ----------
const OPT = {
  sex: [['female', 'Female'], ['male', 'Male'], ['unspecified', 'Prefer not to say']],
  goals: [['lose', 'Lose weight'], ['strength', 'Gain strength'], ['energy', 'More energy'], ['sleep', 'Sleep better'],
    ['eat', 'Eat healthier'], ['stress', 'Reduce stress'], ['condition', 'Manage a condition']],
  pace: [['gentle', 'Gentle'], ['steady', 'Steady'], ['ambitious', 'Ambitious']],
  typicalDay: [['sitting', 'Mostly sitting'], ['walking', 'Some walking'], ['feet', 'On my feet'], ['physical', 'Physical work']],
  exerciseDays: [0, 1, 2, 3, 4, 5, 6, 7].map(n => [n, String(n)]),
  exerciseTypes: [['walking', 'Walking'], ['running', 'Running'], ['gym', 'Gym'], ['yoga', 'Yoga'], ['cycling', 'Cycling'],
    ['swimming', 'Swimming'], ['sports', 'Sports'], ['home', 'Home workouts']],
  spareMinutes: [[10, '10'], [20, '20'], [30, '30'], [45, '45'], [60, '60+']],
  eatingStyle: [['any', 'No restriction'], ['mixed', 'Veg some days, non-veg others'], ['vegetarian', 'Vegetarian'], ['vegan', 'Vegan'],
    ['eggetarian', 'Eggetarian'], ['pescatarian', 'Pescatarian'], ['other', 'Other']],
  weekdays: [['1', 'Mon'], ['2', 'Tue'], ['3', 'Wed'], ['4', 'Thu'], ['5', 'Fri'], ['6', 'Sat'], ['0', 'Sun']],
  freq: [[0, 'Not at all'], [1, 'Several days'], [2, 'More than half the days'], [3, 'Nearly every day']],
  relaxTime: [['none', 'None'], ['lt30', 'Under 30 min'], ['30-60', '30 to 60 min'], ['60+', 'Over an hour']],
  mindfulness: [['never', 'Never'], ['sometimes', 'Sometimes'], ['most', 'Most days']],
  screenTime: [['lt1', 'Under 1 hour'], ['1-2', '1 to 2 hours'], ['2-4', '2 to 4 hours'], ['4+', 'Over 4 hours']],
  mealsPerDay: [['2', '2'], ['3', '3'], ['3s', '3 + snacks']],
  waterGlasses: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => [n, n === 12 ? '12+' : String(n)]),
  sugary: [['0', 'None'], ['1-3', '1 to 3'], ['4-7', '4 to 7'], ['daily', 'Daily']],
  scale: [1, 2, 3, 4, 5].map(n => [n, String(n)]),
  conditions: [['none', 'None'], ['diabetes', 'Diabetes / pre-diabetes'], ['bp', 'High blood pressure'], ['cholesterol', 'High cholesterol'],
    ['heart', 'Heart condition'], ['joint', 'Back or joint pain'], ['other', 'Other']]
};

const SCREENS = [
  {
    title: 'About you', intro: 'A few basics so your targets fit you.',
    fields: [
      { id: 'name', label: 'Name or nickname', type: 'text', optional: true },
      { id: 'units', label: 'Units', type: 'chips', options: [['us', 'US (lb, ft, oz)'], ['metric', 'Metric (kg, cm, L)']] },
      { id: 'age', label: 'Age (years)', type: 'number', min: 13, max: 100 },
      { id: 'sex', label: 'Sex (used only for calorie and water estimates)', type: 'chips', options: OPT.sex },
      { id: 'height', label: 'Height', type: 'height' },
      { id: 'weight', label: 'Current weight', type: 'weight', key: 'weightKg' }
    ]
  },
  {
    title: 'Your goals', intro: 'Pick what matters most right now.',
    fields: [
      { id: 'goals', label: 'Top goals (pick up to 3)', type: 'multi', options: OPT.goals, max: 3 },
      { id: 'targetWeight', label: 'Target weight (optional)', type: 'weight', key: 'targetKg', optional: true },
      { id: 'pace', label: 'How fast do you want to change?', type: 'chips', options: OPT.pace }
    ]
  },
  {
    title: 'Activity', intro: 'Where you are today, not where you want to be.',
    fields: [
      { id: 'typicalDay', label: 'Your typical day', type: 'chips', options: OPT.typicalDay },
      { id: 'exerciseDays', label: 'Exercise days per week right now', type: 'chips', options: OPT.exerciseDays },
      { id: 'exerciseTypes', label: 'Exercise you enjoy (any)', type: 'multi', options: OPT.exerciseTypes, optional: true },
      { id: 'spareMinutes', label: 'Minutes you can spare on a workout day', type: 'chips', options: OPT.spareMinutes }
    ]
  },
  {
    title: 'Food and drink', intro: 'No calorie counting needed.',
    fields: [
      { id: 'eatingStyle', label: 'Eating style', type: 'chips', options: OPT.eatingStyle },
      { id: 'vegDays', label: 'Which days are vegetarian?', type: 'multi', options: OPT.weekdays, showIf: d => d.eatingStyle === 'mixed' },
      { id: 'avoid', label: 'Allergies or foods to avoid (optional)', type: 'text', optional: true },
      { id: 'mealsPerDay', label: 'Meals per day', type: 'chips', options: OPT.mealsPerDay },
      { id: 'waterGlasses', label: 'Glasses of water per day now (250 ml / 8 oz)', type: 'chips', options: OPT.waterGlasses },
      { id: 'sugary', label: 'Sugary drinks or desserts per week', type: 'chips', options: OPT.sugary }
    ]
  },
  {
    title: 'Sleep', intro: 'Your usual weekday pattern.',
    fields: [
      { id: 'bedtime', label: 'Usual bedtime', type: 'time' },
      { id: 'waketime', label: 'Usual wake time', type: 'time' },
      { id: 'sleepQuality', label: 'Sleep quality (1 = poor, 5 = great)', type: 'chips', options: OPT.scale }
    ]
  },
  {
    title: 'Mind and well-being', intro: 'How you have been feeling over the last 2 weeks. There are no wrong answers.',
    fields: [
      { id: 'moodOverall', label: 'My mood has mostly been (1 = low, 5 = great)', type: 'chips', options: OPT.scale },
      { id: 'stress', label: 'Stress most days (1 = calm, 5 = very stressed)', type: 'chips', options: OPT.scale },
      { id: 'downFreq', label: 'How often have you felt down, low or hopeless?', type: 'chips', options: OPT.freq },
      { id: 'interestFreq', label: 'How often have you had little interest or pleasure in doing things?', type: 'chips', options: OPT.freq },
      { id: 'worryFreq', label: 'How often have you felt nervous, anxious or unable to stop worrying?', type: 'chips', options: OPT.freq },
      { id: 'connection', label: 'How connected do you feel to friends and family? (1 = isolated, 5 = very)', type: 'chips', options: OPT.scale },
      { id: 'relaxTime', label: 'Time for hobbies or relaxing on a typical day', type: 'chips', options: OPT.relaxTime },
      { id: 'mindfulness', label: 'Do you practice meditation, prayer or breathing exercises?', type: 'chips', options: OPT.mindfulness },
      { id: 'screenTime', label: 'Leisure screen time per day (phone, TV, social media)', type: 'chips', options: OPT.screenTime }
    ]
  },
  {
    title: 'Health notes', intro: 'Optional. This helps the app keep targets gentle where needed.',
    fields: [
      { id: 'conditions', label: 'Conditions to work around', type: 'multi', options: OPT.conditions, optional: true, exclusive: 'none' },
      { id: 'conditionsNote', label: 'Anything else to note (optional)', type: 'text', optional: true },
      { id: 'reminderTime', label: 'Daily reminder to log (optional)', type: 'time', optional: true }
    ]
  }
];

let draft = null;
let qStep = 0;
let qError = '';

function newDraft() {
  return {
    units: 'us', name: '', age: '', sex: '', heightCm: '', weightKg: '', targetKg: '',
    goals: [], pace: 'steady', typicalDay: '', exerciseDays: '', exerciseTypes: [], spareMinutes: '',
    eatingStyle: '', vegDays: [], avoid: '', mealsPerDay: '3', waterGlasses: '', sugary: '',
    bedtime: '23:00', waketime: '06:30', sleepQuality: '', stress: '',
    moodOverall: '', downFreq: '', interestFreq: '', worryFreq: '', connection: '', relaxTime: '', mindfulness: '', screenTime: '',
    conditions: [], conditionsNote: '', reminderTime: ''
  };
}

function isEmpty(v) {
  return v === '' || v == null || (Array.isArray(v) && v.length === 0);
}

function fieldValue(f) {
  if (f.type === 'height') return draft.heightCm;
  if (f.type === 'weight') return draft[f.key];
  return draft[f.id];
}

function validateScreen(i) {
  for (const f of SCREENS[i].fields) {
    if (f.showIf && !f.showIf(draft)) continue;
    const v = fieldValue(f);
    if (!f.optional && isEmpty(v)) return `Please answer: ${f.label}`;
    if (f.type === 'number' && !isEmpty(v)) {
      const n = Number(v);
      if (Number.isNaN(n) || n < f.min || n > f.max) return `${f.label} should be between ${f.min} and ${f.max}.`;
    }
    if (f.type === 'height' && !isEmpty(v) && (v < 100 || v > 250)) return 'Please check your height.';
    if (f.type === 'weight' && !isEmpty(v) && (v < 30 || v > 300)) return `Please check: ${f.label}`;
  }
  return '';
}

function renderField(f) {
  if (f.showIf && !f.showIf(draft)) return '';
  const v = fieldValue(f);
  const us = draft.units === 'us';
  let inner = '';
  switch (f.type) {
    case 'text':
      inner = `<input type="text" data-f="${f.id}" value="${esc(v)}" maxlength="120">`;
      break;
    case 'number':
      inner = `<input type="number" inputmode="numeric" data-f="${f.id}" value="${esc(v)}" min="${f.min}" max="${f.max}">`;
      break;
    case 'time':
      inner = `<input type="time" data-f="${f.id}" value="${esc(v)}">`;
      break;
    case 'height':
      if (us) {
        const inches = v ? Math.round(v / 2.54) : '';
        const ft = inches === '' ? '' : Math.floor(inches / 12);
        const inch = inches === '' ? '' : inches % 12;
        inner = `<div class="grid2">
          <input type="number" inputmode="numeric" data-h="ft" value="${ft}" placeholder="ft" aria-label="Feet">
          <input type="number" inputmode="numeric" data-h="in" value="${inch}" placeholder="in" aria-label="Inches"></div>`;
      } else {
        inner = `<input type="number" inputmode="numeric" data-h="cm" value="${v ? Math.round(v) : ''}" placeholder="cm">`;
      }
      break;
    case 'weight': {
      const shown = v === '' || v == null ? '' : (us ? Math.round(v / KG_PER_LB) : round1(v));
      inner = `<input type="number" inputmode="decimal" step="0.1" data-w="${f.key}" value="${shown}" placeholder="${us ? 'lb' : 'kg'}">`;
      break;
    }
    case 'chips':
      inner = `<div class="chips">${f.options.map(([val, lbl]) =>
        `<button type="button" class="chip ${String(v) === String(val) ? 'on' : ''}" data-chip="${f.id}" data-val="${esc(val)}">${esc(lbl)}</button>`).join('')}</div>`;
      break;
    case 'multi':
      inner = `<div class="chips">${f.options.map(([val, lbl]) =>
        `<button type="button" class="chip ${(v || []).includes(val) ? 'on' : ''}" data-multi="${f.id}" data-val="${esc(val)}">${esc(lbl)}</button>`).join('')}</div>`;
      break;
  }
  if (['text', 'number', 'time', 'weight'].includes(f.type) || (f.type === 'height' && !us)) {
    return `<label class="field"><span>${esc(f.label)}</span>${inner}</label>`;
  }
  // Groups of buttons or several inputs: a <label> here would make a tap on the question text press the first button.
  return `<div class="field" role="group" aria-label="${esc(f.label)}"><span>${esc(f.label)}</span>${inner}</div>`;
}

function renderQuestionnaire() {
  $('#tabbar').hidden = true;
  $('#title').textContent = profile ? 'Update my answers' : 'Welcome';
  const s = SCREENS[qStep];
  const steps = SCREENS.map((_, i) => `<i class="${i <= qStep ? 'done' : ''}"></i>`).join('');
  app.innerHTML = `
    ${!profile && qStep === 0 ? `<div class="banner">Answer ${SCREENS.length} short screens (about 6 minutes) and the app builds a plan around you. Your answers stay on this device.</div>` : ''}
    <div class="card">
      <div class="progress-steps" aria-label="Step ${qStep + 1} of ${SCREENS.length}">${steps}</div>
      <div class="muted small">Step ${qStep + 1} of ${SCREENS.length}</div>
      <h2>${esc(s.title)}</h2>
      <p class="muted">${esc(s.intro)}</p>
      <form id="qform" novalidate>
        ${s.fields.map(renderField).join('')}
        ${qError ? `<div class="error" role="alert">${esc(qError)}</div>` : ''}
        <div class="row between" style="margin-top:16px">
          ${qStep > 0 ? '<button type="button" class="btn secondary" id="qback">Back</button>' : (profile ? '<button type="button" class="btn secondary" id="qcancel">Cancel</button>' : '<span></span>')}
          <button type="submit" class="btn">${qStep === SCREENS.length - 1 ? 'See my plan' : 'Next'}</button>
        </div>
      </form>
    </div>`;
  window.scrollTo(0, 0);
}

function onQuestionnaireInput(e) {
  const t = e.target;
  if (t.dataset.f) {
    const f = SCREENS[qStep].fields.find(x => x.id === t.dataset.f);
    draft[t.dataset.f] = f && f.type === 'number' ? (t.value === '' ? '' : Number(t.value)) : t.value;
  } else if (t.dataset.h) {
    if (t.dataset.h === 'cm') {
      draft.heightCm = t.value === '' ? '' : Number(t.value);
    } else {
      const form = t.form;
      const ft = Number($('[data-h=ft]', form).value || 0);
      const inch = Number($('[data-h=in]', form).value || 0);
      draft.heightCm = ft || inch ? (ft * 12 + inch) * 2.54 : '';
    }
  } else if (t.dataset.w) {
    const n = t.value === '' ? '' : Number(t.value);
    draft[t.dataset.w] = n === '' ? '' : (draft.units === 'us' ? n * KG_PER_LB : n);
  }
}

function onQuestionnaireClick(e) {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.chip) {
    const f = SCREENS[qStep].fields.find(x => x.id === b.dataset.chip);
    let val = b.dataset.val;
    if (f.options.length && typeof f.options[0][0] === 'number') val = Number(val);
    draft[f.id] = val;
    qError = '';
    renderQuestionnaire();
  } else if (b.dataset.multi) {
    const f = SCREENS[qStep].fields.find(x => x.id === b.dataset.multi);
    const val = b.dataset.val;
    let arr = draft[f.id] || [];
    if (arr.includes(val)) {
      arr = arr.filter(x => x !== val);
    } else {
      if (f.exclusive && val === f.exclusive) arr = [];
      else if (f.exclusive) arr = arr.filter(x => x !== f.exclusive);
      if (f.max && arr.length >= f.max) {
        qError = `Pick up to ${f.max}. Tap one to remove it first.`;
        renderQuestionnaire();
        return;
      }
      arr.push(val);
    }
    draft[f.id] = arr;
    qError = '';
    renderQuestionnaire();
  } else if (b.id === 'qback') {
    qError = '';
    qStep--;
    renderQuestionnaire();
  } else if (b.id === 'qcancel') {
    draft = null;
    qError = '';
    showTab('settings');
  }
}

function onQuestionnaireSubmit(e) {
  e.preventDefault();
  qError = validateScreen(qStep);
  if (qError) { renderQuestionnaire(); return; }
  if (qStep < SCREENS.length - 1) {
    qStep++;
    renderQuestionnaire();
    return;
  }
  const startDate = profile && profile.startDate ? profile.startDate : todayKey();
  profile = Object.assign({}, draft, { startDate, updatedAt: new Date().toISOString() });
  saveProfile();
  draft = null;
  qStep = 0;
  toast('Your plan is ready');
  showTab('plan');
}

function startQuestionnaire() {
  draft = profile ? JSON.parse(JSON.stringify(profile)) : newDraft();
  qStep = 0;
  qError = '';
  currentTab = null;
  renderQuestionnaire();
}

// ---------- Plan engine ----------
const HABITS = {
  sugar: 'Swap sugary drinks and desserts for fruit, water or tea',
  water: 'Drink a full glass of water with every meal',
  screens: 'Screens off 30 minutes before bed',
  breathe: '5 minutes of slow breathing or a short walk to unwind each day',
  walk: 'A 10-minute walk after lunch or dinner',
  veg: 'Add one serving of vegetables to lunch and dinner',
  protein: 'Include a protein source in every meal',
  gratitude: 'Write down one good thing about your day',
  connect: 'Reach out to a friend or family member (call, text or visit)',
  unplug: 'One screen-free hour in the evening',
  hobby: '15 minutes on something you enjoy, just for you',
  log: 'Log your day, every day this week'
};
const FREQ_HIGH = 2; // "More than half the days" or more

function latestWeightKg() {
  const keys = Object.keys(logs).filter(k => logs[k].weightKg != null && k <= todayKey()).sort();
  return keys.length ? Number(logs[keys[keys.length - 1]].weightKg) : null;
}

function computePlan(p) {
  const kg = latestWeightKg() || Number(p.weightKg), cm = Number(p.heightCm), age = Number(p.age);
  const sexAdj = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
  const bmr = 10 * kg + 6.25 * cm - 5 * age + sexAdj; // Mifflin-St Jeor
  const factor = { sitting: 1.2, walking: 1.375, feet: 1.55, physical: 1.725 }[p.typicalDay] || 1.2;
  const maintenance = bmr * factor;
  const hasCondition = (p.conditions || []).some(c => c !== 'none');
  const pace = hasCondition ? 'gentle' : p.pace;
  const goals = p.goals || [];

  let calories = maintenance;
  let calNote = 'to maintain your weight';
  if (goals.includes('lose')) {
    calories = maintenance - { gentle: 250, steady: 400, ambitious: 500 }[pace];
    calNote = `for ${pace} weight loss`;
  } else if (goals.includes('strength')) {
    calories = maintenance + 200;
    calNote = 'to support building strength';
  }
  const floor = p.sex === 'male' ? 1500 : 1200;
  calories = Math.max(floor, Math.round(calories / 10) * 10);

  const waterMl = Math.round((kg * 33) / 50) * 50;
  const waterGlasses = Math.max(6, Math.round(waterMl / GLASS_ML));

  const curDays = Number(p.exerciseDays) || 0;
  const workoutDays = Math.min(7, Math.max(2, curDays + 1));
  const sessionMin = Number(p.spareMinutes) || 20;
  const weeklyMin = workoutDays * sessionMin;

  const baseSteps = { sitting: 3000, walking: 5000, feet: 7000, physical: 9000 }[p.typicalDay] || 4000;
  const steps = Math.min(10000, baseSteps + 1000);

  const curSleep = sleepHours(p.bedtime, p.waketime);
  const week = Math.max(0, Math.floor(daysBetween(p.startDate || todayKey(), todayKey()) / 7));
  let bedtimeTarget = null;
  if (curSleep != null && curSleep < 7) {
    const needed = Math.round((7.5 - curSleep) * 60);
    const shift = Math.min(needed, 15 * (week + 1));
    bedtimeTarget = timeToMin(p.bedtime) - shift;
  }

  // Weekly focus: rotate through habits that match the answers, most relevant first.
  const habits = [];
  if (p.sugary === '4-7' || p.sugary === 'daily') habits.push('sugar');
  if (Number(p.waterGlasses) < waterGlasses - 1) habits.push('water');
  if ((curSleep != null && curSleep < 7) || Number(p.sleepQuality) <= 2 || goals.includes('sleep')) habits.push('screens');
  if (Number(p.stress) >= 4 || Number(p.worryFreq) >= FREQ_HIGH || goals.includes('stress')) habits.push('breathe');
  if (Number(p.moodOverall) <= 2 || Number(p.downFreq) >= 1) habits.push('gratitude');
  if (p.connection !== '' && Number(p.connection) <= 2) habits.push('connect');
  if (p.relaxTime === 'none' || p.relaxTime === 'lt30' || Number(p.interestFreq) >= 1) habits.push('hobby');
  if (p.screenTime === '2-4' || p.screenTime === '4+') habits.push('unplug');
  if (curDays < 3 || goals.includes('energy')) habits.push('walk');
  if (goals.includes('eat') || goals.includes('lose') || goals.includes('condition')) habits.push('veg');
  if (goals.includes('strength')) habits.push('protein');
  if (!habits.length) habits.push('log');
  const habitKey = habits[week % habits.length];

  const mindfulMin = { never: 5, sometimes: 10, most: 15 }[p.mindfulness] || 5;
  const needsSupport = Number(p.downFreq) >= FREQ_HIGH || Number(p.interestFreq) >= FREQ_HIGH;

  return {
    mindfulMin, needsSupport,
    calories, calNote, maintenance: Math.round(maintenance), pace, hasCondition,
    waterMl, waterGlasses, workoutDays, sessionMin, weeklyMin, steps,
    curSleep, bedtimeTarget, week, habitKey, habit: HABITS[habitKey], habits
  };
}

function isVegDay(p, k) {
  if (p.eatingStyle !== 'mixed') return null;
  return (p.vegDays || []).includes(String(parseKey(k).getDay()));
}

const SUPPORT_MSG = 'You mentioned feeling down or losing interest on most days. That is worth talking about with your doctor or a counselor. ' +
  'If you ever feel you might harm yourself, in the US you can call or text 988 any time.';

function mealSlots(p) {
  if (p.mealsPerDay === '2') return [['m1', 'First meal'], ['m2', 'Second meal']];
  const slots = [['m1', 'Breakfast'], ['m2', 'Lunch'], ['m3', 'Dinner']];
  if (p.mealsPerDay === '3s') slots.push(['m4', 'Snacks']);
  return slots;
}

// ---------- Tabs ----------
let currentTab = null;
let viewDate = todayKey();
let progressRange = 7;

function showTab(tab) {
  currentTab = tab;
  $('#tabbar').hidden = false;
  document.querySelectorAll('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  ({ today: renderToday, progress: renderProgress, plan: renderPlan, settings: renderSettings })[tab]();
  window.scrollTo(0, 0);
}

function getLog(k) {
  return logs[k] || {};
}
function setLog(k, patch) {
  const cur = Object.assign({}, logs[k] || {}, patch);
  Object.keys(cur).forEach(key => { if (cur[key] === '' || cur[key] == null) delete cur[key]; });
  if (cur.meals && Object.keys(cur.meals).length === 0) delete cur.meals;
  if (cur.kcal && Object.keys(cur.kcal).length === 0) delete cur.kcal;
  if (Object.keys(cur).length) logs[k] = cur; else delete logs[k];
  saveLogs();
}
const hasEntry = (k) => !!logs[k] && Object.keys(logs[k]).length > 0;

// ---------- Today ----------
function ring(value, target, label, numText, color) {
  const pct = target > 0 ? Math.min(1, (value || 0) / target) : 0;
  const r = 30, c = 2 * Math.PI * r;
  return `<div class="ring">
    <svg viewBox="0 0 80 80" role="img" aria-label="${esc(label)} ${Math.round(pct * 100)} percent">
      <circle cx="40" cy="40" r="${r}" fill="none" stroke="var(--line)" stroke-width="8"/>
      <circle cx="40" cy="40" r="${r}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 40 40)"/>
      <text x="40" y="45" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">${Math.round(pct * 100)}%</text>
    </svg>
    <div class="num">${esc(numText)}</div><div class="lbl">${esc(label)}</div></div>`;
}

function scaleInput(id, value, low, high) {
  return `<div class="chips scale">${[1, 2, 3, 4, 5].map(n =>
      `<button class="chip ${value === n ? 'on' : ''}" data-scale="${id}" data-val="${n}" aria-pressed="${value === n}">${n}</button>`).join('')}</div>
    <div class="scale-labels"><span>1 ${esc(low)}</span><span>5 ${esc(high)}</span></div>`;
}

function scaleField(id, label, value, low, high) {
  return `<div class="field" role="group" aria-label="${esc(label)}"><span>${esc(label)}</span>${scaleInput(id, value, low, high)}</div>`;
}

function ringsHTML(plan, L) {
  const kcalTotal = Object.values(L.kcal || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  return `
    ${ring(kcalTotal, plan.calories, 'Calories', `${kcalTotal.toLocaleString()}/${plan.calories.toLocaleString()}`, '#dd6b20')}
    ${ring(L.water, plan.waterGlasses, 'Water', `${L.water || 0}/${plan.waterGlasses} glasses`, 'var(--accent)')}
    ${ring(L.activityMin, plan.sessionMin, 'Activity', `${L.activityMin || 0}/${plan.sessionMin} min`, 'var(--brand)')}
    ${ring(L.sleepHours, 7, 'Sleep', `${L.sleepHours || 0}/7+ h`, '#805ad5')}
    ${ring(L.mindfulMin, plan.mindfulMin, 'Mind', `${L.mindfulMin || 0}/${plan.mindfulMin} min`, '#319795')}
    ${ring(L.habit ? 1 : 0, 1, 'Weekly habit', L.habit ? 'Done' : 'Not yet', '#d69e2e')}`;
}

// Update the rings and calorie total in place, without re-rendering the page (keeps keyboard focus on phones).
function refreshSummary() {
  const plan = computePlan(profile), L = getLog(viewDate);
  const r = $('#rings');
  if (r) r.innerHTML = ringsHTML(plan, L);
  const kt = $('#kcalTotal');
  if (kt) kt.textContent = Object.values(L.kcal || {}).reduce((a, b) => a + (Number(b) || 0), 0).toLocaleString();
}

function renderToday() {
  const p = profile, plan = computePlan(p);
  const k = viewDate, L = getLog(k), t = todayKey();
  $('#title').textContent = p.name ? `Hi, ${p.name}` : 'Today';
  const units = p.units;
  const meals = L.meals || {};
  const kcal = L.kcal || {};
  const kcalTotal = Object.values(kcal).reduce((a, b) => a + (Number(b) || 0), 0);
  const veg = isVegDay(p, k);
  const recentMoods = [0, 1, 2].map(i => getLog(addDays(k, -i)).mood);
  const lowMoodRun = recentMoods.every(m => m === 1);
  const showReminder = k === t && p.reminderTime && !hasEntry(t) &&
    (new Date().getHours() * 60 + new Date().getMinutes()) >= timeToMin(p.reminderTime);

  app.innerHTML = `
    ${showReminder ? '<div class="banner warn">Reminder: you haven\'t logged today yet. It takes under 2 minutes.</div>' : ''}
    ${lowMoodRun ? `<div class="banner warn">Your mood has been at 1 for three days. Be kind to yourself, and consider talking with someone you trust or your doctor. In the US you can call or text 988 any time.</div>` : ''}
    <div class="card">
      <div class="row between">
        <button class="iconbtn" data-act="prevDay" aria-label="Previous day">&#8249;</button>
        <h2 style="margin:0">${esc(prettyDate(k))}</h2>
        <button class="iconbtn" data-act="nextDay" aria-label="Next day" ${k >= t ? 'disabled' : ''}>&#8250;</button>
      </div>
    </div>

    <div class="card">
      <div class="rings" id="rings">${ringsHTML(plan, L)}</div>
    </div>

    <div class="card">
      <h2>Weekly habit</h2>
      <p style="margin:0 0 10px">${esc(plan.habit)}</p>
      <button class="chip ${L.habit ? 'on' : ''}" data-act="habit">${L.habit ? '&#10003; Done today' : 'Mark as done'}</button>
    </div>

    <div class="card">
      <h2>Water</h2>
      <div class="counter">
        <button class="iconbtn" data-act="waterMinus" aria-label="Remove a glass">&minus;</button>
        <span class="val">${L.water || 0}</span>
        <button class="iconbtn" data-act="waterPlus" aria-label="Add a glass">+</button>
        <span class="muted">of ${plan.waterGlasses} glasses (${fmtWater((L.water || 0) * GLASS_ML, units)})</span>
      </div>
    </div>

    <div class="card">
      <div class="row between"><h2 style="margin:0">Meals</h2>
        ${veg === null ? '' : `<span class="pill ${veg ? 'veg' : 'nonveg'}">${veg ? 'Veg day' : 'Non-veg day'}</span>`}</div>
      <p class="muted small">Rate each meal and add calories if you know them. <b><span id="kcalTotal">${kcalTotal.toLocaleString()}</span> of ${plan.calories.toLocaleString()} kcal</b> so far.<br>
        Rough guide: light meal 300 to 400, regular 500 to 700, large 800+ kcal.</p>
      ${mealSlots(p).map(([id, lbl]) => `
        <h3>${esc(lbl)}</h3>
        <div class="row">
          <div class="chips">
            ${[['good', 'Healthy'], ['ok', 'Okay'], ['heavy', 'Heavy']].map(([v, l]) =>
              `<button class="chip ${v} ${meals[id] === v ? 'on' : ''}" data-meal="${id}" data-val="${v}">${l}</button>`).join('')}
          </div>
          <input class="kcal" type="number" inputmode="numeric" min="0" max="5000" step="10" data-kcal="${id}" value="${kcal[id] ?? ''}" placeholder="kcal" aria-label="${esc(lbl)} calories">
        </div>`).join('')}
      <label class="field"><span>Food note (optional)</span>
        <input type="text" data-log="mealNote" value="${esc(L.mealNote || '')}" placeholder="e.g. skipped breakfast, big lunch out"></label>
    </div>

    <div class="card">
      <h2>Activity</h2>
      <div class="grid2">
        <label class="field"><span>Type</span>
          <select data-log="activityType">
            <option value="">None</option>
            ${OPT.exerciseTypes.concat([['other', 'Other']]).map(([v, l]) =>
              `<option value="${v}" ${L.activityType === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select></label>
        <label class="field"><span>Minutes</span>
          <input type="number" inputmode="numeric" min="0" max="600" data-log="activityMin" value="${L.activityMin ?? ''}"></label>
      </div>
      <label class="field"><span>Steps (optional, target ${plan.steps.toLocaleString()})</span>
        <input type="number" inputmode="numeric" min="0" max="100000" data-log="steps" value="${L.steps ?? ''}"></label>
    </div>

    <div class="card">
      <h2>Sleep (last night)</h2>
      <div class="grid2">
        <label class="field"><span>Hours slept</span>
          <input type="number" inputmode="decimal" step="0.5" min="0" max="16" data-log="sleepHours" value="${L.sleepHours ?? ''}"></label>
        <div></div>
      </div>
      ${scaleField('sleepQuality', 'Sleep quality', L.sleepQuality, 'poor', 'great')}
    </div>

    <div class="card">
      <h2>Mind and mood</h2>
      ${scaleField('mood', 'Mood', L.mood, 'low', 'great')}
      ${scaleField('energy', 'Energy', L.energy, 'drained', 'full')}
      ${scaleField('stressLevel', 'Stress', L.stressLevel, 'calm', 'very stressed')}
      <div class="field"><span>Mindful minutes (meditation, prayer, breathing, quiet walk). Target ${plan.mindfulMin}</span>
        <div class="counter">
          <button class="iconbtn" data-act="mindMinus" aria-label="Remove 5 minutes">&minus;</button>
          <span class="val">${L.mindfulMin || 0}</span>
          <button class="iconbtn" data-act="mindPlus" aria-label="Add 5 minutes">+</button>
          <span class="muted">minutes</span>
        </div></div>
      <div class="field"><span>Did you connect with someone today?</span>
        <button class="chip ${L.connected ? 'on' : ''}" data-act="connected">${L.connected ? '&#10003; Yes' : 'Not yet'}</button></div>
      <label class="field"><span>One good thing about today</span>
        <input type="text" data-log="goodThing" value="${esc(L.goodThing || '')}" placeholder="Big or small"></label>
    </div>

    <div class="card">
      <h2>Weight (optional)</h2>
      <p class="muted small">2 to 3 times a week is plenty, ideally in the morning.</p>
      <input type="number" inputmode="decimal" step="0.1" data-log="weight" value="${L.weightKg != null ? (units === 'us' ? Math.round(L.weightKg / KG_PER_LB * 10) / 10 : round1(L.weightKg)) : ''}" placeholder="${units === 'us' ? 'lb' : 'kg'}" aria-label="Weight">
    </div>

    <div class="card">
      <h2>Notes</h2>
      <textarea data-log="notes" placeholder="Anything worth remembering about today">${esc(L.notes || '')}</textarea>
    </div>
    <p class="muted small" style="text-align:center">Entries save automatically.</p>`;
}

function onTodayChange(e) {
  const t = e.target;
  const id = t.dataset.log;
  if (!id && !t.dataset.kcal) return;
  const k = viewDate;
  let v = t.value;
  if (t.dataset.kcal) {
    const kc = Object.assign({}, getLog(viewDate).kcal || {});
    if (t.value === '') delete kc[t.dataset.kcal]; else kc[t.dataset.kcal] = Number(t.value);
    setLog(viewDate, { kcal: Object.keys(kc).length ? kc : '' });
    refreshSummary();
    return;
  }
  if (!id) return;
  if (id === 'weight') {
    const n = v === '' ? '' : Number(v);
    setLog(k, { weightKg: n === '' ? '' : (profile.units === 'us' ? n * KG_PER_LB : n) });
  } else if (['activityMin', 'steps', 'sleepHours', 'sleepQuality', 'mood', 'energy', 'stressLevel'].includes(id)) {
    setLog(k, { [id]: v === '' ? '' : Number(v) });
  } else {
    setLog(k, { [id]: v });
  }
  refreshSummary();
}

function onTodayClick(e) {
  const b = e.target.closest('button');
  if (!b) return;
  const k = viewDate, L = getLog(k);
  const y = window.scrollY;
  if (b.dataset.scale) {
    const n = Number(b.dataset.val);
    setLog(k, { [b.dataset.scale]: L[b.dataset.scale] === n ? '' : n });
  } else if (b.dataset.meal) {
    const meals = Object.assign({}, L.meals || {});
    if (meals[b.dataset.meal] === b.dataset.val) delete meals[b.dataset.meal];
    else meals[b.dataset.meal] = b.dataset.val;
    setLog(k, { meals });
  } else {
    switch (b.dataset.act) {
      case 'prevDay': viewDate = addDays(k, -1); break;
      case 'nextDay': if (k < todayKey()) viewDate = addDays(k, 1); break;
      case 'waterPlus': setLog(k, { water: (L.water || 0) + 1 }); break;
      case 'waterMinus': setLog(k, { water: Math.max(0, (L.water || 0) - 1) || '' }); break;
      case 'habit': setLog(k, { habit: L.habit ? '' : true }); break;
      case 'connected': setLog(k, { connected: L.connected ? '' : true }); break;
      case 'mindPlus': setLog(k, { mindfulMin: (L.mindfulMin || 0) + 5 }); break;
      case 'mindMinus': setLog(k, { mindfulMin: Math.max(0, (L.mindfulMin || 0) - 5) || '' }); break;
      default: return;
    }
  }
  renderToday();
  if (!b.dataset.act || !b.dataset.act.endsWith('Day')) window.scrollTo(0, y);
}

// ---------- Progress ----------
function series(field, days, transform) {
  const end = todayKey();
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = addDays(end, -i);
    const L = logs[k];
    let v = L ? L[field] : undefined;
    if (v != null && transform) v = transform(v);
    out.push({ k, v: v == null || v === '' ? null : Number(v) });
  }
  return out;
}

function lineChart(data, opts) {
  const W = 340, H = 150, pl = 34, pr = 10, pt = 12, pb = 22;
  const pts = data.filter(d => d.v != null);
  if (pts.length === 0) {
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title)}: no data yet">
      <text class="empty" x="${W / 2}" y="${H / 2}" text-anchor="middle">No entries yet in this period</text></svg>`;
  }
  const vals = pts.map(d => d.v).concat(opts.target != null ? [opts.target] : []);
  let min = opts.min != null ? opts.min : Math.min(...vals);
  let max = opts.max != null ? opts.max : Math.max(...vals);
  if (max === min) { max += 1; min -= 1; }
  const pad = (max - min) * 0.1;
  if (opts.min == null) min -= pad;
  if (opts.max == null) max += pad;
  const x = (i) => pl + (i * (W - pl - pr)) / Math.max(1, data.length - 1);
  const y = (v) => pt + (H - pt - pb) * (1 - (v - min) / (max - min));

  // Path with gaps for missing days
  let path = '', pen = false;
  data.forEach((d, i) => {
    if (d.v == null) { pen = false; return; }
    path += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.v).toFixed(1)} `;
    pen = true;
  });
  const dots = data.map((d, i) => d.v == null ? '' :
    `<circle class="dot" cx="${x(i).toFixed(1)}" cy="${y(d.v).toFixed(1)}" r="${data.length > 14 ? 2 : 3}"><title>${esc(prettyDate(d.k))}: ${esc(opts.fmt ? opts.fmt(d.v) : d.v)}</title></circle>`).join('');
  const yTicks = [min, (min + max) / 2, max].map(v =>
    `<text class="tick" x="${pl - 4}" y="${y(v) + 3}" text-anchor="end">${esc(opts.tick ? opts.tick(v) : Math.round(v))}</text>`).join('');
  const xIdx = data.length <= 7 ? data.map((_, i) => i) : [0, Math.floor((data.length - 1) / 2), data.length - 1];
  const xTicks = xIdx.map(i => {
    const d = parseKey(data[i].k);
    const lbl = data.length <= 7 ? d.toLocaleDateString(undefined, { weekday: 'narrow' }) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `<text class="tick" x="${x(i)}" y="${H - 6}" text-anchor="middle">${esc(lbl)}</text>`;
  }).join('');
  const target = opts.target != null ? `
    <line class="target" x1="${pl}" x2="${W - pr}" y1="${y(opts.target)}" y2="${y(opts.target)}"/>
    <text class="targetlbl" x="${W - pr}" y="${y(opts.target) - 4}" text-anchor="end">${esc(opts.targetLabel || 'target')}</text>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title)} chart">
    <line class="axis" x1="${pl}" x2="${W - pr}" y1="${H - pb}" y2="${H - pb}"/>
    ${yTicks}${xTicks}${target}
    <path class="line" d="${path}"/>${dots}</svg>`;
}

function streak(test) {
  let k = todayKey();
  if (!test(k)) k = addDays(k, -1);
  let n = 0;
  while (test(k)) { n++; k = addDays(k, -1); }
  return n;
}

function avg(arr) {
  const v = arr.filter(x => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function renderProgress() {
  $('#title').textContent = 'Progress';
  const p = profile, plan = computePlan(p), units = p.units, n = progressRange;
  const toLb = (kg) => units === 'us' ? kg / KG_PER_LB : kg;
  const weight = series('weightKg', n, toLb);
  const sleep = series('sleepHours', n);
  const mood = series('mood', n);
  const energy = series('energy', n);
  const water = series('water', n);
  const act = series('activityMin', n);
  const stress = series('stressLevel', n);
  const mind = series('mindfulMin', n);
  const cal = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(todayKey(), -i), L = logs[k];
    const tot = L && L.kcal ? Object.values(L.kcal).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
    cal.push({ k, v: tot > 0 ? tot : null });
  }
  const mealScore = [];
  for (let i = n - 1; i >= 0; i--) {
    const L = logs[addDays(todayKey(), -i)];
    if (L && L.meals) {
      const vals = Object.values(L.meals).map(v => ({ good: 2, ok: 1, heavy: 0 })[v]);
      if (vals.length) mealScore.push(avg(vals) / 2 * 100);
    }
  }
  const logged = series('_', n).filter(d => hasEntry(d.k)).length;
  const activeDays = act.filter(d => d.v > 0).length;
  const w = weight.filter(d => d.v != null);
  const wChange = w.length >= 2 ? w[w.length - 1].v - w[0].v : null;
  const wUnit = units === 'us' ? 'lb' : 'kg';
  const fmt1 = (v) => v == null ? '-' : round1(v);

  app.innerHTML = `
    <div class="card">
      <div class="row between">
        <h2 style="margin:0">Last ${n} days</h2>
        <div class="chips">
          <button class="chip ${n === 7 ? 'on' : ''}" data-range="7">7 days</button>
          <button class="chip ${n === 30 ? 'on' : ''}" data-range="30">30 days</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="grid4">
        <div class="stat"><div class="v">${streak(hasEntry)}</div><div class="k">day logging streak</div></div>
        <div class="stat"><div class="v">${streak(k => !!(logs[k] && logs[k].habit))}</div><div class="k">day habit streak</div></div>
        <div class="stat"><div class="v">${logged}/${n}</div><div class="k">days logged</div></div>
        <div class="stat"><div class="v">${activeDays}</div><div class="k">active days (goal ${Math.round(plan.workoutDays * n / 7)})</div></div>
        <div class="stat"><div class="v">${fmt1(avg(water.map(d => d.v)))}</div><div class="k">avg glasses of water (goal ${plan.waterGlasses})</div></div>
        <div class="stat"><div class="v">${fmt1(avg(sleep.map(d => d.v)))}</div><div class="k">avg hours of sleep</div></div>
        <div class="stat"><div class="v">${mealScore.length ? Math.round(avg(mealScore)) + '%' : '-'}</div><div class="k">healthy meal score</div></div>
        <div class="stat"><div class="v">${avg(cal.map(d => d.v)) == null ? '-' : Math.round(avg(cal.map(d => d.v))).toLocaleString()}</div><div class="k">avg kcal on logged days (goal ${plan.calories.toLocaleString()})</div></div>
        <div class="stat"><div class="v">${fmt1(avg(mind.map(d => d.v)))}</div><div class="k">avg mindful minutes (goal ${plan.mindfulMin})</div></div>
        <div class="stat"><div class="v">${fmt1(avg(stress.map(d => d.v)))}</div><div class="k">avg stress (1 to 5)</div></div>
        <div class="stat"><div class="v">${series('_', n).filter(d => logs[d.k] && logs[d.k].connected).length}</div><div class="k">days you connected with someone</div></div>
        <div class="stat"><div class="v">${wChange == null ? '-' : (wChange > 0 ? '+' : '') + round1(wChange) + ' ' + wUnit}</div><div class="k">weight change</div></div>
      </div>
    </div>
    <div class="card chart"><h2>Weight (${wUnit})</h2>
      ${lineChart(weight, { title: 'Weight', target: p.targetKg ? toLb(Number(p.targetKg)) : null, targetLabel: 'target', fmt: v => `${round1(v)} ${wUnit}`, tick: v => round1(v) })}</div>
    <div class="card chart"><h2>Sleep (hours)</h2>
      ${lineChart(sleep, { title: 'Sleep', target: 7, targetLabel: '7 h', min: 0, fmt: v => `${v} h` })}</div>
    <div class="card chart"><h2>Mood (1 to 5)</h2>
      ${lineChart(mood, { title: 'Mood', min: 1, max: 5 })}</div>
    <div class="card chart"><h2>Energy (1 to 5)</h2>
      ${lineChart(energy, { title: 'Energy', min: 1, max: 5 })}</div>
    <div class="card chart"><h2>Stress (1 to 5)</h2>
      ${lineChart(stress, { title: 'Stress', min: 1, max: 5 })}</div>
    <div class="card chart"><h2>Calories (kcal)</h2>
      ${lineChart(cal, { title: 'Calories', min: 0, target: plan.calories, targetLabel: `${plan.calories.toLocaleString()} kcal`, fmt: v => `${v} kcal` })}</div>
    <div class="card chart"><h2>Activity (minutes)</h2>
      ${lineChart(act, { title: 'Activity', min: 0, target: plan.sessionMin, targetLabel: `${plan.sessionMin} min`, fmt: v => `${v} min` })}</div>`;
}

// ---------- Plan ----------
function renderPlan() {
  $('#title').textContent = 'My plan';
  const p = profile, plan = computePlan(p), units = p.units;
  const bmi = p.weightKg / Math.pow(p.heightCm / 100, 2);
  const goalNames = (p.goals || []).map(g => (OPT.goals.find(o => o[0] === g) || [g, g])[1]).join(', ');
  const types = (p.exerciseTypes || []).map(t => (OPT.exerciseTypes.find(o => o[0] === t) || [t, t])[1]);
  app.innerHTML = `
    ${plan.needsSupport ? `<div class="banner warn">${esc(SUPPORT_MSG)}</div>` : ''}
    ${plan.hasCondition ? '<div class="banner warn">You noted a health condition, so your pace is set to gentle. Please confirm these targets with your doctor.</div>' : ''}
    <div class="card">
      <h2>Your daily targets</h2>
      <p class="muted small">Week ${plan.week + 1} of your plan. Goals: ${esc(goalNames)}.</p>
      <ul class="plan-list">
        <li><b>${plan.calories.toLocaleString()} kcal a day</b><span class="muted">${esc(plan.calNote)} (maintenance is about ${plan.maintenance.toLocaleString()} kcal). Roughly ${Math.round(plan.calories * 0.25 / 10) * 10} breakfast, ${Math.round(plan.calories * 0.35 / 10) * 10} lunch, ${Math.round(plan.calories * 0.3 / 10) * 10} dinner, ${Math.round(plan.calories * 0.1 / 10) * 10} snacks.</span></li>
        <li><b>${plan.waterGlasses} glasses of water (${fmtWater(plan.waterMl, units)})</b><span class="muted">Add about 2 more glasses on workout days.</span></li>
        <li><b>${plan.workoutDays} workout days a week, ${plan.sessionMin} minutes each</b><span class="muted">${plan.weeklyMin} minutes a week. ${plan.weeklyMin < 150 ? 'Build up toward 150 minutes a week over time.' : 'That meets the 150 minutes a week guideline.'}${types.length ? ' Try: ' + esc(types.join(', ')) + '.' : ''}</span></li>
        <li><b>${plan.steps.toLocaleString()} steps a day</b><span class="muted">About 1,000 more than your typical day.</span></li>
        <li><b>${plan.mindfulMin} mindful minutes a day</b><span class="muted">Meditation, prayer, slow breathing or a quiet walk. Log them on the Today tab.</span></li>
        <li><b>7 to 9 hours of sleep</b><span class="muted">${plan.curSleep != null ? `You currently sleep about ${round1(plan.curSleep)} hours.` : ''} ${plan.bedtimeTarget != null ? `This week, aim to be in bed by ${minToTime(plan.bedtimeTarget)} (15 minutes earlier each week).` : 'Keep your current schedule steady, even on weekends.'}</span></li>
      </ul>
    </div>
    <div class="card">
      <h2>This week's habit</h2>
      <p style="margin:0">${esc(plan.habit)}</p>
      <p class="muted small">A new habit is picked each week from your answers. Coming up: ${esc(plan.habits.filter(h => h !== plan.habitKey).map(h => HABITS[h]).slice(0, 2).join('; ') || 'more as you go')}.</p>
    </div>
    <div class="card">
      <h2>Your profile</h2>
      <ul class="plan-list">
        <li><b>${esc(fmtHeight(p.heightCm, units))}, ${esc(fmtWeight(p.weightKg, units))}</b><span class="muted">BMI ${round1(bmi)}${p.targetKg ? `. Target weight ${esc(fmtWeight(p.targetKg, units))}` : ''}</span></li>
        <li><b>Eating style</b><span class="muted">${esc((OPT.eatingStyle.find(o => o[0] === p.eatingStyle) || ['', '-'])[1])}${p.eatingStyle === 'mixed' ? `. Veg days: ${esc(OPT.weekdays.filter(o => (p.vegDays || []).includes(o[0])).map(o => o[1]).join(', ') || 'none')}` : ''}${p.avoid ? `. Avoid: ${esc(p.avoid)}` : ''}</span></li>
      </ul>
      <button class="btn secondary" data-act="editAnswers" style="margin-top:10px">Update my answers</button>
    </div>
    <p class="muted small">These are general wellness targets from standard formulas (Mifflin-St Jeor for energy needs), not medical advice.</p>`;
}

// ---------- Settings, export, import ----------
const CSV_COLS = ['date', 'weight_kg', 'water_glasses', 'activity_type', 'activity_minutes', 'steps', 'sleep_hours',
  'sleep_quality', 'mood', 'energy', 'stress', 'mindful_minutes', 'connected', 'good_thing', 'habit_done', 'veg_day',
  'calories_total', 'meal1', 'meal2', 'meal3', 'meal4', 'meal1_kcal', 'meal2_kcal', 'meal3_kcal', 'meal4_kcal', 'meal_note', 'notes'];

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV() {
  const rows = [CSV_COLS.join(',')];
  Object.keys(logs).sort().forEach(k => {
    const L = logs[k], m = L.meals || {}, c = L.kcal || {};
    const total = Object.values(c).reduce((a, b) => a + (Number(b) || 0), 0);
    const veg = isVegDay(profile, k);
    rows.push([k, L.weightKg != null ? round1(L.weightKg) : '', L.water, L.activityType, L.activityMin, L.steps, L.sleepHours,
      L.sleepQuality, L.mood, L.energy, L.stressLevel, L.mindfulMin, L.connected ? 1 : 0, L.goodThing, L.habit ? 1 : 0,
      veg === null ? '' : (veg ? 1 : 0), total || '', m.m1, m.m2, m.m3, m.m4, c.m1, c.m2, c.m3, c.m4, L.mealNote, L.notes].map(csvCell).join(','));
  });
  return rows.join('\n');
}

function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function renderSettings() {
  $('#title').textContent = 'Settings';
  const count = Object.keys(logs).length;
  app.innerHTML = `
    <div class="card">
      <h2>Your answers</h2>
      <p class="muted">Changed your routine or goals? Update your answers and your plan recalculates.</p>
      <button class="btn secondary" data-act="editAnswers">Update my answers</button>
    </div>
    <div class="card">
      <h2>Units</h2>
      <div class="chips">
        <button class="chip ${profile.units === 'us' ? 'on' : ''}" data-units="us">US (lb, ft, oz)</button>
        <button class="chip ${profile.units === 'metric' ? 'on' : ''}" data-units="metric">Metric (kg, cm, L)</button>
      </div>
    </div>
    <div class="card">
      <h2>Your data</h2>
      <p class="muted">${count} day${count === 1 ? '' : 's'} logged. Everything is stored only in this browser on this device.</p>
      <div class="row">
        <button class="btn" data-act="exportCsv">Export CSV</button>
        <button class="btn secondary" data-act="backup">Download backup</button>
        <button class="btn secondary" data-act="restore">Restore backup</button>
      </div>
      <p class="muted small">CSV is for Excel or Python analysis. A backup file holds your answers and all entries, so you can move to another device.</p>
      <input type="file" id="restoreFile" accept="application/json,.json" hidden>
    </div>
    <div class="card">
      <h2>Install on your phone</h2>
      <p class="muted small" style="margin:0">iPhone: open this page in Safari, tap Share, then <b>Add to Home Screen</b>.<br>
      Android: open in Chrome, tap the menu, then <b>Install app</b> or <b>Add to Home screen</b>.</p>
    </div>
    <div class="card">
      <h2>Start over</h2>
      <p class="muted small">Deletes your answers and every entry on this device. Download a backup first if you might want it.</p>
      <button class="btn danger" data-act="reset">Delete all my data</button>
    </div>
    <p class="muted small" style="text-align:center">Healthy Living v1.0. Not medical advice.</p>`;
}

function onSettingsClick(e) {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.units) {
    profile.units = b.dataset.units;
    saveProfile();
    renderSettings();
    toast('Units updated');
    return;
  }
  switch (b.dataset.act) {
    case 'exportCsv':
      download(`healthy-living-${todayKey()}.csv`, toCSV(), 'text/csv');
      break;
    case 'backup':
      download(`healthy-living-backup-${todayKey()}.json`,
        JSON.stringify({ app: 'healthy-living', version: 1, exportedAt: new Date().toISOString(), profile, logs }, null, 2),
        'application/json');
      break;
    case 'restore':
      $('#restoreFile').click();
      break;
    case 'reset':
      if (confirm('Delete your answers and all entries on this device? This cannot be undone.')) {
        localStorage.removeItem(KEY_PROFILE);
        localStorage.removeItem(KEY_LOGS);
        profile = null;
        logs = {};
        startQuestionnaire();
      }
      break;
  }
}

function onRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.app !== 'healthy-living' || !data.profile || typeof data.logs !== 'object') throw new Error('bad file');
      if (!confirm('Replace the data on this device with this backup?')) return;
      profile = data.profile;
      logs = data.logs;
      saveProfile();
      saveLogs();
      toast('Backup restored');
      showTab('today');
    } catch (err) {
      toast('That file is not a Healthy Living backup.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ---------- Event wiring ----------
app.addEventListener('submit', (e) => { if (e.target.id === 'qform') onQuestionnaireSubmit(e); });
app.addEventListener('input', (e) => {
  if (!currentTab) onQuestionnaireInput(e);
  else if (currentTab === 'today' && (e.target.dataset.log || e.target.dataset.kcal)) onTodayChange(e);
});
app.addEventListener('change', (e) => {
  if (e.target.id === 'restoreFile') return onRestoreFile(e);
  if (currentTab === 'today') onTodayChange(e);
});
app.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b && b.dataset.act === 'editAnswers') return startQuestionnaire();
  if (!currentTab) return onQuestionnaireClick(e);
  if (currentTab === 'today') return onTodayClick(e);
  if (currentTab === 'settings') return onSettingsClick(e);
  if (currentTab === 'progress' && b && b.dataset.range) {
    progressRange = Number(b.dataset.range);
    renderProgress();
  }
});
$('#tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (!b) return;
  if (b.dataset.tab === 'today') viewDate = todayKey();
  showTab(b.dataset.tab);
});

let lastSeenToday = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !profile) return;
  const t = todayKey();
  if (t !== lastSeenToday) {
    if (viewDate === lastSeenToday) viewDate = t;
    lastSeenToday = t;
    if (currentTab) showTab(currentTab);
  }
});

// ---------- Start ----------
if (profile) showTab('today');
else startQuestionnaire();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
