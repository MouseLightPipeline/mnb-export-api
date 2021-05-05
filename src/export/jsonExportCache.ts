import * as fs from "fs";
import * as path from "path";
import moment = require("moment");

import {ServiceOptions} from "../options/serviceOptions";
import {CcfVersion, ExportFormat} from "./exportCacheBase";
import {ExportCacheBase, IExportResponse} from "./exportCacheBase";

const debug = require("debug")("mnb:export-api:json");

export class JsonExportCache extends ExportCacheBase {
    public constructor(ccfVersion: CcfVersion) {
        super(ccfVersion, ExportFormat.Json);
    }

    public loadContents(): ExportCacheBase {
        const dataLocation = path.join(ServiceOptions.dataPath, this.CcfVersion === CcfVersion.Janelia25 ? "json25" : "json30");

        if (!fs.existsSync(dataLocation)) {
            debug("json data path does not exist");
            return;
        }

        debug("initiating json cache load");

        fs.readdirSync(dataLocation).forEach(file => {
            if (file.slice(-5) === ".json") {
                const jsonName = file.slice(0, -5);

                const data = fs.readFileSync(path.join(dataLocation, file), {encoding: "utf8"});

                this._cache.set(jsonName, JSON.parse(data).neuron);
            }
        });

        debug(`loaded ${this._cache.size} neurons (json)`)

        return this;
    }

    public async findContents(ids: string[], hostname: string): Promise<IExportResponse> {    const t1 = process.hrtime();
        if (!ids || ids.length === 0) {
            debug(`null json id request`);
            return;
        }

        debug(`handling json request for ids: ${ids.join(", ")}`);

        const base = {
            comment: `Downloaded ${moment().format("YYYY/MM/DD")}. Please consult Terms-of-Use at https://mouselight.janelia.org when referencing this reconstruction.`,
            neurons: []
        };

        const contents = ids.reduce((prev, id) => {
            const data = this._cache.get(id);

            if (data) {
                prev.neurons.push(data);
            }

            return prev;
        }, base);

        let filename = "mlnb-export.json";

        if (ids.length === 1) {
            filename = ids[0] + ".json";
        }

        await this.logMetrics(ids, hostname, process.hrtime(t1));

        return {
            contents,
            filename
        };
    }
}
