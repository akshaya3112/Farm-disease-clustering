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
  
  // Page-specific initializers
  if (document.getElementById('plotly-elbow-chart')) {
    loadClusteringCharts();
  }
  if (document.getElementById('plotly-cluster-compare')) {
    loadProfileComparisonTool();
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
      <div style="background: var(--bg-surface-alt); padding: 1.25rem 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.75rem; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <span class="badge badge-primary" style="margin-bottom: 0.35rem;">
              Nearest Herd Profile: Group ${data.cluster_id} / 4
            </span>
            <h3 style="font-size: 1.35rem; margin-bottom: 0.25rem; color: var(--text-primary);">
              ${aEmoji} ${data.cluster_name}
            </h3>
            <p style="font-size: 0.925rem; color: var(--text-secondary); margin-bottom: 0; line-height: 1.5;">
              ${data.cluster_summary}
            </p>
          </div>
          <div style="text-align: right; background: var(--bg-surface); padding: 0.6rem 0.9rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <span style="font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Centroid Fit</span><br>
            <strong style="font-size: 1.25rem; color: var(--primary);">${data.distance}</strong>
            <span style="font-size: 0.725rem; color: var(--text-muted); display: block;">(Distance)</span>
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
            📊 Historical Disease Association (In Audited Herd Records)
          </h4>
          <span style="font-size: 0.785rem; color: var(--text-muted);">
            Based on 43,778 records with matching clinical signs
          </span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
          Animals with this specific symptom combination in historical farm data were diagnosed with:
        </p>
        
        ${diseaseBarsHtml}
      </div>

      <!-- 5. Technical Details Drawer (Collapsible for Researchers) -->
      <details style="background: var(--bg-surface-alt); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
        <summary style="font-weight: 700; font-size: 0.875rem; color: var(--text-primary); cursor: pointer; user-select: none;">
          🔬 Technical &amp; Centroid Geometry Details (Click to Expand)
        </summary>
        <div style="margin-top: 0.85rem; font-size: 0.825rem; color: var(--text-secondary); line-height: 1.6;">
          <p style="margin-bottom: 0.5rem;">
            <strong>Input Vitals Vector:</strong> ${data.animal} | Age: ${data.age} yr (Z = ${data.input_normalized.age_zscore}) | Temp: ${data.temperature} &deg;F (Z = ${data.input_normalized.temp_zscore})
          </p>
          <p style="margin-bottom: 0.5rem;">
            <strong>Active Symptoms:</strong> ${data.symptoms_provided.length > 0 ? data.symptoms_provided.join(', ') : 'None selected'}
          </p>
          <p style="margin-bottom: 0.5rem;">
            <strong>Euclidean Distances across all 4 Centroids:</strong>
          </p>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            ${distBreakdown}
          </div>
        </div>
      </details>

      <!-- 6. Responsible Veterinary Advisory Notice -->
      <div class="alert alert-warning" style="margin-bottom: 0;">
        <span style="font-size: 1.5rem;">⚠️</span>
        <div style="font-size: 0.825rem;">
          <strong>Veterinary Ethical Notice:</strong> This clinical risk report is generated via unsupervised clustering patterns. 
          It provides supportive triage and risk stratification for herd management. It must never replace professional diagnosis or laboratory confirmation by a licensed veterinarian.
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
  window.speechSynthesis.cancel(); // Stop any ongoing speech
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // Slightly slower, clear pace
  utterance.pitch = 1.0;
  
  // Try to find a natural English voice
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
  if (naturalVoice) utterance.voice = naturalVoice;
  
  window.speechSynthesis.speak(utterance);
}

/* ===================================================================
   11. Clustering Charts (Plotly)
   =================================================================== */
let cachedMetrics = null;
let cachedPca = null;

async function loadClusteringCharts() {
  const elbowContainer = document.getElementById('plotly-elbow-chart');
  if (!elbowContainer) return;
  
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
  if (!cachedMetrics) return;
  const container = document.getElementById('plotly-elbow-chart');
  if (!container) return;
  
  const metricType = document.getElementById('metric-selector')?.value || 'wcss';
  const kVals = cachedMetrics.k_values;
  const kmData = cachedMetrics.kmeans;
  const kmedData = cachedMetrics.kmedians;
  
  let yKMeans = [];
  let yKMedians = [];
  let yTitle = '';
  
  if (metricType === 'wcss') {
    yKMeans = kmData.wcss;
    yKMedians = kmedData.total_l1_cost;
    yTitle = 'Clustering Cost (WCSS / L1)';
  } else if (metricType === 'silhouette') {
    yKMeans = kmData.silhouette;
    yKMedians = kmedData.silhouette;
    yTitle = 'Silhouette Score (Higher is Better)';
  } else if (metricType === 'dbi') {
    yKMeans = kmData.davies_bouldin;
    yKMedians = kmedData.davies_bouldin;
    yTitle = 'Davies-Bouldin Index (Lower is Better)';
  }
  
  const trace1 = {
    x: kVals,
    y: yKMeans,
    mode: 'lines+markers',
    name: 'Euclidean K-Means',
    line: { color: '#059669', width: 3 },
    marker: { size: 8 }
  };
  
  const trace2 = {
    x: kVals,
    y: yKMedians,
    mode: 'lines+markers',
    name: 'Manhattan K-Medians',
    line: { color: '#d97706', width: 3, dash: 'dot' },
    marker: { size: 8 }
  };
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const layout = {
    paper_bgcolor: isDark ? '#121c2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a273e' : '#f8fafc',
    font: { color: isDark ? '#f8fafc' : '#0f172a', family: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { title: 'Cluster Count (k)', tickmode: 'linear', dtick: 1 },
    yaxis: { title: yTitle },
    margin: { t: 30, r: 20, l: 60, b: 50 },
    legend: { orientation: 'h', y: 1.15 }
  };
  
  Plotly.newPlot(container, [trace1, trace2], layout, { responsive: true, displayModeBar: false });
}

function renderPcaScatter() {
  if (!cachedPca) return;
  const container = document.getElementById('plotly-pca-scatter');
  if (!container) return;
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const colors = ['#2563eb', '#dc2626', '#059669', '#d97706'];
  const clusterNames = [
    'Profile 1: Senior Bovine',
    'Profile 2: Respiratory Distress',
    'Profile 3: Young Sub-Febrile',
    'Profile 4: Acute Febrile'
  ];
  
  const traces = [];
  for (let c = 0; c < 4; c++) {
    const pts = cachedPca.sample_points.filter(p => p.cluster === c);
    traces.push({
      x: pts.map(p => p.pc1),
      y: pts.map(p => p.pc2),
      mode: 'markers',
      name: clusterNames[c] || `Cluster ${c+1}`,
      marker: { color: colors[c % colors.length], size: 5, opacity: 0.7 }
    });
  }
  
  const layout = {
    paper_bgcolor: isDark ? '#121c2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a273e' : '#f8fafc',
    font: { color: isDark ? '#f8fafc' : '#0f172a', family: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { title: `PC1 (${(cachedPca.explained_variance_ratio[0]*100).toFixed(1)}% Var - Age Axis)` },
    yaxis: { title: `PC2 (${(cachedPca.explained_variance_ratio[1]*100).toFixed(1)}% Var - Temp Axis)` },
    margin: { t: 30, r: 20, l: 50, b: 50 },
    legend: { orientation: 'h', y: -0.2 }
  };
  
  Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
}

function renderPcaScree() {
  if (!cachedPca) return;
  const container = document.getElementById('plotly-pca-scree');
  if (!container) return;
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const nComps = cachedPca.explained_variance_ratio.length;
  const labels = Array.from({ length: nComps }, (_, i) => `PC${i+1}`);
  const individual = cachedPca.explained_variance_ratio.map(v => v * 100);
  const cumulative = cachedPca.cumulative_variance_ratio.map(v => v * 100);
  
  const trace1 = {
    x: labels,
    y: individual,
    type: 'bar',
    name: 'Individual Variance %',
    marker: { color: '#059669' }
  };
  
  const trace2 = {
    x: labels,
    y: cumulative,
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Cumulative %',
    line: { color: '#d97706', width: 2 }
  };
  
  const layout = {
    paper_bgcolor: isDark ? '#121c2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a273e' : '#f8fafc',
    font: { color: isDark ? '#f8fafc' : '#0f172a', family: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { title: 'Principal Components' },
    yaxis: { title: 'Variance Explained (%)', range: [0, 105] },
    margin: { t: 30, r: 20, l: 50, b: 50 },
    legend: { orientation: 'h', y: 1.15 }
  };
  
  Plotly.newPlot(container, [trace1, trace2], layout, { responsive: true, displayModeBar: false });
}

/* ===================================================================
   12. Profile Pairwise Comparison Tool
   =================================================================== */
let cachedProfiles = null;

async function loadProfileComparisonTool() {
  const compContainer = document.getElementById('plotly-cluster-compare');
  if (!compContainer) return;
  
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
  if (!cachedProfiles) return;
  const container = document.getElementById('plotly-cluster-compare');
  if (!container) return;
  
  const selA = document.getElementById('compare-cluster-a')?.value || '0';
  const selB = document.getElementById('compare-cluster-b')?.value || '1';
  
  const profA = cachedProfiles.profiles[selA];
  const profB = cachedProfiles.profiles[selB];
  if (!profA || !profB) return;
  
  const sympMapA = {};
  profA.top_symptoms.forEach(s => sympMapA[s.symptom] = s.prevalence_pct);
  const sympMapB = {};
  profB.top_symptoms.forEach(s => sympMapB[s.symptom] = s.prevalence_pct);
  
  const allSymps = Array.from(new Set([...Object.keys(sympMapA), ...Object.keys(sympMapB)])).slice(0, 10);
  const diffs = allSymps.map(s => (sympMapA[s] || 0) - (sympMapB[s] || 0));
  
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const trace = {
    x: diffs,
    y: allSymps,
    type: 'bar',
    orientation: 'h',
    marker: {
      color: diffs.map(d => d >= 0 ? '#059669' : '#dc2626')
    }
  };
  
  const layout = {
    paper_bgcolor: isDark ? '#121c2e' : '#ffffff',
    plot_bgcolor: isDark ? '#1a273e' : '#f8fafc',
    font: { color: isDark ? '#f8fafc' : '#0f172a', family: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { title: `Prevalence Difference (%): Elevated in ${profA.display_name} (+) vs ${profB.display_name} (-)` },
    margin: { t: 30, r: 20, l: 160, b: 50 }
  };
  
  Plotly.newPlot(container, [trace], layout, { responsive: true, displayModeBar: false });
}
