import {FieldType, InfluxDB} from "influx";

const debug = require("debug")("mnb:export-api:metrics");

import {MetricsOptions} from "./options/databaseOptions";
import {CcfVersion, ExportFormat} from "./export/exportCacheBase";

export interface IExportRequest {
    // @ts-ignore
    format: ExportFormat,
    ccfVersion: CcfVersion
    ids: string;
    host: string;
    userName: string;
    userId: string;
    duration: number;
}

const reattemptConnectDelay = 10;

export class MetricsStorageManager {
    private _influxDatabase: InfluxDB = null;

    public static Instance(): MetricsStorageManager {
        return _manager;
    }

    public async logExport(exportRequest: IExportRequest) {
        if (this._influxDatabase) {
            try {
                await this._influxDatabase.writePoints([
                    {
                        measurement: MetricsOptions.measurement,
                        tags: {
                            host: exportRequest.host,
                            userId: exportRequest.userId
                        },
                        fields: {
                            format: exportRequest.format,
                            ccfVersion: exportRequest.ccfVersion,
                            ids: exportRequest.ids,
                            userName: exportRequest.userName,
                            duration: exportRequest.duration
                        }
                    }
                ]);
            } catch (err) {
                debug("loq export request failed");
                debug(err);
            }
        }
    }

    public async initialize() {
        return new Promise(async (resolve) => {
            await this.authenticate(resolve);
        }) ;
    }

    private async authenticate(resolve) {
        try {
            this._influxDatabase = await establishConnection();
            resolve();
        } catch (err) {
            debug(`failed to connect to metrics database (${err.toString()}) - reattempt in ${reattemptConnectDelay} seconds`);
            setTimeout(() => this.authenticate(resolve), reattemptConnectDelay * 1000);
        }
    }
}

async function establishConnection(): Promise<InfluxDB> {
    await ensureExportDatabase();

    return new InfluxDB({
        host: MetricsOptions.host,
        port: MetricsOptions.port,
        database: MetricsOptions.database,
        schema: [
            {
                measurement: MetricsOptions.measurement,
                fields: {
                    format: FieldType.INTEGER,
                    ccfVersion: FieldType.INTEGER,
                    ids: FieldType.STRING,
                    userName: FieldType.STRING,
                    duration: FieldType.FLOAT
                },
                tags: [
                    "host",
                    "userId"
                ]
            }
        ]
    });
}

async function ensureExportDatabase() {
    const influx = new InfluxDB({
        host: MetricsOptions.host,
        port: MetricsOptions.port
    });

    const names: string[] = await influx.getDatabaseNames();

    if (names.indexOf(MetricsOptions.database) === -1) {
        await influx.createDatabase(MetricsOptions.database);
    }

    debug(`metrics ${MetricsOptions.database} database verified`);
}

const _manager: MetricsStorageManager = new MetricsStorageManager();

_manager.initialize().then(() => {
    debug("metrics database connection initialized");
});
