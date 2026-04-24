from datetime import datetime, timedelta

from utils.experiment_logger import replace_records


BASE_DATE = datetime(2026, 4, 14, 9, 0, 0)


HISTORICAL_TESTS = [
    {
        "test_name": "TC-01 Authentification du regulateur",
        "source": "historique.plan_de_test",
        "lot_id": "",
        "site": "",
        "mineral_type": "",
        "http_status": 200,
        "success": True,
        "result_status": "Conforme",
        "message": "Connexion reussie avec token Bearer et role regulator",
    },
    {
        "test_name": "TC-02 Creation d'un lot par un producteur",
        "source": "historique.plan_de_test",
        "lot_id": "LOT_24772",
        "site": "KAMOA",
        "mineral_type": "copper",
        "http_status": 201,
        "success": True,
        "result_status": "Conforme",
        "message": "Lot cree avec statut CREE et historique initial",
    },
    {
        "test_name": "TC-03 Restriction d'acces aux lots cote producteur",
        "source": "historique.plan_de_test",
        "lot_id": "",
        "site": "",
        "mineral_type": "",
        "http_status": 200,
        "success": True,
        "result_status": "Conforme",
        "message": "Le producteur ne voit que ses propres lots",
    },
    {
        "test_name": "TC-04 Auto-validation d'un lot conforme DGMR",
        "source": "historique.plan_de_test",
        "lot_id": "LOT_24772",
        "site": "KAMOA",
        "mineral_type": "copper",
        "http_status": 200,
        "success": True,
        "result_status": "Partiellement conforme",
        "params_compared": 6,
        "conformes": 6,
        "message": "Le lot conforme devient AUTHENTIQUE, mais la generation DGMR etait initialement aleatoire",
    },
    {
        "test_name": "TC-05 Detection d'un lot suspect",
        "source": "historique.plan_de_test",
        "lot_id": "LOT_SUSPECT",
        "site": "KCC",
        "mineral_type": "cobalt",
        "http_status": 200,
        "success": True,
        "result_status": "Conforme",
        "message": "Le lot divergent est marque SUSPECT",
    },
    {
        "test_name": "TC-06 Prevention de double certification",
        "source": "historique.plan_de_test",
        "lot_id": "KAMOA-2603-142",
        "site": "KAMOA",
        "mineral_type": "copper",
        "http_status": 200,
        "success": True,
        "result_status": "Conforme",
        "message": "Le second mint du meme lot echoue",
    },
    {
        "test_name": "TC-07 Controles d'acces onlyOwner",
        "source": "historique.plan_de_test",
        "lot_id": "",
        "site": "",
        "mineral_type": "",
        "http_status": 200,
        "success": True,
        "result_status": "Conforme",
        "message": "Un non-owner ne peut ni minter ni valider",
    },
    {
        "test_name": "TC-08 Mise a jour du certificat IPFS",
        "source": "historique.plan_de_test",
        "lot_id": "KAMOA-2603-142",
        "site": "KAMOA",
        "mineral_type": "copper",
        "http_status": 200,
        "success": True,
        "result_status": "Conforme",
        "message": "Le nouveau hash IPFS est stocke et relisible",
    },
    {
        "test_name": "TC-09 Transaction blockchain reelle sur Ganache",
        "source": "historique.plan_de_test",
        "lot_id": "KAMOA-TEST-XXXX",
        "site": "KAMOA",
        "mineral_type": "copper",
        "http_status": 200,
        "success": True,
        "result_status": "Partiellement conforme",
        "message": "Transaction confirmee, mais adresse de contrat a verifier avant execution",
    },
    {
        "test_name": "TC-10 Persistance apres redemarrage du backend",
        "source": "historique.plan_de_test",
        "lot_id": "LOT_24772",
        "site": "KAMOA",
        "mineral_type": "copper",
        "http_status": 500,
        "success": False,
        "result_status": "Non conforme",
        "message": "Le lot ne reste pas toujours accessible et auto-validable",
        "error": "Persistance JSON / SQL / memoire incoherente",
    },
    {
        "test_name": "TC-11 Portabilite du chargement des modeles IA",
        "source": "historique.plan_de_test",
        "lot_id": "",
        "site": "",
        "mineral_type": "",
        "http_status": 500,
        "success": False,
        "result_status": "Non conforme",
        "message": "Le backend ne charge pas les modeles via un chemin portable",
        "error": "Chemin absolu local des modeles IA",
    },
    {
        "test_name": "TC-12 Exhaustivite de la documentation d'API",
        "source": "historique.plan_de_test",
        "lot_id": "",
        "site": "",
        "mineral_type": "",
        "http_status": 206,
        "success": False,
        "result_status": "Bloque / amelioration requise",
        "message": "La documentation ne reflete pas encore tous les endpoints reels",
        "error": "Documentation incomplete",
    },
]


def main():
    records = []
    for index, item in enumerate(HISTORICAL_TESTS):
        record = {
            "recorded_at": (BASE_DATE + timedelta(minutes=index * 7)).isoformat(),
            **item,
            "already_validated": False,
            "validated_by": "historique",
            "comparison": item.get("comparison", []),
            "params_compared": item.get("params_compared", 0),
            "conformes": item.get("conformes", 0),
        }
        records.append(record)

    paths = replace_records(records)
    print("Historique des tests injecte.")
    for label, path in paths.items():
        print(f"- {label}: {path}")


if __name__ == "__main__":
    main()
