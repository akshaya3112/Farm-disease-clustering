/**
 * Farm Disease-Risk Profile Discovery - Frontend Client Script
 * Handles Theme Toggle, Responsive Navigation, Fetching APIs, and Interactive Plotly Charts
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initTableSearch();
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
      
      // Notify active Plotly charts of theme change
      window.dispatchEvent(new Event('themeChanged'));
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
  }
}

function getPlotlyThemeLayout() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    paper_bgcolor: isDark ? '#111827' : '#ffffff',
    plot_bgcolor: isDark ? '#1f2937' : '#f8fafc',
    font: {
      color: isDark ? '#f9fafb' : '#0f172a',
      family: 'Inter, system-ui, sans-serif'
    },
    gridcolor: isDark ? '#374151' : '#e2e8f0',
    zerolinecolor: isDark ? '#4b5563' : '#cbd5e1'
  };
}

/* ===================================================================
   2. Responsive Mobile Navigation
   =================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });
  }
}

/* ===================================================================
   3. Searchable / Sortable Tables
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
   4. Clustering Workflow Interactive Charts (Plotly)
   =================================================================== */
let cachedMetrics = null;
let cachedPca = null;

async function loadClusteringCharts() {
  const elbowContainer = document.getElementById('plotly-elbow-chart');
  if (!elbowContainer) return;
  
  try {
    const [resMetrics, resPca] = await Promise.all([
      fetch('/api/metrics').then(r => r.json()),
      fetch('/api/pca').then(r => r.json())
    ]);
    
    cachedMetrics = resMetrics;
    cachedPca = resPca;
    
    renderMetricCurves();
    renderPcaScatter();
    renderPcaScree();
    
    // Bind controls
    const algoToggle = document.getElementById('metric-algo-select');
    const kSelector = document.getElementById('metric-k-select');
    const pcaKSelector = document.getElementById('pca-k-select');
    const pcaDimSelector = document.getElementById('pca-dim-select');
    
    if (algoToggle) algoToggle.addEventListener('change', () => {
      renderMetricCurves();
      renderPcaScatter();
    });
    if (kSelector) kSelector.addEventListener('change', () => renderMetricCurves());
    if (pcaKSelector) pcaKSelector.addEventListener('change', () => renderPcaScatter());
    if (pcaDimSelector) pcaDimSelector.addEventListener('change', () => renderPcaScatter());
    
    window.addEventListener('themeChanged', () => {
      renderMetricCurves();
      renderPcaScatter();
      renderPcaScree();
    });
  } catch (err) {
    console.error('Failed to load clustering data for interactive charts:', err);
  }
}

function renderMetricCurves() {
  if (!cachedMetrics) return;
  
  const algoSelect = document.getElementById('metric-algo-select');
  const kSelect = document.getElementById('metric-k-select');
  
  const selectedAlgo = algoSelect ? algoSelect.value : 'all';
  const highlightedK = kSelect ? parseInt(kSelect.value) : 4;
  
  const theme = getPlotlyThemeLayout();
  const records = cachedMetrics.records;
  
  const kmRecords = records.filter(r => r.algorithm === 'K-Means');
  const kmedRecords = records.filter(r => r.algorithm === 'K-Medians');
  
  // 1. Elbow Chart
  const elbowTraces = [];
  if (selectedAlgo === 'all' || selectedAlgo === 'kmeans') {
    elbowTraces.push({
      x: kmRecords.map(r => r.k),
      y: kmRecords.map(r => r.cost_wcss),
      name: 'K-Means (Euclidean WCSS)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#2563eb', width: 3 },
      marker: { size: kmRecords.map(r => r.k === highlightedK ? 14 : 7) }
    });
  }
  if (selectedAlgo === 'all' || selectedAlgo === 'kmedians') {
    elbowTraces.push({
      x: kmedRecords.map(r => r.k),
      y: kmedRecords.map(r => r.cost_wcss),
      name: 'K-Medians (Manhattan L1 Cost)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#059669', width: 3 },
      marker: { size: kmedRecords.map(r => r.k === highlightedK ? 14 : 7) }
    });
  }
  
  const elbowLayout = {
    title: `Within-Cluster Cost vs k (Highlighted: k=${highlightedK})`,
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: theme.font,
    xaxis: { title: 'Number of Clusters (k)', dtick: 1, gridcolor: theme.gridcolor },
    yaxis: { title: 'Cost / Inertia', gridcolor: theme.gridcolor },
    margin: { t: 40, r: 20, l: 60, b: 40 },
    legend: { orientation: 'h', y: -0.2 }
  };
  Plotly.react('plotly-elbow-chart', elbowTraces, elbowLayout, { responsive: true, displayModeBar: false });
  
  // 2. Silhouette Chart
  const silTraces = [];
  if (selectedAlgo === 'all' || selectedAlgo === 'kmeans') {
    silTraces.push({
      x: kmRecords.map(r => r.k),
      y: kmRecords.map(r => r.silhouette),
      name: 'K-Means (Euclidean)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#2563eb', width: 2.5 },
      marker: { size: kmRecords.map(r => r.k === highlightedK ? 13 : 6) }
    });
  }
  if (selectedAlgo === 'all' || selectedAlgo === 'kmedians') {
    silTraces.push({
      x: kmedRecords.map(r => r.k),
      y: kmedRecords.map(r => r.silhouette),
      name: 'K-Medians (Manhattan)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#059669', width: 2.5 },
      marker: { size: kmedRecords.map(r => r.k === highlightedK ? 13 : 6) }
    });
  }
  
  const silLayout = {
    title: 'Silhouette Score vs k (Higher is Better)',
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: theme.font,
    xaxis: { title: 'Clusters (k)', dtick: 1, gridcolor: theme.gridcolor },
    yaxis: { title: 'Silhouette Score', gridcolor: theme.gridcolor },
    margin: { t: 40, r: 20, l: 50, b: 40 },
    legend: { orientation: 'h', y: -0.2 }
  };
  Plotly.react('plotly-silhouette-chart', silTraces, silLayout, { responsive: true, displayModeBar: false });
  
  // 3. Davies-Bouldin Chart
  const dbiTraces = [];
  if (selectedAlgo === 'all' || selectedAlgo === 'kmeans') {
    dbiTraces.push({
      x: kmRecords.map(r => r.k),
      y: kmRecords.map(r => r.davies_bouldin),
      name: 'K-Means (Euclidean)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#2563eb', width: 2.5 },
      marker: { size: kmRecords.map(r => r.k === highlightedK ? 13 : 6) }
    });
  }
  if (selectedAlgo === 'all' || selectedAlgo === 'kmedians') {
    dbiTraces.push({
      x: kmedRecords.map(r => r.k),
      y: kmedRecords.map(r => r.davies_bouldin),
      name: 'K-Medians (Manhattan)',
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#059669', width: 2.5 },
      marker: { size: kmedRecords.map(r => r.k === highlightedK ? 13 : 6) }
    });
  }
  
  const dbiLayout = {
    title: 'Davies-Bouldin Index vs k (Lower is Better - Optimal at k=4)',
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: theme.font,
    xaxis: { title: 'Clusters (k)', dtick: 1, gridcolor: theme.gridcolor },
    yaxis: { title: 'Davies-Bouldin Index', gridcolor: theme.gridcolor },
    margin: { t: 40, r: 20, l: 50, b: 40 },
    legend: { orientation: 'h', y: -0.2 }
  };
  Plotly.react('plotly-dbi-chart', dbiTraces, dbiLayout, { responsive: true, displayModeBar: false });
}

function renderPcaScatter() {
  const container = document.getElementById('plotly-pca-scatter');
  if (!container || !cachedPca || !cachedPca.sampled_points) return;
  
  const kSelector = document.getElementById('pca-k-select');
  const dimSelector = document.getElementById('pca-dim-select');
  const algoSelect = document.getElementById('metric-algo-select');
  
  const chosenK = kSelector ? parseInt(kSelector.value) : 4;
  const is3D = dimSelector ? dimSelector.value === '3d' : false;
  const isMedians = algoSelect && algoSelect.value === 'kmedians';
  const prefix = isMedians ? 'kmedians' : 'kmeans';
  
  const theme = getPlotlyThemeLayout();
  const points = cachedPca.sampled_points;
  const clusterKey = `${prefix}_k${chosenK}`;
  
  // Group points by cluster
  const clustersData = {};
  for (let c = 0; c < chosenK; c++) {
    clustersData[c] = { x: [], y: [], z: [] };
  }
  
  points.forEach(pt => {
    let c = pt.clusters ? pt.clusters[clusterKey] : undefined;
    if (c === undefined && pt.clusters) {
      c = pt.clusters[`kmeans_k${chosenK}`] ?? 0;
    }
    if (c !== undefined && clustersData[c]) {
      clustersData[c].x.push(pt.pc1);
      clustersData[c].y.push(pt.pc2);
      clustersData[c].z.push(pt.pc3);
    }
  });
  
  const colors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c'];
  const traces = [];
  
  for (let c = 0; c < chosenK; c++) {
    const ptCount = clustersData[c].x.length;
    if (is3D) {
      traces.push({
        x: clustersData[c].x,
        y: clustersData[c].y,
        z: clustersData[c].z,
        name: `Cluster ${c + 1} (n=${ptCount})`,
        mode: 'markers',
        type: 'scatter3d',
        marker: { size: 3.5, color: colors[c % colors.length], opacity: 0.75 }
      });
    } else {
      traces.push({
        x: clustersData[c].x,
        y: clustersData[c].y,
        name: `Cluster ${c + 1} (n=${ptCount})`,
        mode: 'markers',
        type: 'scatter',
        marker: { size: 5, color: colors[c % colors.length], opacity: 0.7 }
      });
    }
  }
  
  const layout = {
    title: `PCA Cluster Projection (${is3D ? '3D' : '2D'}, ${isMedians ? 'Manhattan K-Medians' : 'Euclidean K-Means'}, k=${chosenK})`,
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: theme.font,
    margin: { t: 45, r: 20, l: 45, b: 45 },
    legend: { orientation: 'h', y: -0.15 }
  };
  
  if (is3D) {
    layout.scene = {
      xaxis: { title: 'PC1', gridcolor: theme.gridcolor },
      yaxis: { title: 'PC2', gridcolor: theme.gridcolor },
      zaxis: { title: 'PC3', gridcolor: theme.gridcolor }
    };
  } else {
    layout.xaxis = { title: 'Principal Component 1', gridcolor: theme.gridcolor };
    layout.yaxis = { title: 'Principal Component 2', gridcolor: theme.gridcolor };
  }
  
  Plotly.react('plotly-pca-scatter', traces, layout, { responsive: true, displayModeBar: false });
}

function renderPcaScree() {
  const container = document.getElementById('plotly-pca-scree');
  if (!container || !cachedPca || !cachedPca.scree_data) return;

  const theme = getPlotlyThemeLayout();
  const scree = cachedPca.scree_data.slice(0, 15);

  const traceBars = {
    x: scree.map(d => `PC${d.component}`),
    y: scree.map(d => d.pct_explained),
    name: 'Individual Variance (%)',
    type: 'bar',
    marker: { color: '#2563eb', opacity: 0.8 },
    yaxis: 'y1',
    hovertemplate: '%{x}: %{y:.2f}% variance<extra></extra>'
  };

  const traceLine = {
    x: scree.map(d => `PC${d.component}`),
    y: scree.map(d => d.pct_cumulative),
    name: 'Cumulative Variance (%)',
    type: 'scatter',
    mode: 'lines+markers',
    marker: { color: '#dc2626', size: 6 },
    line: { color: '#dc2626', width: 2.5 },
    yaxis: 'y2',
    hovertemplate: 'Cumulative: %{y:.2f}%<extra></extra>'
  };

  const layout = {
    title: 'PCA Scree Plot (Explained Variance)',
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: theme.font,
    margin: { t: 45, r: 50, l: 50, b: 50 },
    legend: { orientation: 'h', y: -0.2 },
    xaxis: { gridcolor: theme.gridcolor, title: 'Principal Component' },
    yaxis: {
      title: 'Individual Variance (%)',
      gridcolor: theme.gridcolor,
      side: 'left'
    },
    yaxis2: {
      title: 'Cumulative (%)',
      overlaying: 'y',
      side: 'right',
      range: [0, 105],
      showgrid: false
    }
  };

  Plotly.react('plotly-pca-scree', [traceBars, traceLine], layout, { responsive: true, displayModeBar: false });
}

/* ===================================================================
   5. Profiles Interactive Comparison Tool (Plotly)
   =================================================================== */
let cachedProfiles = null;

async function loadProfileComparisonTool() {
  const compContainer = document.getElementById('plotly-cluster-compare');
  if (!compContainer) return;
  
  try {
    const res = await fetch('/api/profiles').then(r => r.json());
    cachedProfiles = res;
    
    renderClusterComparison();
    
    const selA = document.getElementById('compare-cluster-a');
    const selB = document.getElementById('compare-cluster-b');
    if (selA) selA.addEventListener('change', renderClusterComparison);
    if (selB) selB.addEventListener('change', renderClusterComparison);
    
    window.addEventListener('themeChanged', renderClusterComparison);
  } catch (err) {
    console.error('Failed to load profiles for comparison tool:', err);
  }
}

function renderClusterComparison() {
  if (!cachedProfiles) return;
  
  const selA = document.getElementById('compare-cluster-a');
  const selB = document.getElementById('compare-cluster-b');
  const cidA = selA ? selA.value : '0';
  const cidB = selB ? selB.value : '1';
  
  const profA = cachedProfiles.profiles[cidA];
  const profB = cachedProfiles.profiles[cidB];
  if (!profA || !profB) return;
  
  const theme = getPlotlyThemeLayout();
  
  // Extract all symptom names
  const symptoms = Object.keys(profA.all_symptom_prevalence);
  
  // Compute differential prevalence: profA - profB
  const diffs = symptoms.map(s => {
    const valA = profA.all_symptom_prevalence[s] || 0;
    const valB = profB.all_symptom_prevalence[s] || 0;
    return {
      symptom: s,
      diff: valA - valB,
      absDiff: Math.abs(valA - valB),
      valA: valA,
      valB: valB
    };
  });
  
  // Pick top 12 differentiating symptoms
  diffs.sort((a, b) => b.absDiff - a.absDiff);
  const topDiffs = diffs.slice(0, 12).reverse();
  
  const trace = {
    y: topDiffs.map(d => d.symptom),
    x: topDiffs.map(d => d.diff),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: topDiffs.map(d => d.diff >= 0 ? '#2563eb' : '#dc2626')
    },
    text: topDiffs.map(d => `${d.diff > 0 ? '+' : ''}${d.diff.toFixed(1)}%`),
    textposition: 'auto',
    hoverinfo: 'text',
    hovertext: topDiffs.map(d => `${d.symptom}<br>Cluster ${parseInt(cidA)+1}: ${d.valA}%<br>Cluster ${parseInt(cidB)+1}: ${d.valB}%<br>Diff: ${d.diff.toFixed(1)}%`)
  };
  
  const layout = {
    title: `Symptom Prevalence Difference: Cluster ${parseInt(cidA)+1} vs Cluster ${parseInt(cidB)+1}`,
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: theme.font,
    xaxis: {
      title: `<-- More Prevalent in Cluster ${parseInt(cidB)+1} (%) | More Prevalent in Cluster ${parseInt(cidA)+1} (%) -->`,
      gridcolor: theme.gridcolor,
      zerolinecolor: theme.zerolinecolor
    },
    yaxis: {
      gridcolor: theme.gridcolor,
      automargin: true
    },
    margin: { t: 50, r: 30, l: 160, b: 60 }
  };
  
  Plotly.react('plotly-cluster-compare', [trace], layout, { responsive: true, displayModeBar: false });
}

// Auto-trigger on page load
if (document.getElementById('plotly-elbow-chart')) {
  loadClusteringCharts();
}
if (document.getElementById('plotly-cluster-compare')) {
  loadProfileComparisonTool();
}

/* ===================================================================
   6. Live Farm Triage & Disease-Risk Predictor Logic
   =================================================================== */

function updateAgeDisplay(val) {
  const display = document.getElementById('age-display');
  if (display) {
    display.textContent = `${parseFloat(val).toFixed(1)} yrs`;
  }
}

function updateTempDisplay(val) {
  const display = document.getElementById('temp-display');
  if (!display) return;
  const temp = parseFloat(val);
  
  if (temp >= 103.5) {
    display.textContent = `${temp.toFixed(1)} °F (Severe Fever 🔴)`;
    display.style.color = 'var(--danger)';
  } else if (temp >= 102.5) {
    display.textContent = `${temp.toFixed(1)} °F (Mild Fever 🟡)`;
    display.style.color = 'var(--warning)';
  } else {
    display.textContent = `${temp.toFixed(1)} °F (Normal 🟢)`;
    display.style.color = 'var(--primary)';
  }
}

function toggleSymptom(element) {
  element.classList.toggle('active');
  const span = element.querySelector('span');
  if (span) {
    span.textContent = element.classList.contains('active') ? '✓' : '+';
  }
  updateSymptomsCount();
}

function updateSymptomsCount() {
  const countSpan = document.getElementById('symptoms-count');
  if (countSpan) {
    const selected = document.querySelectorAll('.symptom-tag.active');
    countSpan.textContent = selected.length;
  }
}

function clearAllSymptoms() {
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    tag.classList.remove('active');
    const span = tag.querySelector('span');
    if (span) span.textContent = '+';
  });
  updateSymptomsCount();
}

function filterSymptomTags(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.symptom-tag').forEach(tag => {
    const symp = tag.getAttribute('data-symptom').toLowerCase();
    tag.style.display = symp.includes(q) ? 'inline-flex' : 'none';
  });
}

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
      symptoms: ['loss of appetite', 'depression', 'difficulty walking']
    },
    'locomotor': {
      species: 'goat',
      age: 2.0,
      temperature: 101.2,
      symptoms: ['lameness', 'painless lumps', 'blisters on mouth']
    }
  };
  
  const p = presets[presetName];
  if (!p) return;
  
  // Set species radio
  const radio = document.querySelector(`input[name="species"][value="${p.species}"]`);
  if (radio) radio.checked = true;
  
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
    if (p.symptoms.includes(sName)) {
      tag.classList.add('active');
      const span = tag.querySelector('span');
      if (span) span.textContent = '✓';
    }
  });
  
  updateSymptomsCount();
  
  // Run prediction automatically for preset
  runPrediction();
}

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
  
  // 2. Show loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Evaluating Distance to Cluster Centroids...';
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
        <strong>Prediction Error:</strong> Could not retrieve model prediction. Ensure the backend server is running.
      </div>
    `;
    resultContainer.style.display = 'block';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '⚡ Run Clinical Assessment &amp; Predict Disease Risk';
    }
  }
}

function renderPredictionResult(data) {
  const container = document.getElementById('prediction-result-container');
  if (!container) return;
  
  // Disease color palette
  const diseaseColors = {
    'Anthrax': '#dc2626',
    'Blackleg': '#7c3aed',
    'Foot And Mouth': '#2563eb',
    'Lumpy Virus': '#d97706',
    'Pneumonia': '#059669'
  };
  
  // Build disease progress bars HTML
  let diseaseBarsHtml = '';
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
  
  // Build distance breakdown
  let distBreakdown = Object.entries(data.all_distances).map(([k, dist]) => {
    const isSelected = k.includes(`${data.cluster_id}`);
    return `<span style="font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: ${isSelected ? 'var(--primary-bg)' : 'var(--bg-surface-alt)'}; border: 1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}; font-weight: ${isSelected ? '700' : '500'}; color: ${isSelected ? 'var(--primary-light)' : 'var(--text-muted)'};">${k}: ${dist}</span>`;
  }).join(' ');

  container.innerHTML = `
    <div class="result-card" style="border-top: 5px solid ${data.urgency.color};">
      
      <!-- Result Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1rem;">
        <div>
          <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.35rem;">
            <span class="badge ${data.urgency.badge_class}" style="font-size: 0.85rem; padding: 0.35rem 0.75rem;">
              ${data.urgency.icon} ${data.urgency.level}
            </span>
            <span class="badge badge-info">Cluster ${data.cluster_id} / 4</span>
          </div>
          <h3 style="margin-bottom: 0.25rem; font-size: 1.45rem;">
            ${data.cluster_name}
          </h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0;">
            ${data.cluster_summary}
          </p>
        </div>
        
        <div style="text-align: right; background: var(--bg-surface-alt); padding: 0.6rem 0.9rem; border-radius: 8px; border: 1px solid var(--border-color);">
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Centroid Distance</span><br>
          <strong style="font-size: 1.3rem; color: var(--text-primary);">${data.distance}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">(Best Geometric Fit)</span>
        </div>
      </div>

      <!-- Main Result Grid -->
      <div class="grid-2" style="margin-bottom: 1.25rem;">
        
        <!-- Left: Disease Likelihood Breakdown -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h4 style="font-size: 1rem; margin-bottom: 0;">
              📊 Historical Diagnostic Likelihood:
            </h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Empirical Contingency</span>
          </div>
          <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            In the 43,778 audited herd records, animals fitting this syndromic phenotype presented with:
          </p>
          
          <div class="disease-bar-container">
            ${diseaseBarsHtml}
          </div>
        </div>

        <!-- Right: Clinical Action Plan & Normalized Vector -->
        <div style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">
              🩺 Actionable Farm Triage Recommendation:
            </h4>
            <div style="background: var(--bg-surface-alt); padding: 1rem; border-radius: 8px; border-left: 4px solid ${data.urgency.color}; margin-bottom: 1rem;">
              <p style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0; line-height: 1.5;">
                ${data.urgency.action}
              </p>
            </div>

            <h4 style="font-size: 0.9rem; margin-bottom: 0.35rem;">
              📐 Distance Across All 4 Clusters:
            </h4>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              ${distBreakdown}
            </div>
          </div>

          <!-- Input Snapshot -->
          <div style="font-size: 0.8rem; color: var(--text-muted); background: var(--bg-surface-alt); padding: 0.5rem 0.75rem; border-radius: 6px;">
            <strong>Input Summary:</strong> ${data.animal} | Age: ${data.age} yr (Z=${data.input_normalized.age_zscore}) | Temp: ${data.temperature} °F (Z=${data.input_normalized.temp_zscore}) | Symptoms: ${data.symptoms_provided.length > 0 ? data.symptoms_provided.join(', ') : 'None'}
          </div>
        </div>
      </div>

      <!-- Veterinary Disclaimer -->
      <div style="background: var(--warning-bg); border: 1px solid var(--warning-border); padding: 0.65rem 0.9rem; border-radius: 6px; display: flex; gap: 0.5rem; align-items: center; font-size: 0.8rem; color: var(--warning);">
        <span>⚠️</span>
        <div>
          <strong>Responsible Veterinary Notice:</strong> This prediction is generated via unsupervised phenotypic pattern clustering. 
          It does not substitute for pathological diagnostic testing or clinical examination by a licensed veterinarian.
        </div>
      </div>

    </div>
  `;
}


