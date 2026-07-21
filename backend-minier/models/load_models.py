import json
import os

import joblib
import numpy as np
import pandas as pd

from utils.shap_explainer import SHAP_AVAILABLE, explain_prediction

FRAUD_THRESHOLD_DEFAULT = 0.30


class ModelLoader:
    """Load all saved AI models for the backend."""

    def __init__(self, model_dir=None):
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        default_paths = [
            os.path.join(project_root, "modele_ia_minier", "modeles"),
            os.path.join(os.path.expanduser("~"), "Desktop", "Gracy", "memoire", "modele_ia_minier", "modeles"),
        ]

        if model_dir is None:
            for path in default_paths:
                if os.path.exists(path):
                    self.model_dir = path
                    break
            else:
                self.model_dir = default_paths[0]
        else:
            self.model_dir = model_dir

        self.models = {}
        self.scaler = None
        self.feature_columns = None
        self.label_encoders = {}
        self.fraud_threshold_config = {}
        self.shap_available = SHAP_AVAILABLE

    def load_all(self):
        """Load all AI artifacts."""
        print("Loading AI models...")
        print(f"Model dir: {self.model_dir}")

        if not os.path.exists(self.model_dir):
            print(f"Model dir {self.model_dir} not found")
            os.makedirs(self.model_dir, exist_ok=True)
            print(f"Created model dir: {self.model_dir}")
            print("Please copy your .pkl models into this folder")
            return self

        feature_path = os.path.join(self.model_dir, "feature_columns.pkl")
        if os.path.exists(feature_path):
            self.feature_columns = joblib.load(feature_path)
            print(f"Features loaded: {len(self.feature_columns)} columns")
        else:
            print("feature_columns.pkl not found, using defaults")
            self.feature_columns = [
                "cu_grade_percent",
                "co_grade_percent",
                "fe_percent",
                "s_percent",
                "density_t_m3",
                "weight_tonnes",
            ]

        scaler_path = os.path.join(self.model_dir, "scaler.pkl")
        if os.path.exists(scaler_path):
            self.scaler = joblib.load(scaler_path)
            print("Scaler loaded")
        else:
            print("scaler.pkl not found")

        threshold_path = os.path.join(self.model_dir, "fraud_threshold_config.json")
        if os.path.exists(threshold_path):
            try:
                with open(threshold_path, "r", encoding="utf-8") as fh:
                    self.fraud_threshold_config = json.load(fh)
                threshold = self.fraud_threshold_config.get("threshold")
                if threshold is not None:
                    print(f"Fraud threshold loaded: {threshold}")
            except Exception as error:
                print(f"Could not read fraud_threshold_config.json: {error}")
                self.fraud_threshold_config = {}

        model_files = {
            "mineral": ["model_mineral_type.pkl", "random_forest.pkl", "xgboost.pkl"],
            "impurity": ["model_impurity_level.pkl", "random_forest.pkl", "lightgbm.pkl"],
            "fraud": ["model_fraud_detection.pkl", "random_forest.pkl", "xgboost.pkl"],
        }

        for name, filenames in model_files.items():
            loaded = False
            for filename in filenames:
                path = os.path.join(self.model_dir, filename)
                if not os.path.exists(path):
                    continue
                try:
                    self.models[name] = joblib.load(path)
                    if hasattr(self.models[name], "n_jobs"):
                        try:
                            self.models[name].n_jobs = 1
                        except Exception:
                            pass
                    print(f"Model {name} loaded from {filename}")
                    loaded = True
                    break
                except Exception as error:
                    print(f"Could not load {filename}: {error}")
            if not loaded:
                print(f"Model {name} not found")

        encoder_files = {
            "mineral": "label_encoder_mineral.pkl",
            "impurity": "label_encoder_impurity.pkl",
        }

        for name, filename in encoder_files.items():
            path = os.path.join(self.model_dir, filename)
            if os.path.exists(path):
                self.label_encoders[name] = joblib.load(path)
                print(f"Encoder {name} loaded")

        print("AI loading complete")
        return self

    def predict(self, features_dict):
        """Predict from a feature dictionary."""
        row = {col: features_dict.get(col, 0) for col in self.feature_columns}
        X_df = pd.DataFrame([row], columns=self.feature_columns)
        X = X_df.values

        if self.scaler:
            try:
                X_scaled = self.scaler.transform(X_df)
            except Exception:
                X_scaled = X
        else:
            X_scaled = X

        results = {}

        if "mineral" in self.models:
            try:
                mineral_pred = self.models["mineral"].predict(X_scaled)[0]
                if hasattr(self.models["mineral"], "predict_proba"):
                    mineral_proba = self.models["mineral"].predict_proba(X_scaled)[0]
                    confidence = float(max(mineral_proba))
                elif hasattr(self.models["mineral"], "decision_function"):
                    scores = self.models["mineral"].decision_function(X_scaled)[0]
                    if hasattr(scores, "__len__"):
                        exp_scores = np.exp(scores - np.max(scores))
                        proba = exp_scores / exp_scores.sum()
                        confidence = float(max(proba))
                    else:
                        confidence = float(1 / (1 + np.exp(-abs(scores))))
                else:
                    confidence = 0.75

                if "mineral" in self.label_encoders:
                    mineral_type = self.label_encoders["mineral"].inverse_transform([mineral_pred])[0]
                else:
                    mineral_type = str(mineral_pred)

                results["mineral"] = {
                    "type": mineral_type,
                    "confidence": confidence,
                }
            except Exception as error:
                results["mineral"] = {"type": "unknown", "confidence": 0, "error": str(error)}

        if "impurity" in self.models:
            try:
                impurity_pred = self.models["impurity"].predict(X_scaled)[0]
                if hasattr(self.models["impurity"], "predict_proba"):
                    impurity_proba = self.models["impurity"].predict_proba(X_scaled)[0]
                    imp_confidence = float(max(impurity_proba))
                elif hasattr(self.models["impurity"], "decision_function"):
                    scores = self.models["impurity"].decision_function(X_scaled)[0]
                    if hasattr(scores, "__len__"):
                        exp_scores = np.exp(scores - np.max(scores))
                        proba = exp_scores / exp_scores.sum()
                        imp_confidence = float(max(proba))
                    else:
                        imp_confidence = float(1 / (1 + np.exp(-abs(scores))))
                else:
                    imp_confidence = 0.75

                if "impurity" in self.label_encoders:
                    impurity_level = self.label_encoders["impurity"].inverse_transform([impurity_pred])[0]
                else:
                    impurity_level = str(impurity_pred)

                results["impurity"] = {
                    "level": impurity_level,
                    "confidence": imp_confidence,
                }
            except Exception:
                results["impurity"] = {"level": "unknown", "confidence": 0}

        if "fraud" in self.models:
            try:
                fraud_pred = self.models["fraud"].predict(X_scaled)[0]
                if hasattr(self.models["fraud"], "predict_proba"):
                    fraud_proba = self.models["fraud"].predict_proba(X_scaled)[0]
                    fraud_confidence = float(max(fraud_proba))
                    fraud_probability = float(fraud_proba[1]) if len(fraud_proba) > 1 else float(fraud_proba[0])
                elif hasattr(self.models["fraud"], "decision_function"):
                    score = self.models["fraud"].decision_function(X_scaled)[0]
                    fraud_probability = float(1 / (1 + np.exp(-float(score))))
                    fraud_confidence = float(1 / (1 + np.exp(-abs(float(score)))))
                else:
                    fraud_probability = 0.0
                    fraud_confidence = 0.75

                fraud_threshold = float(self.fraud_threshold_config.get("threshold", FRAUD_THRESHOLD_DEFAULT))
                is_fraud = bool(fraud_probability >= fraud_threshold)
                if not hasattr(self.models["fraud"], "predict_proba"):
                    is_fraud = bool(fraud_pred == 1 or fraud_pred == -1)

                results["fraud"] = {
                    "is_fraud": is_fraud,
                    "probability": fraud_probability,
                    "confidence": fraud_confidence,
                    "threshold": fraud_threshold,
                }
            except Exception:
                results["fraud"] = {"is_fraud": False, "confidence": 0}

        return results

    def explain(self, features_dict, prediction_results=None, top_n=5):
        """Return compact SHAP explanations when the dependency is available."""
        if not self.shap_available or not self.models:
            return {}

        row = {col: features_dict.get(col, 0) for col in self.feature_columns}
        X_df = pd.DataFrame([row], columns=self.feature_columns)

        if self.scaler:
            try:
                X_scaled = self.scaler.transform(X_df)
                explain_frame = pd.DataFrame(X_scaled, columns=self.feature_columns)
            except Exception:
                explain_frame = X_df
        else:
            explain_frame = X_df

        explanation_results = {}
        prediction_results = prediction_results or {}

        for model_name, model in self.models.items():
            predicted_value = None
            if model_name == "fraud":
                fraud_info = prediction_results.get("fraud", {})
                predicted_value = 1 if fraud_info.get("is_fraud") else 0
            elif model_name == "mineral":
                predicted_value = prediction_results.get("mineral", {}).get("type")
            elif model_name == "impurity":
                predicted_value = prediction_results.get("impurity", {}).get("level")

            explanation = explain_prediction(
                model,
                explain_frame,
                self.feature_columns,
                predicted_value=predicted_value,
                top_n=top_n,
            )
            if explanation:
                explanation_results[model_name] = explanation

        return explanation_results


model_loader = ModelLoader()
