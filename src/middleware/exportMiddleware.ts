import {CcfVersion, ExportFormat, ExportCacheBase} from "../export/exportCacheBase";
import {JsonExportCache} from "../export/jsonExportCache";
import {SwcExportCache} from "../export/swcExportCache";

const swcExport25 = (new SwcExportCache(CcfVersion.Janelia25)).loadContents();
const swcExport30 = (new SwcExportCache(CcfVersion.Aibs2017)).loadContents();

const swcMap = new Map<CcfVersion, ExportCacheBase>();
swcMap.set(CcfVersion.Janelia25, swcExport25);
swcMap.set(CcfVersion.Aibs2017, swcExport30);

const jsonExport25 = (new JsonExportCache(CcfVersion.Janelia25)).loadContents();
const jsonExport30 = (new JsonExportCache(CcfVersion.Aibs2017)).loadContents();

const jsonMap = new Map<CcfVersion, ExportCacheBase>();
jsonMap.set(CcfVersion.Janelia25, jsonExport25);
jsonMap.set(CcfVersion.Aibs2017, jsonExport30);

const map = new Map<ExportFormat, Map<CcfVersion, ExportCacheBase>>();
map.set(ExportFormat.Swc, swcMap);
map.set(ExportFormat.Json, jsonMap);

export async function exportMiddleware(req, res) {
    const format = req.body.format as ExportFormat ?? ExportFormat.Swc;

    const ccfVersion = (req.body.ccfVersion as CcfVersion) ?? CcfVersion.Janelia25;

    const source = (map.get(format)).get(ccfVersion);

    const response = await source.findContents(req.body.ids, req.headers["x-forwarded-for"] || req.connection.remoteAddress)

    res.json(response);
}
