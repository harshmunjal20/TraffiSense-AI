import React, { useState, useEffect, useMemo } from "react";
import MapView from "./components/MapView";
import PredictionWidget from "./components/PredictionWidget";
import HighRiskZones from "./components/HighRiskZones";
import AlertsPanel from "./components/AlertsPanel";
import Chatbot from "./components/Chatbot";
import RoutePlanner from "./components/RoutePlanner";
import { getHeatmap } from "./api";
import "./App.css";
import WeatherBadge from "./components/WeatherBadge";

export default function App() {
  const [selectedRoadId, setSelectedRoadId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [minutesAhead, setMinutesAhead] = useState(0);
  const [roads, setRoads] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const data = await getHeatmap(minutesAhead);
        setRoads(data);
      } catch (e) {
        console.warn("Heatmap fetch failed");
      }
    };
    fetchRoads();
    const interval = setInterval(fetchRoads, 30000);
    return () => clearInterval(interval);
  }, [minutesAhead]);

  const selectedRoad = useMemo(() => {
    if (!selectedRoadId) return null;
    return roads.find((r) => r.id === selectedRoadId) || null;
  }, [roads, selectedRoadId]);

  const sliderLabel = minutesAhead === 0 ? "Now" : `+${minutesAhead} min`;

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <span className="header-logo">🚦</span>
          <h1>TraffiSense AI</h1>
          <span className="header-sub">Delhi Live Traffic Predictor</span>
        </div>
        <div className="time-slider-wrap">
          <span className="slider-label-left">Now</span>
          <input
            type="range"
            min={0}
            max={60}
            step={15}
            value={minutesAhead}
            onChange={(e) => setMinutesAhead(Number(e.target.value))}
            className="time-slider"
          />
          <span className="slider-label-right">+60m</span>
          <span className="slider-current">{sliderLabel}</span>
        </div>
        <div className="header-right">
          <WeatherBadge onWeatherChange={(wx) => console.log("weather:", wx)} />
          <span className="live-badge">● LIVE</span>
          <span className="header-time">{time}</span>
        </div>
      </header>

      <div className="dashboard">
        <div className="dashboard-main">
          <div className="map-container" style={{ position: "relative" }}>
            <MapView
              roads={roads}
              onRoadSelect={(road) => setSelectedRoadId(road.id)}
              routeData={routeData}
            />
            <div className="map-legend">
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: "#22c55e" }}
                ></div>
                Low
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: "#f97316" }}
                ></div>
                Medium
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: "#ef4444" }}
                ></div>
                High
              </div>
              <div className="legend-item">
                <div
                  className="legend-dot"
                  style={{ background: "#7c3aed" }}
                ></div>
                Very High
              </div>
            </div>
          </div>
          <div className="bottom-row">
            <div className="bottom-left">
              <RoutePlanner
                onRouteDrawn={setRouteData}
                minutesAhead={minutesAhead}
              />
            </div>
            <div className="bottom-right">
              <Chatbot onRouteDrawn={setRouteData} roads={roads} />
            </div>
          </div>
        </div>
        <div className="dashboard-side">
          <PredictionWidget road={selectedRoad} minutesAhead={minutesAhead} />
          <HighRiskZones roads={roads} />
          <AlertsPanel roads={roads} />
        </div>
      </div>
    </div>
  );
}
