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
    
    // Bind controls
    const algoToggle = document.getElementById('metric-algo-select');
    const kSelector = document.getElementById('metric-k-select');
    const pcaKSelector = document.getElementById('pca-k-select');
    const pcaDimSelector = document.getElementById('pca-dim-select');
    
    if (algoToggle) algoToggle.addEventListener('change', () => renderMetricCurves());
    if (kSelector) kSelector.addEventListener('change', () => renderMetricCurves());
    if (pcaKSelector) pcaKSelector.addEventListener('change', () => renderPcaScatter());
    if (pcaDimSelector) pcaDimSelector.addEventListener('change', () => renderPcaScatter());
    
    window.addEventListener('themeChanged', () => {
      renderMetricCurves();
      renderPcaScatter();
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
  if (!cachedPca) return;
  
  const kSelector = document.getElementById('pca-k-select');
  const dimSelector = document.getElementById('pca-dim-select');
  const chosenK = kSelector ? parseInt(kSelector.value) : 4;
  const is3D = dimSelector ? dimSelector.value === '3d' : false;
  
  const theme = getPlotlyThemeLayout();
  const points = cachedPca.sampled_points;
  const clusterKey = `kmeans_k${chosenK}`;
  
  // Group points by cluster
  const clustersData = {};
  for (let c = 0; c < chosenK; c++) {
    clustersData[c] = { x: [], y: [], z: [] };
  }
  
  points.forEach(pt => {
    const c = pt.clusters[clusterKey];
    if (clustersData[c]) {
      clustersData[c].x.push(pt.pc1);
      clustersData[c].y.push(pt.pc2);
      clustersData[c].z.push(pt.pc3);
    }
  });
  
  const colors = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777'];
  const traces = [];
  
  for (let c = 0; c < chosenK; c++) {
    if (is3D) {
      traces.push({
        x: clustersData[c].x,
        y: clustersData[c].y,
        z: clustersData[c].z,
        name: `Cluster ${c + 1}`,
        mode: 'markers',
        type: 'scatter3d',
        marker: { size: 3.5, color: colors[c % colors.length], opacity: 0.75 }
      });
    } else {
      traces.push({
        x: clustersData[c].x,
        y: clustersData[c].y,
        name: `Cluster ${c + 1}`,
        mode: 'markers',
        type: 'scatter',
        marker: { size: 5, color: colors[c % colors.length], opacity: 0.7 }
      });
    }
  }
  
  const layout = {
    title: `PCA Projection of Clusters (${is3D ? '3D' : '2D'}, k=${chosenK})`,
    paper_bgcolor: theme.paper_bgcolor,
    plot_bgcolor: theme.plot_bgcolor,
    font: theme.font,
    margin: { t: 40, r: 20, l: 40, b: 40 },
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

