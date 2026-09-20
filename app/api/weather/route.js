import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// In-memory server-side cache for weather responses (10 minutes TTL)
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    // 1. Validate presence of coordinates
    if (!lat || !lon) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude (lat) and Longitude (lon) query parameters are required",
        },
        { status: 400 }
      );
    }

    // 2. Validate numeric coordinate bounds
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (
      isNaN(latNum) ||
      isNaN(lonNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lonNum < -180 ||
      lonNum > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.",
        },
        { status: 400 }
      );
    }

    // 3. Check OpenWeather API key environment variable
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_openweather_api_key_here") {
      return NextResponse.json(
        {
          success: false,
          message: "OpenWeather API key is missing or not configured on the server",
        },
        { status: 500 }
      );
    }

    // 4. Check cache for recent result
    const cacheKey = `${latNum.toFixed(2)}_${lonNum.toFixed(2)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        weather: cached.data,
        cached: true,
      });
    }

    // 5. Call OpenWeather API (Metric units = Celsius, m/s)
    const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${encodeURIComponent(
      apiKey.trim()
    )}&units=metric`;

    const res = await fetch(openWeatherUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 401) {
        return NextResponse.json(
          { success: false, message: "Weather API authentication failed" },
          { status: 502 }
        );
      } else if (status === 404) {
        return NextResponse.json(
          { success: false, message: "Weather data not found for specified coordinates" },
          { status: 404 }
        );
      } else if (status === 429) {
        return NextResponse.json(
          { success: false, message: "Weather API rate limit reached. Please try again later." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, message: `Weather service error (${status})` },
        { status: 502 }
      );
    }

    const data = await res.json();

    // 6. Normalize response structure
    const main = data.main || {};
    const weatherArray = data.weather?.[0] || {};
    const wind = data.wind || {};

    const normalizedWeather = {
      temperature: Math.round(main.temp ?? 0),
      feelsLike: Math.round(main.feels_like ?? main.temp ?? 0),
      humidity: main.humidity ?? 0,
      windSpeed: Number((wind.speed ?? 0).toFixed(1)),
      condition: weatherArray.main || "Clear",
      description: weatherArray.description || "clear sky",
      icon: weatherArray.icon || "01d",
      cityName: data.name || "",
    };

    // Store in cache
    weatherCache.set(cacheKey, {
      timestamp: Date.now(),
      data: normalizedWeather,
    });

    return NextResponse.json({
      success: true,
      weather: normalizedWeather,
    });
  } catch (error) {
    console.error("GET /api/weather Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch weather data due to a server error",
      },
      { status: 500 }
    );
  }
}
