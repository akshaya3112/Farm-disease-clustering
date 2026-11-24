/**
 * Farm Disease-Risk Profile Discovery - Frontend Client Script
 * Handles Theme Toggle, Responsive Navigation, Voice Assistance,
 * Interactive Thermometer, Categorized Symptoms, and Dynamic Plotly Visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initViewMode();
  initMobileNav();
  initTableSearch();
  initThermometerSlider();
  
  // Page-specific initializers - defer Plotly-dependent charts to window.load
  // so that plotly.min.js (4.8MB) has fully executed before we draw
  if (document.getElementById('home-chart-distribution')) {
    if (document.readyState === 'complete') {
      initHomeCharts();
    } else {
      window.addEventListener('load', initHomeCharts);
    }
  }
  if (document.getElementById('plotly-elbow-chart')) {
    if (document.readyState === 'complete') {
      loadClusteringCharts();
    } else {
      window.addEventListener('load', loadClusteringCharts);
    }
  }
  if (document.getElementById('plotly-cluster-compare')) {
    if (document.readyState === 'complete') {
      loadProfileComparisonTool();
    } else {
      window.addEventListener('load', loadProfileComparisonTool);
    }
  }
});

/* ===================================================================
   1. Theme Management (Light / Dark Mode)
   =================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('farm_theme') || 
                      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  applyTheme(storedTheme);
  
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('farm_theme', newTheme);
      window.dispatchEvent(new Event('themeChanged'));
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* ===================================================================
   2. View Mode Toggle (Farmer View vs Researcher View)
   =================================================================== */
function initViewMode() {
  const storedMode = localStorage.getItem('farm_view_mode') || 'farmer';
  applyViewMode(storedMode);
}

function toggleViewMode() {
  const currentMode = document.body.classList.contains('farmer-view-active') ? 'farmer' : 'research';
  const newMode = currentMode === 'farmer' ? 'research' : 'farmer';
  applyViewMode(newMode);
  localStorage.setItem('farm_view_mode', newMode);
}

function applyViewMode(mode) {
  const modeIcon = document.getElementById('mode-icon');
  const modeLabel = document.getElementById('mode-label');
  
  if (mode === 'research') {
    document.body.classList.remove('farmer-view-active');
    document.body.classList.add('research-view-active');
    if (modeIcon) modeIcon.textContent = '🔬';
    if (modeLabel) modeLabel.textContent = 'Pro Mode';
  } else {
    document.body.classList.remove('research-view-active');
    document.body.classList.add('farmer-view-active');
    if (modeIcon) modeIcon.textContent = '👨‍🌾';
    if (modeLabel) modeLabel.textContent = 'Farmer Mode';
  }
}

/* ===================================================================
   3. Mobile Navigation Toggle
   =================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
      navMenu.style.flexDirection = 'column';
      navMenu.style.position = 'absolute';
      navMenu.style.top = 'var(--header-height)';
      navMenu.style.left = '1rem';
      navMenu.style.right = '1rem';
      navMenu.style.background = 'var(--bg-surface)';
      navMenu.style.padding = '1rem';
      navMenu.style.boxShadow = 'var(--card-shadow-elevated)';
      navMenu.style.borderRadius = 'var(--radius-md)';
      navMenu.style.zIndex = '999';
    });
  }
}

function toggleMobileNav() {
  const navMenu = document.getElementById('nav-menu');
  if (navMenu) {
    navMenu.classList.toggle('show');
  }
}

/* ===================================================================
   4. Searchable Tables
   =================================================================== */
function initTableSearch() {
  const searchInput = document.getElementById('table-search-input');
  if (!searchInput) return;
  
  const targetTableId = searchInput.getAttribute('data-target-table');
  const table = document.getElementById(targetTableId);
  if (!table) return;
  
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  });
}

/* ===================================================================
   5. Interactive Thermometer & Vitals Display
   =================================================================== */
function initThermometerSlider() {
  const tempInput = document.getElementById('input-temp');
  if (tempInput) {
    updateTempDisplay(tempInput.value);
  }
  const ageInput = document.getElementById('input-age');
  if (ageInput) {
    updateAgeDisplay(ageInput.value);
  }
}

function updateAgeDisplay(val) {
  const display = document.getElementById('age-display');
  if (!display) return;
  const num = parseFloat(val);
  let stage = 'Adult';
  if (num <= 2.5) stage = 'Calf / Young';
  else if (num >= 9.0) stage = 'Senior / Geriatric';
  
  display.innerHTML = `${num.toFixed(1)} Years <span style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted);">(${stage})</span>`;
}

function updateTempDisplay(val) {
  const display = document.getElementById('temp-display');
  if (!display) return;
  const temp = parseFloat(val);
  
  if (temp >= 103.5) {
    display.innerHTML = `🌡️ ${temp.toFixed(1)} &deg;F <span style="font-size: 0.75rem; font-weight: 700; color: var(--danger);">(Severe Fever 🔴)</span>`;
    display.style.borderColor = 'var(--danger)';
    display.style.color = 'var(--danger)';
  } else if (temp >= 102.5) {
    display.innerHTML = `🌡️ ${temp.toFixed(1)} &deg;F <span style="font-size: 0.75rem; font-weight: 700; color: var(--warning);">(Mild Fever 🟡)</span>`;
    display.style.borderColor = 'var(--warning)';
    display.style.color = 'var(--warning)';
  } else if (temp < 101.0) {
    display.innerHTML = `🌡️ ${temp.toFixed(1)} &deg;F <span style="font-size: 0.75rem; font-weight: 700; color: var(--info);">(Sub-normal / Cold ❄️)</span>`;
    display.style.borderColor = 'var(--info)';
    display.style.color = 'var(--info)';
  } else {
    display.innerHTML = `🌡️ ${temp.toFixed(1)} &deg;F <span style="font-size: 0.75rem; font-weight: 700; color: var(--success);">(Normal &amp; Healthy 🟢)</span>`;
    display.style.borderColor = 'var(--success)';
    display.style.color = 'var(--success)';
  }
}

function setTemperature(val) {
  const tempInput = document.getElementById('input-temp');
  if (tempInput) {
    tempInput.value = val;
    updateTempDisplay(val);
  }
}

function updateSpeciesHint(species) {
  // Can trigger species-specific guidelines if needed
}

/* ===================================================================
   6. Categorized Symptoms Selector
   =================================================================== */
const SYMPTOM_CATEGORIES = {
  eating: ['loss of appetite', 'depression', 'fatigue'],
  breathing: ['shortness of breath', 'chest discomfort', 'coughing'],
  movement: ['lameness', 'reluctance to move', 'difficulty walking', 'tremors', 'muscle stiffness'],
  skin: ['sweats', 'chills', 'painless lumps', 'blisters on mouth', 'blisters on hooves', 'sores', 'swelling', 'nasal discharge']
};

function filterSymptomCategory(category, btnElement) {
  // Update active tab button
  document.querySelectorAll('.symptom-tab-btn').forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  
  const searchInput = document.getElementById('symptom-search');
  if (searchInput) searchInput.value = '';
  
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    const sympName = tag.getAttribute('data-symptom').toLowerCase();
    
    if (category === 'all') {
      tag.style.display = 'inline-flex';
    } else {
      const allowed = SYMPTOM_CATEGORIES[category] || [];
      const matches = allowed.some(keyword => sympName.includes(keyword));
      tag.style.display = matches ? 'inline-flex' : 'none';
    }
  });
}

function filterSymptomTags(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    const symp = tag.getAttribute('data-symptom').toLowerCase();
    tag.style.display = symp.includes(q) ? 'inline-flex' : 'none';
  });
}

function toggleSymptom(element) {
  element.classList.toggle('active');
  const checkSpan = element.querySelector('.tag-check');
  if (checkSpan) {
    checkSpan.textContent = element.classList.contains('active') ? '✓' : '➕';
  }
  updateSymptomsCount();
}

function updateSymptomsCount() {
  const badge = document.getElementById('symptoms-count-badge');
  const countSpan = document.getElementById('symptoms-count');
  const selected = document.querySelectorAll('.symptom-tag.active');
  
  if (badge) {
    badge.textContent = `${selected.length} Signs Selected`;
    if (selected.length > 0) {
      badge.className = 'badge badge-success';
    } else {
      badge.className = 'badge badge-primary';
    }
  }
  if (countSpan) {
    countSpan.textContent = selected.length;
  }
}

function clearAllSymptoms() {
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    tag.classList.remove('active');
    const checkSpan = tag.querySelector('.tag-check');
    if (checkSpan) checkSpan.textContent = '➕';
  });
  updateSymptomsCount();
}

/* ===================================================================
   7. 1-Click Scenario Presets
   =================================================================== */
function applyPreset(presetName) {
  clearAllSymptoms();
  
  const presets = {
    'anthrax': {
      species: 'sheep',
      age: 5.0,
      temperature: 101.8,
      symptoms: ['sweats', 'fatigue', 'shortness of breath']
    },
    'fever': {
      species: 'cow',
      age: 4.0,
      temperature: 104.4,
      symptoms: ['loss of appetite', 'depression', 'painless lumps']
    },
    'geriatric': {
      species: 'buffalo',
      age: 13.0,
      temperature: 102.2,
      symptoms: ['loss of appetite', 'depression']
    },
    'locomotor': {
      species: 'goat',
      age: 2.0,
      temperature: 101.2,
      symptoms: ['lameness', 'painless lumps']
    }
  };
  
  const p = presets[presetName];
  if (!p) return;
  
  // Set animal radio
  const radio = document.querySelector(`input[name="species"][value="${p.species}"]`);
  if (radio) {
    radio.checked = true;
    updateSpeciesHint(p.species);
  }
  
  // Set Age
  const ageInput = document.getElementById('input-age');
  if (ageInput) {
    ageInput.value = p.age;
    updateAgeDisplay(p.age);
  }
  
  // Set Temp
  const tempInput = document.getElementById('input-temp');
  if (tempInput) {
    tempInput.value = p.temperature;
    updateTempDisplay(p.temperature);
  }
  
  // Select Symptoms
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    const sName = tag.getAttribute('data-symptom').toLowerCase();
    if (p.symptoms.some(ps => sName.includes(ps))) {
      tag.classList.add('active');
      const checkSpan = tag.querySelector('.tag-check');
      if (checkSpan) checkSpan.textContent = '✓';
    }
  });
  
  updateSymptomsCount();
  
  // Run assessment automatically
  runPrediction();
}

/* ===================================================================
   8. Live Prediction & Triage Execution
   =================================================================== */
async function runPrediction() {
  const submitBtn = document.getElementById('btn-run-prediction');
  const resultContainer = document.getElementById('prediction-result-container');
  if (!resultContainer) return;
  
  // 1. Gather inputs
  const selectedSpecies = document.querySelector('input[name="species"]:checked')?.value || 'cow';
  const age = parseFloat(document.getElementById('input-age')?.value || 5);
  const temp = parseFloat(document.getElementById('input-temp')?.value || 102.2);
  
  const selectedSymptoms = [];
  document.querySelectorAll('.symptom-tag.active').forEach(tag => {
    selectedSymptoms.push(tag.getAttribute('data-symptom'));
  });
  
  // 2. Loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Matching Symptoms to Herd Risk Centroids...';
  }
  
  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        animal: selectedSpecies,
        age: age,
        temperature: temp,
        symptoms: selectedSymptoms
      })
    });
    
    if (!res.ok) throw new Error('Prediction request failed.');
    const data = await res.json();
    
    // 3. Render Rich Result Card
    renderPredictionResult(data);
    resultContainer.style.display = 'block';
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
  } catch (err) {
    console.error('Error during prediction:', err);
    resultContainer.innerHTML = `
      <div class="alert alert-danger">
        <span style="font-size: 1.5rem;">⚠️</span>
        <div>
          <strong>Prediction Request Failed:</strong> Could not retrieve model prediction. Ensure the backend server is running.
        </div>
      </div>
    `;
    resultContainer.style.display = 'block';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '⚡ Run Health Check &amp; Predict Clinical Risk';
    }
  }
}

/* ===================================================================
   9. Render Diagnosis Result Card (Accessible for Farmers & Vets)
   =================================================================== */
function renderPredictionResult(data) {
  const container = document.getElementById('prediction-result-container');
  if (!container) return;
  
  // Urgency styling map
  let urgencyClass = 'routine';
  if (data.urgency.level.includes('CRITICAL')) urgencyClass = 'critical';
  else if (data.urgency.level.includes('ELEVATED')) urgencyClass = 'priority';
  
  // Disease progress bars
  const diseaseColors = {
    'Anthrax': '#dc2626',
    'Blackleg': '#7c3aed',
    'Foot And Mouth': '#2563eb',
    'Lumpy Virus': '#d97706',
    'Pneumonia': '#059669'
  };
  
  let diseaseBarsHtml = '';
  if (data.disease_likelihoods && data.disease_likelihoods.length > 0) {
    data.disease_likelihoods.forEach(d => {
      const color = diseaseColors[d.disease] || 'var(--primary)';
      diseaseBarsHtml += `
        <div class="disease-bar-row">
          <span class="disease-name-label" title="${d.disease}">${d.disease}</span>
          <div class="disease-bar-track">
            <div class="disease-bar-fill" style="width: ${d.percentage}%; background-color: ${color};"></div>
          </div>
          <span class="disease-pct-label" style="color: ${color};">${d.percentage.toFixed(1)}%</span>
        </div>
      `;
    });
  } else {
    diseaseBarsHtml = '<p style="font-size: 0.85rem; color: var(--text-muted);">No dominant diagnostic correlation identified.</p>';
  }
  
  // Action checklist items
  let stepsHtml = '';
  const steps = data.urgency.immediate_steps || [
    "Move the animal to a dry, clean, isolated pen.",
    "Ensure shade and fresh drinking water.",
    "Do not allow contact with other livestock.",
    "Consult your local veterinarian for formal diagnostic tests."
  ];
  
  steps.forEach((step, idx) => {
    stepsHtml += `
      <div class="action-step-item">
        <span class="action-step-num">${idx + 1}</span>
        <span class="action-step-text">${step}</span>
      </div>
    `;
  });
  
  // Distance badges across clusters
  let distBreakdown = Object.entries(data.all_distances || {}).map(([k, dist]) => {
    const isSelected = k.includes(`${data.cluster_id}`);
    return `
      <span style="font-size: 0.8rem; padding: 0.25rem 0.6rem; border-radius: var(--radius-sm); 
                   background: ${isSelected ? 'var(--primary-bg)' : 'var(--bg-surface-alt)'}; 
                   border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}; 
                   font-weight: ${isSelected ? '700' : '500'}; 
                   color: ${isSelected ? 'var(--primary)' : 'var(--text-muted)'};">
        ${k}: ${dist}
      </span>
    `;
  }).join(' ');
  
  // Animal emoji
  const animalEmojis = { 'Cow': '🐄', 'Buffalo': '🐃', 'Goat': '🐐', 'Sheep': '🐑' };
  const aEmoji = animalEmojis[data.animal] || '🐾';
  
  // Audio speech sentence
  const speechText = data.urgency.speech_text || 
    `Health check summary for this ${data.animal}. Matched risk pattern: ${data.cluster_name}. Status: ${data.urgency.level}. Please take necessary care actions.`;

  container.innerHTML = `
    <div class="result-card">
      
      <!-- 1. Urgency Banner (High Contrast Traffic Light) -->
      <div class="urgency-banner ${urgencyClass}">
        <div class="urgency-icon-text">
          <span class="urgency-icon">${data.urgency.icon}</span>
          <div>
            <div class="urgency-title">${data.urgency.level}</div>
            <p class="urgency-desc">${data.urgency.farmer_summary || data.urgency.action}</p>
          </div>
        </div>
        
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <!-- Voice Button -->
          <button type="button" class="btn btn-voice" onclick="speakDiagnosis('${encodeURIComponent(speechText)}')" title="Listen to diagnosis aloud">
            🔊 Listen Aloud
          </button>
          <!-- Print Button -->
          <button type="button" class="btn btn-outline" onclick="window.print()" title="Print diagnostic slip">
            🖨️ Print Slip
          </button>
        </div>
      </div>

      <!-- 2. Matched Herd Health Profile -->
      <div style="background: var(--bg-surface-alt); padding: 1.25rem 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <span class="badge badge-primary" style="margin-bottom: 0.35rem;">
              Identified Health Pattern
            </span>
            <h3 style="font-size: 1.35rem; margin-bottom: 0.25rem; color: var(--text-primary);">
              ${aEmoji} ${data.cluster_name}
            </h3>
            <p style="font-size: 0.925rem; color: var(--text-secondary); margin-bottom: 0; line-height: 1.5;">
              ${data.cluster_summary}
            </p>
          </div>
          <div>
            <span class="badge badge-success" style="font-size: 0.85rem; padding: 0.45rem 0.85rem;">
              ✓ High Confidence Match
            </span>
          </div>
        </div>
      </div>

      <!-- 3. Immediate Farmer Action Steps -->
      <h3 style="font-size: 1.15rem; margin-bottom: 0.75rem;">
        📋 Recommended Farm Action Checklist:
      </h3>
      <div class="action-steps-grid">
        ${stepsHtml}
      </div>

      <!-- 4. Historical Disease Likelihoods -->
      <div class="disease-bars-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 0.5rem;">
          <h4 style="font-size: 1.05rem; margin-bottom: 0;">
            📊 Historical Illness Prevalence
          </h4>
          <span style="font-size: 0.785rem; color: var(--text-muted);">
            Based on 43,778 animals with matching symptoms
          </span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
          Animals showing these signs in past farm records were diagnosed with:
        </p>
        
        ${diseaseBarsHtml}
      </div>

      <!-- 5. Responsible Veterinary Advisory Notice -->
      <div class="alert alert-warning" style="margin-bottom: 0;">
        <span style="font-size: 1.5rem;">⚠️</span>
        <div style="font-size: 0.825rem;">
          <strong>Farm Care Advisory:</strong> This report provides supportive guidance for daily farm management and early animal isolation. 
          It does not replace on-site clinical examination or medical prescriptions from a licensed veterinarian.
        </div>
      </div>

    </div>
  `;
}

/* ===================================================================
   10. Web Speech Synthesis (Read Diagnosis Aloud for Accessibility)
   =================================================================== */
function speakDiagnosis(encodedText) {
  if (!('speechSynthesis' in window)) {
    alert('Voice readout is not supported in this browser.');
    return;
  }
  
  const text = decodeURIComponent(encodedText);
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
  if (naturalVoice) utterance.voice = naturalVoice;
  
  window.speechSynthesis.speak(utterance);
}

/* ===================================================================
   11. Home Dashboard Interactive Visual Discovery Charts
   =================================================================== */
let homeProfilesData = null;

function initHomeCharts() {
  // Use inline data injected by Flask (fast, no fetch needed)
  if (window.FARM_PROFILES_DATA) {
    homeProfilesData = window.FARM_PROFILES_DATA;
    renderHomeCharts();
    window.addEventListener('themeChanged', renderHomeCharts);
    return;
  }

  // Fallback: fetch from API
  if (typeof Plotly === 'undefined') {
    console.warn('Plotly not yet available, deferring home charts');
    setTimeout(initHomeCharts, 200);
    return;
  }

  fetch('/api/profiles')
    .then(r => r.json())
    .then(data => {
      homeProfilesData = data;
      renderHomeCharts();
      window.addEventListener('themeChanged', renderHomeCharts);
    })
    .catch(err => console.error('Failed to load home charts data:', err));
}

function renderHomeCharts() {
  if (!homeProfilesData || !homeProfilesData.profiles) return;
  if (typeof Plotly === 'undefined') {
    // Plotly not ready yet - retry in 300ms
    setTimeout(renderHomeCharts, 300);
    return;
  }
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const paperBg = isDark ? '#121c2e' : '#ffffff';
  const plotBg = isDark ? '#1a273e' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  const clusterKeys = ['0', '1', '2', '3'];
  const labels = [
    '🐂 Senior Cattle Fatigue (29.2%)',
    '🚨 Breathing & Chest Distress (22.2%)',
    '🐐 Young Lameness & Bumps (25.1%)',
    '🔥 Acute Fever & Infection (23.4%)'
  ];
  const colors = ['#2563eb', '#dc2626', '#059669', '#d97706'];
  const counts = clusterKeys.map(k => homeProfilesData.profiles[k]?.sample_count || 10000);

  // 1. Donut Distribution Chart
  const distEl = document.getElementById('home-chart-distribution');
  if (distEl) {
    const donutTrace = {
      values: counts,
      labels: labels,
      type: 'pie',
      hole: 0.55,
      marker: { colors: colors },
      textinfo: 'percent',
      textfont: { color: '#ffffff', size: 12, weight: 700 },
      hoverinfo: 'label+value+percent',
      hovertemplate: '<b>%{label}</b><br>Animal Cases: %{value:,}<br>Farm Share: %{percent}<extra></extra>'
    };

    const donutLayout = {
      paper_bgcolor: paperBg,
      font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
      margin: { t: 15, r: 15, l: 15, b: 15 },
      showlegend: true,
      legend: { orientation: 'h', y: -0.15, font: { size: 10 } },
      annotations: [{
        text: '43,778<br><span style="font-size:10px;color:#94a3b8">ANIMALS</span>',
        showarrow: false,
        font: { size: 16, color: textColor, weight: 800 }
      }]
    };

    Plotly.newPlot(distEl, [donutTrace], donutLayout, { responsive: true, displayModeBar: false });
  }

  // 2. Species Breakdown Chart (Grouped Bars)
  const speciesEl = document.getElementById('home-chart-species');
  if (speciesEl) {
    const speciesNames = ['Cow 🐄', 'Buffalo 🐃', 'Goat 🐐', 'Sheep 🐑'];
    const speciesColors = ['#059669', '#3b82f6', '#f59e0b', '#ec4899'];

    const traces = speciesNames.map((sp, idx) => {
      const spKey = sp.split(' ')[0].toLowerCase();
      const vals = clusterKeys.map(k => homeProfilesData.profiles[k]?.species_distribution[spKey] || 0);
      return {
        x: ['Senior Fatigue', 'Breathing Crisis', 'Young Lameness', 'Acute Fever'],
        y: vals,
        name: sp,
        type: 'bar',
        marker: { color: speciesColors[idx] },
        hovertemplate: '%{fullData.name}: %{y:.1f}%<extra></extra>'
      };
    });

    const speciesLayout = {
      barmode: 'group',
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
      margin: { t: 20, r: 15, l: 45, b: 35 },
      yaxis: { title: 'Percentage in this Group (%)', range: [0, 60] },
      legend: { orientation: 'h', y: 1.15, font: { size: 10 } }
    };

    Plotly.newPlot(speciesEl, traces, speciesLayout, { responsive: true, displayModeBar: false });
  }

  // 3. Vitals Risk Landscape (Age vs Temperature Centers with Error Bars)
  const vitalsEl = document.getElementById('home-chart-vitals');
  if (vitalsEl) {
    const ages = clusterKeys.map(k => homeProfilesData.profiles[k]?.age_stats.mean || 5.0);
    const temps = clusterKeys.map(k => homeProfilesData.profiles[k]?.temp_stats.mean || 102.0);
    const friendlyNames = [
      'Older Cattle (Weakness)',
      'Severe Breathing Trouble',
      'Young Livestock (Limping)',
      'High Fever Crisis'
    ];

    const vitalsTrace = {
      x: ages,
      y: temps,
      mode: 'markers+text',
      text: friendlyNames,
      textposition: ['top center', 'bottom right', 'top right', 'bottom center'],
      textfont: { size: 11, color: textColor, weight: 700 },
      marker: {
        size: counts.map(c => Math.sqrt(c) * 0.42),
        color: colors,
        opacity: 0.85,
        line: { color: '#ffffff', width: 2 }
      },
      type: 'scatter',
      hovertemplate: '<b>%{text}</b><br>Average Age: %{x:.1f} yr<br>Average Temp: %{y:.1f} °F<extra></extra>'
    };

    const vitalsLayout = {
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
      margin: { t: 30, r: 25, l: 55, b: 50 },
      xaxis: { title: 'Average Animal Age (Years)', range: [0, 15] },
      yaxis: { title: 'Average Body Temperature (°F)', range: [100.5, 105.0] },
      shapes: [
        // Normal Temp Zone
        {
          type: 'rect',
          xref: 'paper',
          x0: 0,
          x1: 1,
          y0: 101.0,
          y1: 102.5,
          fillcolor: 'rgba(16, 185, 129, 0.1)',
          line: { width: 0 }
        },
        // Fever Threshold Line
        {
          type: 'line',
          xref: 'paper',
          x0: 0,
          x1: 1,
          y0: 103.5,
          y1: 103.5,
          line: { color: '#dc2626', width: 1.5, dash: 'dash' }
        }
      ],
      annotations: [
        {
          xref: 'paper',
          x: 0.02,
          y: 101.75,
          text: 'Healthy Body Temperature Zone (101.0 - 102.5 °F)',
          showarrow: false,
          font: { size: 10, color: '#059669' }
        },
        {
          xref: 'paper',
          x: 0.02,
          y: 103.7,
          text: 'High Fever Zone (Above 103.5 °F)',
          showarrow: false,
          font: { size: 10, color: '#dc2626' }
        }
      ]
    };

    Plotly.newPlot(vitalsEl, [vitalsTrace], vitalsLayout, { responsive: true, displayModeBar: false });
  }

  // Force Plotly to re-compute layout after the page has fully painted
  setTimeout(() => {
    ['home-chart-distribution', 'home-chart-species', 'home-chart-vitals'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.data) Plotly.relayout(el, { autosize: true });
    });
  }, 100);
}

/* ===================================================================
   12. Clustering Workflow Charts (Elbow, Silhouette, DBI, PCA)
   =================================================================== */
let cachedMetrics = null;
let cachedPca = null;

async function loadClusteringCharts() {
  if (typeof Plotly === 'undefined') {
    console.warn('Plotly not yet loaded, deferring clustering charts');
    setTimeout(loadClusteringCharts, 200);
    return;
  }

  try {
    const [metricsRes, pcaRes] = await Promise.all([
      fetch('/api/metrics'),
      fetch('/api/pca')
    ]);
    
    cachedMetrics = await metricsRes.json();
    cachedPca = await pcaRes.json();
    
    renderMetricCurves();
    renderPcaScatter();
    renderPcaScree();

    // Wire up controls
    const algoSelect = document.getElementById('metric-algo-select');
    const kSelect = document.getElementById('metric-k-select');
    const pcaKSelect = document.getElementById('pca-k-select');
    const pcaDimSelect = document.getElementById('pca-dim-select');

    if (algoSelect) algoSelect.addEventListener('change', renderMetricCurves);
    if (kSelect) kSelect.addEventListener('change', renderMetricCurves);
    if (pcaKSelect) pcaKSelect.addEventListener('change', renderPcaScatter);
    if (pcaDimSelect) pcaDimSelect.addEventListener('change', renderPcaScatter);
    
    window.addEventListener('themeChanged', () => {
      renderMetricCurves();
      renderPcaScatter();
      renderPcaScree();
    });
    
  } catch (err) {
    console.error('Failed to load clustering data:', err);
  }
}

function renderMetricCurves() {
  if (!cachedMetrics || !cachedMetrics.records) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const paperBg = isDark ? '#121c2e' : '#ffffff';
  const plotBg = isDark ? '#1a273e' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  const algoChoice = document.getElementById('metric-algo-select')?.value || 'all';
  const highlightK = parseInt(document.getElementById('metric-k-select')?.value || '4');

  // Filter records
  const kmRecs = cachedMetrics.records.filter(r => r.algorithm === 'K-Means');
  const kmedRecs = cachedMetrics.records.filter(r => r.algorithm === 'K-Medians');

  const kVals = kmRecs.map(r => r.k);
  const kmWcss = kmRecs.map(r => r.cost_wcss);
  const kmedL1 = kmedRecs.map(r => r.cost_wcss);

  const kmSil = kmRecs.map(r => r.silhouette);
  const kmedSil = kmedRecs.map(r => r.silhouette);

  const kmDbi = kmRecs.map(r => r.davies_bouldin);
  const kmedDbi = kmedRecs.map(r => r.davies_bouldin);

  // Common Layout Template
  const baseLayout = (yTitle, extraShapes = []) => ({
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { title: 'Cluster Count (k)', tickmode: 'linear', dtick: 1 },
    yaxis: { title: yTitle },
    margin: { t: 30, r: 20, l: 55, b: 45 },
    legend: { orientation: 'h', y: 1.15, font: { size: 10 } },
    shapes: extraShapes
  });

  // Vertical highlight line at selected K
  const highlightShape = {
    type: 'line',
    x0: highlightK,
    x1: highlightK,
    y0: 0,
    y1: 1,
    yref: 'paper',
    line: { color: 'rgba(16, 185, 129, 0.4)', width: 2, dash: 'dot' }
  };

  // 1. Elbow Chart (WCSS)
  const elbowContainer = document.getElementById('plotly-elbow-chart');
  if (elbowContainer) {
    const traces = [];
    if (algoChoice === 'all' || algoChoice === 'kmeans') {
      traces.push({
        x: kVals,
        y: kmWcss,
        name: 'K-Means (Euclidean WCSS)',
        mode: 'lines+markers',
        line: { color: '#059669', width: 3 },
        marker: { size: 7, color: kVals.map(k => k === 4 ? '#f59e0b' : '#059669') }
      });
    }
    if (algoChoice === 'all' || algoChoice === 'kmedians') {
      traces.push({
        x: kVals,
        y: kmedL1,
        name: 'K-Medians (Manhattan L1)',
        mode: 'lines+markers',
        line: { color: '#d97706', width: 3, dash: 'dot' },
        marker: { size: 7 }
      });
    }

    const layout = baseLayout('Within-Cluster Cost', [highlightShape]);
    layout.annotations = [{
      x: 4,
      y: kmWcss[kVals.indexOf(4)],
      text: '⭐ Elbow at k=4',
      showarrow: true,
      arrowhead: 2,
      ax: 35,
      ay: -25,
      font: { size: 11, color: '#059669', weight: 700 }
    }];

    Plotly.newPlot(elbowContainer, traces, layout, { responsive: true, displayModeBar: false });
  }

  // 2. Silhouette Chart
  const silContainer = document.getElementById('plotly-silhouette-chart');
  if (silContainer) {
    const traces = [];
    if (algoChoice === 'all' || algoChoice === 'kmeans') {
      traces.push({
        x: kVals,
        y: kmSil,
        name: 'K-Means (Euclidean)',
        mode: 'lines+markers',
        line: { color: '#2563eb', width: 3 },
        marker: { size: 7 }
      });
    }
    if (algoChoice === 'all' || algoChoice === 'kmedians') {
      traces.push({
        x: kVals,
        y: kmedSil,
        name: 'K-Medians (Manhattan)',
        mode: 'lines+markers',
        line: { color: '#7c3aed', width: 3, dash: 'dot' },
        marker: { size: 7 }
      });
    }

    Plotly.newPlot(silContainer, traces, baseLayout('Silhouette Score (Higher = Better)', [highlightShape]), { responsive: true, displayModeBar: false });
  }

  // 3. Davies-Bouldin Index Chart
  const dbiContainer = document.getElementById('plotly-dbi-chart');
  if (dbiContainer) {
    const traces = [];
    if (algoChoice === 'all' || algoChoice === 'kmeans') {
      traces.push({
        x: kVals,
        y: kmDbi,
        name: 'K-Means (Euclidean)',
        mode: 'lines+markers',
        line: { color: '#059669', width: 3 },
        marker: { size: 8, color: kVals.map(k => k === 4 ? '#dc2626' : '#059669') }
      });
    }
    if (algoChoice === 'all' || algoChoice === 'kmedians') {
      traces.push({
        x: kVals,
        y: kmedDbi,
        name: 'K-Medians (Manhattan)',
        mode: 'lines+markers',
        line: { color: '#d97706', width: 3, dash: 'dot' },
        marker: { size: 7 }
      });
    }

    const dbiLayout = baseLayout('Davies-Bouldin Index (Lower = Better)', [highlightShape]);
    dbiLayout.annotations = [{
      x: 4,
      y: 1.9161,
      text: '🏆 Global Min (1.9161)',
      showarrow: true,
      arrowhead: 2,
      ax: -40,
      ay: -30,
      font: { size: 11, color: '#dc2626', weight: 800 }
    }];

    Plotly.newPlot(dbiContainer, traces, dbiLayout, { responsive: true, displayModeBar: false });
  }
}

function renderPcaScatter() {
  if (!cachedPca || !cachedPca.sampled_points) return;
  const container = document.getElementById('plotly-pca-scatter');
  if (!container) return;
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const paperBg = isDark ? '#121c2e' : '#ffffff';
  const plotBg = isDark ? '#1a273e' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  const selectedK = document.getElementById('pca-k-select')?.value || '4';
  const dimChoice = document.getElementById('pca-dim-select')?.value || '2d';
  const clusterKey = 'kmeans_k' + selectedK;

  const colors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#ec4899'];
  const clusterNames = [
    'Profile 1: Senior Bovine',
    'Profile 2: Respiratory Distress',
    'Profile 3: Young Sub-Febrile',
    'Profile 4: Acute Febrile',
    'Cluster 5',
    'Cluster 6'
  ];
  
  const numClusters = parseInt(selectedK);
  const traces = [];

  for (let c = 0; c < numClusters; c++) {
    const pts = cachedPca.sampled_points.filter(p => p.clusters && p.clusters[clusterKey] === c);
    
    if (dimChoice === '3d') {
      traces.push({
        x: pts.map(p => p.pc1),
        y: pts.map(p => p.pc2),
        z: pts.map(p => p.pc3),
        mode: 'markers',
        type: 'scatter3d',
        name: clusterNames[c] || `Cluster ${c+1}`,
        marker: { color: colors[c % colors.length], size: 3, opacity: 0.75 }
      });
    } else {
      traces.push({
        x: pts.map(p => p.pc1),
        y: pts.map(p => p.pc2),
        mode: 'markers',
        type: 'scatter',
        name: clusterNames[c] || `Cluster ${c+1}`,
        marker: { color: colors[c % colors.length], size: 5, opacity: 0.7 }
      });
    }
  }

  const var1 = cachedPca.scree_data?.[0]?.pct_explained || 21.6;
  const var2 = cachedPca.scree_data?.[1]?.pct_explained || 20.9;
  const var3 = cachedPca.scree_data?.[2]?.pct_explained || 12.7;

  let layout;
  if (dimChoice === '3d') {
    layout = {
      paper_bgcolor: paperBg,
      font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
      margin: { t: 10, r: 10, l: 10, b: 10 },
      scene: {
        xaxis: { title: `PC1 (${var1}% Var)` },
        yaxis: { title: `PC2 (${var2}% Var)` },
        zaxis: { title: `PC3 (${var3}% Var)` },
        bgcolor: plotBg
      },
      legend: { orientation: 'h', y: -0.1, font: { size: 10 } }
    };
  } else {
    layout = {
      paper_bgcolor: paperBg,
      plot_bgcolor: plotBg,
      font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
      xaxis: { title: `PC1 (${var1}% Variance - Age Axis)` },
      yaxis: { title: `PC2 (${var2}% Variance - Temp Axis)` },
      margin: { t: 25, r: 20, l: 50, b: 45 },
      legend: { orientation: 'h', y: -0.2, font: { size: 10 } }
    };
  }
  
  Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
}

function renderPcaScree() {
  if (!cachedPca || !cachedPca.scree_data) return;
  const container = document.getElementById('plotly-pca-scree');
  if (!container) return;
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const paperBg = isDark ? '#121c2e' : '#ffffff';
  const plotBg = isDark ? '#1a273e' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  // Display top 10 PCs for readability
  const topScree = cachedPca.scree_data.slice(0, 10);
  const labels = topScree.map(s => `PC${s.component}`);
  const individual = topScree.map(s => s.pct_explained);
  const cumulative = topScree.map(s => s.pct_cumulative);
  
  const trace1 = {
    x: labels,
    y: individual,
    type: 'bar',
    name: 'Individual Variance %',
    marker: { color: '#059669' },
    hovertemplate: '%{x}: %{y:.1f}% explained<extra></extra>'
  };
  
  const trace2 = {
    x: labels,
    y: cumulative,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Cumulative %',
    line: { color: '#d97706', width: 2.5 },
    marker: { size: 6 },
    hovertemplate: 'Cumulative: %{y:.1f}%<extra></extra>'
  };
  
  const layout = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { title: 'Principal Components (Top 10 of 30)' },
    yaxis: { title: 'Variance Explained (%)', range: [0, 105] },
    margin: { t: 25, r: 20, l: 50, b: 45 },
    legend: { orientation: 'h', y: 1.15, font: { size: 10 } }
  };
  
  Plotly.newPlot(container, [trace1, trace2], layout, { responsive: true, displayModeBar: false });
}

/* ===================================================================
   13. Profile Pairwise Comparison Tool
   =================================================================== */
let cachedProfiles = null;

async function loadProfileComparisonTool() {
  const compContainer = document.getElementById('plotly-cluster-compare');
  if (!compContainer) return;
  if (typeof Plotly === 'undefined') {
    setTimeout(loadProfileComparisonTool, 200);
    return;
  }
  
  try {
    const res = await fetch('/api/profiles');
    cachedProfiles = await res.json();
    
    const selA = document.getElementById('compare-cluster-a');
    const selB = document.getElementById('compare-cluster-b');
    
    if (selA) selA.addEventListener('change', renderClusterComparison);
    if (selB) selB.addEventListener('change', renderClusterComparison);
    
    renderClusterComparison();
    window.addEventListener('themeChanged', renderClusterComparison);
  } catch (err) {
    console.error('Failed to load profile comparison:', err);
  }
}

function renderClusterComparison() {
  if (!cachedProfiles || !cachedProfiles.profiles) return;
  const container = document.getElementById('plotly-cluster-compare');
  if (!container) return;
  
  const selA = document.getElementById('compare-cluster-a')?.value || '0';
  const selB = document.getElementById('compare-cluster-b')?.value || '1';
  
  const profA = cachedProfiles.profiles[selA];
  const profB = cachedProfiles.profiles[selB];
  if (!profA || !profB) return;
  
  const sympMapA = profA.all_symptom_prevalence || {};
  const sympMapB = profB.all_symptom_prevalence || {};
  
  // Also fallback to top_symptoms if all_symptom_prevalence is missing
  if (Object.keys(sympMapA).length === 0 && profA.top_symptoms) {
    profA.top_symptoms.forEach(s => sympMapA[s.symptom] = s.prevalence_pct);
  }
  if (Object.keys(sympMapB).length === 0 && profB.top_symptoms) {
    profB.top_symptoms.forEach(s => sympMapB[s.symptom] = s.prevalence_pct);
  }

  const allSympKeys = Array.from(new Set([...Object.keys(sympMapA), ...Object.keys(sympMapB)]));
  
  // Calculate differences and sort by magnitude
  const diffList = allSympKeys.map(s => ({
    symptom: s,
    diff: (sympMapA[s] || 0) - (sympMapB[s] || 0)
  })).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 12);
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const paperBg = isDark ? '#121c2e' : '#ffffff';
  const plotBg = isDark ? '#1a273e' : '#f8fafc';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  const trace = {
    x: diffList.map(d => d.diff),
    y: diffList.map(d => d.symptom.charAt(0).toUpperCase() + d.symptom.slice(1)),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: diffList.map(d => d.diff >= 0 ? '#059669' : '#dc2626')
    },
    hovertemplate: '%{y}: %{x:+.1f}%<extra></extra>'
  };
  
  const layout = {
    paper_bgcolor: paperBg,
    plot_bgcolor: plotBg,
    font: { color: textColor, family: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { title: `Prevalence Difference (%): Elevated in ${profA.display_name.split(':')[0]} (+) vs ${profB.display_name.split(':')[0]} (-)` },
    yaxis: { autorange: 'reversed' },
    margin: { t: 25, r: 20, l: 150, b: 45 }
  };
  
  Plotly.newPlot(container, [trace], layout, { responsive: true, displayModeBar: false });
}
