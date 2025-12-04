from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import requests
import os
from datetime import datetime

router = APIRouter(prefix="/weather", tags=["weather"])

# OpenWeatherMap API (or use another weather service)
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY", "")
WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"


@router.get("/forecast")
async def get_weather_forecast(
    lat: float = Query(...),
    lon: float = Query(...),
    date: Optional[str] = None
):
    """Get weather forecast for a location and optional date."""
    if not WEATHER_API_KEY:
        # Return mock data if API key not configured
        return {
            "condition": "Clear",
            "temperature": 75,
            "humidity": 60,
            "windSpeed": 10,
            "precipitation": 0,
            "forecast": "Sunny skies expected"
        }
    
    try:
        # For current weather
        params = {
            "lat": lat,
            "lon": lon,
            "appid": WEATHER_API_KEY,
            "units": "imperial"
        }
        
        response = requests.get(WEATHER_API_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        return {
            "condition": data["weather"][0]["main"],
            "description": data["weather"][0]["description"],
            "temperature": round(data["main"]["temp"]),
            "humidity": data["main"]["humidity"],
            "windSpeed": data["wind"].get("speed", 0),
            "precipitation": data.get("rain", {}).get("1h", 0),
            "forecast": data["weather"][0]["description"],
            "icon": data["weather"][0]["icon"]
        }
    except Exception as e:
        # Fallback to mock data on error
        return {
            "condition": "Clear",
            "temperature": 75,
            "humidity": 60,
            "windSpeed": 10,
            "precipitation": 0,
            "forecast": "Weather data unavailable"
        }


@router.get("/batch")
async def get_batch_weather(
    locations: str = Query(..., description="Comma-separated lat,lon pairs")
):
    """Get weather for multiple locations at once."""
    locations_list = locations.split(",")
    results = []
    
    for loc in locations_list:
        try:
            lat, lon = map(float, loc.strip().split(":"))
            weather = await get_weather_forecast(lat=lat, lon=lon)
            results.append({
                "location": {"lat": lat, "lon": lon},
                "weather": weather
            })
        except:
            continue
    
    return {"results": results}

