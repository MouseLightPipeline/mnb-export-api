import {createServer} from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

const debug = require("debug")("mdb:export-api:server");

import {ServiceOptions} from "./options/serviceOptions";

import {swcExportMiddleware} from "./middleware/swcExportMiddleware";
import {jsonExportMiddleware} from "./middleware/jsonExportMiddleware";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use("/swc", swcExportMiddleware);

app.use("/json", jsonExportMiddleware);

const server = createServer(app);

server.listen(ServiceOptions.serverOptions.port, () => {
    debug(`export server is now running with env ${ServiceOptions.envName} on http://localhost:${ServiceOptions.serverOptions.port}`);
});
