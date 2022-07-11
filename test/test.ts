const pako = require("pako");
const fs = require("fs");
const path = require("path");
const draco3d = require('draco3d');

console.log("Hello World");

// const test = { my: 'super', puper: [456, 567], awesome: 'pako' };

// const compressed = pako.deflate(JSON.stringify(test));

// const restored = JSON.parse(pako.inflate(compressed, { to: 'string' }));


let decoderModule = null;

// The code to create the encoder and decoder modules is asynchronous.
// draco3d.createDecoderModule will return a promise to a funciton with a
// module as a parameter when the module has been fully initialized.
// Create and set the decoder module.
draco3d.createDecoderModule({}).then(function (module) {
    // This is reached when everything is ready, and you can call methods on
    // Module.
    decoderModule = module;
    console.log('Decoder Module Initialized!');
    moduleInitialized();
});

function moduleInitialized() {

    const rootPath = "/Volumes/Spare/HarConversion/";

    const zLibRoot = path.join(rootPath, "zlib");

    const swcRoot = path.join(rootPath, "swc");

    if (!fs.existsSync(zLibRoot)) {
        fs.mkdirSync(swcRoot);
    }

    if (!fs.existsSync(zLibRoot)) {
        return;
    }

    const dirContents = fs.readdirSync(zLibRoot);

    dirContents.forEach(f => {
        if (!f.endsWith(".zlib")) {
            return;
        }

        const compressed = fs.readFileSync(path.join(zLibRoot, f));

        const restored = pako.inflate(compressed, {to: "buffer"});

        const decoder = new decoderModule.Decoder();

        const decodedGeometry = decodeDracoData(restored, decoder);

        const numPoints = decodedGeometry.num_points();

        console.log(`points: ${numPoints}`);
        // console.log(`attributes ${decodedGeometry.num_attributes()}`);

        const cols = [];

        for (let idx = 0; idx < decodedGeometry.num_attributes(); idx++) {
            const attr = decoder.GetAttribute(decodedGeometry, idx);
/*
            console.log(`Attribute ${idx}`);
            console.log(attr.attribute_type());
            console.log(attr.data_type());
            console.log(attr.num_components());
            console.log(attr.byte_stride());
            console.log(attr.byte_offset());
            console.log(attr.size());
*/
            let ia = null;

            switch (idx) {
                case 0:
                case 1:
                case 4:
                    ia = new decoderModule.DracoInt32Array();
                    decoder.GetAttributeInt32ForAllPoints(decodedGeometry, attr, ia);
                    break;
                case 2:
                case 3:
                    ia = new decoderModule.DracoFloat32Array();
                    decoder.GetAttributeFloatForAllPoints(decodedGeometry, attr, ia);
                    break;
                default:
                    continue;
            }

            const data = [];

            if (idx == 2) {
                for (let ndx = 0; ndx < numPoints; ndx++) {
                    const pos = [];

                    for (let jdx = 0; jdx < 3; jdx++) {
                        pos.push(ia.GetValue((ndx * 3) + jdx));
                    }

                    data.push(pos);
                }
            } else {
                for (let ndx = 0; ndx < numPoints; ndx++) {
                    data.push(ia.GetValue(ndx));
                }
            }

            cols.push(data);

            decoderModule.destroy(ia);
        }

        let data = [];

        for (let idx = 0; idx < numPoints; idx++) {
            data.push([cols[0][idx], cols[1][idx], cols[2][idx][0], cols[2][idx][1], cols[2][idx][2], cols[3][idx], cols[4][idx]])
        }

        data = data.sort((a, b) => a[0] - b[0]);

        const keyValues = new Map<number, number>();
        keyValues.set(-1, -1);

        data.map((d, idx) => keyValues.set(d[0], idx + 1));

        let swc = "";

        data.forEach(row => {
            swc += `${keyValues.get(row[0])} ${row[1]} ${row[2]} ${row[3]} ${row[4]} ${row[5]} ${keyValues.get(row[6])}\n`
        });

        const outputName = path.join(swcRoot, f.replace(".zlib", ""));

        fs.writeFileSync(outputName, swc);

        decoderModule.destroy(decoder);
        decoderModule.destroy(decodedGeometry);
    });

    /*
        fs.readFile('/Users/pedson/Downloads/bunny.drc', function(err, data) {
            if (err) {
                return console.log(err);
            }
            console.log("Decoding file of size " + data.byteLength + " ..");
            // Decode mesh
            const decoder = new decoderModule.Decoder();
            const decodedGeometry = decodeDracoData(data, decoder);
            // Encode mesh
            // encodeMeshToFile(decodedGeometry, decoder);

            decoderModule.destroy(decoder);
            decoderModule.destroy(decodedGeometry);
        });
     */

    console.log("done");
}

function decodeDracoData(rawBuffer, decoder) {
    const buffer = new decoderModule.DecoderBuffer();
    buffer.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
    const geometryType = decoder.GetEncodedGeometryType(buffer);

    let dracoGeometry;
    let status;
    if (geometryType === decoderModule.TRIANGULAR_MESH) {
        dracoGeometry = new decoderModule.Mesh();
        status = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
    } else if (geometryType === decoderModule.POINT_CLOUD) {
        dracoGeometry = new decoderModule.PointCloud();
        status = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
    } else {
        const errorMsg = 'Error: Unknown geometry type.';
        console.error(errorMsg);
    }
    decoderModule.destroy(buffer);

    return dracoGeometry;
}

