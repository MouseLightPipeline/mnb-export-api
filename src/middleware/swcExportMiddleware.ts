import * as fs from "fs";
import * as path from "path";
import * as archiver from "archiver";
import * as uuid from "uuid";
import moment = require("moment");

const debug = require("debug")("mnb:export-api:swc");

import {MetricsStorageManager} from "../metricsStorageManager";
import {ServiceOptions} from "../options/serviceOptions";
import {ExportFormat} from "./exportFormat";

const dataMap = new Map<string, string>();

cacheData();

function cacheData() {
    const dataLocation = path.join(ServiceOptions.dataPath, "swc");

    if (!fs.existsSync(dataLocation)) {
        debug("swc data path does not exist");
        return;
    }

    debug("initiating swc cache load");

    fs.readdirSync(dataLocation).forEach(file => {
        if (file.slice(-4) === ".swc") {
            const swcName = file.slice(0, -4);

            const data = fs.readFileSync(path.join(dataLocation, file), {encoding: "utf8"});

            dataMap.set(swcName, data);
        }
    });

    debug(`loaded ${dataMap.size} neurons (swc)`);
}

export async function swcExportMiddleware(req, res) {
    const t1 = process.hrtime();

    const ids = req.body.ids;

    let response = null;

    if (!ids || ids.length === 0) {
        debug(`null swc id request`);
        response = null;
    } else if (ids.length === 1) {
        debug(`handling swc request for id: ${ids[0]}`);

        let encoded = null;

        const data = dataMap.get(ids[0]);

        if (data) {
            encoded = new Buffer(`# Generated ${moment().format("YYYY/MM/DD")}. \n` + data).toString("base64");

            const t2 = process.hrtime(t1);

            await MetricsStorageManager.Instance().logExport({
                host: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
                userId: "(unknown)",
                format: ExportFormat.SWC,
                ids: ids.join(", "),
                userName: "(unknown)",
                duration: t2[0] + t2[1] / 1000000000
            });
        }

        response = {
            contents: encoded,
            filename: ids[0] + ".swc"
        };
    } else {
        debug(`handling swc request for ids:`);
        debug(`${ids}`);

        const tempFile = uuid.v4();

        response = await new Promise(async (resolve) => {
            const output = fs.createWriteStream(tempFile);

            output.on("finish", () => {
                const readData = fs.readFileSync(tempFile);

                const encoded = readData.toString("base64");

                fs.unlinkSync(tempFile);

                resolve({
                    contents: encoded,
                    filename: "mlnb-export-data.zip"
                });
            });

            const archive = archiver("zip", {zlib: {level: 9}});

            archive.pipe(output);

            ids.forEach(id => {
                const data = dataMap.get(id);

                if (data) {
                    archive.append(`# Generated ${moment().format("YYYY/MM/DD")}. \n` + data, {name: id + ".swc"});
                }
            });

            await archive.finalize();

            const t2 = process.hrtime(t1);

            await MetricsStorageManager.Instance().logExport({
                host: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
                userId: "(unknown)",
                format: ExportFormat.SWC,
                ids: ids.join(", "),
                userName: "(unknown)",
                duration: t2[0] + t2[1] / 1000000000
            });
        });
    }

    await res.json(response);
}
