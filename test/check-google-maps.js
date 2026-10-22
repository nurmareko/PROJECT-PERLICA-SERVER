import process from 'node:process'
import { fileURLToPath } from 'node:url'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ silent: true})
const key = process.env.GOOGLE_MAPS_API_KEY?.trim()

function sanitize(value) {
  return String(value)
    .split(key)
    .join('[KEY HIDDEN]')
    .replace(/AIza[\w-]+/g, '[KEY HIDDEN]')
    .replace(/https?:\/\/\S+/g, '[Google link omitted]')
}

const checks = [
  {
    name: 'Routes API — Compute Routes',
    config: {
      method: 'POST',
      url: 'https://routes.googleapis.com/directions/v2:computeRoutes',
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
        'Content-Type': 'application/json',
      },
      data: {
        origin: { location: { latLng: { latitude: -6.1754, longitude: 106.8272 } } },
        destination: { location: { latLng: { latitude: -6.1256, longitude: 106.6559 } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
      },
    },
    report(response) {
      const route = response.data?.routes?.[0]
      if (response.status === 200 && route) {
        console.log('Google status: OK')
        console.log('Distance (meters):', sanitize(route.distanceMeters))
        console.log('Duration:', sanitize(route.duration))
        return true
      }
      console.log('Google status:', sanitize(response.data?.error?.status ?? 'No route returned'))
      console.log('Google message:', sanitize(response.data?.error?.message ?? 'Unexpected response.'))
      return false
    },
  },
  {
    name: 'Geocoding API',
    config: {
      method: 'GET',
      url: 'https://maps.googleapis.com/maps/api/geocode/json',
      params: { latlng: '-6.1754,106.8272', key },
    },
    report(response) {
      console.log('Google status:', sanitize(response.data?.status ?? response.data?.error?.status ?? 'Missing status'))
      console.log('Google message:', sanitize(response.data?.error_message ?? response.data?.error?.message ?? 'No error message returned.'))
      return response.status === 200 && response.data?.status === 'OK'
    },
  },
]

await Promise.all(checks.map(async (check) => {
  try {
    const response = await axios({
      ...check.config,
      timeout: 10000,
      validateStatus: () => true,
    })
    console.log(`\n=== ${check.name} ===`)
    console.log('HTTP status:', response.status)
    if (!check.report(response))
      process.exitCode = 1
  }
  catch {
    // Axios error objects contain credentials in their request configuration.
    console.error(`\n=== ${check.name} ===`)
    console.error('Network request failed or timed out. Request details hidden to protect credentials.')
    process.exitCode = 1
  }
}))
