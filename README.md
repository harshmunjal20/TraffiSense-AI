# TraffiSense AI — Delhi Live Traffic Predictor

> **Live Demo:** [traffi-sense-ai.vercel.app](https://traffi-sense-ai.vercel.app)

A real-time AI-powered traffic prediction and smart route planning system for Delhi NCR, built for the CodeCamp Hackathon.

---

## Problem Statement

Delhi's traffic congestion costs commuters hours daily. Existing solutions lack predictive intelligence — they react to congestion rather than forecast it. TraffiSense AI uses machine learning to predict congestion 60 minutes ahead, enabling smarter commute decisions.

---

## Features

### Live Congestion Heatmap
- 16 road segments across Delhi NCR color-coded in real time
- Green → Low | Orange → Medium | Red → High | Purple → Very High
- Road geometry fetched from OSRM (OpenStreetMap routing engine)

### Time Forecasting Slider
- Predict traffic Now, +15, +30, +45, or +60 minutes ahead
- Shifts the hour feature in the XGBoost model for genuine future predictions

### Smart Route Planner (Toll Intelligence)
- Three routes for any two Delhi locations:
  - **Fastest** — Direct via major roads, toll-inclusive
  - **Eco** — Toll-free alternative, fuel-optimized
  - **AI Recommended** — Avoids predicted bottlenecks
- Displays ETA, distance, **estimated toll fee**, fuel consumption, and traffic level
- ETAs are congestion-weighted using live model predictions

### AI Traffic Chatbot
- Powered by Groq API (LLaMA 3.3 70B)
- Natural language route requests: *"Route from Karol Bagh to Lajpat Nagar"*
- Fuzzy location detection — understands partial or misspelled names
- Draws routes directly on the map from chat

### Emergency Vehicle Routing
- Select location + emergency type (Hospital / Fire Station)
- Finds nearest facility and draws priority red route
- Covers 6 hospitals and 6 fire stations across Delhi NCR

### High Risk Zones & Live Alerts
- Top 5 most congested roads ranked by model score
- Automatic alerts when any road hits High or Very High congestion

### Live Weather Integration
- Real Delhi weather via Open-Meteo API
- Night/day aware icons
- Rain detection with confidence score warnings

---

## ML Model

| Detail | Info |
|--------|------|
| Algorithm | XGBoost Classifier |
| Dataset | 7,000 rows, multi-location Delhi traffic data |
| Accuracy | **99.7%** on test set |
| Features | Hour, day of week, weather, rain, accidents, events, public transport density, traffic volume |
| Output | Congestion label (Low / Medium / High / Very High) + score (0–100) |
| Inference | Live on every `/heatmap` API call |

The model predicts future congestion by shifting the `hour` feature forward by `minutes_ahead`, enabling genuine time-based forecasting.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Leaflet.js, CSS |
| Backend | Flask (Python) |
| ML Model | XGBoost, scikit-learn |
| Routing | OSRM (OpenStreetMap) |
| Map Tiles | CARTO / OpenStreetMap |
| Chatbot | Groq API — LLaMA 3.3 70B |
| Weather | Open-Meteo API |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Running Locally

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5001
```

### Frontend (React)
```bash
cd frontend/traffisense
npm install
# Create .env file:
echo "REACT_APP_BACKEND_URL=http://127.0.0.1:5001" > .env
echo "REACT_APP_GROQ_KEY=your_groq_key" >> .env
npm start
# Runs on http://localhost:3000
```

---

## 📁 Project Structure

```
TraffiSense-AI/
├── backend/
│   ├── app.py              # Flask API — /heatmap, /predict, /roads
│   ├── model.pkl           # Trained XGBoost model
│   ├── label_encoder.pkl   # Label encoder
│   ├── feature_names.pkl   # Feature names
│   └── requirements.txt
├── frontend/
│   └── traffisense/
│       └── src/
│           ├── App.js
│           ├── api/index.js
│           └── components/
│               ├── MapView.jsx
│               ├── RoutePlanner.jsx
│               ├── Chatbot.jsx
│               ├── EmergencyPanel.jsx
│               ├── WeatherBadge.jsx
│               ├── HighRiskZones.jsx
│               ├── AlertsPanel.jsx
│               └── PredictionWidget.jsx
└── model/
    ├── train_model.py       # Model training script
    ├── generate_data.py     # Dataset generation
    ├── retrain_real.py      # Retraining experiments
    └── data/               # Training dataset
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/heatmap?minutes_ahead=X` | GET | Congestion predictions for all 16 roads |
| `/predict` | POST | Single road prediction |
| `/roads` | GET | Road metadata |

---

## Team

Harsh Munjal(Lead)
Abdullah Jami

Built with ❤️ during a 21-hour hackathon.
