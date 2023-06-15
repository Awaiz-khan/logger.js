import requestIp from "request-ip";
import useragent from "useragent";
import express from 'express';
import device from 'express-device';

const app = express();

// Middleware to retrieve the IP address
app.use(requestIp.mw());

// Register the device middleware
app.use(device.capture());

export const basicRoutes = {
  path: '/api/get-ip',
  method: 'get',
  handler: async (req, res) => {
    try {
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const parsedUserAgent = useragent.parse(userAgent);
      const browser = parsedUserAgent.family;
      const os = parsedUserAgent.os.toString();

      const isMobile = detectMobileDevice(req);
      const networkType = isMobile ? 'Mobile Connection' : 'Wi-Fi Connection';

      const deviceType = req.device.type || 'Unknown';
      const deviceModel = req.device.model || 'Unknown';

      res.send(`Your IP address is: ${ip}\nNetwork Type: ${networkType}\nDevice: ${deviceType} ${deviceModel}\nBrowser: ${browser}\nOS: ${os}`);
    } catch (error) {
      res.status(500).send(error.message);
    }
  }
};

// Function to extract client IP address
const getClientIP = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = forwardedFor ? forwardedFor.split(',')[0] : req.connection.remoteAddress;
  return ip;
};

// Refactored function to detect if the client is using a mobile device
const detectMobileDevice = (req) => {
  const userAgent = req.headers['user-agent'];
  return /Mobi/.test(userAgent);
};