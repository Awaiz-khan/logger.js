import express from "express"
import os from "os"
import 'dotenv/config'
import requestIp from "request-ip";
import ip from "ip";
import useragent from "useragent";
import device from 'express-device';
 import geoip  from 'geoip-lite';
import axios from 'axios';


import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { routes } from "./allRoutes.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
app.use(express.static(path.join(__dirname, '../build')));
app.use(requestIp.mw());





// Add all the routes to our Express server
// exported from routes/index.js
routes.forEach(route => {
    app[route.method](route.path, route.handler);
});

const port = process.env.PORT

export const startServer = () => {

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
}





app.get('/', (req, res) => {

let ipAddress=  ip.address()
ip.subnet('192.168.1.134', '255.255.255.192')
        res.send(`Your IP address is: ${ipAddress}`);


});


// Middleware to retrieve the IP address
app.use(requestIp.mw());

// Register the device middleware
app.use(device.capture());




app.get('/api/v1',async (req, res) => {
  try {
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    const parsedUserAgent = useragent.parse(userAgent);
    const browser = parsedUserAgent.family;
    const os = parsedUserAgent.os.toString();
  
   

    const isMobile = detectMobileDevice(req);
    const networkType = isMobile ? 'Mobile Connection' : getNetworkType(req);

    const deviceType = req.device.type || 'Unknown';
    const isPostman = detectPostman(req);
    const browserInfo = isPostman ? 'Postman' : browser;
    const isVpn = detectVPN(ip);
    const Description=   await userLocation(ip);
    const hostname = getHostName(req);
   
const isMobileVpn = MobileVpnDetection(req);
    res.send({
      ip,
      networkType,
      deviceType,
      browser: browserInfo,
      os,
      isVpn,
     
      isMobileVpn,
       Description
      
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

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
  return req.connection.localAddress === '127.0.0.1' || req.connection.localAddress === '::1';
};

const isLANConnection = (req) => {
  return isPrivateIP(req.connection.remoteAddress);
};

const isPrivateIP = (ip) => {
  const privateIPRanges = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    'fd00::/8',
  ];

  return privateIPRanges.some(range => {
    const [subnet, prefix] = range.split('/');
    const subnetParts = subnet.split('.');
    const ipParts = ip.split('.');

    const subnetBinary = subnetParts.map(part => (+part).toString(2).padStart(8, '0')).join('');
    const ipBinary = ipParts.map(part => (+part).toString(2).padStart(8, '0')).join('');

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
  const matchedProvider = vpnProviders.find(provider => geo && geo.isp && geo.isp.toLowerCase().includes(provider));
  if (matchedProvider) {
    return true;
  }
  
  // TODO: Add additional checks or conditions based on your VPN detection requirements
  const vpnRegions = ['Hong Kong', 'British Virgin Islands', 'Panama', 'Cyprus'];
  const matchedRegion = vpnRegions.find(region => geo && geo.country && geo.country.toLowerCase().includes(region.toLowerCase()));
  if (matchedRegion) {
    return true;
  }


  return false;
};



const userLocation = async (ip) => {
  const endpoint = `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,proxy,hosting,query`;

  const response = await fetch(endpoint);
  const data = await response.json();

  const { status, message, continent, continentCode, country, countryCode, region, regionName, city, district, zip, lat, lon, timezone, offset, currency, isp, org, as, asname, reverse,proxy, hosting, query } = data;

  return {
    status,
    message,
    continent,
    continentCode,
    country,
    countryCode,
    region,
    regionName,
    city,
    district,
    zip,
    lat,
    lon,
    timezone,
    offset,
    currency,
    isp,
    org,
    as,
    asname,
    reverse,
  
    proxy,
    //hosting,
   
  };
}

const getHostName = async (req) => {
  const hostname = await req.headers.host;
  return hostname;
}


const MobileVpnDetection = (req) => {
  const userAgent = req.headers['user-agent'];
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xRealIP = req.headers['x-real-ip'];

  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    // iOS device detected, check VPN status
    if (!xRealIP || xRealIP.startsWith('17.')) {
      return true; // VPN detected
    }
  } else if (userAgent.includes('Android')) {
    // Android device detected, check VPN status
    if (xForwardedFor && xForwardedFor.split(',').length > 1) {
      return true; // VPN detected
    }
  } else if (userAgent.includes('Macintosh') || userAgent.includes('Linux')) {
    // macOS or Linux device detected, check VPN status
    if (xForwardedFor && xForwardedFor.split(',').length === 1) {
      return true; // VPN detected
    }
  }
  
  return false; // VPN not detected
};



