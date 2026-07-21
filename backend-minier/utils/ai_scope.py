from __future__ import annotations


def build_ai_scope_summary(feature_columns=None, payload=None):
    feature_columns = list(feature_columns or [])
    payload = payload or {}

    quantitative_inputs = [field for field in feature_columns if field in {
        "cu_grade_percent",
        "co_grade_percent",
        "fe_percent",
        "ni_percent",
        "s_percent",
        "silica_percent",
        "density_t_m3",
        "moisture_percent",
        "hardness_mohs",
        "weight_tonnes",
    }]

    fingerprint_fields = {
        "geological_origin": payload.get("geological_origin") or "non renseignee",
        "texture": payload.get("texture") or "non renseignee",
    }

    return {
        "title": "Clarification du role de l'IA",
        "quantitative_inputs": quantitative_inputs,
        "fingerprint_fields": fingerprint_fields,
        "model_scope": [
            "Le modele IA actuel apprend a partir de mesures quantitatives stables et comparables.",
            "La composition chimique est prise en compte via les teneurs numeriques (Cu, Co, Fe, Ni, S, silice) plutot que comme empreinte qualitative complete.",
            "Les champs geologiques et texturaux enrichissent l'empreinte mineralogique, mais ne servent pas encore d'entree principale au classifieur.",
            "La composition chimique est utilisee via ses valeurs numeriques d'analyse, puis SHAP explique leur poids dans la decision.",
            "Pour exploiter pleinement l'origine geologique et la texture dans la prediction, il faudra reentraner et revalider le modele avec des donnees etiquetees coherentes.",
        ],
        "why_not_full_fingerprint": "L'empreinte complete reste tres pertinente pour la traçabilite, mais l'origine geologique et la texture sont encore conservees comme contexte metier et metadonnees de certificat, pas comme variables d'apprentissage principales.",
        "shap_note": "SHAP sert a montrer quelles variables quantitatives ont le plus influence la prediction du modele.",
    }
