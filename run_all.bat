@echo off
echo =====================================================================
echo Farm Disease-Risk Profile Discovery: Pipeline ^& Web Application Runner
echo =====================================================================

echo.
echo [Step 1/2] Executing Phase A Data Science Pipeline...
python run_pipeline.py
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pipeline execution failed! Exiting.
    exit /b %ERRORLEVEL%
)

echo.
echo [Step 2/2] Launching Phase B Flask Web Dashboard...
echo Open your browser at http://127.0.0.1:5000
python app.py

