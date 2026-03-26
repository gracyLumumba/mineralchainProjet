export function createHealthStatus(payload = {}) {
  const database = payload.database || {};

  return {
    status: payload.status || 'unknown',
    modelCount: Array.isArray(payload.models_loaded) ? payload.models_loaded.length : 0,
    databaseConfigured: Boolean(database.configured),
    databaseConnected: Boolean(database.connected),
    databaseEnabled: Boolean(database.enabled),
    databaseUrl: database.url || 'non configuree',
    features: Array.isArray(payload.features) ? payload.features : [],
  };
}
