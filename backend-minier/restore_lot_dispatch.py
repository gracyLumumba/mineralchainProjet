import json
import os
from datetime import datetime, timezone

import psycopg
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    raise SystemExit(
        "DATABASE_URL manquant. Renseigne la variable d'environnement avant d'executer ce script."
    )
if DATABASE_URL.startswith("postgresql+psycopg://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgresql+psycopg://"):]


def main():
    now = datetime.now(timezone.utc)

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE lots
                SET owner_user_id = %s,
                    owner_username = %s,
                    owner_name = %s,
                    updated_at = %s
                WHERE owner_username = %s
                RETURNING lot_id
                """,
                (
                    "demo-producer-001",
                    "producteur",
                    "Jean-Baptiste Mutombo",
                    now,
                    "regulateur",
                ),
            )
            reassigned = [row[0] for row in cur.fetchall()]

            if reassigned:
                cur.execute(
                    """
                    INSERT INTO lot_history (lot_id, event, status, details, timestamp)
                    SELECT id, %s, status, %s::jsonb, %s
                    FROM lots
                    WHERE lot_id = ANY(%s)
                    """,
                    (
                        "DISPATCHED_TO_PRODUCER",
                        json.dumps({
                            "from": "regulateur",
                            "to": "producteur",
                            "reason": "restauration_repartition",
                        }),
                        now,
                        reassigned,
                    ),
                )

            cur.execute(
                """
                UPDATE lots
                SET regulator_validated = TRUE,
                    regulator_validated_at = COALESCE(regulator_validated_at, %s),
                    updated_at = %s
                WHERE status = %s
                  AND regulator_validated = FALSE
                RETURNING lot_id
                """,
                (now, now, "AUTHENTIQUE"),
            )
            validated = [row[0] for row in cur.fetchall()]

            if validated:
                cur.execute(
                    """
                    INSERT INTO lot_history (lot_id, event, status, details, timestamp)
                    SELECT id, %s, status, %s::jsonb, %s
                    FROM lots
                    WHERE lot_id = ANY(%s)
                    """,
                    (
                        "DGMR_VALIDATED_FOR_TRANSPORT",
                        json.dumps({
                            "visible_to": "transporteur",
                            "reason": "lot_authentique_valide",
                        }),
                        now,
                        validated,
                    ),
                )

        conn.commit()

    print(f"reassigned_to_producteur={len(reassigned)}")
    print(f"validated_for_transporteur={len(validated)}")


if __name__ == "__main__":
    main()
