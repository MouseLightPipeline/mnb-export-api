import * as fs from "fs";
import * as path from "path";
import * as Archiver from "archiver";
import * as uuid from "uuid";

import {PersistentStorageManager} from "./databaseConnector";
import {ExportFormat, ServiceOptions} from "./serviceOptions";
import moment = require("moment");

const dataMap = new Map<string, string>();

cacheData();

function cacheData() {
    const dataLocation = path.join(ServiceOptions.dataPath, "swc");

    fs.readdirSync(dataLocation).forEach(file => {
        if (file.slice(-4) === ".swc") {
            const swcName = file.slice(0, -4);

            const data = fs.readFileSync(path.join(dataLocation, file), {encoding: "utf8"});

            dataMap.set(swcName, data);
        }
    })
}

export async function swcExportMiddleware(req, res) {
    const t1 =  process.hrtime();

    const ids = req.body.ids;

    if (!ids || ids.length === 0) {
        res.json(null);
        return;
    }

    if (ids.length === 1) {
        let encoded = null;

        const data = dataMap.get(ids[0]);

        if (data) {
            encoded = new Buffer(`# Generated ${moment().format("YYYY/MM/DD")}. \n` + data).toString("base64");

            const t2 = process.hrtime(t1);

            await PersistentStorageManager.Instance().logExport({
                host: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
                userId: "(unknown)",
                format: ExportFormat.SWC,
                ids: ids.join(", "),
                userName: "(unknown)",
                duration: t2[0] + t2[1] / 1000000000
            });
        }

        res.json({
            contents: encoded,
            filename: ids[0] + ".swc"
        });
    } else {
        const tempFile = uuid.v4();

        const response = await new Promise(async (resolve) => {
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

            const archive = Archiver("zip", {zlib: {level: 9}});

            archive.pipe(output);

            ids.forEach(id => {
                const data = dataMap.get(id);

                if (data) {
                    archive.append(`# Generated ${moment().format("YYYY/MM/DD")}. \n` + data, {name: id + ".swc"});
                }
            });

            await archive.finalize();

            const t2 = process.hrtime(t1);

            await PersistentStorageManager.Instance().logExport({
                host: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
                userId: "(unknown)",
                format: ExportFormat.SWC,
                ids: ids.join(", "),
                userName: "(unknown)",
                duration: t2[0]+ t2[1]/1000000000
            });
        });

        res.json(response);
    }
}

/*
    public async requestExport(tracingIds: string[], format: ExportFormat): Promise<IRequestExportOutput[]> {
        if (!tracingIds || tracingIds.length === 0) {
            return [];
        }

        const tracings = await this._storageManager.Tracings.findAll({where: {id: {$in: tracingIds}}});

        if (tracings.length === 0) {
            return [];
        }

        const idFunc = this._storageManager.StructureIdentifiers.idValue;

        const promises: Promise<IRequestExportOutput>[] = (tracings.map((async (tracing) => {
            const nodes: ITracingNode[] = await this._storageManager.Nodes.findAll({
                where: {tracingId: tracing.id},
                order: [["sampleNumber", "ASC"]]
            });

            const swcTracing: ISwcTracing = await this._storageManager.SwcTracings.findById(tracing.swcTracingId);

            const transform: IRegistrationTransform = await this._storageManager.RegistrationTransforms.findById(tracing.registrationTransformId);

            const neuron: INeuron = await this._storageManager.Neurons.findById(swcTracing.neuronId);

            const filename = sanitize(`${neuron.idString}-${path.basename(swcTracing.filename, path.extname(swcTracing.filename))}`);

            if (format === ExportFormat.SWC) {
                return {
                    contents: mapToSwc(tracing, swcTracing, neuron, transform, nodes, idFunc),
                    filename: filename
                };
            } else {
                return {
                    contents: mapToJSON(tracing, swcTracing, neuron, transform, nodes, idFunc),
                    filename: filename
                };
            }
        })));

        const data = await Promise.all(promises);

        if (data.length > 1) {
            if (format === ExportFormat.SWC) {
                const tempFile = uuid.v4();

                return new Promise<IRequestExportOutput[]>(async (resolve) => {
                    const output = fs.createWriteStream(tempFile);

                    output.on("finish", () => {
                        const readData = fs.readFileSync(tempFile);

                        const encoded = readData.toString("base64");

                        fs.unlinkSync(tempFile);

                        resolve([{
                            contents: encoded,
                            filename: "ndb-export-data.zip"
                        }]);
                    });

                    const archive = Archiver("zip", {zlib: {level: 9}});

                    archive.pipe(output);

                    data.forEach(d => {
                        archive.append(d.contents, {name: d.filename + ".swc"});
                    });

                    await archive.finalize();
                });

            } else {
                const obj = data.reduce((prev: any, d) => {
                    prev[d.filename] = d.contents;

                    return prev;
                }, {});

                return [{
                    contents: JSON.stringify(obj),
                    filename: "ndb-export-data.json"
                }]
            }
        } else {
            data[0].filename += format === ExportFormat.SWC ? ".swc" : ".json";

            if (format === ExportFormat.JSON) {
                data[0].contents = JSON.stringify(data[0].contents)
            }

            return data;
        }
    }


 */