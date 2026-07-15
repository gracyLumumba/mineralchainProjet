-- MineralChain PostgreSQL schema
-- Generated from backend-minier/database/models.py

CREATE TABLE IF NOT EXISTS lots (
    id SERIAL PRIMARY KEY,
    lot_id VARCHAR(50) NOT NULL UNIQUE,
    site VARCHAR(20) NOT NULL,
    extraction_date DATE NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    analyzed_at TIMESTAMP,

    cu_grade DOUBLE PRECISION,
    co_grade DOUBLE PRECISION,
    fe_grade DOUBLE PRECISION,
    ni_grade DOUBLE PRECISION,
    s_grade DOUBLE PRECISION,
    silica_grade DOUBLE PRECISION,

    density DOUBLE PRECISION,
    moisture DOUBLE PRECISION,
    hardness DOUBLE PRECISION,
    weight DOUBLE PRECISION,

    mineral_type VARCHAR(20),
    confidence DOUBLE PRECISION,
    impurity_level VARCHAR(20),
    is_fraud BOOLEAN DEFAULT FALSE,
    status VARCHAR(20),

    token_id INTEGER UNIQUE,
    tx_hash VARCHAR(100) UNIQUE,
    block_number INTEGER,
    contract_address VARCHAR(100),
    certificate_id VARCHAR(100),
    owner_user_id VARCHAR(80),
    owner_username VARCHAR(80),
    owner_name VARCHAR(120),

    regulator_validated BOOLEAN DEFAULT FALSE,
    regulator_validated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lots_lot_id ON lots (lot_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots (status);
CREATE INDEX IF NOT EXISTS idx_lots_site ON lots (site);
CREATE INDEX IF NOT EXISTS idx_lots_token_id ON lots (token_id);

CREATE TABLE IF NOT EXISTS lot_history (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    event VARCHAR(50) NOT NULL,
    status VARCHAR(20),
    details JSONB,
    timestamp TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lot_history_lot_id ON lot_history (lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_history_timestamp ON lot_history (timestamp);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lots(id) ON DELETE SET NULL,
    type VARCHAR(50),
    message VARCHAR(200),
    severity VARCHAR(20),
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_lot_id ON alerts (lot_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts (resolved);
