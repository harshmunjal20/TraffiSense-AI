import React, { useEffect, useState } from 'react';
import { predict } from '../api';

const labelColor = (label) => {
  if (label === 'High') return '#ef4444';
  if (label === 'Medium') return '#f97316';
  return '#22c55e';
};

export default function PredictionWidget({ road }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!road) return;
    const fetch = async () => {
      const res = await predict(road.id, 0, 0);
      setData(res);
    };
    fetch();
  }, [road]);

  if (!road) return (
    <div className="widget empty">
      <p>Click a road on the map to see prediction</p>
    </div>
  );

  if (!data) return <div className="widget empty"><p>Loading...</p></div>;

  return (
    <div className="widget">
      <h3>{data.road_name}</h3>
      <div className="score" style={{ color: labelColor(data.congestion_label) }}>
        {data.congestion_score}%
      </div>
      <div className="label" style={{ color: labelColor(data.congestion_label) }}>
        {data.congestion_label} Congestion
      </div>
      <div className="meta">
        <span>Next 45 mins: <b style={{ color: labelColor(data.prediction_45min) }}>{data.prediction_45min}</b></span>
        <span>Confidence: <b>{data.confidence}%</b></span>
      </div>
    </div>
  );
}