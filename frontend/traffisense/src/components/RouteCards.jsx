import React from 'react';

const ROUTES = [
  {
    type: 'Fastest Route',
    icon: '⚡',
    time: '48 mins',
    toll: '₹135',
    traffic: 'Medium',
    trafficColor: '#f97316',
    fuel: '2.1L',
    via: 'NH48 → Ring Road',
  },
  {
    type: 'Economical Route',
    icon: '💰',
    time: '62 mins',
    toll: '₹0',
    traffic: 'Low',
    trafficColor: '#22c55e',
    fuel: '1.8L',
    via: 'Mathura Road → Lajpat Nagar',
  },
  {
    type: 'AI Recommended',
    icon: '🤖',
    time: '52 mins',
    toll: '₹60',
    traffic: 'Low',
    trafficColor: '#22c55e',
    fuel: '1.9L',
    via: 'Dwarka Expressway → MG Road',
    recommended: true,
  },
];

export default function RouteCards() {
  return (
    <div className="widget">
      <h3>Smart Route Planner</h3>
      <div className="route-subtitle">Sector 18, Noida → Connaught Place</div>
      {ROUTES.map((r, i) => (
        <div key={i} className={`route-card ${r.recommended ? 'route-recommended' : ''}`}>
          <div className="route-header">
            <span className="route-icon">{r.icon}</span>
            <span className="route-type">{r.type}</span>
            {r.recommended && <span className="route-badge">Best Pick</span>}
          </div>
          <div className="route-via">{r.via}</div>
          <div className="route-stats">
            <div className="route-stat">
              <span className="stat-label">ETA</span>
              <span className="stat-value">{r.time}</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Toll</span>
              <span className="stat-value">{r.toll}</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Traffic</span>
              <span className="stat-value" style={{ color: r.trafficColor }}>{r.traffic}</span>
            </div>
            <div className="route-stat">
              <span className="stat-label">Fuel</span>
              <span className="stat-value">{r.fuel}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}