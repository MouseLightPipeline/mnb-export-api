const configuration = {
    port: 5000,
    dataPath: "/opt/data/export"
};

function loadConfiguration() {
    const options = Object.assign({}, configuration);


    options.port = parseInt(process.env.EXPORT_API_PORT) || options.port;
    options.dataPath = process.env.EXPORT_API_DATA_PATH || options.dataPath;

    return options;
}

export const ServiceOptions = loadConfiguration();
