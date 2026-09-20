"use client";

import React, { useState, useEffect } from "react";
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Loader2,
  AlertCircle,
  Sun,
  Cloud,
  CloudRain,
  Compass,
} from "lucide-react";

export default function WeatherCard({
  latitude,
  longitude,
  destinationName = "Destination",
  className = "",
}) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const latNum = Number(latitude);
  const lonNum = Number(longitude);
  const hasValidCoords =
    !isNaN(latNum) &&
    !isNaN(lonNum) &&
    (latNum !== 0 || lonNum !== 0) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lonNum >= -180 &&
    lonNum <= 180;

  useEffect(() => {
    if (!hasValidCoords) {
      setLoading(false);
      return;
    }

    async function fetchWeather() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/weather?lat=${latNum}&lon=${lonNum}`);
        const data = await res.json();

        if (data.success && data.weather) {
          setWeather(data.weather);
        } else {
          setError(data.message || "Weather data unavailable");
        }
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Unable to connect to weather service");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [latitude, longitude, hasValidCoords]);

  // Missing or invalid coordinates state
  if (!hasValidCoords) {
    return (
      <div className={`p-5 rounded-3xl bg-secondaryBg border border-borderLine text-center space-y-2 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <CloudSun size={20} />
        </div>
        <p className="text-xs font-semibold text-mutedText">
          Weather information is unavailable for this destination.
        </p>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className={`p-6 rounded-3xl bg-white border border-borderLine shadow-sm flex flex-col items-center justify-center gap-3 py-10 ${className}`}>
        <Loader2 size={24} className="animate-spin text-coral-500" />
        <span className="text-xs font-semibold text-mutedText">
          Fetching live weather in {destinationName}...
        </span>
      </div>
    );
  }

  // Error State
  if (error || !weather) {
    return (
      <div className={`p-5 rounded-3xl bg-secondaryBg border border-borderLine text-center space-y-2 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
          <AlertCircle size={20} />
        </div>
        <p className="text-xs font-semibold text-primaryText">
          Weather Data Unavailable
        </p>
        <p className="text-[11px] text-mutedText max-w-xs mx-auto">
          {error || "Could not retrieve live forecast."}
        </p>
      </div>
    );
  }

  const { temperature, feelsLike, humidity, windSpeed, condition, description, icon } = weather;
  const weatherIconUrl = icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : null;

  return (
    <div className={`p-6 rounded-3xl bg-white border border-borderLine shadow-lg space-y-5 relative overflow-hidden group ${className}`}>
      {/* Background Subtle Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-coral-50 text-coral-500">
            <CloudSun size={18} />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-primaryText">
              Weather in {destinationName}
            </h4>
            <span className="text-[10px] text-mutedText uppercase tracking-wider font-semibold">Live Forecast</span>
          </div>
        </div>

        {weatherIconUrl && (
          <div className="relative w-12 h-12 shrink-0">
            <img
              src={weatherIconUrl}
              alt={condition}
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Main Temperature & Condition Banner */}
      <div className="flex items-baseline justify-between pt-1 pb-2 border-b border-borderLine/80">
        <div>
          <div className="font-display font-extrabold text-4xl text-primaryText tracking-tight">
            {temperature}°<span className="text-2xl text-coral-500 font-bold">C</span>
          </div>
          <p className="text-xs font-medium text-mutedText capitalize mt-0.5">
            {description || condition}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase text-mutedText font-semibold block">Feels Like</span>
          <span className="font-display font-bold text-base text-primaryText">
            {feelsLike}°C
          </span>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Humidity */}
        <div className="p-3 rounded-2xl bg-secondaryBg/80 border border-borderLine flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
            <Droplets size={16} />
          </div>
          <div>
            <span className="text-[10px] text-mutedText font-semibold block uppercase">Humidity</span>
            <span className="font-display font-bold text-sm text-primaryText">{humidity}%</span>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="p-3 rounded-2xl bg-secondaryBg/80 border border-borderLine flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600 shrink-0">
            <Wind size={16} />
          </div>
          <div>
            <span className="text-[10px] text-mutedText font-semibold block uppercase">Wind Speed</span>
            <span className="font-display font-bold text-sm text-primaryText">{windSpeed} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
