const configuration = {
    envName: "",
    dataPath: "/opt/data/export",
    serverOptions: {
        port: 9691
    }
};

function loadConfiguration() {
    const options = Object.assign({}, configuration);

    options.dataPath = process.env.EXPORT_DATA_PATH || options.dataPath;

    return options;
}

export const ServiceOptions = loadConfiguration();
