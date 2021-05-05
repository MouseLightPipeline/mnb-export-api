import {MetricsStorageManager} from "../metricsStorageManager";

export enum ExportFormat {
    Swc = 0,
    Json = 1
}

export enum CcfVersion {
    Janelia25,
    Aibs2017
}

export interface IExportResponse {
    contents: any;
    filename: string;
}

export abstract class ExportCacheBase {
    protected _cache = new Map<string, string>();

    private readonly _ccfVersion: CcfVersion;

    public get CcfVersion(): CcfVersion {
        return this._ccfVersion;
    }

    private readonly _exportFormat: ExportFormat;

    public get ExportFormat(): ExportFormat {
        return this._exportFormat;
    }

    protected constructor(ccfVersion: CcfVersion, exportFormat: ExportFormat) {
        this._ccfVersion = ccfVersion;
        this._exportFormat = exportFormat;
    }

    public abstract loadContents(): ExportCacheBase;

    public findContents(ids: string[], hostname: string): Promise<IExportResponse> {
        return null;
    }

    protected async logMetrics(ids: string[], hostname: string, duration: [number, number]): Promise<void> {
        await MetricsStorageManager.Instance().logExport({
            host: hostname,
            userId: "(unknown)",
            format: this.ExportFormat,
            ccfVersion: this.CcfVersion,
            ids: ids.join(", "),
            userName: "(unknown)",
            duration: duration[0] + duration[1] / 1000000000
        });
    }
}
