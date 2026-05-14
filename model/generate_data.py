import pandas as pd
import numpy as np
import os

np.random.seed(42)

ROADS = [
    {"id": 1, "name": "MG Road",          "lat": 28.6329, "lng": 77.2195},
    {"id": 2, "name": "Ring Road",         "lat": 28.5672, "lng": 77.2100},
    {"id": 3, "name": "NH48",              "lat": 28.5021, "lng": 77.0824},
    {"id": 4, "name": "Connaught Place",   "lat": 28.6315, "lng": 77.2167},
    {"id": 5, "name": "Lajpat Nagar",      "lat": 28.5677, "lng": 77.2436},
    {"id": 6, "name": "Karol Bagh",        "lat": 28.6514, "lng": 77.1907},
    {"id": 7, "name": "Rohini Sector 10",  "lat": 28.7331, "lng": 77.1200},
    {"id": 8, "name": "Dwarka Expressway", "lat": 28.5921, "lng": 77.0460},
    {"id": 9, "name": "Noida Link Road",   "lat": 28.5673, "lng": 77.3210},
    {"id": 10, "name": "Mathura Road",     "lat": 28.5494, "lng": 77.2500},
]

def is_peak_hour(hour):
    return 1 if (8 <= hour <= 10) or (17 <= hour <= 20) else 0

def generate_congestion(hour, day, weather, event):
    base = 30
    if is_peak_hour(hour):
        base += np.random.randint(30, 45)
    elif 11 <= hour <= 16:
        base += np.random.randint(10, 25)
    elif 21 <= hour or hour <= 6:
        base += np.random.randint(0, 10)
    if day >= 5:
        base -= np.random.randint(5, 15)
    if weather == 1:
        base += np.random.randint(15, 25)
    elif weather == 2:
        base += np.random.randint(20, 35)
    if event == 1:
        base += np.random.randint(10, 20)
    base += np.random.randint(-5, 5)
    return int(np.clip(base, 0, 100))

rows = []
timestamps = pd.date_range(start="2024-01-01", periods=48*30, freq="30min")

for ts in timestamps:
    hour = ts.hour
    day = ts.dayofweek
    weather = np.random.choice([0, 1, 2], p=[0.75, 0.20, 0.05])
    event = np.random.choice([0, 1], p=[0.90, 0.10])
    for road in ROADS:
        past_30 = generate_congestion(hour - 1 if hour > 0 else 23, day, weather, event)
        past_60 = generate_congestion(hour - 2 if hour > 1 else 22, day, weather, event)
        current = generate_congestion(hour, day, weather, event)
        rows.append({
            "road_id":           road["id"],
            "road_name":         road["name"],
            "timestamp":         ts,
            "hour":              hour,
            "day_of_week":       day,
            "is_weekend":        1 if day >= 5 else 0,
            "is_peak_hour":      is_peak_hour(hour),
            "weather":           weather,
            "event_nearby":      event,
            "past_congestion_30": past_30,
            "past_congestion_60": past_60,
            "congestion_score":  current,
        })

df = pd.DataFrame(rows)
df["congestion_label"] = pd.cut(
    df["congestion_score"],
    bins=[0, 33, 66, 100],
    labels=["Low", "Medium", "High"]
)

os.makedirs("model/data", exist_ok=True)
df.to_csv("model/data/traffic_data.csv", index=False)
print(f"Generated {len(df)} rows")
print(df["congestion_label"].value_counts())
print(df.head(3))