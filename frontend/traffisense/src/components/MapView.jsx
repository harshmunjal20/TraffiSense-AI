import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getHeatmap } from '../api';

const { BaseLayer } = LayersControl;

const TILES = {
  street: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; satellite providers',
  },
};

const ROAD_PATHS = {
  1:  [ [28.6350,77.2140],[28.6330,77.2160],[28.6315,77.2167],[28.6300,77.2180],[28.6280,77.2200] ], // Connaught Place
  2:  [ [28.6150,77.2270],[28.6140,77.2285],[28.6129,77.2295],[28.6115,77.2310],[28.6100,77.2330] ], // India Gate
  3:  [ [28.4980,77.0860],[28.4970,77.0870],[28.4959,77.0882],[28.4945,77.0895],[28.4930,77.0910] ], // Cyber Hub
  4:  [ [28.5580,77.0970],[28.5572,77.0983],[28.5562,77.1000],[28.5550,77.1015],[28.5535,77.1030] ], // IGI Airport
  5:  [ [28.6300,77.3620],[28.6290,77.3635],[28.6280,77.3649],[28.6268,77.3663],[28.6255,77.3678] ], // Sector 62 Noida
  6:  [ [28.4815,77.0785],[28.4805,77.0795],[28.4794,77.0806],[28.4780,77.0820],[28.4765,77.0835] ], // MG Road
  7:  [ [28.6150,77.2750],[28.6140,77.2762],[28.6127,77.2773],[28.6112,77.2785],[28.6095,77.2800] ], // Akshardham
  8:  [ [28.5965,77.3025],[28.5955,77.3038],[28.5942,77.3053],[28.5928,77.3068],[28.5912,77.3082] ], // DND Flyway
  9:  [ [28.5925,77.4270],[28.5913,77.4285],[28.5900,77.4300],[28.5885,77.4315],[28.5870,77.4330] ], // Greater Noida West
  10: [ [28.5698,77.2405],[28.5688,77.2418],[28.5677,77.2430],[28.5663,77.2443],[28.5648,77.2458] ], // Lajpat Nagar
  11: [ [28.6540,77.1885],[28.6530,77.1897],[28.6519,77.1909],[28.6505,77.1922],[28.6490,77.1936] ], // Karol Bagh
  12: [ [28.5532,77.0540],[28.5522,77.0552],[28.5511,77.0565],[28.5498,77.0578],[28.5483,77.0592] ], // Dwarka
  13: [ [28.5728,77.3215],[28.5718,77.3228],[28.5706,77.3240],[28.5692,77.3253],[28.5678,77.3268] ], // Sector 18 Noida
  14: [ [28.5658,77.3315],[28.5648,77.3328],[28.5636,77.3340],[28.5622,77.3353],[28.5608,77.3368] ], // Botanical Garden
  15: [ [28.6482,77.3365],[28.6472,77.3378],[28.6460,77.3390],[28.6446,77.3403],[28.6430,77.3418] ], // Vaishali
  16: [ [28.4692,77.5005],[28.4682,77.5018],[28.4671,77.5030],[28.4657,77.5043],[28.4642,77.5058] ], // Pari Chowk
};

const getColor = (label) => {
  if (label === 'Very High') return '#7c3aed';
  if (label === 'High')      return '#ef4444';
  if (label === 'Medium')    return '#f97316';
  return '#22c55e';
};

function RouteLayer({ routeData }) {
  const map = useMap();

  useEffect(() => {
    if (!routeData || !routeData.coords) return;
    const line = L.polyline(routeData.coords, {
      color:   routeData.color,
      weight:  6,
      opacity: 0.9,
    }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [40, 40] });
    return () => map.removeLayer(line);
  }, [routeData, map]);

  return null;
}

export default function MapView({ roads, onRoadSelect, routeData }) {
  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={11}
      zoomAnimation={true}
      markerZoomAnimation={true}
      style={{ height: '100%', width: '100%' }}
    >
      <LayersControl position="topright">
        <BaseLayer checked name="Street">
          <TileLayer url={TILES.street.url} attribution={TILES.street.attribution} />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer url={TILES.satellite.url} attribution={TILES.satellite.attribution} />
        </BaseLayer>
      </LayersControl>

      <RouteLayer routeData={routeData} />

      {roads.map((road) => {
        const path = ROAD_PATHS[road.id];
        if (!path) return null;
        return (
          <Polyline
            key={road.id}
            positions={path}
            pathOptions={{ color: getColor(road.congestion_label), weight: 6, opacity: 0.85 }}
            eventHandlers={{ click: () => onRoadSelect(road) }}
          >
            <Tooltip sticky>
              <span>
                <b>{road.name}</b><br />
                {road.congestion_label} — {road.congestion_score}%<br />
                Confidence: {road.confidence}%
              </span>
            </Tooltip>
          </Polyline>
        );
      })}
    </MapContainer>
  );
}