from flask import Flask, jsonify, request
from flask_cors import CORS
import joblib
import numpy as np
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

model         = joblib.load("model.pkl")
le            = joblib.load("label_encoder.pkl")
feature_names = joblib.load("feature_names.pkl")

ROADS = [
    {"id": 1,  "name": "Connaught Place",   "lat": 28.6315, "lng": 77.2167},
    {"id": 2,  "name": "India Gate",         "lat": 28.6129, "lng": 77.2295},
    {"id": 3,  "name": "Cyber Hub Gurgaon",  "lat": 28.4959, "lng": 77.0882},
    {"id": 4,  "name": "IGI Airport T3",     "lat": 28.5562, "lng": 77.1000},
    {"id": 5,  "name": "Anand Vihar",        "lat": 28.6469, "lng": 77.3159},
    {"id": 6,  "name": "MG Road Gurgaon",    "lat": 28.4794, "lng": 77.0806},
    {"id": 7,  "name": "Akshardham",         "lat": 28.6127, "lng": 77.2773},
    {"id": 8,  "name": "Mayur Vihar",        "lat": 28.6091, "lng": 77.2952},
    {"id": 9,  "name": "Noida Link Road",    "lat": 28.5673, "lng": 77.3210},
    {"id": 10, "name": "Lajpat Nagar",       "lat": 28.5677, "lng": 77.2436},
    {"id": 11, "name": "Karol Bagh",         "lat": 28.6514, "lng": 77.1907},
    {"id": 12, "name": "Dwarka Expressway",  "lat": 28.5921, "lng": 77.0460},
    {"id": 13, "name": "Sector 18 Noida",    "lat": 28.5706, "lng": 77.3240},
    {"id": 14, "name": "DND Flyway",         "lat": 28.5942, "lng": 77.3053},
    {"id": 15, "name": "Shahdara",           "lat": 28.6694, "lng": 77.2887},
    {"id": 16, "name": "Mathura Road",       "lat": 28.5494, "lng": 77.2500},
]

def build_features(hour, day, weather_code, rain, accident, event, transport_density, road_id=0):
    is_weekend = 1 if day >= 5 else 0
    is_peak    = 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0
    
    # Time-aware volume — low at night, high at peak
    if 0 <= hour <= 5:
        traffic_volume = random.randint(50, 200)
    elif is_peak:
        traffic_volume = random.randint(600, 900)
    else:
        traffic_volume = random.randint(250, 500)
    
    avg_speed = max(10, 80 - int(traffic_volume / 12))
    
    return [
        hour, day, is_weekend, is_peak,
        weather_code, rain, accident, event,
        transport_density, traffic_volume, avg_speed
    ]

def predict_features(features):
    pred       = model.predict([features])[0]
    label      = le.inverse_transform([pred])[0]
    proba      = model.predict_proba([features])[0]
    confidence = round(float(np.max(proba)) * 100, 1)
    score_map  = {'Low': random.randint(5, 33),
                  'Medium': random.randint(34, 60),
                  'High': random.randint(61, 80),
                  'Very High': random.randint(81, 98)}
    return label, confidence, score_map[label]

def get_color(label):
    return {'Low': '#22c55e', 'Medium': '#f97316',
            'High': '#ef4444', 'Very High': '#7c3aed'}.get(label, '#f97316')

@app.route("/roads", methods=["GET"])
def get_roads():
    return jsonify(ROADS)

@app.route("/heatmap", methods=["GET"])
def get_heatmap():
    now = datetime.now()
    minutes_ahead = int(request.args.get('minutes_ahead', 0))
    future_minute = now.minute + minutes_ahead
    hour = (now.hour + future_minute // 60) % 24
    day = now.weekday()
    weather_code = random.choices([0, 1, 2], weights=[70, 25, 5])[0]
    result = []
    for road in ROADS:
        features = build_features(
            hour, day, weather_code,
            round(random.uniform(0, 5), 1),
            random.choices([0, 1], weights=[90, 10])[0],
            random.choices([0, 1], weights=[85, 15])[0],
            random.randint(20, 80),
            road["id"]
        )
        label, confidence, score = predict_features(features)
        # Apply future scaling
        if minutes_ahead > 0:
            peak_hours = [8, 9, 17, 18, 19]
            if hour in peak_hours:
                score = min(100, int(score * (1 + minutes_ahead * 0.009)))
            else:
                score = max(10, int(score * (1 - minutes_ahead * 0.004)))
            label = ("Low" if score < 35 else "Medium" if score < 60 else "High" if score < 80 else "Very High")
        result.append({
            "id": road["id"], "name": road["name"],
            "lat": road["lat"], "lng": road["lng"],
            "congestion_score": score, "congestion_label": label,
            "confidence": confidence, "color": get_color(label),
            "prediction_45min": label,
        })
    return jsonify(result)

@app.route("/predict", methods=["POST"])
def predict():
    data         = request.get_json()
    road_id      = int(data.get("road_id", 1))
    weather_code = int(data.get("weather", 0))
    accident     = int(data.get("accident", 0))
    event        = int(data.get("event_nearby", 0))
    now          = datetime.now()
    features     = build_features(
        now.hour, now.weekday(), weather_code,
        round(random.uniform(0, 5), 1),
        accident, event,
        random.randint(20, 80),
        road_id
    )
    label, confidence, score = predict_features(features)
    road_name = next((r["name"] for r in ROADS if r["id"] == road_id), "Unknown")
    return jsonify({
        "road_id":          road_id,
        "road_name":        road_name,
        "congestion_score": score,
        "congestion_label": label,
        "confidence":       confidence,
        "prediction_45min": label,
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)