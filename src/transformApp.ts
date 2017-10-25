import {createServer} from "http";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as compression from "compression";

const debug = require("debug")("ndb:transform:server");

import {ServiceOptions} from "./serviceOptions";

import {swcExportMiddleware} from "./swxExportMiddleware";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

// app.use(compression);

app.use("/swc", swcExportMiddleware);

app.use("/json", swcExportMiddleware);

const server = createServer(app);

server.listen(ServiceOptions.serverOptions.port, () => {
    debug(`export server is now running with env ${ServiceOptions.envName} on http://localhost:${ServiceOptions.serverOptions.port}`);
});
