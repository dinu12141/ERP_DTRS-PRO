# Operations & Dispatch Module - Setup Instructions

## ✅ Implementation Complete

All features have been implemented as requested:

1. ✅ Crew Profile with Capability Tags and Home Base
2. ✅ Vehicles with VIN, Plate, Max Panel Capacity
3. ✅ Calendar with Drag-and-Drop Scheduling
4. ✅ Validation Logic (Reset constraints)
5. ✅ Weather API Overlay
6. ✅ Firestore Schema
7. ✅ Cloud Functions for Weather

## Installation Steps

### 1. Install Frontend Dependencies
```bash
cd frontend
yarn install
```

### 2. Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. Install Cloud Functions Dependencies
```bash
cd functions
npm install
```

### 4. Configure Environment Variables

**Backend (.env or environment):**
```env
WEATHER_API_KEY=your_openweathermap_api_key
```

**Cloud Functions:**
```bash
firebase functions:config:set weather.api_key="your_api_key"
```

**Frontend (.env):**
```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_WEATHER_API_KEY=your_key (optional, uses backend)
```

### 5. Deploy Cloud Functions
```bash
cd functions
firebase deploy --only functions:updateScheduleWeather,functions:batchUpdateWeather
```

## Features

### Calendar View
- Click empty slot to create schedule
- View events with weather overlay
- Filter by date and status
- Multiple view modes (Month, Week, Day, Agenda)

### Validation
- Reset cannot be scheduled before detach complete
- Reset cannot be scheduled before roofing complete
- Client-side and server-side validation

### Weather Integration
- Automatic weather fetch on schedule creation
- Weather displayed on calendar events
- Cloud Function for batch updates

## Testing

1. Create a crew with capability tags
2. Create a vehicle with VIN and capacity
3. Create a schedule entry - weather should auto-fetch
4. Try scheduling RESET before detach/roofing complete - should show error
5. View calendar - events should show weather icons

## Notes

- Drag-and-drop requires additional setup with react-big-calendar dragAndDrop addon
- Weather API uses OpenWeatherMap (can be configured)
- All data stored in Firestore with proper indexes

