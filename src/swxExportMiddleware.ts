import * as fs from "fs";
import * as path from "path";

import {PersistentStorageManager} from "./databaseConnector";
import {ServiceOptions} from "./serviceOptions";

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
    const ids = req.body.ids;

    console.log(ids);

    if (!ids || ids.length === 0) {
        res.json(null);
        return;
    }

    const data = dataMap.get(ids[0]);

    res.set("Content-Type", "text/plain");
    res.send(data);
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