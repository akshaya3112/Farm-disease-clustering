"""
Flask Web Application for Farm Disease-Risk Profile Discovery
Author: Antigravity Team
"""

import os
import json
import sys
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
    import sklearn, pandas, numpy, matplotlib, seaborn, scipy, plotly
    versions = {
        "Python": sys.version.split()[0],
        "Flask": Flask.__version__ if hasattr(Flask, "__version__") else "3.x",
        "scikit-learn": sklearn.__version__,
        "pandas": pandas.__version__,
        "numpy": numpy.__version__,
        "matplotlib": matplotlib.__version__,
        "seaborn": seaborn.__version__,
        "scipy": scipy.__version__,
        "plotly": plotly.__version__,
    }
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
