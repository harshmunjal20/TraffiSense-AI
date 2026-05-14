import React, { useEffect, useState } from 'react';

const WX_ICONS = { 0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️', 45:'🌫️', 48:'🌫️', 51:'🌦️', 61:'🌧️', 63:'🌧️', 65:'🌧️', 80:'🌦️', 95:'⛈️' };

const WX_ICONS_NIGHT = { 0:'🌙', 1:'🌙', 2:'☁️', 3:'☁️', 45:'🌫️', 48:'🌫️', 51:'🌧️', 61:'🌧️', 63:'🌧️', 65:'🌧️', 80:'🌧️', 95:'⛈️' };

const getIcon = (code, hour) => {
  const isNight = hour >= 20 || hour <= 5;
  if (isNight) return WX_ICONS_NIGHT[code] || '🌙';
  return WX_ICONS[code] || '🌡️';
};

export default function WeatherBadge({ onWeatherChange }) {
  const [wx, setWx] = useState(null);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current=temperature_2m,weathercode,windspeed_10m&timezone=Asia/Kolkata')
      .then(r => r.json())
      .then(d => {
        const c = d.current;
        const weather = { temp: Math.round(c.temperature_2m), code: c.weathercode, wind: Math.round(c.windspeed_10m) };
        setWx(weather);
        if (onWeatherChange) onWeatherChange(weather);
      })
      .catch(() => {});
  }, []);

  if (!wx) return null;

  const hour = new Date().getHours();
  const icon = getIcon(wx.code, hour);
  const isRain = [51,61,63,65,80,95].includes(wx.code);

  return (
    <div className="weather-badge" style={{ borderColor: isRain ? '#f97316' : 'rgba(255,255,255,0.15)' }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span className="wx-temp">{wx.temp}°C</span>
      {isRain && <span className="wx-warn">Rain ↓ confidence</span>}
    </div>
  );
}