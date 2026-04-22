def _to_float(value, default=0.0):
    try:
        if value in (None, ""):
            return float(default)
        return float(value)
    except (TypeError, ValueError):
        return float(default)


def _pick_number(data, *keys):
    for key in keys:
        if key in data and data.get(key) not in (None, ""):
            return _to_float(data.get(key), 0.0)
    return 0.0


def evaluate_consistency_rules(data):
    cu = _pick_number(data, 'cu_grade_percent', 'cu_grade', 'cu')
    co = _pick_number(data, 'co_grade_percent', 'co_grade', 'co')
    fe = _pick_number(data, 'fe_percent', 'fe_grade', 'fe')
    ni = _pick_number(data, 'ni_percent', 'ni_grade', 'ni')
    sulfur = _pick_number(data, 's_percent', 's_grade', 's')
    silica = _pick_number(data, 'silica_percent', 'silica_grade', 'sio2_percent', 'sio2', 'silice')
    density = _pick_number(data, 'density_t_m3', 'density')
    moisture = _pick_number(data, 'moisture_percent', 'moisture')
    hardness = _pick_number(data, 'hardness_mohs', 'hardness')
    weight = _pick_number(data, 'weight_tonnes', 'weight_tons', 'weight')

    chemistry_total = cu + co + fe + ni + sulfur + silica
    reasons = []

    if chemistry_total > 100:
        reasons.append(f"Somme chimique invalide ({chemistry_total:.2f}% > 100%)")
    if moisture > 40:
        reasons.append(f"Humidite trop elevee ({moisture:.2f}% > 40%)")
    if cu > 25:
        reasons.append(f"Teneur en cuivre trop elevee ({cu:.2f}% > 25%)")
    if cu > 15 and density < 2.0:
        reasons.append(f"Combinaison incoherente Cu/densite (Cu {cu:.2f}% et densite {density:.2f} t/m3)")
    if density <= 0:
        reasons.append("Densite invalide")
    if weight <= 0:
        reasons.append("Poids invalide")
    if hardness and (hardness < 0 or hardness > 10):
        reasons.append(f"Durete invalide ({hardness:.2f} Mohs)")

    return {
        "is_suspect": len(reasons) > 0,
        "reasons": reasons,
        "metrics": {
            "chemistry_total": chemistry_total,
            "density": density,
            "moisture": moisture,
            "weight": weight,
            "hardness": hardness,
        },
    }
