import express from "express"
import os from "os"
import 'dotenv/config'


const port = process.env.PORT

const app = express();



app.listen(port, () => {
    const networkInterfaces = os.networkInterfaces();
    let ipAddress;

    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (!iface.internal && iface.family === 'IPv4') {
                ipAddress = iface.address;
                break;
            }
        }
        if (ipAddress) {
            break;
        }
    }

    console.log(`Server is running on port http://localhost:${port}`);
    if (ipAddress) {
        console.log(`Locally connected to:  http://${ipAddress}:${port}`);
    } else {
        console.log('Unable to determine server IP address.');
    }
})


app.get('/', (req, res) => {
const ipAddress = os.networkInterfaces();
res.send(ipAddress)
})