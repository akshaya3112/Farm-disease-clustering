"""
Evaluation Module: Metrics, PCA Projection, and Configuration Comparison
Author: Antigravity Team
"""

import numpy as np
import pandas as pd
from sklearn.metrics import silhouette_score, davies_bouldin_score
from sklearn.decomposition import PCA


def evaluate_cluster_grid(X, kmeans_models, kmedians_models, sample_size=10000, random_state=42):
    """
    Evaluate K-Means (Euclidean) and K-Medians (Manhattan) across tested k values.
    Returns structured metrics records and summary comparison.
    """
    X_arr = np.asarray(X)
    records = []
    
    # 1. Evaluate Euclidean K-Means
    for k, model in kmeans_models.items():
        wcss = float(model.inertia_)
        sil = float(silhouette_score(
            X_arr, 
            model.labels_, 
            metric="euclidean", 
            sample_size=sample_size, 
            random_state=random_state
        ))
        dbi = float(davies_bouldin_score(X_arr, model.labels_))
        
        records.append({
            "algorithm": "K-Means",
            "distance_metric": "Euclidean",
            "k": int(k),
            "cost_wcss": round(wcss, 2),
            "silhouette": round(sil, 4),
            "davies_bouldin": round(dbi, 4),
        })
        
    # 2. Evaluate Manhattan K-Medians
    for k, model in kmedians_models.items():
        cost_l1 = float(model.cost_)
        sil = float(silhouette_score(
            X_arr, 
            model.labels_, 
            metric="manhattan", 
            sample_size=sample_size, 
            random_state=random_state
        ))
        dbi = float(davies_bouldin_score(X_arr, model.labels_))
        
        records.append({
            "algorithm": "K-Medians",
            "distance_metric": "Manhattan",
            "k": int(k),
            "cost_wcss": round(cost_l1, 2),
            "silhouette": round(sil, 4),
            "davies_bouldin": round(dbi, 4),
        })
        
    df_metrics = pd.DataFrame(records)
    
    # Identify best metrics per algorithm
    km_subset = df_metrics[df_metrics["algorithm"] == "K-Means"]
    best_km_sil = int(km_subset.loc[km_subset["silhouette"].idxmax()]["k"])
    best_km_dbi = int(km_subset.loc[km_subset["davies_bouldin"].idxmin()]["k"])
    
    kmed_subset = df_metrics[df_metrics["algorithm"] == "K-Medians"]
    best_kmed_sil = int(kmed_subset.loc[kmed_subset["silhouette"].idxmax()]["k"])
    best_kmed_dbi = int(kmed_subset.loc[kmed_subset["davies_bouldin"].idxmin()]["k"])
    
    summary = {
        "kmeans": {
            "best_silhouette_k": best_km_sil,
            "best_silhouette_value": float(km_subset["silhouette"].max()),
            "best_dbi_k": best_km_dbi,
            "best_dbi_value": float(km_subset["davies_bouldin"].min()),
        },
        "kmedians": {
            "best_silhouette_k": best_kmed_sil,
            "best_silhouette_value": float(kmed_subset["silhouette"].max()),
            "best_dbi_k": best_kmed_dbi,
            "best_dbi_value": float(kmed_subset["davies_bouldin"].min()),
        }
    }
    
    return {
        "records": records,
        "summary": summary
    }


def compute_pca_projection(X, feature_names, n_components=3, random_state=42):
    """
    Compute PCA decomposition for dimensionality reduction and visualization.
    Returns explained variance, scree plot data, component loadings, and 2D/3D coordinates.
    """
    X_arr = np.asarray(X)
    pca_full = PCA(random_state=random_state).fit(X_arr)
    
    explained_var = pca_full.explained_variance_ratio_
    cumulative_var = np.cumsum(explained_var)
    
    scree_data = [
        {
            "component": int(i + 1),
            "explained_variance": float(round(explained_var[i], 4)),
            "cumulative_variance": float(round(cumulative_var[i], 4)),
            "pct_explained": float(round(explained_var[i] * 100, 2)),
            "pct_cumulative": float(round(cumulative_var[i] * 100, 2))
        }
        for i in range(len(explained_var))
    ]
    
    # 3D transformation
    pca3 = PCA(n_components=n_components, random_state=random_state)
    coords_3d = pca3.fit_transform(X_arr)
    
    # Loadings: correlation between original features and top components
    loadings = pd.DataFrame(
        pca3.components_.T,
        columns=[f"PC{i+1}" for i in range(n_components)],
        index=feature_names
    )
    
    top_loadings = {}
    for comp in [f"PC{i+1}" for i in range(n_components)]:
        top_pos = loadings[comp].sort_values(ascending=False).head(5).round(4).to_dict()
        top_neg = loadings[comp].sort_values(ascending=True).head(5).round(4).to_dict()
        top_loadings[comp] = {"positive": top_pos, "negative": top_neg}
        
    # Sample 2500 points for ultra-fast responsive interactive web scatter plots
    rng = np.random.RandomState(random_state)
    sample_indices = rng.choice(len(X_arr), size=min(2500, len(X_arr)), replace=False).tolist()
    
    return {
        "scree_data": scree_data,
        "total_components": len(explained_var),
        "top_3_variance_pct": float(round(float(cumulative_var[2]) * 100, 2)),
        "loadings": top_loadings,
        "sample_indices": sample_indices,
        "coords_3d": coords_3d
    }

