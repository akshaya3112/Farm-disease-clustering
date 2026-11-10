"""
Automated Route & API Verification Test Suite
"""

import unittest
from app import app


class TestAppRoutes(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_pages(self):
        pages = [
            ("/", 200, "Farm Disease-Risk Profile Discovery"),
            ("/preprocessing", 200, "Data Preparation &amp; Preprocessing"),
            ("/clustering", 200, "Clustering Workflow &amp; Distance Comparison"),
            ("/profiles", 200, "Objective 3: Cluster Profiles"),
            ("/stability", 200, "Stability, Limitations & Responsible Use"),
            ("/about", 200, "About &amp; Reproducibility Guide"),
        ]
        for url, expected_status, text_snippet in pages:
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertEqual(res.status_code, expected_status, f"Route {url} failed with {res.status_code}")
                content = res.data.decode("utf-8")
                self.assertIn(text_snippet, content, f"Missing snippet '{text_snippet}' in {url}")
                print(f"[PASS] Page {url} -> 200 OK")

    def test_api_endpoints(self):
        apis = [
            "/api/metrics",
            "/api/profiles",
            "/api/stability",
            "/api/pca",
            "/api/preprocessing",
        ]
        for url in apis:
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertEqual(res.status_code, 200, f"API {url} failed with {res.status_code}")
                self.assertTrue(res.is_json, f"API {url} did not return JSON")
                data = res.get_json()
                self.assertIsInstance(data, dict, f"API {url} JSON is not a dict")
                print(f"[PASS] API {url} -> 200 OK (JSON verified)")

    def test_predict_endpoint(self):
        payload = {
            "animal": "cow",
            "age": 4.5,
            "temperature": 104.2,
            "symptoms": ["loss of appetite", "depression", "painless lumps"]
        }
        res = self.client.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200, f"/api/predict failed with {res.status_code}")
        data = res.get_json()
        self.assertIn("cluster_name", data)
        self.assertIn("urgency", data)
        self.assertIn("disease_likelihoods", data)
        print("[PASS] API /api/predict -> 200 OK (Prediction and disease likelihood verified)")

    def test_figure_and_download_routes(self):
        res = self.client.get("/outputs/figures/centroid_heatmap.png")
        self.assertEqual(res.status_code, 200, "Figure serving failed")
        print("[PASS] Static figure serving -> 200 OK")

        res_dl = self.client.get("/download/metrics.json")
        self.assertEqual(res_dl.status_code, 200, "Download metrics.json failed")
        print("[PASS] Download artifact route -> 200 OK")


if __name__ == "__main__":
    unittest.main()

