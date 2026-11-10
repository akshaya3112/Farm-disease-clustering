"""
Flask Web Application for Farm Disease-Risk Profile Discovery
Author: Antigravity Team
"""

import os
import json
import sys
import math
from flask import Flask, render_template, jsonify, request, send_from_directory, abort

app = Flask(__name__)
app.jinja_env.globals.update(zip=zip, enumerate=enumerate, min=min, max=max)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
FIGURES_DIR = os.path.join(OUTPUTS_DIR, "figures")
DATA_DIR = os.path.join(BASE_DIR, "data")


def load_json_file(filename):
    """Safely load JSON artifact from outputs directory."""
    filepath = os.path.join(OUTPUTS_DIR, filename)
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        app.logger.error(f"Error loading {filename}: {e}")
        return None


# -------------------------------------------------------------
# Web Page Routes
# -------------------------------------------------------------

@app.route("/")
def home():
    """Home page: title, summary, headline findings, objective checklist, chosen config."""
    metrics = load_json_file("metrics.json")
    profiles = load_json_file("cluster_profiles.json")
    prep_log = load_json_file("preprocessing_log.json")
    stability = load_json_file("stability.json")
    
    missing = (metrics is None or profiles is None or prep_log is None or stability is None)
    
    return render_template(
        "home.html",
        active_page="home",
        missing=missing,
        metrics=metrics,
        profiles=profiles,
        prep_log=prep_log,
        stability=stability
    )


@app.route("/preprocessing")
def preprocessing():
    """Objective 1: Dataset overview, variable relevance, missing values, outliers, scaling, decision log."""
    prep_log = load_json_file("preprocessing_log.json")
    missing = (prep_log is None)
    return render_template(
        "preprocessing.html",
        active_page="preprocessing",
        missing=missing,
        prep_log=prep_log
    )


@app.route("/clustering")
def clustering():
    """Objective 2: Interactive elbow, silhouette, DBI, comparison table, PCA scatter, chosen config."""
    metrics = load_json_file("metrics.json")
    pca_data = load_json_file("pca.json")
    missing = (metrics is None or pca_data is None)
    return render_template(
        "clustering.html",
        active_page="clustering",
        missing=missing,
        metrics=metrics,
        pca_data=pca_data
    )


@app.route("/profiles")
def profiles():
    """Objective 3: Cluster cards, centroid heatmap, radar/bar charts, ANOVA features, comparison tool."""
    profiles_data = load_json_file("cluster_profiles.json")
    missing = (profiles_data is None)
    return render_template(
        "profiles.html",
        active_page="profiles",
        missing=missing,
        profiles_data=profiles_data
    )


@app.route("/stability")
def stability():
    """Objective 3: Stability analysis, ARI matrices, limitations, bias, and responsible use."""
    stability_data = load_json_file("stability.json")
    metrics_data = load_json_file("metrics.json")
    missing = (stability_data is None)
    return render_template(
        "stability.html",
        active_page="stability",
        missing=missing,
        stability_data=stability_data,
        metrics_data=metrics_data
    )


@app.route("/about")
def about():
    """About & Reproducibility: outcome mapping, pipeline execution steps, library versions, downloads."""
    versions = {
        "Python": sys.version.split()[0],
        "Flask": getattr(Flask, "__version__", "3.x"),
        "scikit-learn": "1.4.0+",
        "pandas": "2.1.0+",
        "numpy": "1.26.0+",
        "matplotlib": "3.8.0+",
        "seaborn": "0.13.0+",
        "scipy": "1.11.0+",
        "plotly": "5.18.0+",
    }
    for pkg_name, mod_name in [
        ("scikit-learn", "sklearn"),
        ("pandas", "pandas"),
        ("numpy", "numpy"),
        ("matplotlib", "matplotlib"),
        ("seaborn", "seaborn"),
        ("scipy", "scipy"),
        ("plotly", "plotly"),
    ]:
        try:
            mod = __import__(mod_name)
            versions[pkg_name] = getattr(mod, "__version__", "Installed")
        except ImportError:
            pass
    figures_list = []
    if os.path.exists(FIGURES_DIR):
        figures_list = [f for f in os.listdir(FIGURES_DIR) if f.endswith((".png", ".svg"))]
        
    return render_template(
        "about.html",
        active_page="about",
        versions=versions,
        figures_list=sorted(figures_list)
    )


# -------------------------------------------------------------
# REST JSON API Endpoints (called by frontend fetch() for Plotly charts)
# -------------------------------------------------------------

@app.route("/api/metrics")
def api_metrics():
    data = load_json_file("metrics.json")
    if data is None:
        return jsonify({"error": "metrics.json not found. Run pipeline first."}), 404
    return jsonify(data)


@app.route("/api/profiles")
def api_profiles():
    data = load_json_file("cluster_profiles.json")
    if data is None:
        return jsonify({"error": "cluster_profiles.json not found. Run pipeline first."}), 404
    return jsonify(data)


@app.route("/api/stability")
def api_stability():
    data = load_json_file("stability.json")
    if data is None:
        return jsonify({"error": "stability.json not found. Run pipeline first."}), 404
    return jsonify(data)


@app.route("/api/pca")
def api_pca():
    data = load_json_file("pca.json")
    if data is None:
        return jsonify({"error": "pca.json not found. Run pipeline first."}), 404
    return jsonify(data)


@app.route("/api/preprocessing")
def api_preprocessing():
    data = load_json_file("preprocessing_log.json")
    if data is None:
        return jsonify({"error": "preprocessing_log.json not found. Run pipeline first."}), 404
    return jsonify(data)


@app.route("/api/predict", methods=["POST"])
def api_predict():
    """Predict disease-risk cluster profile and associated historical disease correlations for an input animal."""
    req = request.get_json() or {}
    animal = req.get("animal", "cow").lower().strip()
    try:
        age = float(req.get("age", 5.0))
    except (ValueError, TypeError):
        age = 5.0
    try:
        temperature = float(req.get("temperature", 102.2))
    except (ValueError, TypeError):
        temperature = 102.2

    raw_symptoms = req.get("symptoms", [])
    if isinstance(raw_symptoms, str):
        raw_symptoms = [s.strip() for s in raw_symptoms.split(",") if s.strip()]
    symptoms_set = {s.lower().strip() for s in raw_symptoms}

    prep_log = load_json_file("preprocessing_log.json")
    profiles_data = load_json_file("cluster_profiles.json")

    if not prep_log or not profiles_data:
        return jsonify({"error": "Pipeline outputs not found. Run pipeline first."}), 500

    scaling = prep_log["scaling_stats"]
    profiles = profiles_data["profiles"]
    crosscheck = profiles_data.get("disease_crosscheck", {})
    contingency = crosscheck.get("contingency_matrix", {})
    all_symptoms = prep_log["raw_audit"]["all_symptoms"]

    feature_names = list(profiles["0"]["standardized_centroids"].keys())

    # 1. Feature standardization
    vec = {}
    vec["age_std"] = (age - scaling["Age"]["raw_mean"]) / scaling["Age"]["raw_std"]
    vec["temp_std"] = (temperature - scaling["Temperature"]["raw_mean"]) / scaling["Temperature"]["raw_std"]

    for sp in ["buffalo", "cow", "goat", "sheep"]:
        vec[f"animal_{sp}"] = 1.0 if animal == sp else 0.0

    for s in all_symptoms:
        col = f"symptom_{s.replace(' ', '_')}"
        vec[col] = 1.0 if s.lower() in symptoms_set else 0.0

    # 2. Distance to centroids
    dists = {}
    for cid, p in profiles.items():
        c_centroids = p["standardized_centroids"]
        dist_val = math.sqrt(sum((vec[f] - c_centroids.get(f, 0.0)) ** 2 for f in feature_names))
        dists[cid] = dist_val

    best_cid = min(dists, key=dists.get)
    matched_profile = profiles[best_cid]
    best_dist = round(dists[best_cid], 3)

    # 3. Disease distribution from historical crosscheck
    cluster_diseases = contingency.get(best_cid, {})
    disease_list = []
    for d_name, d_info in cluster_diseases.items():
        disease_list.append({
            "disease": d_name.title(),
            "percentage": d_info.get("row_pct", 0.0),
            "count": d_info.get("count", 0)
        })
    disease_list.sort(key=lambda x: x["percentage"], reverse=True)

    # 4. Clinical Triage Urgency level
    if temperature >= 103.5 or "sweats" in symptoms_set or "shortness of breath" in symptoms_set or (disease_list and disease_list[0]["disease"].lower() == "anthrax"):
        urgency = {
            "level": "CRITICAL / HIGH URGENCY",
            "badge_class": "badge-danger",
            "color": "#dc2626",
            "icon": "🚨",
            "action": "Immediate quarantine of this animal. High fever or severe systemic distress detected. Notify herd veterinarian and conduct urgent diagnostic testing."
        }
    elif temperature >= 102.5 or any("blister" in s or "sores" in s for s in symptoms_set) or any("swelling" in s for s in symptoms_set):
        urgency = {
            "level": "ELEVATED RISK / PRIORITY MONITORING",
            "badge_class": "badge-warning",
            "color": "#d97706",
            "icon": "⚠️",
            "action": "Isolate in observation stall. Examine hooves, mouth, and mucosa for lesions. Monitor vitals twice daily."
        }
    else:
        urgency = {
            "level": "ROUTINE HERD OBSERVATION",
            "badge_class": "badge-success",
            "color": "#059669",
            "icon": "🟢",
            "action": "Supportive nutritional and hydration care. Monitor feed intake and rumination patterns."
        }

    return jsonify({
        "cluster_id": int(best_cid) + 1,
        "cluster_internal_id": best_cid,
        "cluster_name": matched_profile["display_name"],
        "cluster_summary": matched_profile["summary"],
        "distance": best_dist,
        "all_distances": {f"Cluster {int(c)+1}": round(d, 3) for c, d in dists.items()},
        "urgency": urgency,
        "disease_likelihoods": disease_list,
        "animal": animal.title(),
        "age": age,
        "temperature": temperature,
        "symptoms_provided": list(symptoms_set),
        "input_normalized": {
            "age_zscore": round(vec["age_std"], 3),
            "temp_zscore": round(vec["temp_std"], 3)
        }
    })


# -------------------------------------------------------------
# Static File & Export Downloads
# -------------------------------------------------------------

@app.route("/outputs/figures/<path:filename>")
def serve_figure(filename):
    """Serve static generated figures."""
    return send_from_directory(FIGURES_DIR, filename)


@app.route("/download/<path:filename>")
def download_artifact(filename):
    """Allow downloading JSON artifacts or figures."""
    # Check outputs root
    target_path = os.path.join(OUTPUTS_DIR, filename)
    if os.path.isfile(target_path):
        return send_from_directory(OUTPUTS_DIR, filename, as_attachment=True)
    # Check figures
    target_path_fig = os.path.join(FIGURES_DIR, filename)
    if os.path.isfile(target_path_fig):
        return send_from_directory(FIGURES_DIR, filename, as_attachment=True)
    abort(404)


if __name__ == "__main__":
    # Standard development server for localhost
    port = int(os.environ.get("PORT", 5000))
    print(f"Launching Farm Disease Clustering App on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=True)
