"""
Static Visualization Generator for Phase A Pipeline
Produces publication-quality PNG and SVG figures.
Author: Antigravity Team
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd


# Set consistent academic styling
sns.set_theme(style="whitegrid", font="sans-serif")
plt.rcParams.update({
    "font.size": 11,
    "axes.labelsize": 12,
    "axes.titlesize": 13,
    "xtick.labelsize": 10,
    "ytick.labelsize": 10,
    "figure.titlesize": 14,
    "figure.dpi": 200
})

FIGURES_DIR = "outputs/figures"


def ensure_dir(path=FIGURES_DIR):
    os.makedirs(path, exist_ok=True)


def plot_preprocessing_distributions(df_raw, num_scaled_df):
    """Plot before vs after standardization distributions and outlier boxplots."""
    ensure_dir()
    fig, axes = plt.subplots(2, 2, figsize=(12, 9))
    
    # 1. Raw distributions
    sns.histplot(df_raw["Age"], kde=True, color="#2b5c8f", ax=axes[0, 0], bins=15)
    axes[0, 0].set_title("Raw Age Distribution (Years)")
    axes[0, 0].set_xlabel("Age (1 - 15 yrs)")
    
    sns.histplot(df_raw["Temperature"], kde=True, color="#b23b3b", ax=axes[0, 1], bins=20)
    axes[0, 1].set_title("Raw Temperature Distribution (F)")
    axes[0, 1].set_xlabel("Temperature (100.0 - 105.0 F)")
    
    # 2. Scaled distributions
    sns.histplot(num_scaled_df["age_std"], kde=True, color="#2e7d32", ax=axes[1, 0], bins=15)
    axes[1, 0].set_title("Standardized Age (Z-Score: mean=0, std=1)")
    axes[1, 0].set_xlabel("Standardized Z-Score")
    
    sns.histplot(num_scaled_df["temp_std"], kde=True, color="#f57c00", ax=axes[1, 1], bins=20)
    axes[1, 1].set_title("Standardized Temperature (Z-Score: mean=0, std=1)")
    axes[1, 1].set_xlabel("Standardized Z-Score")
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/preprocessing_distributions.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/preprocessing_distributions.svg", bbox_inches="tight")
    plt.close(fig)


def plot_outlier_boxplots(df_raw):
    """Boxplots to inspect IQR outliers."""
    ensure_dir()
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.5))
    
    sns.boxplot(y=df_raw["Age"], ax=axes[0], color="#90caf9", width=0.4)
    axes[0].set_title("Age Outlier Inspection (IQR: 4 - 10 yrs)")
    axes[0].set_ylabel("Age (Years)")
    
    sns.boxplot(y=df_raw["Temperature"], ax=axes[1], color="#ffab91", width=0.4)
    axes[1].set_title("Temperature Outlier Inspection (IQR: 101.1 - 103.4 F)")
    axes[1].set_ylabel("Temperature (F)")
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/outlier_boxplots.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/outlier_boxplots.svg", bbox_inches="tight")
    plt.close(fig)


def plot_elbow_curves(eval_records):
    """Elbow curve plot comparing Euclidean WCSS and Manhattan L1 Cost."""
    ensure_dir()
    df = pd.DataFrame(eval_records)
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
    
    # Euclidean
    df_eucl = df[df["algorithm"] == "K-Means"]
    axes[0].plot(df_eucl["k"], df_eucl["cost_wcss"], marker="o", color="#1976d2", linewidth=2.2, markersize=7)
    axes[0].axvline(x=4, color="#d32f2f", linestyle="--", alpha=0.8, label="Selected k=4 (Elbow Inflection)")
    axes[0].set_title("K-Means (Euclidean Distance): WCSS / Inertia vs k")
    axes[0].set_xlabel("Number of Clusters (k)")
    axes[0].set_ylabel("Within-Cluster Sum of Squares (Inertia)")
    axes[0].legend()
    
    # Manhattan
    df_manh = df[df["algorithm"] == "K-Medians"]
    axes[1].plot(df_manh["k"], df_manh["cost_wcss"], marker="s", color="#388e3c", linewidth=2.2, markersize=7)
    axes[1].axvline(x=4, color="#d32f2f", linestyle="--", alpha=0.8, label="Selected k=4 (Elbow Inflection)")
    axes[1].set_title("K-Medians (Manhattan Distance): Total L1 Cost vs k")
    axes[1].set_xlabel("Number of Clusters (k)")
    axes[1].set_ylabel("Total Within-Cluster L1 Cost")
    axes[1].legend()
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/clustering_elbow_curves.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/clustering_elbow_curves.svg", bbox_inches="tight")
    plt.close(fig)


def plot_validation_metrics(eval_records):
    """Silhouette Score and Davies-Bouldin Index comparisons."""
    ensure_dir()
    df = pd.DataFrame(eval_records)
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
    
    df_km = df[df["algorithm"] == "K-Means"]
    df_kmed = df[df["algorithm"] == "K-Medians"]
    
    # Silhouette
    axes[0].plot(df_km["k"], df_km["silhouette"], marker="o", label="K-Means (Euclidean)", color="#1976d2", linewidth=2)
    axes[0].plot(df_kmed["k"], df_kmed["silhouette"], marker="s", label="K-Medians (Manhattan)", color="#388e3c", linewidth=2)
    axes[0].set_title("Silhouette Score vs k (Higher is Better)")
    axes[0].set_xlabel("Number of Clusters (k)")
    axes[0].set_ylabel("Silhouette Score")
    axes[0].legend()
    
    # Davies-Bouldin
    axes[1].plot(df_km["k"], df_km["davies_bouldin"], marker="o", label="K-Means (Euclidean)", color="#1976d2", linewidth=2)
    axes[1].plot(df_kmed["k"], df_kmed["davies_bouldin"], marker="s", label="K-Medians (Manhattan)", color="#388e3c", linewidth=2)
    axes[1].axvline(x=4, color="#d32f2f", linestyle="--", alpha=0.8, label="k=4 Optimal DBI (1.9161)")
    axes[1].set_title("Davies-Bouldin Index vs k (Lower is Better)")
    axes[1].set_xlabel("Number of Clusters (k)")
    axes[1].set_ylabel("Davies-Bouldin Index")
    axes[1].legend()
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/clustering_validation_metrics.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/clustering_validation_metrics.svg", bbox_inches="tight")
    plt.close(fig)


def plot_pca_scree(scree_data):
    """PCA Scree plot showing individual and cumulative explained variance."""
    ensure_dir()
    df = pd.DataFrame(scree_data).head(15)
    
    fig, ax1 = plt.subplots(figsize=(10, 5.5))
    
    color = "#1976d2"
    ax1.set_xlabel("Principal Component")
    ax1.set_ylabel("Individual Explained Variance Ratio", color=color)
    bars = ax1.bar(df["component"], df["explained_variance"], color=color, alpha=0.6, width=0.6, label="Individual Variance")
    ax1.tick_params(axis="y", labelcolor=color)
    
    ax2 = ax1.twinx()
    color2 = "#d32f2f"
    ax2.set_ylabel("Cumulative Explained Variance", color=color2)
    ax2.plot(df["component"], df["cumulative_variance"], color=color2, marker="o", linewidth=2.2, label="Cumulative Variance")
    ax2.tick_params(axis="y", labelcolor=color2)
    ax2.grid(False)
    
    plt.title("PCA Scree Plot (Explained Variance by Principal Component)")
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/pca_scree_plot.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/pca_scree_plot.svg", bbox_inches="tight")
    plt.close(fig)


def plot_pca_clusters_2d(coords_3d, cluster_labels, sample_indices):
    """Plot 2D PCA cluster separation."""
    ensure_dir()
    coords_sample = coords_3d[sample_indices]
    labels_sample = np.asarray(cluster_labels)[sample_indices]
    
    fig, ax = plt.subplots(figsize=(10, 7))
    palette = sns.color_palette("tab10", len(np.unique(cluster_labels)))
    
    for c in sorted(np.unique(cluster_labels)):
        mask = (labels_sample == c)
        ax.scatter(
            coords_sample[mask, 0],
            coords_sample[mask, 1],
            s=25,
            alpha=0.65,
            label=f"Cluster {c+1}",
            color=palette[c]
        )
        
    ax.set_title("2D PCA Projection of Discovered Disease-Risk Clusters (k=4)")
    ax.set_xlabel("Principal Component 1")
    ax.set_ylabel("Principal Component 2")
    ax.legend(title="Risk Profiles", frameon=True)
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/pca_clusters_2d.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/pca_clusters_2d.svg", bbox_inches="tight")
    plt.close(fig)


def plot_centroid_heatmap(profiles_dict, feature_names):
    """Heatmap showing standardized centroid values for each cluster."""
    ensure_dir()
    clusters = sorted(profiles_dict.keys(), key=lambda x: int(x))
    k = len(clusters)
    
    # Pick the most active features (top variance across centroids)
    matrix = []
    for c in clusters:
        centroids = profiles_dict[c]["standardized_centroids"]
        matrix.append([centroids[f] for f in feature_names])
        
    df_heat = pd.DataFrame(matrix, index=[f"Profile {int(c)+1}" for c in clusters], columns=feature_names)
    
    # Filter to features that have substantial variance across clusters
    top_varying_cols = df_heat.std().sort_values(ascending=False).head(16).index
    df_sub = df_heat[top_varying_cols]
    
    # Clean column names for display
    clean_cols = [c.replace("symptom_", "").replace("animal_", "Species: ").replace("_std", " (scaled)").replace("_", " ") for c in df_sub.columns]
    df_sub.columns = clean_cols
    
    fig, ax = plt.subplots(figsize=(14, 6))
    sns.heatmap(df_sub, annot=True, fmt=".2f", cmap="coolwarm", center=0, cbar_kws={'label': 'Standardized Centroid Value (Z-Score)'}, ax=ax)
    ax.set_title("Cluster Centroid Heatmap (Key Distinctive Clinical Features)")
    plt.xticks(rotation=45, ha="right")
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/centroid_heatmap.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/centroid_heatmap.svg", bbox_inches="tight")
    plt.close(fig)


def plot_feature_contributions_anova(anova_ranking):
    """Horizontal bar chart of top 15 features by ANOVA F-statistic."""
    ensure_dir()
    df = pd.DataFrame(anova_ranking).head(15).iloc[::-1]  # Reverse for ascending display
    
    fig, ax = plt.subplots(figsize=(10, 7))
    bars = ax.barh(df["clean_name"], df["f_statistic"], color="#1565c0", alpha=0.85)
    ax.set_title("Top 15 Distinguishing Features Between Clusters (ANOVA F-Statistic)")
    ax.set_xlabel("ANOVA F-Statistic (Explanatory Metric Only)")
    
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 50, bar.get_y() + bar.get_height() / 2, f"{w:,.0f}", ha="left", va="center", fontsize=9)
        
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/feature_contributions_anova.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/feature_contributions_anova.svg", bbox_inches="tight")
    plt.close(fig)


def plot_seed_stability_heatmap(seed_res):
    """Heatmap showing pairwise ARI matrix across random seeds."""
    ensure_dir()
    seeds = seed_res["seeds"]
    matrix = np.array(seed_res["ari_matrix"])
    
    fig, ax = plt.subplots(figsize=(7, 6))
    labels = [f"Seed {s}" for s in seeds]
    sns.heatmap(matrix, annot=True, fmt=".3f", cmap="Blues", vmin=0.5, vmax=1.0, xticklabels=labels, yticklabels=labels, ax=ax)
    ax.set_title(f"Cluster Solution Stability Across Random Seeds (Mean ARI = {seed_res['mean_ari']})")
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/seed_stability_heatmap.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/seed_stability_heatmap.svg", bbox_inches="tight")
    plt.close(fig)


def plot_disease_crosscheck(crosscheck_data):
    """Heatmap for descriptive disease cross-check contingency matrix."""
    if not crosscheck_data:
        return
    ensure_dir()
    ct_data = crosscheck_data["contingency_matrix"]
    diseases = crosscheck_data["diseases"]
    
    matrix = []
    cluster_labels = []
    for c, row in sorted(ct_data.items(), key=lambda x: int(x[0])):
        cluster_labels.append(f"Profile {int(c)+1}")
        matrix.append([row[d]["count"] for d in diseases])
        
    df_ct = pd.DataFrame(matrix, index=cluster_labels, columns=diseases)
    
    fig, ax = plt.subplots(figsize=(10, 5.5))
    sns.heatmap(df_ct, annot=True, fmt="d", cmap="YlGnBu", cbar_kws={'label': 'Animal Count'}, ax=ax)
    ax.set_title("Descriptive Cross-Check: Cluster Phenotypes vs Ground Truth Diagnoses\n(Explanatory Post-Hoc Audit Only - NOT Accuracy)")
    plt.xticks(rotation=30, ha="right")
    
    plt.tight_layout()
    fig.savefig(f"{FIGURES_DIR}/disease_crosscheck_heatmap.png", dpi=200, bbox_inches="tight")
    fig.savefig(f"{FIGURES_DIR}/disease_crosscheck_heatmap.svg", bbox_inches="tight")
    plt.close(fig)

