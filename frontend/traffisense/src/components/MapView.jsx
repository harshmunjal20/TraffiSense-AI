import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Tooltip,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const { BaseLayer } = LayersControl;

const TILES = {
  street: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &copy; satellite providers",
  },
};

const ROAD_SEGMENTS = [
  { id: 1,  name: "Connaught Place",   from: [28.635, 77.205],  to: [28.628, 77.228] },
  { id: 2,  name: "India Gate",        from: [28.62,  77.215],  to: [28.605, 77.24]  },
  { id: 3,  name: "Cyber Hub Gurgaon", from: [28.51,  77.065],  to: [28.485, 77.105] },
  { id: 4,  name: "IGI Airport T3",    from: [28.57,  77.075],  to: [28.545, 77.12]  },
  { id: 5,  name: "Anand Vihar",       from: [28.66,  77.29],   to: [28.635, 77.34]  },
  { id: 6,  name: "MG Road Gurgaon",   from: [28.495, 77.06],   to: [28.465, 77.1]   },
  { id: 7,  name: "Akshardham",        from: [28.625, 77.255],  to: [28.598, 77.3]   },
  { id: 8,  name: "Mayur Vihar",       from: [28.62,  77.275],  to: [28.595, 77.315] },
  { id: 9,  name: "Noida Link Road",   from: [28.59,  77.305],  to: [28.555, 77.36]  },
  { id: 10, name: "Lajpat Nagar",      from: [28.59,  77.22],   to: [28.55,  77.27]  },
  { id: 11, name: "Karol Bagh",        from: [28.67,  77.165],  to: [28.635, 77.21]  },
  { id: 12, name: "Dwarka Expressway", from: [28.62,  77.05],   to: [28.53,  77.08]  },
  { id: 13, name: "Sector 18 Noida",   from: [28.595, 77.3],    to: [28.555, 77.34]  },
  { id: 14, name: "DND Flyway",        from: [28.59,  77.29],   to: [28.54,  77.32]  },
  { id: 15, name: "Shahdara",          from: [28.695, 77.26],   to: [28.65,  77.31]  },
  { id: 16, name: "Mathura Road",      from: [28.61,  77.235],  to: [28.53,  77.26]  },
];

const getColor = (label) => {
  if (label === "Very High") return "#7c3aed";
  if (label === "High")      return "#ef4444";
  if (label === "Medium")    return "#f97316";
  return "#22c55e";
};

const getWeight = (label) => {
  if (label === "Very High") return 6;
  if (label === "High")      return 5;
  if (label === "Medium")    return 4;
  return 3;
};

const getOpacity = (score) => {
  return 0.25 + (score / 100) * 0.65;
};

function RouteAutoFit({ activeRoute }) {
  const map = useMap();
  useEffect(() => {
    if (activeRoute?.coords) {
      const bounds = L.polyline(activeRoute.coords).getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activeRoute, map]);
  return null;
}

export default function MapView({ roads, onRoadSelect, activeRoute }) {
  const [roadPaths, setRoadPaths] = useState({});

  useEffect(() => {
    const fetchPaths = async () => {
      const results = {};
      await Promise.all(
        ROAD_SEGMENTS.map(async (seg) => {
          try {
            const url = `https://router.project-osrm.org/route/v1/driving/${seg.from[1]},${seg.from[0]};${seg.to[1]},${seg.to[0]}?overview=full&geometries=geojson`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.routes?.[0]) {
              results[seg.id] = data.routes[0].geometry.coordinates.map(
                ([lng, lat]) => [lat, lng],
              );
            }
          } catch (e) {}
        }),
      );
      setRoadPaths(results);
    };
    fetchPaths();
  }, []);

  return (
    <MapContainer
      center={[28.6139, 77.209]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <LayersControl position="topright">
        <BaseLayer checked name="Street">
          <TileLayer url={TILES.street.url} attribution={TILES.street.attribution} />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer url={TILES.satellite.url} attribution={TILES.satellite.attribution} />
        </BaseLayer>
      </LayersControl>

      <RouteAutoFit activeRoute={activeRoute} />

      {activeRoute?.coords && (
        <>
          <Polyline
            positions={activeRoute.coords}
            pathOptions={{ color: "#000000", weight: 10, opacity: 0.5 }}
          />
          <Polyline
            positions={activeRoute.coords}
            pathOptions={{ color: activeRoute.color, weight: 6, opacity: 0.95 }}
          />
        </>
      )}

      {roads.map((road) => {
        const path = roadPaths[road.id];
        if (!path) return null;
        return (
          <Polyline
            key={road.id}
            positions={path}
            pathOptions={{
              color: getColor(road.congestion_label),
              weight: getWeight(road.congestion_label),
              opacity: getOpacity(road.congestion_score),
            }}
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