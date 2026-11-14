# Farm Disease-Risk Profile Discovery Through Unsupervised Pattern Clustering

Unsupervised machine learning project that discovers groups of livestock with similar disease-risk profiles **without using the disease labels**. It compares Euclidean K-Means and Manhattan K-Medians, validates the results, interprets the clusters, and serves everything through an interactive web dashboard.

- **Live dashboard:** https://farm-disease-clustering.vercel.app/
- **Course:** INT396 (Unsupervised Machine Learning), Lovely Professional University
- **Author:** Akshaya (individual project)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Results](#key-results)
3. [Dataset](#dataset)
4. [Methodology](#methodology)
5. [Prerequisites](#prerequisites)
6. [Dependencies](#dependencies)
7. [Installation](#installation)
8. [Execution Instructions](#execution-instructions)
9. [Project Structure](#project-structure)
10. [Reproducibility](#reproducibility)
11. [Limitations](#limitations)
12. [Responsible Use](#responsible-use)
13. [References](#references)

---

## Project Overview

Livestock diseases often share overlapping symptoms, and confirmed diagnoses are costly or missing on real farms. This project asks: *can animals be grouped into meaningful risk profiles from symptoms, species, age and temperature alone?*

The workflow:

1. Audit and preprocess the data (the `Disease` column is isolated before any scaling, encoding or distance computation).
2. Cluster with **Euclidean K-Means** and **Manhattan K-Medians** for k = 2 to 10.
3. Validate with **WCSS (elbow), Silhouette Score and Davies-Bouldin Index**, and visualise separation with **PCA**.
4. Interpret the clusters (profiles, standardised centroids, ANOVA feature ranking).
5. Test stability (random seeds, bootstrap resamples, neighbouring k, distance metric).
6. Cross-check against the disease labels **after** clustering, for description only.
7. Present everything in a Flask and Plotly dashboard, including a tool that places a new animal into its nearest risk profile.

## Key Results

| Item | Value |
|---|---|
| Selected configuration | K-Means, Euclidean distance, **k = 4** |
| WCSS / inertia | 144,176.66 |
| Silhouette Score | 0.1405 |
| Davies-Bouldin Index | 1.9161 (global minimum over k = 2 to 10) |
| Seed stability (mean ARI, 5 seeds) | 0.9957 |
| Bootstrap stability (mean ARI) | 0.9765 |
| ARI, Euclidean vs Manhattan (k = 4) | 0.1775 |
| Top 3 PCA components | 55.12% of variance |

**Discovered profiles (k = 4):**

| Profile | Animals | Mean age | Mean temp |
|---|---|---|---|
| Geriatric Bovine Clinical Syndrome | 10,564 (24.13%) | 11.93 yrs | 102.2 °F |
| Respiratory-Diaphoretic Sign Group | 6,974 (15.93%) | 5.62 yrs | 101.79 °F |
| Young Sub-Febrile Locomotor and Mucosal Pattern | 14,081 (32.16%) | 4.81 yrs | 101.2 °F |
| Acute Febrile Systemic Complex | 12,159 (27.77%) | 5.22 yrs | 103.84 °F |

The Silhouette Score is modest, so clusters overlap. See [Limitations](#limitations).

## Dataset

- **Source:** Kaggle livestock symptoms and diseases ("Animal Disease Prediction") dataset
- **File:** `animal_disease_dataset.csv`
- **Size:** 43,778 rows, 7 columns, no missing values

| Column | Description |
|---|---|
| `Animal` | cow, buffalo, goat or sheep |
| `Age` | age in years (1 to 15) |
| `Temperature` | body temperature in °F (about 100 to 105) |
| `Symptom 1`, `Symptom 2`, `Symptom 3` | three symptom slots, 24 distinct symptoms |
| `Disease` | anthrax, blackleg, foot and mouth, lumpy virus, pneumonia (**not used for clustering**) |

Dataset link: *[add your Google Drive or Kaggle link here]*

## Methodology

**Preprocessing**
- Isolate `Disease` before any transformation.
- Multi-hot encode the 24 symptoms (removes bias from the three symptom slots).
- One-hot encode the 4 species.
- Standardise `Age` and `Temperature`.
- Final feature space: **30 features** (2 vitals + 4 species + 24 symptoms).

**Clustering**
- Euclidean K-Means (`n_init >= 10`).
- Manhattan K-Medians (custom implementation, because scikit-learn's `KMeans` is Euclidean only).
- k = 2 to 10, evaluated with WCSS, Silhouette Score and Davies-Bouldin Index.

**Interpretation and stability**
- 2D and 3D PCA, standardised centroid heatmap, ANOVA F-statistic feature ranking.
- 5 random seeds (42, 123, 456, 789, 999), 5 bootstrap subsamples (80%), k vs k+1 comparison, Euclidean vs Manhattan comparison.

## Prerequisites

- **Python 3.9 or newer** (developed and tested on Python 3.12)
- **pip** (Python package manager)
- **Git** (to clone the repository)
- A modern web browser (to view the dashboard)
- About 500 MB of free disk space

Check your versions:

```bash
python --version
git --version
```

## Dependencies

| Package | Purpose |
|---|---|
| pandas, numpy | data handling |
| scikit-learn | K-Means, metrics, PCA, preprocessing |
| scipy | hierarchical clustering, statistics |
| matplotlib, seaborn | static figures |
| plotly | interactive charts |
| flask (3.1) | web dashboard |
| jupyter | notebook execution |

All dependencies are listed in `requirements.txt`.

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/akshaya3112/Farm-disease-clustering.git
cd Farm-disease-clustering

# 2. (Recommended) create and activate a virtual environment
python -m venv venv

# Windows (PowerShell)
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

> **Windows tip:** use `python -m pip` instead of `pip`. It avoids launcher errors when several Python versions are installed.

Verify the installation:

```bash
python -c "import pandas, numpy, sklearn, scipy, matplotlib, seaborn, plotly, flask; print('all good')"
```

Make sure `animal_disease_dataset.csv` is in the project folder (or the data folder used by the code).

## Execution Instructions

### Option 1: Run the analysis notebook

```bash
jupyter notebook project.ipynb
```

Then choose **Kernel > Restart and Run All**. The notebook runs top to bottom: data audit, preprocessing, K-Means and K-Medians for k = 2 to 10, validation metrics, PCA, profiling, and stability analysis. Figures are saved to `outputs/figures/` and tables to `outputs/`.

### Option 2: Run the dashboard locally

```bash
python app.py
```

Open the address shown in the terminal (usually `http://127.0.0.1:5000`).

Dashboard pages: Home (with the interactive risk-profile predictor), Data and Preprocessing, Clustering Workflow, Cluster Profiles, Stability and Ethics, About and Reproduce.

### Option 3: Use the live deployment

No installation needed: https://farm-disease-clustering.vercel.app/

## Project Structure

> Update this tree to match your repository.

```
Farm-disease-clustering/
├── animal_disease_dataset.csv   # dataset
├── project.ipynb                # full analysis notebook
├── app.py                       # Flask dashboard
├── requirements.txt             # dependencies
├── outputs/
│   └── figures/                 # generated plots (heatmaps, ANOVA, stability)
└── README.md
```

## Reproducibility

- Fixed random seeds (primary seed 42) throughout.
- `n_init >= 10` restarts for K-Means.
- Stability audited across 5 seeds and 5 bootstrap subsamples.
- Slow computations (such as plots) use documented random samples of the full data, where noted in the notebook.

## Limitations

- Dataset origin, sampling method and farm geography are unknown; the fixed three symptom slots suggest a collection artifact rather than real veterinary records.
- K-Means assumes continuous, roughly spherical clusters, while most features here are binary.
- Silhouette Score is low (0.14), so cluster separation is modest and clusters overlap.
- Euclidean and Manhattan solutions disagree (ARI 0.1775 at k = 4).
- Validation metrics measure geometry, not veterinary validity.
- Only 5 diseases and 4 species are represented.

## Responsible Use

- Clusters are **exploratory phenotypes**, not permanent real-world disease categories.
- They are **not a diagnostic tool**; any flagged profile must be validated by a licensed veterinarian.
- Cluster membership must **never** be used to automate treatment, quarantine or culling decisions.
- Intended only for herd-level surveillance and triage prioritisation.

## References

- Pedregosa et al., *Scikit-learn: Machine Learning in Python*, JMLR, 2011.
- MacQueen, *Some methods for classification and analysis of multivariate observations*, 1967.
- Rousseeuw, *Silhouettes: a graphical aid to the interpretation and validation of cluster analysis*, 1987.
- Davies and Bouldin, *A cluster separation measure*, IEEE TPAMI, 1979.

## Author

**Akshaya**, B.Tech Computer Science and Engineering (AI/ML), Lovely Professional University
GitHub: [akshaya3112](https://github.com/akshaya3112)
