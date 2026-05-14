import React from 'react';

const labelColor = (label) => {
  if (label === 'Very High') return '#7c3aed';
  if (label === 'High')      return '#ef4444';
  if (label === 'Medium')    return '#f97316';
  return '#22c55e';
};

const labelRank = (label) => {
  if (label === 'Very High') return 4;
  if (label === 'High')      return 3;
  if (label === 'Medium')    return 2;
  return 1;
};

export default function HighRiskZones({ roads = [] }) {
  const zones = [...roads]
    .sort((a, b) => labelRank(b.congestion_label) - labelRank(a.congestion_label) || b.congestion_score - a.congestion_score)
    .slice(0, 5);

  return (
    <div className="widget">
      <h3>High Risk Zones</h3>
      {zones.map((z, i) => (
        <div key={z.id} className="zone-row">
          <span className="zone-rank">#{i + 1}</span>
          <span className="zone-name">{z.name}</span>
          <span className="zone-label" style={{ color: labelColor(z.congestion_label) }}>
            {z.congestion_label}
          </span>
        </div>
      ))}
    </div>
  );
}