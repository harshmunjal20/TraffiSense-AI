import React, { useState } from "react";

const DELHI_LOCATIONS = [
  { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
  { name: "Chandni Chowk", lat: 28.6562, lng: 77.231 },
  { name: "Anand Vihar", lat: 28.6469, lng: 77.3159 },
  { name: "Lajpat Nagar", lat: 28.5677, lng: 77.2436 },
  { name: "Karol Bagh", lat: 28.6514, lng: 77.1907 },
  { name: "Rohini Sector 10", lat: 28.7331, lng: 77.12 },
  { name: "Dwarka Expressway", lat: 28.5921, lng: 77.046 },
  { name: "Noida Link Road", lat: 28.5673, lng: 77.321 },
  { name: "ITO Crossing", lat: 28.6289, lng: 77.2403 },
  { name: "Akshardham", lat: 28.6127, lng: 77.2773 },
  { name: "Dhaula Kuan", lat: 28.5933, lng: 77.1568 },
  { name: "Saket", lat: 28.5245, lng: 77.2066 },
  { name: "India Gate", lat: 28.6129, lng: 77.2295 },
  { name: "IGI Airport", lat: 28.5562, lng: 77.1 },
  { name: "Cyber Hub Gurgaon", lat: 28.4959, lng: 77.0882 },
  { name: "Sector 18 Noida", lat: 28.5706, lng: 77.324 },
  { name: "Shahdara", lat: 28.6694, lng: 77.2887 },
  { name: "Pitampura", lat: 28.7005, lng: 77.15 },
  { name: "Vasant Kunj", lat: 28.5215, lng: 77.158 },
];

const HOSPITALS = [
  { name: "AIIMS Delhi", lat: 28.5672, lng: 77.21 },
  { name: "RML Hospital", lat: 28.6271, lng: 77.2182 },
  { name: "Safdarjung Hospital", lat: 28.5689, lng: 77.2075 },
  { name: "GTB Hospital", lat: 28.6814, lng: 77.321 },
  { name: "Max Saket", lat: 28.5245, lng: 77.21 },
  { name: "Fortis Gurgaon", lat: 28.4595, lng: 77.0266 },
];

const FIRE_STATIONS = [
  { name: "Fire Station Connaught Place", lat: 28.633, lng: 77.2194 },
  { name: "Fire Station Karol Bagh", lat: 28.652, lng: 77.195 },
  { name: "Fire Station Lajpat Nagar", lat: 28.565, lng: 77.243 },
  { name: "Fire Station Dwarka", lat: 28.589, lng: 77.059 },
  { name: "Fire Station Shahdara", lat: 28.67, lng: 77.295 },
  { name: "Fire Station Noida", lat: 28.5706, lng: 77.321 },
];

const getDistance = (a, b) => {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
};

const fetchOSRM = async (from, to) => {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes?.[0]) {
    return {
      coords: data.routes[0].geometry.coordinates.map(([lng, lat]) => [
        lat,
        lng,
      ]),
      duration: Math.round(data.routes[0].duration / 60),
      distance: (data.routes[0].distance / 1000).toFixed(1),
    };
  }
  return null;
};

export default function EmergencyPanel({ onRouteDrawn, onClose }) {
  const [fromLocation, setFromLocation] = useState("");
  const [emergencyType, setEmergencyType] = useState("hospital");
  const [loading, setLoading] = useState(false);

  const handleDispatch = async () => {
    const from = DELHI_LOCATIONS.find((l) => l.name === fromLocation);
    if (!from) return;

    setLoading(true);

    const facilities = emergencyType === "hospital" ? HOSPITALS : FIRE_STATIONS;

    const nearest = facilities.reduce((closest, facility) => {
      return getDistance(from, facility) < getDistance(from, closest)
        ? facility
        : closest;
    }, facilities[0]);

    const route = await fetchOSRM(from, nearest);

    if (route) {
      onRouteDrawn({ coords: route.coords, color: "#ff0000", weight: 8 });
      onClose();
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "60px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1a1a2e",
        border: "2px solid #ff0000",
        borderRadius: "12px",
        padding: "20px",
        zIndex: 9999,
        width: "340px",
        boxShadow: "0 0 30px rgba(255,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <h3 style={{ color: "#ff4444", margin: 0 }}>🚨 Emergency Dispatch</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label style={{ color: "#aaa", fontSize: "12px" }}>YOUR LOCATION</label>
        <select
          value={fromLocation}
          onChange={(e) => setFromLocation(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            background: "#0f0f23",
            color: "#fff",
            border: "1px solid #333",
            marginTop: "4px",
          }}
        >
          <option value="">Select your location...</option>
          {DELHI_LOCATIONS.map((l) => (
            <option key={l.name}>{l.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <label style={{ color: "#aaa", fontSize: "12px" }}>
          EMERGENCY TYPE
        </label>
        <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
          <button
            onClick={() => setEmergencyType("hospital")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              cursor: "pointer",
              background: emergencyType === "hospital" ? "#7f1d1d" : "#0f0f23",
              color: "#fff",
              border:
                emergencyType === "hospital"
                  ? "1px solid #ff4444"
                  : "1px solid #333",
              fontWeight: emergencyType === "hospital" ? "bold" : "normal",
            }}
          >
            🏥 Hospital
          </button>
          <button
            onClick={() => setEmergencyType("fire")}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              cursor: "pointer",
              background: emergencyType === "fire" ? "#7f1d1d" : "#0f0f23",
              color: "#fff",
              border:
                emergencyType === "fire"
                  ? "1px solid #ff4444"
                  : "1px solid #333",
              fontWeight: emergencyType === "fire" ? "bold" : "normal",
            }}
          >
            🔥 Fire Station
          </button>
        </div>
      </div>

      <button
        onClick={handleDispatch}
        disabled={!fromLocation || loading}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "6px",
          background: !fromLocation || loading ? "#333" : "#dc2626",
          color: "#fff",
          border: "none",
          fontWeight: "bold",
          cursor: !fromLocation || loading ? "not-allowed" : "pointer",
          fontSize: "14px",
        }}
      >
        {loading ? "Finding nearest..." : "🚨 Dispatch Emergency Route"}
      </button>

    </div>
  );
}
