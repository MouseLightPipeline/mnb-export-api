import * as fs from "fs";
import * as path from "path";

import {PersistentStorageManager} from "./databaseConnector";
import {ExportFormat, ServiceOptions} from "./serviceOptions";
import moment = require("moment");

const dataMap = new Map<string, string>();

cacheData();

function cacheData() {
    const dataLocation = path.join(ServiceOptions.dataPath, "json");

    fs.readdirSync(dataLocation).forEach(file => {
        if (file.slice(-5) === ".json") {
            const swcName = file.slice(0, -5);

            const data = fs.readFileSync(path.join(dataLocation, file), {encoding: "utf8"});

            dataMap.set(swcName, JSON.parse(data).neuron);
        }
    })
}

export async function jsonExportMiddleware(req, res) {
    const t1 = process.hrtime();

    const ids = req.body.ids;

    if (!ids || ids.length === 0) {
        res.json(null);
        return;
    }

    const base = {
        comment: `Generated ${moment().format("YYYY/MM/DD")}. Please consult Terms-of-Use at https://mouselight.janelia.org when referencing this reconstruction.`,
        neurons: []
    };

    const contents = ids.reduce((prev, id) => {
        const data = dataMap.get(id);

        if (data) {
            prev.neurons.push(data);
        }

        return prev;
    }, base);

    const t2 = process.hrtime(t1);

    await PersistentStorageManager.Instance().logExport({
        host: req.ip,
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
