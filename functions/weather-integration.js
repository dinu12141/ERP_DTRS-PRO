/**
 * Cloud Function: Fetch weather data for schedule entries
 * Triggered when a schedule entry is created or updated
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

const WEATHER_API_KEY = functions.config().weather?.api_key || '';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Geocode address to coordinates (simplified - use actual geocoding service in production)
 */
async function geocodeAddress(address) {
  // In production, use Google Geocoding API or similar
  // For now, return default coordinates
  return { lat: 39.7392, lon: -104.9903 }; // Denver, CO default
}

/**
 * Fetch weather data from API
 */
async function fetchWeather(lat, lon, date) {
  if (!WEATHER_API_KEY) {
    // Return mock data if API key not configured
    return {
      condition: 'Clear',
      temperature: 75,
      humidity: 60,
      windSpeed: 10,
      precipitation: 0,
      forecast: 'Sunny skies expected'
    };
  }

  try {
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        lat,
        lon,
        appid: WEATHER_API_KEY,
        units: 'imperial'
      },
      timeout: 5000
    });

    const data = response.data;
    return {
      condition: data.weather[0].main,
      description: data.weather[0].description,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed || 0,
      precipitation: data.rain?.['1h'] || 0,
      forecast: data.weather[0].description,
      icon: data.weather[0].icon,
      fetchedAt: admin.firestore.FieldValue.serverTimestamp()
    };
  } catch (error) {
    console.error('Weather API error:', error);
    return {
      condition: 'Unknown',
      temperature: null,
      error: 'Failed to fetch weather data'
    };
  }
}

/**
 * Cloud Function: Update weather when schedule entry is created/updated
 */
exports.updateScheduleWeather = functions.firestore
  .document('schedule/{scheduleId}')
  .onWrite(async (change, context) => {
    const scheduleData = change.after.exists ? change.after.data() : null;
    
    if (!scheduleData) {
      return null; // Document deleted
    }

    // Skip if weather already exists and is recent (within 1 hour)
    if (scheduleData.weather && scheduleData.weather.fetchedAt) {
      const fetchedTime = scheduleData.weather.fetchedAt.toDate();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (fetchedTime > oneHourAgo) {
        return null; // Weather data is still fresh
      }
    }

    // Get job to get address
    const jobRef = admin.firestore().collection('jobs').doc(scheduleData.jobId);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) {
      console.error('Job not found for schedule entry');
      return null;
    }

    const jobData = jobDoc.data();
    const address = jobData.address;

    if (!address) {
      console.error('Job address not found');
      return null;
    }

    // Geocode address to get coordinates
    const { lat, lon } = await geocodeAddress(address);

    // Fetch weather data
    const weather = await fetchWeather(lat, lon, scheduleData.date);

    // Update schedule entry with weather data
    return change.after.ref.update({
      weather: weather
    });
  });

/**
 * Cloud Function: Batch update weather for multiple schedule entries
 * Can be triggered manually or on a schedule
 */
exports.batchUpdateWeather = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const date = data.date || new Date().toISOString().split('T')[0];
  const scheduleRef = admin.firestore().collection('schedule');
  const snapshot = await scheduleRef.where('date', '==', date).get();

  const updates = [];
  for (const doc of snapshot.docs) {
    const scheduleData = doc.data();
    
    // Get job address
    const jobRef = admin.firestore().collection('jobs').doc(scheduleData.jobId);
    const jobDoc = await jobRef.get();
    
    if (!jobDoc.exists) continue;
    
    const jobData = jobDoc.data();
    const address = jobData.address;
    if (!address) continue;

    // Geocode and fetch weather
    const { lat, lon } = await geocodeAddress(address);
    const weather = await fetchWeather(lat, lon, scheduleData.date);

    updates.push(doc.ref.update({ weather }));
  }

  await Promise.all(updates);
  return { updated: updates.length };
});

