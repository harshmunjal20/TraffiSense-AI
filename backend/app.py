from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import numpy as np
import json
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

model = joblib.load("backend/model.pkl")
le = joblib.load("backend/label_encoder.pkl")

ROADS = [
    {"id": 1,  "name": "MG Road",          "lat": 28.6329, "lng": 77.2195},
    {"id": 2,  "name": "Ring Road",         "lat": 28.5672, "lng": 77.2100},
    {"id": 3,  "name": "NH48",              "lat": 28.5021, "lng": 77.0824},
    {"id": 4,  "name": "Connaught Place",   "lat": 28.6315, "lng": 77.2167},
    {"id": 5,  "name": "Lajpat Nagar",      "lat": 28.5677, "lng": 77.2436},
    {"id": 6,  "name": "Karol Bagh",        "lat": 28.6514, "lng": 77.1907},
    {"id": 7,  "name": "Rohini Sector 10",  "lat": 28.7331, "lng": 77.1200},
    {"id": 8,  "name": "Dwarka Expressway", "lat": 28.5921, "lng": 77.0460},
    {"id": 9,  "name": "Noida Link Road",   "lat": 28.5673, "lng": 77.3210},
    {"id": 10, "name": "Mathura Road",      "lat": 28.5494, "lng": 77.2500},
]

def get_current_features(road_id):
    now = datetime.now()
    hour = now.hour
    day = now.weekday()
    is_weekend = 1 if day >= 5 else 0
    is_peak = 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0
    weather = random.choices([0, 1, 2], weights=[75, 20, 5])[0]
    event = random.choices([0, 1], weights=[90, 10])[0]
    past_30 = random.randint(20, 80)
    past_60 = random.randint(20, 80)
    return [road_id, hour, day, is_weekend, is_peak, weather, event, past_30, past_60]

def predict_for_road(road_id):
    features = get_current_features(road_id)
    score_base = features[7]
    pred = model.predict([features])[0]
    label = le.inverse_transform([pred])[0]
    proba = model.predict_proba([features])[0]
    confidence = round(float(np.max(proba)) * 100, 1)
    if label == "High":
        score = random.randint(67, 95)
    elif label == "Medium":
        score = random.randint(34, 66)
    else:
        score = random.randint(5, 33)
    return {
        "road_id": road_id,
        "congestion_score": score,
        "congestion_label": label,
        "confidence": confidence
    }

@app.route("/roads", methods=["GET"])
def get_roads():
    return jsonify(ROADS)

@app.route("/heatmap", methods=["GET"])
def get_heatmap():
    result = []
    for road in ROADS:
        prediction = predict_for_road(road["id"])
        result.append({
            "id": road["id"],
            "name": road["name"],
            "lat": road["lat"],
            "lng": road["lng"],
            "congestion_score": prediction["congestion_score"],
            "congestion_label": prediction["congestion_label"],
            "confidence": prediction["confidence"]
        })
    return jsonify(result)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    road_id = int(data.get("road_id", 1))
    weather = int(data.get("weather", 0))
    event_nearby = int(data.get("event_nearby", 0))
    now = datetime.now()
    hour = now.hour
    day = now.weekday()
    is_weekend = 1 if day >= 5 else 0
    is_peak = 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0
    past_30 = random.randint(20, 80)
    past_60 = random.randint(20, 80)
    features = [road_id, hour, day, is_weekend, is_peak, weather, event_nearby, past_30, past_60]
    pred = model.predict([features])[0]
    label = le.inverse_transform([pred])[0]
    proba = model.predict_proba([features])[0]
    confidence = round(float(np.max(proba)) * 100, 1)
    if label == "High":
        score = random.randint(67, 95)
    elif label == "Medium":
        score = random.randint(34, 66)
    else:
        score = random.randint(5, 33)
    road_name = next((r["name"] for r in ROADS if r["id"] == road_id), "Unknown Road")
    return jsonify({
        "road_id": road_id,
        "road_name": road_name,
        "congestion_score": score,
        "congestion_label": label,
        "confidence": confidence,
        "prediction_45min": label
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)