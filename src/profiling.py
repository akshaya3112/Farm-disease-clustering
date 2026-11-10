"""
Cluster Profiling, Interpretation, and Feature Contribution Module
Author: Antigravity Team
"""

import numpy as np
import pandas as pd
from scipy.stats import f_oneway


def profile_clusters(df_raw, X, cluster_labels, feature_names, disease_series=None):
    """
    Generate comprehensive cluster profiles, cautious naming, trait metrics,
    and descriptive cross-check with diagnostic outcomes.
    """
    X_df = pd.DataFrame(X, columns=feature_names) if not isinstance(X, pd.DataFrame) else X
    n_samples = len(X_df)
    unique_clusters = sorted(list(set(cluster_labels)))
    k = len(unique_clusters)
    
    # Global baselines
    global_symptom_cols = [c for c in feature_names if c.startswith("symptom_")]
    global_animal_cols = [c for c in feature_names if c.startswith("animal_")]
    
    profiles = {}
    
    # Temporary working DataFrame with raw and cluster info
    work_df = df_raw.copy()
    work_df["cluster"] = cluster_labels
    
    for c in unique_clusters:
        c_mask = (cluster_labels == c)
        c_count = int(np.sum(c_mask))
        c_pct = float(round((c_count / n_samples) * 100, 2))
        
        c_raw = work_df[c_mask]
        c_features = X_df[c_mask]
        
        # Numeric traits (raw unscaled)
        age_mean = float(round(c_raw["Age"].mean(), 2))
        age_median = float(round(c_raw["Age"].median(), 2))
        temp_mean = float(round(c_raw["Temperature"].mean(), 2))
        temp_median = float(round(c_raw["Temperature"].median(), 2))
        
        # Animal breakdown
        animal_dist = (c_raw["Animal"].value_counts(normalize=True) * 100).round(1).to_dict()
        
        # Symptom prevalences (% presenting)
        symp_prev = {}
        for sc in global_symptom_cols:
            prev = float(round(c_features[sc].mean() * 100, 1))
            symp_name = sc.replace("symptom_", "").replace("_", " ")
            symp_prev[symp_name] = prev
            
        top_symptoms = sorted(symp_prev.items(), key=lambda x: x[1], reverse=True)[:6]
        
        # Standardized Centroids (Z-score deviation from global mean)
        centroids_dict = {
            col: float(round(c_features[col].mean(), 4))
            for col in feature_names
        }
        
        # Assign cautious, descriptive epidemiological phenotype names
        # Based on objective dominant signals:
        if temp_mean >= 103.0:
            c_name = f"Profile {c+1}: Acute Febrile Systemic Complex"
            summary_desc = (
                f"Marked by severe hyperthermia (mean temp {temp_mean} deg F), "
                f"high prevalence of {top_symptoms[0][0]} ({top_symptoms[0][1]}%) and "
                f"{top_symptoms[1][0]} ({top_symptoms[1][1]}%)."
            )
        elif age_mean >= 9.0:
            dominant_animals = [a for a, p in animal_dist.items() if p > 30]
            dom_str = "/".join(dominant_animals) if dominant_animals else "livestock"
            c_name = f"Profile {c+1}: Geriatric Bovine Clinical Syndrome"
            summary_desc = (
                f"Characterized by mature/geriatric age (mean {age_mean} yrs, heavily {dom_str}) "
                f"with dominant signs of {top_symptoms[0][0]} ({top_symptoms[0][1]}%) and "
                f"{top_symptoms[1][0]} ({top_symptoms[1][1]}%)."
            )
        elif any("sweat" in s[0] or "fatigue" in s[0] or "breath" in s[0] for s in top_symptoms[:3]):
            c_name = f"Profile {c+1}: Respiratory-Diaphoretic Sign Group"
            summary_desc = (
                f"Dominant presentation of systemic sweating, fatigue, and dyspnea "
                f"(top signs: {top_symptoms[0][0]} {top_symptoms[0][1]}%, {top_symptoms[1][0]} {top_symptoms[1][1]}%) "
                f"with moderate temperature ({temp_mean} deg F)."
            )
        else:
            c_name = f"Profile {c+1}: Young Sub-Febrile Locomotor & Mucosal Pattern"
            summary_desc = (
                f"Presents in younger stock (mean age {age_mean} yrs) with lower-normative temperature ({temp_mean} deg F) "
                f"and focal complaints of {top_symptoms[0][0]} ({top_symptoms[0][1]}%)."
            )
            
        profiles[str(c)] = {
            "cluster_id": int(c),
            "display_name": c_name,
            "sample_count": c_count,
            "percentage": c_pct,
            "summary": summary_desc,
            "age_stats": {"mean": age_mean, "median": age_median},
            "temp_stats": {"mean": temp_mean, "median": temp_median},
            "species_distribution": animal_dist,
            "top_symptoms": [{"symptom": s[0], "prevalence_pct": s[1]} for s in top_symptoms],
            "all_symptom_prevalence": symp_prev,
            "standardized_centroids": centroids_dict,
        }
        
    # Key Feature Contributions via ANOVA F-statistic
    anova_records = []
    for col in feature_names:
        groups = [X_df[cluster_labels == c][col].values for c in unique_clusters]
        f_val, p_val = f_oneway(*groups)
        anova_records.append({
            "feature": col,
            "clean_name": col.replace("symptom_", "").replace("animal_", "Species: ").replace("_std", " (scaled)").replace("_", " "),
            "f_statistic": float(round(f_val, 2)) if not np.isnan(f_val) else 0.0,
            "p_value": float(p_val) if not np.isnan(p_val) else 1.0,
        })
    anova_df = pd.DataFrame(anova_records).sort_values(by="f_statistic", ascending=False)
    
    # Optional Descriptive Disease Cross-Check (STRICTLY NON-SUPERVISED DESCRIPTIVE LOG)
    crosscheck_data = None
    if disease_series is not None:
        ct = pd.crosstab(cluster_labels, disease_series)
        ct_pct = (pd.crosstab(cluster_labels, disease_series, normalize="index") * 100).round(2)
        
        diseases = list(ct.columns)
        contingency_matrix = {}
        for c in unique_clusters:
            contingency_matrix[str(c)] = {
                d: {
                    "count": int(ct.loc[c, d]) if c in ct.index and d in ct.columns else 0,
                    "row_pct": float(ct_pct.loc[c, d]) if c in ct_pct.index and d in ct_pct.columns else 0.0
                }
                for d in diseases
            }
            
        crosscheck_data = {
            "disclaimer": (
                "IMPORTANT METHODOLOGICAL NOTICE: The Disease labels were NEVER used during feature engineering, "
                "distance calculation, or cluster generation. This cross-check is strictly a post-hoc descriptive "
                "investigation to observe how unsupervised clinical phenotype profiles align with veterinary diagnoses. "
                "It is NOT a measure of diagnostic classification accuracy, as clustering is an exploratory pattern discovery technique."
            ),
            "diseases": diseases,
            "contingency_matrix": contingency_matrix
        }
        
    return {
        "profiles": profiles,
        "anova_ranking": anova_df.to_dict(orient="records"),
        "disease_crosscheck": crosscheck_data
    }

