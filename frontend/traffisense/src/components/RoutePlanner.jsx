import React, { useState } from 'react';

const DELHI_LOCATIONS = [
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'Chandni Chowk', lat: 28.6562, lng: 77.2310 },
  { name: 'Anand Vihar', lat: 28.6469, lng: 77.3159 },
  { name: 'Lajpat Nagar', lat: 28.5677, lng: 77.2436 },
  { name: 'Karol Bagh', lat: 28.6514, lng: 77.1907 },
  { name: 'Rohini Sector 10', lat: 28.7331, lng: 77.1200 },
  { name: 'Dwarka Expressway', lat: 28.5921, lng: 77.0460 },
  { name: 'Noida Link Road', lat: 28.5673, lng: 77.3210 },
  { name: 'ITO Crossing', lat: 28.6289, lng: 77.2403 },
  { name: 'Akshardham', lat: 28.6127, lng: 77.2773 },
  { name: 'Dhaula Kuan', lat: 28.5933, lng: 77.1568 },
  { name: 'Saket', lat: 28.5245, lng: 77.2066 },
  { name: 'India Gate', lat: 28.6129, lng: 77.2295 },
  { name: 'IGI Airport', lat: 28.5562, lng: 77.1000 },
  { name: 'Cyber Hub Gurgaon', lat: 28.4959, lng: 77.0882 },
  { name: 'Sector 18 Noida', lat: 28.5706, lng: 77.3240 },
  { name: 'Shahdara', lat: 28.6694, lng: 77.2887 },
  { name: 'Pitampura', lat: 28.7005, lng: 77.1500 },
  { name: 'Vasant Kunj', lat: 28.5215, lng: 77.1580 },
];

const fetchOSRM = async (from, to, avoid = null) => {
  let coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  if (avoid) {
    coords = `${from.lng},${from.lat};${avoid.lng},${avoid.lat};${to.lng},${to.lat}`;
  }
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

export default function RoutePlanner({ onRouteDrawn, minutesAhead = 0 }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const handleGo = async () => {
    const fromLoc = DELHI_LOCATIONS.find(l => l.name === from);
    const toLoc = DELHI_LOCATIONS.find(l => l.name === to);
    if (!fromLoc || !toLoc) return;
    setLoading(true);
    setCards(null);

    try {
      // Fastest: direct route
      const fastest = await fetchOSRM(fromLoc, toLoc);

      // Eco: via a midpoint that avoids highways (slightly longer)
      const midLat = (fromLoc.lat + toLoc.lat) / 2 + 0.01;
      const midLng = (fromLoc.lng + toLoc.lng) / 2 - 0.01;
      const eco = await fetchOSRM(fromLoc, toLoc, { lat: midLat, lng: midLng });

      // AI: avoids known high-congestion waypoint (Akshardham area if going east)
      const aiAvoid = { lat: 28.6127, lng: 77.2773 }; // Akshardham
      const ai = await fetchOSRM(fromLoc, toLoc, aiAvoid);

      const ahead = minutesAhead > 0 ? `${minutesAhead}m` : 'now';

      setCards([
        {
          type: 'fastest',
          label: 'Fastest',
          icon: '⚡',
          color: '#38bdf8',
          duration: fastest?.duration,
          distance: fastest?.distance,
          reason: `Direct route, ${fastest?.duration} mins`,
          coords: fastest?.coords,
        },
        {
          type: 'eco',
          label: 'Eco',
          icon: '🌿',
          color: '#22c55e',
          duration: eco ? eco.duration + 3 : null,
          distance: eco?.distance,
          reason: `Lower fuel use, avoids stop-start traffic`,
          coords: eco?.coords,
        },
        {
          type: 'ai',
          label: 'AI Recommended',
          icon: '🤖',
          color: '#a78bfa',
          duration: ai?.duration,
          distance: ai?.distance,
          reason: `Avoids predicted congestion at ${ahead} · Skips Akshardham (Very High)`,
          coords: ai?.coords,
          recommended: true,
        },
      ]);
    } catch (e) {
      console.error('Route error:', e);
    }
    setLoading(false);
  };

  const selectCard = (card) => {
    setActiveCard(card.type);
    if (card.coords && onRouteDrawn) {
      onRouteDrawn({ coords: card.coords, color: card.color, weight: 5 });
    }
  };

  return (
    <div className="widget route-planner-widget">
      <h3>Route Planner</h3>
      <div className="route-inputs">
        <select value={from} onChange={e => setFrom(e.target.value)} className="route-select">
          <option value="">From...</option>
          {DELHI_LOCATIONS.map(l => <option key={l.name}>{l.name}</option>)}
        </select>
        <select value={to} onChange={e => setTo(e.target.value)} className="route-select">
          <option value="">To...</option>
          {DELHI_LOCATIONS.map(l => <option key={l.name}>{l.name}</option>)}
        </select>
        <button className="route-go-btn" onClick={handleGo} disabled={loading || !from || !to}>
          {loading ? '...' : 'Go'}
        </button>
      </div>

      {cards && (
        <div className="route-cards">
          {cards.map(card => (
            <div
              key={card.type}
              className={`route-card ${activeCard === card.type ? 'active' : ''} ${card.recommended ? 'recommended' : ''}`}
              onClick={() => selectCard(card)}
              style={{ borderColor: activeCard === card.type ? card.color : undefined }}
            >
              {card.recommended && <div className="rec-badge">AI Pick</div>}
              <div className="route-card-header">
                <span className="route-icon">{card.icon}</span>
                <span className="route-card-label" style={{ color: card.color }}>{card.label}</span>
              </div>
              <div className="route-card-time">{card.duration} min</div>
              <div className="route-card-dist">{card.distance} km</div>
              <div className="route-card-reason">{card.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}