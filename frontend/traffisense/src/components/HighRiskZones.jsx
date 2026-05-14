import React, { useEffect, useState } from 'react';
import { getHeatmap } from '../api';

const labelColor = (label) => {
  if (label === 'High') return '#ef4444';
  if (label === 'Medium') return '#f97316';
  return '#22c55e';
};

export default function HighRiskZones() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await getHeatmap();
      const sorted = data.sort((a, b) => b.congestion_score - a.congestion_score).slice(0, 5);
      setZones(sorted);
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

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