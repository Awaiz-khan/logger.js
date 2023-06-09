
import axios from "axios";

export const basicRoutes = {
    path: '/api/get-ip',
    method: 'get',
    handler: async (req, res) => {
        try {
            const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const response = await axios.get(`https://geolocation-api.com/ip/${ipAddress}`);
            const { country, region, city } = response.data;
        
            res.send(`Your location: ${city}, ${region}, ${country}`);
          } catch (error) {
            res.status(500).send('Error retrieving location');
          }
    }
}
