import React, { useState } from 'react';
import MapView from './components/MapView';
import PredictionWidget from './components/PredictionWidget';
import HighRiskZones from './components/HighRiskZones';
import './App.css';

export default function App() {
  const [selectedRoad, setSelectedRoad] = useState(null);

  return (
    <div className="app-container">
      <header className="header">
        <h1>TraffiSense AI</h1>
        <span>Delhi Live Traffic Predictor</span>
      </header>
      <div className="main">
        <div className="map-panel">
          <MapView onRoadSelect={setSelectedRoad} />
        </div>
        <div className="side-panel">
          <PredictionWidget road={selectedRoad} />
          <HighRiskZones />
        </div>
      </div>
    </div>
  );
}