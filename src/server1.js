import express from 'express';
import os from 'os';
import 'dotenv/config';
import requestIp from 'request-ip';
import ip from 'ip';
import useragent from 'useragent';
import device from 'express-device';
import geoip from 'geoip-lite';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { routes } from './allRoutes.js';
import crypto from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, '../build')));
app.use(requestIp.mw());
app.use(cookieParser());

// Add all the routes to our Express server
routes.forEach((route) => {
  app[route.method](route.path, route.handler);
});

const port = process.env.PORT;

const uri = 'mongodb://localhost:27017';
const dbName = 'your-database-name';
const collectionName = 'responses';

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

export const startServer = () => {
  // Connect to MongoDB
  // client.connect((err) => {
  //   if (err) {
  //     console.error('Failed to connect to MongoDB', err);
  //     return;
  //   }

  //   console.log('Connected to MongoDB');

  // Start the server
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
  });
};

app.get('/', (req, res) => {
  const ipAddress = ip.address();
  ip.subnet('192.168.1.134', '255.255.255.192');
  res.send(`Your IP address is: ${ipAddress}`);
});

// Middleware to retrieve the IP address
app.use(requestIp.mw());

// Register the device middleware
app.use(device.capture());

const userLocationCache = new Map();
const responseCache = {};
app.get('/api/v1', async (req, res) => {
  try {
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    // Check if the stored IP matches the request IP
    const storedIP = req.cookies.ipAddress;
    if (storedIP === ip) {
      const encryptedResponseData = req.cookies.responseData;
      if (encryptedResponseData) {
        const decryptedResponseData = decryptCookie(encryptedResponseData, 'secretKey');
        if (decryptedResponseData) {
          const cachedResponse = JSON.parse(decryptedResponseData);

          // Return the cached response without calculating response time
          res.send(cachedResponse);
          return; // Return early to skip the remaining code
        }
      }
    }

    const parsedUserAgent = useragent.parse(userAgent);
    const browser = parsedUserAgent.family;
    const os = parsedUserAgent.os.toString();

    const isMobile = detectMobileDevice(req);
    const networkType = isMobile ? 'Mobile Connection' : getNetworkType(req);

    const deviceType = req.device.type || 'Unknown';
    const isPostman = detectPostman(req);
    const browserInfo = isPostman ? 'Postman' : browser;
    const isVpn = detectVPN(ip);

    // Check if user location is cached
    let description = userLocationCache.get(ip);
    if (!description) {
      description = await userLocation(ip, res);
      userLocationCache.set(ip, description);
    }

    const responseData = {
      ip,
      networkType,
      deviceType,
      browser: browserInfo,
      os,
      isVpn,
      description,
    };

    const responseStartTime = new Date().getTime(); // Record the response start time

    // Encrypt and store the response data in cookies
    const encryptedResponseData = encryptCookie(JSON.stringify(responseData), 'secretKey');
    if (encryptedResponseData) {
      res.cookie('ipAddress', ip, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
      res.cookie('responseData', encryptedResponseData, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
    }

    const responseEndTime = new Date().getTime(); // Record the response end time
    const responseTime = responseEndTime - responseStartTime; // Calculate the response time in milliseconds
    responseData.responseTime = `${responseTime}ms`; // Format the response time with 'ms'

    res.send(responseData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Encrypt cookie data
const encryptCookie = (data, secretKey) => {
  try {
    const encryptedData = crypto.AES.encrypt(data, secretKey).toString();
    return encryptedData;
  } catch (error) {
    console.error('Failed to encrypt cookie data:', error);
    return null;
  }
};

// Decrypt cookie data
const decryptCookie = (encryptedData, secretKey) => {
  try {
    const bytes = crypto.AES.decrypt(encryptedData, secretKey);
    const decryptedData = bytes.toString(crypto.enc.Utf8);
    return decryptedData;
  } catch (error) {
    console.error('Failed to decrypt cookie data:', error);
    return null;
  }
};

const getClientIP = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = forwardedFor ? forwardedFor.split(',')[0] : req.connection.remoteAddress;
  return ip;
};

const detectMobileDevice = (req) => {
  const userAgent = req.headers['user-agent'];
  return /Mobi/.test(userAgent);
};

const detectPostman = (req) => {
  const userAgent = req.headers['user-agent'];
  return /PostmanRuntime/.test(userAgent);
};

const getNetworkType = (req) => {
  if (isLocalhost(req)) {
    return 'Localhost';
  } else if (isLANConnection(req)) {
    return 'LAN Connection';
  } else if (isPrivateIP(req.connection.remoteAddress)) {
    return 'Private Network Connection';
  } else {
    return 'Public Network Connection';
  }
};

const isLocalhost = (req) => {
  const remoteAddress = req.connection.remoteAddress;
  const forwardedFor = req.headers['x-forwarded-for'];
  const ips = forwardedFor ? forwardedFor.split(',') : [];
  ips.push(remoteAddress);

  return (
    ips.includes('127.0.0.1') ||
    ips.includes('::1') ||
    ips.includes('::ffff:127.0.0.1') ||
    ips.includes('localhost') ||
    ips.includes('0.0.0.0') ||
    ips.includes('::')
  );
};


const isLANConnection = (req) => {
  return isPrivateIP(req.connection.remoteAddress);
};

const isPrivateIP = (ip) => {
  const privateIPRanges = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fd00::/8'];

  return privateIPRanges.some((range) => {
    const [subnet, prefix] = range.split('/');
    const subnetParts = subnet.split('.');
    const ipParts = ip.split('.');

    const subnetBinary = subnetParts.map((part) => (+part).toString(2).padStart(8, '0')).join('');
    const ipBinary = ipParts.map((part) => (+part).toString(2).padStart(8, '0')).join('');

    return ipBinary.slice(0, prefix) === subnetBinary.slice(0, prefix);
  });
};

const detectVPN = (ip) => {
  const geo = geoip.lookup(ip);

  // Check if the IP is associated with a VPN provider
  if (geo && geo.isp && geo.isp.toLowerCase().includes('vpn')) {
    return true;
  }

  // Add additional checks or conditions based on your VPN detection requirements
  const vpnProviders = ['expressvpn', 'nordvpn', 'cyberghost', 'surfshark'];
  const matchedProvider = vpnProviders.find((provider) => geo && geo.isp && geo.isp.toLowerCase().includes(provider));
  if (matchedProvider) {
    return true;
  }

  // TODO: Add additional checks or conditions based on your VPN detection requirements
  const vpnRegions = ['Hong Kong', 'British Virgin Islands', 'Panama', 'Cyprus'];
  const matchedRegion = vpnRegions.find(
    (region) => geo && geo.country && geo.country.toLowerCase().includes(region.toLowerCase())
  );
  if (matchedRegion) {
    return true;
  }

  return false;
};

// Define async function userLocation with parameters ip and res
const userLocation = async (ip, res) => {
  // Check if userLocationCache has ip key
  if (userLocationCache.has(ip)) {
    // Return value associated with ip key
    return userLocationCache.get(ip);
  }

  // Define endpoint using ip-api.com and ip parameter
  const endpoint = `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,proxy,hosting,query`;

  try {
    // Send GET request to endpoint using axios library
    const { data } = await axios.get(endpoint);

    // Remove query key from data object and create new object with remaining properties
    const locationData = Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'query'));

    // Set cookie options
    const cookieOptions = {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true
    };

    // Set cookie with name userLocation, value locationData, and options cookieOptions
    res.cookie('userLocation', locationData, cookieOptions);

    // Set ip key in userLocationCache with value locationData
    userLocationCache.set(ip, locationData);

    // Return locationData object
    return locationData;
  } catch (error) {
    // Send error message with status 500
    res.status(500).send({
      status: false,
      message: error.message
    });
  }
};

// To retrieve the user location data from the cookie:

app.get('/cookies', (req, res) => {
  const userLocation = req.cookies.userLocation;
  res.send(userLocation);
});
