import {createServer} from "http";
import * as express from "express";
import * as bodyParser from "body-parser";

const debug = require("debug")("mnb:export-api:server");

import {ServiceOptions} from "./options/serviceOptions";

import {swcExportMiddleware} from "./middleware/swcExportMiddleware";
import {jsonExportMiddleware} from "./middleware/jsonExportMiddleware";
import * as os from "os";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(bodyParser.json());

app.use("/swc", swcExportMiddleware);

app.use("/json", jsonExportMiddleware);

const server = createServer(app);

server.listen(ServiceOptions.port, () => {
    debug(`listening at http://${os.hostname()}:${ServiceOptions.port}/`);
});
