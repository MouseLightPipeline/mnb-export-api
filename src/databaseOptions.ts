export interface IConnection {
    host: string;
    port: number;
    database: string;
}

export interface IDatabases {
    metrics: IDatabaseEnv;
}

export interface IDatabaseEnv {
    development: IConnection;
    production: IConnection;
    azure: IConnection;
}

export const Databases: IDatabases = {
    metrics: {
        development: {
            host: "localhost",
            port: 8086,
            database: "export_metrics_db"
        },
        production: {
            host: "metrics-db",
            port: 8086,
            database: "export_metrics_db"
        },
        azure: {
            host: "metrics-db",
            port: 8086,
            database: "export_metrics_db"
        }
    }
};
