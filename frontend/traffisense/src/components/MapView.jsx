import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getHeatmap } from '../api';

const getColor = (label) => {
  if (label === 'High') return '#ef4444';
  if (label === 'Medium') return '#f97316';
  return '#22c55e';
};

export default function MapView({ onRoadSelect }) {
  const [roads, setRoads] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await getHeatmap();
      setRoads(data);
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={11}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {roads.map((road) => (
        <CircleMarker
          key={road.id}
          center={[road.lat, road.lng]}
          radius={14}
          fillColor={getColor(road.congestion_label)}
          color={getColor(road.congestion_label)}
          fillOpacity={0.8}
          eventHandlers={{ click: () => onRoadSelect(road) }}
        >
          <Tooltip direction="top" permanent={false}>
            <span><b>{road.name}</b><br />
            {road.congestion_label} — {road.congestion_score}%<br />
            Confidence: {road.confidence}%</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}