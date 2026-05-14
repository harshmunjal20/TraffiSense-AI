import React, { useState, useEffect, useMemo } from "react";
import MapView from "./components/MapView";
import PredictionWidget from "./components/PredictionWidget";
import HighRiskZones from "./components/HighRiskZones";
import AlertsPanel from "./components/AlertsPanel";
import Chatbot from "./components/Chatbot";
import RoutePlanner from "./components/RoutePlanner";
import WeatherBadge from "./components/WeatherBadge";
import EmergencyPanel from "./components/EmergencyPanel";
import { getHeatmap } from "./api";
import "./App.css";

export default function App() {
  const [splash, setSplash] = useState(true);
  const [selectedRoadId, setSelectedRoadId] = useState(null);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [minutesAhead, setMinutesAhead] = useState(0);
  const [roads, setRoads] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [ecoRoute, setEcoRoute] = useState(null);
  const [aiRoute, setAiRoute] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyRouteActive, setEmergencyRouteActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleRouteDrawn = (data) => {
    if (!data) {
      setRouteData(null);
      setEcoRoute(null);
      setAiRoute(null);
      setActiveRoute(null);
      return;
    }
    if (data.fromName) setSource(data.fromName);
    if (data.toName) setDestination(data.toName);
    if (data.type === "fastest") setRouteData(data);
    else if (data.type === "eco") setEcoRoute(data);
    else if (data.type === "ai") setAiRoute(data);
  };

  const handleCardSelect = (routeObj) => setActiveRoute(routeObj);

  const selectedRoad = useMemo(() => {
    if (!selectedRoadId) return null;
    return roads.find((r) => r.id === selectedRoadId) || null;
  }, [roads, selectedRoadId]);

  const sliderLabel = minutesAhead === 0 ? "Now" : `+${minutesAhead} min`;

  return (
    <>
      {splash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#0f172a",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            animation: "fadeOut 0.5s ease 2s forwards",
          }}
        >
          <img
            src="/Logo.png"
            alt="TraffiSense"
            style={{
              height: "200px",
              width: "200px",
              objectFit: "contain",
              borderRadius: "42px",
              animation: "scaleIn 0.6s ease forwards",
            }}
          />
          <h1
            style={{
              color: "#38bdf8",
              fontSize: "2.5rem",
              marginTop: "140px",
              fontWeight: "bold",
            }}
          >
            TraffiSense AI
          </h1>
          <p style={{ color: "#64748b", marginTop: "8px" }}>
            Delhi Live Traffic Predictor
          </p>
        </div>
      )}

      <div className="app-container">
        <header className="header">
          <div className="header-left">
            <img
              src="/Logo.png"
              alt="TraffiSense"
              style={{
                height: "32px",
                width: "32px",
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
            <h1>TraffiSense AI</h1>
            <span className="header-sub">Delhi Live Traffic Predictor</span>
          </div>

          <button
            onClick={() => setShowHeatmap((p) => !p)}
            className="heatmap-toggle"
          >
            {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          </button>

          <button
            onClick={() => setEmergencyMode((p) => !p)}
            style={{
              background: emergencyMode ? "#dc2626" : "#7f1d1d",
              color: "white",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontWeight: "bold",
              cursor: "pointer",
              animation: emergencyMode ? "pulse 1s infinite" : "none",
            }}
          >
            {emergencyMode ? "🚨 EMERGENCY ACTIVE" : "🚑 Emergency Route"}
          </button>

          {emergencyRouteActive && (
            <button
              onClick={() => {
                setActiveRoute(null);
                setEmergencyRouteActive(false);
              }}
              style={{
                background: "#374151",
                color: "#ef4444",
                border: "1px solid #ef4444",
                padding: "6px 14px",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ✕ Clear Emergency
            </button>
          )}

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
            <WeatherBadge
              onWeatherChange={(wx) => console.log("weather:", wx)}
            />
            <span className="live-badge">● LIVE</span>
            <span className="header-time">{time}</span>
          </div>
        </header>

        <div className="dashboard">
          <div className="dashboard-main">
            <div className="map-container" style={{ position: "relative" }}>
              <MapView
                roads={showHeatmap ? roads : []}
                onRoadSelect={(road) => setSelectedRoadId(road.id)}
                activeRoute={activeRoute}
              />

              {emergencyMode && (
                <EmergencyPanel
                  onRouteDrawn={(route) => {
                    setActiveRoute(route);
                    setEmergencyRouteActive(true);
                  }}
                  onClose={() => setEmergencyMode(false)}
                />
              )}

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
                  onRouteDrawn={handleRouteDrawn}
                  onCardSelect={handleCardSelect}
                  minutesAhead={minutesAhead}
                  source={source}
                  setSource={setSource}
                  destination={destination}
                  setDestination={setDestination}
                  routeData={routeData}
                  ecoRoute={ecoRoute}
                  aiRoute={aiRoute}
                />
              </div>
              <div className="bottom-right">
                <Chatbot
                  onRouteDrawn={handleRouteDrawn}
                  onCardSelect={handleCardSelect}
                  roads={roads}
                  minutesAhead={minutesAhead}
                />
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
    </>
  );
}
