import maxmind from 'maxmind';
import path from 'path';

// Path to the GeoLite2-City.mmdb file
const databasePath = path.resolve('PATH_TO_GEOIP_CITY_DATABASE');

// Function to retrieve location information
async function getLocationInfo(ipAddress) {
  try {
    const reader = await maxmind.open(databasePath);
    const response = await reader.city(ipAddress);

    const { traits, continent, country, subdivisions, city, postal, location } = response;

    const { iso_code: region_code, names: { en: region_name } } = subdivisions[0];
    const { iso_code: calling_code, is_in_european_union: is_eu, languages, ...rest } = country;
    const { ip_address_type: type, ...traitsRest } = traits;

    return {
      ip: ipAddress,
      type,
      continent_code: continent.code,
      continent_name: continent.names.en,
      country_code: rest.iso_code,
      country_name: rest.names.en,
      region_code,
      region_name,
      city: city.names.en,
      zip: postal.code,
      latitude: location.latitude,
      longitude: location.longitude,
      location: {
        geoname_id: city.geoname_id,
        capital: rest.capital,
        languages: languages.map(({ iso_code: code, names: { en: name, [code]: native } }) => ({ code, name, native })),
        country_flag: rest.country_flag,
        country_flag_emoji: rest.country_flag_emoji,
        country_flag_emoji_unicode: rest.country_flag_emoji_unicode,
        calling_code,
        is_eu
      }
    };
  } catch (error) {
    console.error('Error retrieving location information:', error);
    return null;
  }
}

// Usage
const ipAddress = '134.201.250.155'; // Replace with the user's IP address
getLocationInfo(ipAddress)
  .then(locationInfo => {
    console.log(locationInfo);
    // Access specific properties like locationInfo.region_name, locationInfo.city, etc.
  });
