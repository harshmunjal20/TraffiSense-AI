import React from 'react';

const labelColor = (label) => {
  if (label === 'Very High') return '#7c3aed';
  if (label === 'High')      return '#ef4444';
  if (label === 'Medium')    return '#f97316';
  return '#22c55e';
};

export default function PredictionWidget({ road, simulatePeak }) {
  if (!road) return (
    <div className="widget empty">
      <p>Click a road on the map to see prediction</p>
    </div>
  );

  return (
    <div className="widget">
      <h3>{road.name}</h3>
      <div className="score" style={{ color: labelColor(road.congestion_label) }}>
        {road.congestion_score}%
      </div>
      <div className="label" style={{ color: labelColor(road.congestion_label) }}>
        {road.congestion_label} Congestion
      </div>
      <div className="meta">
        <span>Next 45 mins: <b style={{ color: labelColor(road.prediction_45min) }}>{road.prediction_45min}</b></span>
        <span>Confidence: <b>{road.confidence}%</b></span>
        {simulatePeak && <span style={{ color: '#f97316' }}>⚠ Peak Hour Simulation</span>}
      </div>
    </div>
  );
}