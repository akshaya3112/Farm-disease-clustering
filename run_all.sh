#!/usr/bin/env bash
set -e

echo "====================================================================="
echo "Farm Disease-Risk Profile Discovery: Pipeline & Web Application Runner"
echo "====================================================================="

echo ""
echo "[Step 1/2] Executing Phase A Data Science Pipeline..."
python run_pipeline.py

echo ""
echo "[Step 2/2] Launching Phase B Flask Web Dashboard..."
echo "Open your browser at http://127.0.0.1:5000"
python app.py

