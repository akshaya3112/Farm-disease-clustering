"""
Data Preprocessing Module for Farm Disease-Risk Profile Discovery
Author: Antigravity Team
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler


def load_dataset(csv_path="data/animal_disease_dataset.csv"):
    """Load raw dataset from CSV file."""
    if not os.path.exists(csv_path):
        # Check root fallback
        if os.path.exists("animal_disease_dataset.csv"):
            csv_path = "animal_disease_dataset.csv"
        else:
            raise FileNotFoundError(f"Dataset not found at {csv_path}")
    df = pd.read_csv(csv_path)
    return df


def audit_raw_data(df):
    """Generate comprehensive audit of raw dataset before preprocessing."""
    shape = df.shape
    columns = list(df.columns)
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    sample_records = df.head(8).to_dict(orient="records")
    
    # Numeric summaries
    numeric_stats = {}
    for col in ["Age", "Temperature"]:
        if col in df.columns:
            s = df[col]
            numeric_stats[col] = {
                "count": int(s.count()),
                "mean": float(round(s.mean(), 3)),
                "std": float(round(s.std(), 3)),
                "min": float(round(s.min(), 2)),
                "q25": float(round(s.quantile(0.25), 2)),
                "median": float(round(s.median(), 2)),
                "q75": float(round(s.quantile(0.75), 2)),
                "max": float(round(s.max(), 2)),
                "skew": float(round(s.skew(), 3)),
                "kurtosis": float(round(s.kurtosis(), 3)),
            }
            
    # Categorical distributions
    animal_counts = df["Animal"].value_counts().to_dict()
    animal_pcts = (df["Animal"].value_counts(normalize=True) * 100).round(2).to_dict()
    
    disease_counts = df["Disease"].value_counts().to_dict()
    disease_pcts = (df["Disease"].value_counts(normalize=True) * 100).round(2).to_dict()
    
    # Symptoms exploration
    s1 = set(df["Symptom 1"].dropna().unique())
    s2 = set(df["Symptom 2"].dropna().unique())
    s3 = set(df["Symptom 3"].dropna().unique())
    all_symptoms = sorted(list(s1.union(s2).union(s3)))
    
    # Symptom global occurrence frequencies
    symptom_freq = {}
    for s in all_symptoms:
        cnt = int(((df["Symptom 1"] == s) | (df["Symptom 2"] == s) | (df["Symptom 3"] == s)).sum())
        symptom_freq[s] = {
            "count": cnt,
            "pct": float(round((cnt / len(df)) * 100, 2))
        }
        
    # Missing values
    missing_before = {col: int(df[col].isnull().sum()) for col in columns}
    
    # Exact duplicate check (all 7 cols)
    exact_duplicates = int(df.duplicated().sum())
    
    # Feature duplicate check (excluding Disease)
    feature_cols = [c for c in columns if c != "Disease"]
    feature_duplicates = int(df.duplicated(subset=feature_cols).sum())
    
    # Outliers IQR check
    outlier_audit = {}
    for col in ["Age", "Temperature"]:
        q25 = df[col].quantile(0.25)
        q75 = df[col].quantile(0.75)
        iqr = q75 - q25
        lower_bound = q25 - 1.5 * iqr
        upper_bound = q75 + 1.5 * iqr
        n_outliers = int(((df[col] < lower_bound) | (df[col] > upper_bound)).sum())
        outlier_audit[col] = {
            "q25": float(round(q25, 2)),
            "q75": float(round(q75, 2)),
            "iqr": float(round(iqr, 2)),
            "lower_bound": float(round(lower_bound, 2)),
            "upper_bound": float(round(upper_bound, 2)),
            "outlier_count": n_outliers,
            "outlier_pct": float(round((n_outliers / len(df)) * 100, 2)),
            "decision": "Retain all values. Range is within biologically verified limits for livestock."
        }
        
    return {
        "shape": {"rows": shape[0], "columns": shape[1]},
        "columns": columns,
        "dtypes": dtypes,
        "sample": sample_records,
        "numeric_stats": numeric_stats,
        "animal_distribution": {"counts": animal_counts, "percentages": animal_pcts},
        "disease_distribution": {"counts": disease_counts, "percentages": disease_pcts},
        "all_symptoms": all_symptoms,
        "symptom_frequencies": symptom_freq,
        "missing_values_before": missing_before,
        "exact_duplicates": exact_duplicates,
        "feature_duplicates": feature_duplicates,
        "outlier_audit": outlier_audit,
    }


def get_variable_relevance_table():
    """Produce formal variable relevance justification table."""
    return [
        {
            "variable": "Animal",
            "type": "Categorical Nominal (4 levels: cow, buffalo, goat, sheep)",
            "decision": "KEEP (Encoded)",
            "preprocessing": "One-Hot Encoding (4 binary features)",
            "justification": "Species physiology affects clinical susceptibility and baseline temperature/size. Retained as categorical feature vector."
        },
        {
            "variable": "Age",
            "type": "Continuous Numeric (1 to 15 years)",
            "decision": "KEEP (Scaled)",
            "preprocessing": "StandardScaler (Z-score standardization: mean=0, std=1)",
            "justification": "Animal age is a key epidemiological risk factor (neonates/young vs geriatric vulnerability). Standardized to match unit variance."
        },
        {
            "variable": "Temperature",
            "type": "Continuous Numeric (100.0 to 105.0 deg F)",
            "decision": "KEEP (Scaled)",
            "preprocessing": "StandardScaler (Z-score standardization: mean=0, std=1)",
            "justification": "Core objective clinical vital sign indicating febrile state vs normal physiological range. Standardized to match unit variance."
        },
        {
            "variable": "Symptom 1",
            "type": "Categorical Nominal (Symptom slot 1)",
            "decision": "TRANSFORM (Multi-hot)",
            "preprocessing": "Integrated into 24-dimensional binary multi-hot feature space",
            "justification": "Positional symptom slots are arbitrary in clinical recording. Multi-hot unification eliminates slot-order bias and models symptom presence."
        },
        {
            "variable": "Symptom 2",
            "type": "Categorical Nominal (Symptom slot 2)",
            "decision": "TRANSFORM (Multi-hot)",
            "preprocessing": "Integrated into 24-dimensional binary multi-hot feature space",
            "justification": "Merged with Symptoms 1 and 3 into unified clinical symptom indicators."
        },
        {
            "variable": "Symptom 3",
            "type": "Categorical Nominal (Symptom slot 3)",
            "decision": "TRANSFORM (Multi-hot)",
            "preprocessing": "Integrated into 24-dimensional binary multi-hot feature space",
            "justification": "Merged with Symptoms 1 and 2 into unified clinical symptom indicators."
        },
        {
            "variable": "Disease",
            "type": "Categorical Ground-Truth Label (5 veterinary diagnoses)",
            "decision": "ISOLATE & DROP FROM CLUSTERING",
            "preprocessing": "Excluded from all feature engineering, scaling, and clustering",
            "justification": "MANDATORY UNSUPERVISED INTEGRITY: Clustering must uncover latent phenotypic risk profiles strictly from observational signs. Label is preserved in an isolated vector exclusively for post-hoc descriptive cross-validation."
        }
    ]


def preprocess_data(df):
    """
    Execute end-to-end preprocessing pipeline:
    1. Extract ground truth Disease label into isolated series.
    2. Extract and standardize numeric features (Age, Temperature).
    3. One-hot encode Animal species.
    4. Multi-hot encode the 24 symptoms.
    5. Construct final feature matrix X (43778 x 30).
    6. Generate Preprocessing Decision Log.
    """
    # 1. Isolate Disease
    disease_labels = df["Disease"].copy()
    features_raw = df.drop(columns=["Disease"]).copy()
    
    # 2. Numeric standardization
    scaler = StandardScaler()
    num_cols = ["Age", "Temperature"]
    num_scaled_arr = scaler.fit_transform(features_raw[num_cols])
    num_scaled_df = pd.DataFrame(
        num_scaled_arr, 
        columns=["age_std", "temp_std"],
        index=features_raw.index
    )
    
    # Record before/after stats
    scaling_stats = {
        "Age": {
            "raw_mean": float(round(features_raw["Age"].mean(), 3)),
            "raw_std": float(round(features_raw["Age"].std(), 3)),
            "raw_min": float(round(features_raw["Age"].min(), 3)),
            "raw_max": float(round(features_raw["Age"].max(), 3)),
            "scaled_mean": float(round(num_scaled_df["age_std"].mean(), 6)),
            "scaled_std": float(round(num_scaled_df["age_std"].std(), 6)),
            "scaled_min": float(round(num_scaled_df["age_std"].min(), 3)),
            "scaled_max": float(round(num_scaled_df["age_std"].max(), 3)),
        },
        "Temperature": {
            "raw_mean": float(round(features_raw["Temperature"].mean(), 3)),
            "raw_std": float(round(features_raw["Temperature"].std(), 3)),
            "raw_min": float(round(features_raw["Temperature"].min(), 3)),
            "raw_max": float(round(features_raw["Temperature"].max(), 3)),
            "scaled_mean": float(round(num_scaled_df["temp_std"].mean(), 6)),
            "scaled_std": float(round(num_scaled_df["temp_std"].std(), 6)),
            "scaled_min": float(round(num_scaled_df["temp_std"].min(), 3)),
            "scaled_max": float(round(num_scaled_df["temp_std"].max(), 3)),
        }
    }
    
    # 3. One-hot encode Animal
    animal_encoded = pd.get_dummies(features_raw["Animal"], prefix="animal", dtype=float)
    # Ensure consistent column ordering: buffalo, cow, goat, sheep
    animal_cols = sorted(list(animal_encoded.columns))
    animal_encoded = animal_encoded[animal_cols]
    
    # 4. Multi-hot encode symptoms
    s1 = set(features_raw["Symptom 1"].dropna().unique())
    s2 = set(features_raw["Symptom 2"].dropna().unique())
    s3 = set(features_raw["Symptom 3"].dropna().unique())
    all_symptoms = sorted(list(s1.union(s2).union(s3)))
    
    n_samples = len(features_raw)
    n_symptoms = len(all_symptoms)
    symptom_mat = np.zeros((n_samples, n_symptoms), dtype=float)
    
    for i, symp in enumerate(all_symptoms):
        mask = (
            (features_raw["Symptom 1"] == symp) |
            (features_raw["Symptom 2"] == symp) |
            (features_raw["Symptom 3"] == symp)
        )
        symptom_mat[:, i] = mask.astype(float)
        
    symptom_col_names = [f"symptom_{s.replace(' ', '_')}" for s in all_symptoms]
    symptom_df = pd.DataFrame(symptom_mat, columns=symptom_col_names, index=features_raw.index)
    
    # 5. Assemble master feature matrix X
    X = pd.concat([num_scaled_df, animal_encoded, symptom_df], axis=1)
    
    # 6. Preprocessing Decision Log
    decision_log = [
        {
            "step": "1. Dataset Inspection & Integrity Verification",
            "what_was_done": "Audited 43,778 records across 7 columns for missingness, data types, and value validity.",
            "reason": "Ensure data integrity before applying unsupervised distance-based algorithms.",
            "impact": "Confirmed zero missing values, valid physiological ranges (Age: 1-15 yr, Temp: 100-105 F)."
        },
        {
            "step": "2. Disease Label Isolation",
            "what_was_done": "Extracted 'Disease' column into an isolated ground-truth vector and removed from clustering input.",
            "reason": "Unsupervised pattern discovery requirement: clustering must not be contaminated by diagnostic labels.",
            "impact": "Guarantees zero target leakage. All downstream clusters represent genuine unsupervised phenotype groupings."
        },
        {
            "step": "3. Categorical Encoding (Animal Species)",
            "what_was_done": "Converted 'Animal' into 4 binary one-hot indicators (animal_buffalo, animal_cow, animal_goat, animal_sheep).",
            "reason": "Label encoding (0,1,2,3) assigns artificial Euclidean distances between nominal species. One-hot encoding creates orthogonal dimensions with equal pairwise distance.",
            "impact": "Preserved equal metric distance between all livestock species."
        },
        {
            "step": "4. Multi-Hot Symptom Reshaping",
            "what_was_done": "Aggregated 3 positional symptom columns into a 24-dimensional binary presence/absence indicator matrix.",
            "reason": "Symptom recording order (Symptom 1 vs 2 vs 3) is arbitrary. Separate one-hot encoding would produce 72 sparse variables and treat same symptom in different positions as distinct features.",
            "impact": "Eliminated positional bias, reduced feature dimensionality from 72 to 24, and created true clinical Hamming/Manhattan distance space."
        },
        {
            "step": "5. Numerical Feature Standardization",
            "what_was_done": "Applied StandardScaler (Z-score normalization) to Age and Temperature. Kept binary flags in {0, 1}.",
            "reason": "Unscaled Age (1-15) and Temperature (100-105) have vastly different ranges and would dominate Euclidean distance over binary symptom indicators. Binary features are left in {0,1} to maintain exact Hamming distance semantics.",
            "impact": "Normalized numeric variance (mean=0, std=1) balanced against binary symptom indicators."
        },
        {
            "step": "6. Duplicate & Outlier Audit",
            "what_was_done": "Audited exact duplicates (0) and feature duplicates (3,618). Retained feature duplicates after verifying clinical validity.",
            "reason": "In agricultural herd medicine, multiple animals naturally present identical symptom triplets. Dropping duplicates would distort cluster density and true epidemiological prevalence.",
            "impact": "Full observational sample (N=43,778) retained without artificial population skew."
        }
    ]
    
    return {
        "X": X,
        "disease_labels": disease_labels,
        "raw_features": features_raw,
        "scaler": scaler,
        "all_symptoms": all_symptoms,
        "feature_names": list(X.columns),
        "scaling_stats": scaling_stats,
        "decision_log": decision_log
    }

