import React from 'react';

const alertColor = (type) => {
  if (type === 'high') return '#ef4444';
  if (type === 'medium') return '#f97316';
  return '#38bdf8';
};

const alertBg = (type) => {
  if (type === 'high') return '#450a0a';
  if (type === 'medium') return '#431407';
  return '#0c2340';
};

function roadToAlert(road) {
  if (road.congestion_label === 'Very High') {
    return { id: road.id, type: 'high', message: `Severe congestion on ${road.name}. Score: ${road.congestion_score}%. Avoid if possible.` };
  }
  if (road.congestion_label === 'High') {
    return { id: road.id, type: 'high', message: `Heavy traffic on ${road.name}. Expected delays.` };
  }
  if (road.congestion_label === 'Medium') {
    return { id: road.id, type: 'medium', message: `Moderate buildup on ${road.name}. Congestion score: ${road.congestion_score}%.` };
  }
  return null;
}

export default function AlertsPanel({ roads = [] }) {
  const alerts = roads
    .map(roadToAlert)
    .filter(Boolean)
    .sort((a, b) => (a.type === 'high' ? -1 : 1))
    .slice(0, 5);

  if (alerts.length === 0) {
    return (
      <div className="widget">
        <h3>Live Alerts</h3>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No active alerts.</div>
      </div>
    );
  }

  return (
    <div className="widget">
      <h3>Live Alerts</h3>
      {alerts.map((a) => (
        <div
          key={a.id}
          className="alert-row"
          style={{ borderLeft: `3px solid ${alertColor(a.type)}`, background: alertBg(a.type) }}
        >
          <span className="alert-dot" style={{ color: alertColor(a.type) }}>●</span>
          <span className="alert-msg">{a.message}</span>
        </div>
      ))}
    </div>
  );
}