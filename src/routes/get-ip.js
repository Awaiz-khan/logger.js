
import os from 'os';

export const basicRoutes = {
    path: '/api/get-ip',
    method: 'get',
    handler: async (req, res) => {
        const ipAddress = os.networkInterfaces();
    res.send(ipAddress);
    }
}