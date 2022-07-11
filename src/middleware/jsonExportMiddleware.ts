import * as fs from "fs";
import * as path from "path";
import moment = require("moment");

const debug = require("debug")("mnb:export-api:json");

import {MetricsStorageManager} from "../metricsStorageManager";
import {ServiceOptions} from "../options/serviceOptions";
import {ExportFormat} from "./exportFormat";

const dataMap = new Map<string, string>();

cacheData();

function cacheData() {
    const dataLocation = path.join(ServiceOptions.dataPath, "json");

    if (!fs.existsSync(dataLocation)) {
        debug("json data path does not exist");
        return;
    }

    /*
    debug("initiating json cache load");

    fs.readdirSync(dataLocation).forEach(file => {
        if (file.slice(-5) === ".json") {
            const jsonName = file.slice(0, -5);

            const data = fs.readFileSync(path.join(dataLocation, file), {encoding: "utf8"});

            dataMap.set(jsonName, JSON.parse(data).neuron);
        }
    });

    debug(`loaded ${dataMap.size} neurons (json)`);
     */
}

export async function jsonExportMiddleware(req, res) {
    const t1 = process.hrtime();

    const dataLocation = path.join(ServiceOptions.dataPath, "json");

    if (!fs.existsSync(dataLocation)) {
        debug("json data path does not exist");
        return;
    }
    const ids = req.body.ids;

    if (!ids || ids.length === 0) {
        debug(`null json id request`);
        res.json(null);
        return;
    }

    debug(`handling json request for ids:`);
    debug(`${ids}`);

    const base = {
        comment: `Generated ${moment().format("YYYY/MM/DD")}. Please consult Terms-of-Use at https://mouselight.janelia.org when referencing this reconstruction.`,
        neurons: []
    };

    const contents = ids.reduce((prev, id) => {
        // const data = dataMap.get(id);

        try {
            const data = fs.readFileSync(path.join(dataLocation, id + ".json"), {encoding: "utf8"});

            if (data) {
                prev.neurons.push(JSON.parse(data).neuron);
            }
        } catch {}

        return prev;
    }, base);

    const t2 = process.hrtime(t1);

    await MetricsStorageManager.Instance().logExport({
        host: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        userId: "(unknown)",
        format: ExportFormat.JSON,
        ids: ids.join(", "),
        userName: "(unknown)",
        duration: t2[0] + t2[1] / 1000000000
    });

    let filename = "mlnb-export.json";

    if (ids.length === 1) {
        filename = ids[0] + ".json";
    }

    res.json({
        contents,
        filename
    });
}
