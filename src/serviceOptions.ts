export enum ExportFormat {
    SWC = 0,
    JSON = 1
}


import {Databases} from "./databaseOptions";

export interface IServerOptions {
    port: number;
}

export interface IDataBaseOptions {
    metrics: any;
}

export interface IServiceOptions {
    envName: string;
    dataPath: string;
    serverOptions: IServerOptions;
    databaseOptions: IDataBaseOptions;
}

interface IConfiguration<T> {
    development: T;
    azure: T;
    production: T;
}

const configurations: IConfiguration<IServiceOptions> = {
    development: {
        envName: "",
        dataPath: "/opt/data/export",
        serverOptions: {
            port: 9691
        },
        databaseOptions: {
            metrics: null
        }
    },
    azure: {
        envName: "",
        dataPath: "/opt/data/export",
        serverOptions: {
            port: 9691
        },
        databaseOptions: {
            metrics: null
        }
    },
    production: {
        envName: "",
        dataPath: "/opt/data/export",
        serverOptions: {
            port: 9691
        },
        databaseOptions: {
            metrics: null
        }
    }
};

function loadConfiguration(): IServiceOptions {
    const envName = process.env.NODE_ENV || "development";

    const c = configurations[envName];

    c.envName = envName;

    const dbEnvName = process.env.DATABASE_ENV || envName;

    c.dataPath = process.env.EXPORT_DATA_PATH || c.dataPath;


    c.databaseOptions.metrics = Databases.metrics[dbEnvName];
    c.databaseOptions.metrics.host = process.env.METRICS_DB_HOST || c.databaseOptions.metrics.host;
    c.databaseOptions.metrics.port = process.env.METRICS_DB_PORT || c.databaseOptions.metrics.port;

    return c;
}

export const ServiceOptions: IServiceOptions = loadConfiguration();
