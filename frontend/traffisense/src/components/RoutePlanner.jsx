import React, { useState, useEffect } from "react";

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

const fetchOSRM = async (from, to, via = null) => {
  let coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  if (via)
    coords = `${from.lng},${from.lat};${via.lng},${via.lat};${to.lng},${to.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes?.length > 0) {
    const route = data.routes[0];
    return {
      coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      duration: Math.round(route.duration / 60),
      distance: (route.distance / 1000).toFixed(1),
    };
  }
  return null;
};

export default function RoutePlanner({
  onRouteDrawn,
  onCardSelect,
  minutesAhead = 0,
  source,
  setSource,
  destination,
  setDestination,
  routeData,
  ecoRoute,
  aiRoute,
}) {
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [congestionScalers, setCongestionScalers] = useState({
    fastest: 1,
    eco: 1,
    ai: 1,
  });

  useEffect(() => {
    if (!routeData) return;

    const fetchCongestion = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:5001"}/heatmap?minutes_ahead=${minutesAhead}`,
        );
        const roads = await res.json();

        const scoreMap = {};
        roads.forEach((r) => {
          scoreMap[r.id] = r.congestion_score;
        });

        const fastestRoads = [1, 2, 10, 11];
        const ecoRoads = [4, 12, 6, 3];
        const aiRoads = [14, 16, 9, 13];

        const avg = (ids) => {
          const scores = ids.map((id) => scoreMap[id] ?? 20);
          return scores.reduce((a, b) => a + b, 0) / scores.length;
        };

        const toScalerFastest = (avgScore) => 1 + (avgScore / 100) * 1.2;
        const toScalerEco = (avgScore) => 1.3 + (avgScore / 100) * 0.6;
        const toScalerAi = (avgScore) => 1.1 + (avgScore / 100) * 0.4;

        setCongestionScalers({
          fastest: toScalerFastest(avg(fastestRoads)),
          eco: toScalerEco(avg(ecoRoads)),
          ai: toScalerAi(avg(aiRoads)),
        });
      } catch (e) {}
    };

    fetchCongestion();
  }, [minutesAhead, routeData]);

  const cards = React.useMemo(() => {
    if (!routeData && !ecoRoute && !aiRoute) return null;

    const fastDist = parseFloat(routeData?.distance) || 0;
    const ecoDist = parseFloat(ecoRoute?.distance) || 0;
    const aiDist = parseFloat(aiRoute?.distance) || 0;

    return [
      {
        type: "fastest",
        label: "Fastest",
        icon: "⚡",
        color: "#38bdf8",
        duration: routeData?.rawDuration
          ? Math.round(routeData.rawDuration * congestionScalers.fastest)
          : "--",
        distance: routeData?.distance,
        reason: "Direct route via major roads",
        coords: routeData?.coords,
        toll: fastDist ? `₹${Math.round(fastDist * 4.5)}` : "₹0",
        fuel: fastDist ? `${(fastDist * 0.08).toFixed(1)}L` : "--",
        traffic: "Medium",
      },
      {
        type: "eco",
        label: "Eco",
        icon: "🌿",
        color: "#22c55e",
        duration: ecoRoute?.rawDuration
          ? Math.round(ecoRoute.rawDuration * congestionScalers.eco)
          : "--",
        distance: ecoRoute?.distance,
        reason: "Toll-free alternative route",
        coords: ecoRoute?.coords,
        toll: "₹0",
        fuel: ecoDist ? `${(ecoDist * 0.07).toFixed(1)}L` : "--",
        traffic: "Low",
      },
      {
        type: "ai",
        label: "AI Recommended",
        icon: "🤖",
        color: "#a78bfa",
        duration: aiRoute?.rawDuration
          ? Math.round(aiRoute.rawDuration * congestionScalers.ai)
          : "--",
        distance: aiRoute?.distance,
        reason: `Avoids predicted bottlenecks at +${minutesAhead}m`,
        coords: aiRoute?.coords,
        recommended: true,
        toll: aiDist ? `₹${Math.round(aiDist * 2.2)}` : "₹0",
        fuel: aiDist ? `${(aiDist * 0.075).toFixed(1)}L` : "--",
        traffic: "Low",
      },
    ];
  }, [routeData, ecoRoute, aiRoute, minutesAhead, congestionScalers]);

  const handleClear = () => {
    setSource("");
    setDestination("");
    setActiveCard(null);
    onRouteDrawn(null);
    onCardSelect(null);
  };

  const handleGo = async () => {
    const fromLoc = DELHI_LOCATIONS.find((l) => l.name === source);
    const toLoc = DELHI_LOCATIONS.find((l) => l.name === destination);
    if (!fromLoc || !toLoc) return;
    if (source === destination) {
      alert("Please select different source and destination.");
      return;
    }

    setLoading(true);
    setActiveCard(null);
    onCardSelect(null);

    try {
      const fst = await fetchOSRM(fromLoc, toLoc);

      const midLat = (fromLoc.lat + toLoc.lat) / 2;
      const midLng = (fromLoc.lng + toLoc.lng) / 2;
      const ecoWaypoint = { lat: midLat + 0.02, lng: midLng - 0.04 };
      const aiWaypoint = { lat: midLat - 0.02, lng: midLng + 0.04 };

      const eco = await fetchOSRM(fromLoc, toLoc, ecoWaypoint);
      const ai = await fetchOSRM(fromLoc, toLoc, aiWaypoint);

      if (fst) {
        const baseDuration = fst.duration;
        const baseDistance = parseFloat(fst.distance);
        const ecoDuration = eco ? eco.duration : Math.round(baseDuration * 1.4);
        const ecoDistance = eco
          ? eco.distance
          : (baseDistance * 1.25).toFixed(1);
        const aiDuration = ai ? ai.duration : Math.round(baseDuration * 1.18);
        const aiDistance = ai ? ai.distance : (baseDistance * 1.08).toFixed(1);

        onRouteDrawn({
          ...fst,
          type: "fastest",
          duration: baseDuration,
          rawDuration: baseDuration,
        });
        onRouteDrawn({
          coords: eco?.coords ?? fst.coords,
          type: "eco",
          duration: ecoDuration,
          rawDuration: ecoDuration,
          distance: ecoDistance,
        });
        onRouteDrawn({
          coords: ai?.coords ?? fst.coords,
          type: "ai",
          duration: aiDuration,
          rawDuration: aiDuration,
          distance: aiDistance,
        });

        onCardSelect({ coords: fst.coords, color: "#38bdf8", weight: 6 });
        setActiveCard("fastest");
      }
    } catch (e) {
      console.error("Route error:", e);
    }

    setLoading(false);
  };

  const selectCard = (card) => {
    if (!card.coords) return;
    setActiveCard(card.type);
    onCardSelect({ coords: card.coords, color: card.color, weight: 6 });
  };

  return (
    <div className="widget route-planner-widget">
      <h3>Route Planner</h3>

      <div className="route-inputs">
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="route-select"
        >
          <option value="">From...</option>
          {DELHI_LOCATIONS.map((l) => (
            <option key={l.name}>{l.name}</option>
          ))}
        </select>

        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="route-select"
        >
          <option value="">To...</option>
          {DELHI_LOCATIONS.map((l) => (
            <option key={l.name}>{l.name}</option>
          ))}
        </select>

        <button
          className="route-go-btn"
          onClick={handleGo}
          disabled={loading || !source || !destination}
        >
          {loading ? "..." : "Go"}
        </button>

        {(cards || source || destination) && (
          <button onClick={handleClear} className="clear-btn">
            ✕ Clear
          </button>
        )}
      </div>

      {cards && (
        <div className="route-cards">
          {cards.map((card) => (
            <div
              key={card.type}
              className={`route-card ${activeCard === card.type ? "active" : ""} ${card.recommended ? "recommended" : ""}`}
              onClick={() => selectCard(card)}
              style={{
                borderColor: activeCard === card.type ? card.color : undefined,
              }}
            >
              {card.recommended && <div className="rec-badge">AI Pick</div>}
              <div className="route-card-header">
                <span className="route-icon">{card.icon}</span>
                <span
                  className="route-card-label"
                  style={{ color: card.color }}
                >
                  {card.label}
                </span>
              </div>
              <div className="route-card-time">{card.duration ?? "--"} min</div>
              <div className="route-card-dist">{card.distance ?? "--"} km</div>
              <div className="route-card-stats">
                <span className="route-stat">Toll: {card.toll}</span>
                <span className="route-stat">Fuel: {card.fuel}</span>
                <span className="route-stat">Traffic: {card.traffic}</span>
              </div>
              <div className="route-card-reason">{card.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
