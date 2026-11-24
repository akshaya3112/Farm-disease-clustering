# Run from the repo root: python kmedians_convergence_check.py
# Replicates the paper K-Medians fits (n_init=5, max_iter=35, tol=1e-4, seed 42), logs iterations per restart
# and compares Davies-Bouldin under Euclidean vs native L1 centroid distances.
import numpy as np
import pandas as pd
import json
import os
from sklearn.metrics import davies_bouldin_score

X = pd.read_csv('data/processed_features.csv').values.astype(np.float64)
n, p = X.shape
print("Data shape:", X.shape)
print('var age, temp:', X[:, 0].var(), X[:, 1].var(), 'binary var max:', X[:, 2:].var(axis=0).max())
print('z range:', X[:, 0].min(), X[:, 0].max(), X[:, 1].min(), X[:, 1].max())

def fit(X, k, max_iter=35, tol=1e-4, n_init=5, seed=42):
    rng = np.random.RandomState(seed)
    best = (np.inf, None, None)
    log = []
    for r in range(n_init):
        rs = int(rng.randint(0, 1000000))
        sub = np.random.RandomState(rs)
        centers = X[sub.choice(n, size=k, replace=False)].copy()
        converged = False
        for it in range(max_iter):
            d = np.zeros((n, k), dtype=np.float32)
            for s in range(0, n, 5000):
                e = min(s + 5000, n)
                d[s:e] = np.abs(X[s:e, None, :] - centers[None]).sum(2)
            lab = d.argmin(1)
            nc = np.zeros_like(centers)
            for c in range(k):
                m = lab == c
                nc[c] = np.median(X[m], axis=0) if m.any() else X[sub.randint(0, n)]
            shift = np.abs(nc - centers).sum()
            centers = nc
            if shift < tol:
                converged = True
                break
        cost = sum(np.abs(X[lab == c] - centers[c]).sum() for c in range(k) if (lab == c).any())
        log.append((it + 1, converged, cost))
        if cost < best[0]:
            best = (cost, centers.copy(), lab.copy(), len(log) - 1)
    return best, log

def l1_dbi(X, lab, centers):
    k = len(centers)
    s = np.array([np.abs(X[lab == i] - centers[i]).sum(1).mean() for i in range(k)])
    M = np.abs(centers[:, None] - centers[None]).sum(2)
    R = [max((s[i] + s[j]) / M[i, j] for j in range(k) if j != i) for i in range(k)]
    return np.mean(R)

res = {}
for k in range(2, 11):
    best, log = fit(X, k)
    cost, cen, lab, bi = best
    its = [l[0] for l in log]
    conv = [l[1] for l in log]
    eu = davies_bouldin_score(X, lab)
    l1 = l1_dbi(X, lab, cen)
    res[k] = dict(iters=its, conv=conv, best_iters=its[bi], best_conv=conv[bi], dbi_eu=eu, dbi_l1=l1)
    print(k, its, conv, 'best', its[bi], conv[bi], 'DBI eu %.4f l1 %.4f' % (eu, l1), flush=True)

out_dir = 'outputs'
os.makedirs(out_dir, exist_ok=True)
json.dump(res, open(os.path.join(out_dir, 'kmedians_convergence.json'), 'w'), default=float, indent=2)

allit = [i for k in res for i in res[k]['iters']]
allc = [c for k in res for c in res[k]['conv']]
print('total runs', len(allit), 'converged', sum(allc), 'mean iters', np.mean(allit), 'median', np.median(allit))
print('k=4 runs', res[4]['iters'], res[4]['conv'])
