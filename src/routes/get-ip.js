
import axios from "axios";
import requestIp from "request-ip";
import express from "express";

const app = express();

// Middleware to retrieve the IP address
app.use(requestIp.mw());

// export const basicRoutes = {
//     path: '/api/get-ip',
//     method: 'get',
//     handler: async (req, res) => {
//         try {
//             const clientIp = req.clientIp;
//             console.log(clientIp);
//             res.send(`Your IP address is: ${clientIp}`);

//             // const response = await axios.get(`https://geolocation-api.com/ip/${ipAddress}`);
//             // const { country, region, city } = response.data;

//             // res.send(`Your location: ${city}, ${region}, ${country}`);
//           } catch (error) {
//             res.status(500).send('Error retrieving location');
//           }
//     }
// }



export const basicRoutes = {
  path: '/api/get-ip',
  method: 'get',
  handler: async (req, res) => {
    try {
      var ip;
      if (req.headers['x-forwarded-for']) {
        ip = req.headers['x-forwarded-for'].split(",")[0];
      } else if (req.connection && req.connection.remoteAddress) {
        ip = req.connection.remoteAddress;
      } else {
        ip = req.ip;
      } console.log("client IP is *********************" + ip);
      res.send(`Your IP address is: ${ip}`);
    } catch (error) {
      res.status(500).send('Error retrieving location');
    }
  }
}