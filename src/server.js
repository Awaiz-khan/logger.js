import express from "express"
import os from "os"
import 'dotenv/config'

import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { routes } from "./allRoutes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, '../build')));

// Add all the routes to our Express server
// exported from routes/index.js
routes.forEach(route => {
    app[route.method](route.path, route.handler);
});

const port = process.env.PORT

export const startServer=()=>{
 
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

}



