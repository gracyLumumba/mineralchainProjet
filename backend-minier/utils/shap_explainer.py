from __future__ import annotations

import numpy as np

try:
    import shap  # type: ignore
    SHAP_AVAILABLE = True
except Exception:
    shap = None  # type: ignore
    SHAP_AVAILABLE = False


def _to_float(value):
    try:
        return float(value)
    except Exception:
        return 0.0


def _tree_like_model(model) -> bool:
    return any(hasattr(model, attr) for attr in ("feature_importances_", "estimators_", "tree_"))


def _select_explainer(model, background):
    if shap is None:
        raise RuntimeError("SHAP indisponible")

    if _tree_like_model(model):
        try:
            return shap.TreeExplainer(model)
        except Exception:
            pass

    if hasattr(model, "predict_proba"):
        try:
            return shap.Explainer(model.predict_proba, background)
        except Exception:
            pass

    return shap.Explainer(model, background)


def _flatten_shap_values(values, feature_count):
    arr = np.array(values)
    if arr.ndim == 0:
        return np.zeros(feature_count)
    if arr.ndim == 1:
        return arr
    if arr.ndim == 2:
        if arr.shape[0] == 1:
            return arr[0]
        if arr.shape[1] == feature_count:
            return arr[0]
        return arr[:, 0]
    if arr.ndim >= 3:
        if arr.shape[0] == 1:
            sample = arr[0]
            if sample.shape[0] == feature_count:
                return sample[:, -1] if sample.shape[-1] > 1 else sample[:, 0]
            if sample.shape[-1] == feature_count:
                return sample[-1]
        flattened = arr.reshape(arr.shape[0], -1)[0]
        return flattened[:feature_count]
    return np.zeros(feature_count)


def explain_prediction(model, explain_frame, feature_names, predicted_value=None, top_n=5):
    """
    Return a compact SHAP explanation for a single row.

    The output stays small so it can be embedded directly in the API response.
    """
    if not SHAP_AVAILABLE or model is None:
        return {}

    try:
        feature_names = list(feature_names or [])
        if not feature_names:
            return {}

        background = explain_frame
        if len(explain_frame) > 32:
            background = explain_frame.sample(32, random_state=42)

        explainer = _select_explainer(model, background)
        shap_values = explainer(explain_frame)

        values = _flatten_shap_values(getattr(shap_values, "values", shap_values), len(feature_names))
        base_values = getattr(shap_values, "base_values", None)
        base_value = None
        if base_values is not None:
            base_arr = np.array(base_values).reshape(-1)
            if base_arr.size:
                base_value = _to_float(base_arr[0])

        contributions = []
        for idx, feature_name in enumerate(feature_names):
            raw_value = _to_float(values[idx]) if idx < len(values) else 0.0
            contributions.append({
                "feature": feature_name,
                "value": raw_value,
                "abs_value": abs(raw_value),
                "direction": "positive" if raw_value >= 0 else "negative",
            })

        contributions.sort(key=lambda item: item["abs_value"], reverse=True)
        top_features = contributions[: max(1, int(top_n))]

        return {
            "available": True,
            "predicted_value": predicted_value,
            "base_value": base_value,
            "top_features": top_features,
            "all_features": contributions,
        }
    except Exception as error:
        return {
            "available": False,
            "error": str(error),
        }
