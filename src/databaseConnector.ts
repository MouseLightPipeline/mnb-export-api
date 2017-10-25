const Influx = require("influx");

const debug = require("debug")("ndb:export:database-connector");

import {ServiceOptions} from "./serviceOptions"

export interface IExportRequest {
    format: number,
    ids: string;
    host: string[];
    userName: string;
    userId: string;
    duration: number;
}

const databaseOptions = ServiceOptions.databaseOptions;

const measurement = "export_requests";

export class PersistentStorageManager {
    public static Instance(): PersistentStorageManager {
        return _manager;
    }

    public async logExport(exportRequest: IExportRequest) {
        try {
            if (this.influxDatabase) {
                this.influxDatabase.writePoints([
                    {
                        measurement: measurement,
                        tags: {
                            host: exportRequest.host,
                            userId: exportRequest.userId
                        },
                        fields: {
                            format: exportRequest.format,
                            ids: exportRequest.format,
                            userName: exportRequest.userName,
                            duration: exportRequest.duration
                        }
                    }
                ]).then();
            }
        } catch (err) {
            debug("loq export request failed");
            debug(err);
        }
    }


    private influxDatabase = establishInfluxConnection();
}

function establishInfluxConnection() {
    if (databaseOptions["metrics"]) {
        const databaseConfig = databaseOptions["metrics"];

        return new Influx.InfluxDB({
            host: databaseConfig.host,
            port: databaseConfig.port,
            database: databaseConfig.database,
            schema: [
                {
                    measurement: measurement,
                    fields: {
                        format: Influx.FieldType.INTEGER,
                        ids: Influx.FieldType.STRING,
                        userName: Influx.FieldType.STRING,
                        duration: Influx.FieldType.INTEGER
                    },
                    tags: [
                        "host",
                        "userId"
                    ]
                }
            ]
        });
    } else {
        return null;
    }
}

const _manager: PersistentStorageManager = new PersistentStorageManager();
