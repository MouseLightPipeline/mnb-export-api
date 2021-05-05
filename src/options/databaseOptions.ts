export const Databases = {
    metrics: {
        host: "metrics-db",
        port: 8086,
        database: "export_metrics_db",
        measurement: "export_requests"
    }
};

function loadDatabaseOptions() {
    const options = Object.assign({}, Databases);

    options.metrics.host = process.env.METRICS_DB_HOST || options.metrics.host;
    options.metrics.port = parseInt(process.env.METRICS_DB_PORT) || options.metrics.port;

    return options;
}

const DatabaseOptions = loadDatabaseOptions();

export const MetricsOptions = DatabaseOptions.metrics;
