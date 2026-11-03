# Farm Disease-Risk Profile Discovery Through Unsupervised Pattern Clustering

An end-to-end, reproducible data-science investigation and multi-page Flask web application uncovering latent livestock syndromic risk phenotypes from observational herd data without diagnostic label contamination.

---

## 📌 Project Overview
- **Title:** Farm Disease-Risk Profile Discovery Through Unsupervised Pattern Clustering
- **Dataset:** Kaggle "Animal Disease Prediction" (`43,778` animal records, `7` attributes)
- **Methodology:** Unsupervised Pattern Discovery (Euclidean K-Means vs Manhattan K-Medians)
- **Primary Selected Configuration:** Euclidean K-Means, $k = 4$ (Davies-Bouldin Index: `1.9161`, Silhouette Score: `0.1405`)
- **Web Application:** Multi-page Flask app with Jinja2 templates, REST APIs, and interactive Plotly visualizations.

---

## 🎯 Objectives & Implementation

### Objective 1: Data Preparation & Auditing
- **Dataset Ingestion:** 43,778 animal records across 4 species (`cow`, `buffalo`, `goat`, `sheep`).
- **Zero Missing Cells:** Audited missing values across all columns (0 missing values, complete observations).
- **Outlier Audit:** Evaluated IQR thresholds for continuous vitals:
  - Age: Q1=4, Q3=10, IQR=6 &rarr; Bounds: [-5.0, 19.0] yr &rarr; Observed [1.0, 15.0] yr (0 outliers).
  - Temperature: Q1=101.1, Q3=103.4, IQR=2.3 &rarr; Bounds: [97.65, 106.85] &deg;F &rarr; Observed [100.0, 105.0] &deg;F (0 outliers).
- **Duplicate Audit:** 0 exact duplicate rows across all 7 columns; 3,618 feature-level duplicates across the 6 predictor fields. Retained after verifying that multiple animals naturally present identical common symptom triplets in agricultural herds.
- **Categorical Multi-Hot Reshaping:** Positional symptom slots (`Symptom 1`, `Symptom 2`, `Symptom 3`) were unified into a 24-dimensional binary multi-hot feature space ($x_j \in \{0, 1\}$).
- **Why Label Encoding is Flawed:** Label encoding assigns arbitrary ordinal integers (e.g. Buffalo=0, Cow=1, Goat=2, Sheep=3). In Euclidean and Manhattan distance, $(Sheep - Buffalo)^2 = 9$ vs $(Cow - Buffalo)^2 = 1$, imposing an artificial metric hierarchy. One-hot and multi-hot binary indicators place each category on an orthogonal axis at equidistant unit distance.
- **Standardization:** `StandardScaler` applied to `Age` and `Temperature` ($\mu=0, \sigma=1$); binary flags left in $\{0, 1\}$ to maintain exact Hamming distance semantics.
- **Auditable Preprocessing Decision Log:** Saved to `outputs/preprocessing_log.json` and rendered in a searchable table.

### Objective 2: Clustering Workflow
- **Euclidean K-Means Grid:** Evaluated for $k \in [2, 10]$ (`scikit-learn`, `n_init=10`, `random_state=42`).
- **Manhattan K-Medians Grid:** Implemented a custom, vectorized $L_1$ coordinate-wise K-Medians algorithm for $k \in [2, 10]$. Standard K-Means does not support Manhattan distance because taking the arithmetic mean minimizes squared Euclidean errors; in $L_1$ space, the mathematical minimizer is the univariate median.
- **Validation Metrics Computed:**
  - WCSS (Inertia for Euclidean, total $L_1$ distance for Manhattan)
  - Silhouette Score (computed with metric="euclidean" for K-Means, metric="manhattan" for K-Medians)
  - Davies-Bouldin Index (DBI)
- **PCA Decomposition:** Scree plot, explained variance ratios, and 2D/3D scatter projections.
- **Selected Configuration ($k = 4$):**
  - Minimal Davies-Bouldin Index globally across all tested configurations (`DBI = 1.9161`).
  - Strong Silhouette Score (`0.1405`).
  - Clear WCSS elbow inflection point.
  - Peaks under Manhattan K-Medians (`Silhouette = 0.2042`).
  - Clinically resolves 4 interpretable syndromic phenotypes without collapsing into over-simplistic binary splits.

### Objective 3: Interpretation & Responsible Reporting
- **Discovered Syndromic Phenotypes:**
  - **Profile 1 (24.1%):** *Geriatric Bovine Clinical Syndrome* (Mean Age: 11.93 yr, 86.7% cow/buffalo, dominant loss of appetite 75.7% and depression 51.2%).
  - **Profile 2 (15.9%):** *Respiratory-Diaphoretic Sign Group* (Mean Temp: 101.79 &deg;F, dominant sweats 51.1%, fatigue 50.9%, shortness of breath 50.5%).
  - **Profile 3 (32.2%):** *Young Sub-Febrile Locomotor & Mucosal Pattern* (Mean Age: 4.81 yr, lower-normative temp 101.20 &deg;F, focal lumps 42.1%, lameness 22.9%).
  - **Profile 4 (27.8%):** *Acute Febrile Systemic Complex* (Severe hyperthermia: mean temp 103.84 &deg;F, high systemic fever, appetite loss 78.7%).
- **Key Feature Contributions:** Ranked by one-way ANOVA F-statistic and explained via a shallow surrogate decision tree (fidelity: `97.8%` accuracy).
- **Stability Analysis:**
  - Random Seed Stability: 5 independent runs yielded a Mean Adjusted Rand Index (ARI) of `0.9957`.
  - Bootstrap Stability: 5 bootstrap subsamples (80% sampling) yielded a Mean Overlap ARI of `0.9765`.
  - Metric Concordance: Euclidean vs Manhattan ARI at $k=4$ is `0.1775`, reflecting differing geometric handling of sparse binary features.
- **Post-Hoc Descriptive Cross-Check:** The ground-truth `Disease` label was strictly isolated prior to clustering. A post-hoc contingency table reveals that Profile 2 captures 6,974 animals, all of which are Anthrax cases in the dataset. This is documented strictly as a descriptive cross-check and never reported as classification accuracy.
- **Responsible Use & Limitations:** Documented that exploratory clusters are phenotype groupings, not diagnostic disease categories. Requires veterinary expert validation; not for automated treatment or culling decisions.

---

## 📂 Project Directory Structure

```text
farm-disease-clustering/
├── data/
│   ├── animal_disease_dataset.csv             # Raw Kaggle dataset
│   └── processed_features.csv                 # Preprocessed 30-dim matrix
├── notebooks/
│   └── farm_disease_clustering_analysis.ipynb # Well-commented Jupyter notebook
├── src/
│   ├── __init__.py
│   ├── preprocessing.py                       # Preprocessing and auditing logic
│   ├── clustering.py                          # KMeans & vectorized KMedians
│   ├── evaluation.py                          # WCSS, Silhouette, DBI, PCA
│   ├── profiling.py                           # Profiles, ANOVA, surrogate tree
│   ├── stability.py                           # Seed, bootstrap, metric ARI
│   └── visualization.py                       # Static PNG/SVG figure generation
├── outputs/
│   ├── metrics.json                           # Metrics across k=2..10
│   ├── cluster_profiles.json                  # Phenotypes, traits, centroids
│   ├── stability.json                         # ARI matrices & stability verdict
│   ├── preprocessing_log.json                 # Decision log & audits
│   ├── pca.json                               # Scree data & sample coordinates
│   └── figures/                               # PNG & SVG publication plots
├── templates/                                 # Jinja2 templates (Multi-page app)
│   ├── base.html                              # Base layout with theme toggle
│   ├── home.html                              # Headline findings & checklist
│   ├── preprocessing.html                     # Objective 1 page
│   ├── clustering.html                        # Objective 2 page
│   ├── profiles.html                          # Objective 3 page & comparison tool
│   ├── stability.html                         # Stability & ethics page
│   └── about.html                             # Outcome mapping & downloads
├── static/
│   ├── css/style.css                          # Custom responsive design system
│   └── js/main.js                             # Plotly charts, search, theme toggle
├── app.py                                     # Flask application and REST API
├── run_pipeline.py                            # One-command Phase A orchestrator
├── run_all.bat                                # Windows launcher
├── run_all.sh                                 # POSIX launcher
├── test_app_routes.py                         # Automated test suite
├── requirements.txt                           # Dependency specifications
└── README.md                                  # Documentation
```

---

## 🚀 Reproduction Instructions

### 1. Environment Setup
Install all required dependencies:
```bash
pip install -r requirements.txt
```

### 2. Run the Complete Data Science Pipeline (Phase A)
Execute the master pipeline orchestrator to regenerate all metrics, profiles, stability audits, and static figures:
```bash
python run_pipeline.py
```

### 3. Launch the Multi-Page Flask Web Application (Phase B)
Start the web dashboard:
```bash
python app.py
```
Open your browser and navigate to:
**http://127.0.0.1:5000**

### 4. One-Click Runners
- **Windows:** Run `.\run_all.bat`
- **Linux / macOS:** Run `bash run_all.sh`

### 5. Automated Testing
Run the route and API verification test suite:
```bash
python test_app_routes.py
```

---

## 📊 Summary of Chosen Configuration & Justification

| Parameter | Selected Value |
|---|---|
| **Algorithm** | K-Means |
| **Distance Metric** | Euclidean ($L_2$ norm) |
| **Number of Clusters ($k$)** | $k = 4$ |
| **WCSS / Inertia** | `144,176.66` |
| **Silhouette Score** | `0.1405` |
| **Davies-Bouldin Index** | `1.9161` (Global Minimum across all tested $k$) |
| **Seed Stability (Mean ARI)** | `0.9957` (Near-perfect convergence) |
| **Bootstrap Overlap ARI** | `0.9765` |

**Selection Rationale:**
1. **Mathematical Optimization:** The Davies-Bouldin Index strictly achieves its global minimum at $k = 4$ (`1.9161`), indicating maximal ratio of cluster separation to within-cluster dispersion.
2. **Elbow Inflection:** The rate of WCSS reduction exhibits a clear elbow inflection at $k = 4$, with marginal returns rapidly diminishing for $k \ge 5$.
3. **Cross-Metric Concordance:** Under the Manhattan K-Medians model, Silhouette Score peaks at $k = 4$ (`0.2042`), demonstrating cross-metric agreement.
4. **Clinical Granularity:** While $k = 2$ achieved a slightly higher Euclidean silhouette score (`0.1425` vs `0.1405`), $k = 2$ had a poor Davies-Bouldin index (`2.3101`) and merely split animals into young vs old, failing to resolve the distinct symptom complexes needed for actionable herd risk management.

---

## 🔍 Dataset Quirks & Assumptions

1. **Fixed Triplet Symptom Structure:** Every animal in the dataset possesses exactly three recorded symptoms across `Symptom 1`, `Symptom 2`, and `Symptom 3`. In field veterinary practice, animal symptom counts vary widely. Multi-hot encoding across all 24 unique symptoms successfully removed the positional slot bias.
2. **Feature Duplicates (3,618 rows):** While no row was an exact duplicate across all 7 columns, 3,618 animals shared identical feature vectors (excluding `Disease`). In veterinary epidemiology, identical symptom profiles naturally occur within herds. Dropping these records would distort natural cluster density and disease prevalence.
3. **Synthetic / Curated Origins:** The dataset originated from Kaggle with clean, discrete integer ages (1-15) and narrow temperatures (100.0-105.0 &deg;F). Consequently, findings are presented cautiously as exploratory phenotypes rather than definitive real-world disease classifications.

