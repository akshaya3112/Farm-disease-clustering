"""
Clustering Workflow Module: Euclidean K-Means & Manhattan K-Medians
Author: Antigravity Team
"""

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans


class KMedians:
    """
    K-Medians Clustering with Manhattan (L1) Distance Metric.
    
    Mathematical Foundation:
    -----------------------
    In standard K-Means, the cluster centroid is the mean of assigned points,
    which minimizes the sum of squared Euclidean (L2) errors.
    Under the Manhattan (L1) metric:
        Cost(C) = sum_{i in C} sum_{j=1}^D |x_{i,j} - m_{c,j}|
    The spatial center that minimizes this L1 cost along each independent dimension j
    is the univariate median:
        m_{c,j} = Median({x_{i,j} : point i in cluster c})
    
    This class implements an exact, vectorized coordinate-wise K-Medians algorithm
    with multiple random restarts (n_init) and fixed seeds for reproducibility.
    """
    def __init__(self, n_clusters=4, max_iter=100, tol=1e-4, n_init=10, random_state=42):
        self.n_clusters = n_clusters
        self.max_iter = max_iter
        self.tol = tol
        self.n_init = n_init
        self.random_state = random_state
        self.cluster_centers_ = None
        self.labels_ = None
        self.cost_ = None  # Total within-cluster Manhattan (L1) distance

    def fit(self, X):
        X_arr = np.asarray(X, dtype=np.float64)
        n_samples, n_features = X_arr.shape
        rng = np.random.RandomState(self.random_state)
        
        best_cost = np.inf
        best_centers = None
        best_labels = None
        
        for init_idx in range(self.n_init):
            # Seed per restart derived deterministically from base seed
            restart_seed = int(rng.randint(0, 1000000))
            sub_rng = np.random.RandomState(restart_seed)
            
            # Smart initialization: pick random data points
            init_indices = sub_rng.choice(n_samples, size=self.n_clusters, replace=False)
            centers = X_arr[init_indices].copy()
            labels = np.zeros(n_samples, dtype=int)
            
            for it in range(self.max_iter):
                # Assignment step using Manhattan (L1) distance
                # Chunked computation to prevent RAM spikes on 43k records
                chunk_size = 5000
                dists = np.zeros((n_samples, self.n_clusters), dtype=np.float32)
                for start in range(0, n_samples, chunk_size):
                    end = min(start + chunk_size, n_samples)
                    chunk_diff = np.abs(X_arr[start:end, np.newaxis, :] - centers[np.newaxis, :, :])
                    dists[start:end, :] = np.sum(chunk_diff, axis=2)
                
                new_labels = np.argmin(dists, axis=1)
                
                # Update step: Coordinate-wise median for each cluster
                new_centers = np.zeros_like(centers)
                for c in range(self.n_clusters):
                    mask = (new_labels == c)
                    if np.any(mask):
                        new_centers[c] = np.median(X_arr[mask], axis=0)
                    else:
                        # Handle empty cluster by re-seeding with random sample
                        rand_pick = sub_rng.randint(0, n_samples)
                        new_centers[c] = X_arr[rand_pick]
                        
                shift = np.sum(np.abs(new_centers - centers))
                centers = new_centers
                labels = new_labels
                if shift < self.tol:
                    break
                    
            # Compute total L1 cost across all points
            current_cost = 0.0
            for c in range(self.n_clusters):
                mask = (labels == c)
                if np.any(mask):
                    current_cost += np.sum(np.abs(X_arr[mask] - centers[c]))
                    
            if current_cost < best_cost:
                best_cost = current_cost
                best_centers = centers.copy()
                best_labels = labels.copy()
                
        self.cluster_centers_ = best_centers
        self.labels_ = best_labels
        self.cost_ = float(best_cost)
        return self


def run_kmeans_grid(X, k_range=range(2, 11), random_state=42, n_init=10):
    """
    Execute standard K-Means clustering across a range of k values using Euclidean distance.
    Returns dictionary mapping k -> fitted KMeans instance.
    """
    models = {}
    X_arr = np.asarray(X)
    for k in k_range:
        km = KMeans(
            n_clusters=k,
            init="k-means++",
            n_init=n_init,
            max_iter=300,
            random_state=random_state
        ).fit(X_arr)
        models[k] = km
    return models


def run_kmedians_grid(X, k_range=range(2, 11), random_state=42, n_init=5, max_iter=40):
    """
    Execute K-Medians clustering across a range of k values using Manhattan distance.
    Returns dictionary mapping k -> fitted KMedians instance.
    """
    models = {}
    X_arr = np.asarray(X)
    for k in k_range:
        kmed = KMedians(
            n_clusters=k,
            max_iter=max_iter,
            tol=1e-4,
            n_init=n_init,
            random_state=random_state
        ).fit(X_arr)
        models[k] = kmed
    return models

