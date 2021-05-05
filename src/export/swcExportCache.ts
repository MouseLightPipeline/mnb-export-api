import * as fs from "fs";
import * as path from "path";
import * as archiver from "archiver";
import * as uuid from "uuid";
import {ServiceOptions} from "../options/serviceOptions";
import {CcfVersion, ExportFormat, ExportCacheBase, IExportResponse} from "./exportCacheBase";
import moment = require("moment");

const debug = require("debug")("mnb:export-api:swc");

export class SwcExportCache extends ExportCacheBase {
    public constructor(ccfVersion: CcfVersion) {
        super(ccfVersion, ExportFormat.Swc);
    }

    public loadContents(): ExportCacheBase {
        const dataLocation = path.join(ServiceOptions.dataPath, this.CcfVersion === CcfVersion.Janelia25 ? "swc25" : "swc30");

        if (!fs.existsSync(dataLocation)) {
            debug("swc data path does not exist");
            return;
        }

        debug("initiating swc cache load");

        fs.readdirSync(dataLocation).forEach(file => {
            if (file.slice(-4) === ".swc") {
                const swcName = file.slice(0, -4);

                const data = fs.readFileSync(path.join(dataLocation, file), {encoding: "utf8"});

                this._cache.set(swcName, data);
            }
        });

        debug(`loaded ${this._cache.size} neurons (swc)`)

        return this;
    }

    public async findContents(ids: string[], hostname: string): Promise<IExportResponse> {
        if (!ids || ids.length === 0) {
            debug(`null swc id request`);
            return null;
        }

        const t1 = process.hrtime();

        debug(`handling json request for ids: ${ids.join(", ")}`);

        let response: IExportResponse;

        if (ids.length === 1) {
            let encoded = null;

            const data = this._cache.get(ids[0]);

            if (data) {
                encoded = Buffer.from(`# Downloaded ${moment().format("YYYY/MM/DD")}. \n` + data).toString("base64");
            }

            response = {
                contents: encoded,
                filename: ids[0] + ".swc"
            };
        } else {
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
                    const data = this._cache.get(id);

                    if (data) {
                        archive.append(`# Generated ${moment().format("YYYY/MM/DD")}. \n` + data, {name: id + ".swc"});
                    }
                });

                await archive.finalize();
            });
        }

        await this.logMetrics(ids, hostname, process.hrtime(t1));

        return response;
    }
}
