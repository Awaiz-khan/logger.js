app.get('/map-preview', async (req, res) => {
    const { lat, lng } = req.query; // Get latitude and longitude from query parameters
  
    try {
      const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x400&key=${apiKey}`;
  
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const image = Buffer.from(response.data, 'binary');
  
      res.set('Content-Type', 'image/png');
      res.send(image);
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send('An error occurred.');
    }
  });
  

/**
 Now, your Node.js server should be running on the specified port (e.g., 3000). You can access the Google Maps preview image by making a GET request to http://localhost:3000/map-preview?lat=LATITUDE&lng=LONGITUDE, replacing LATITUDE and LONGITUDE with the desired location coordinates.

For example, if you want a preview of the location with latitude 37.7749 and longitude -122.4194, you would make a GET request to http://localhost:3000/map-preview?lat=37.7749&lng=-122.4194.

Note: This implementation fetches the static map image using the Google Maps Static Maps API. Make sure to comply with the API usage limits and terms of service defined by Google.
 */