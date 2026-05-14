import pandas as pd
import numpy as np
import joblib
import os
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

df = pd.read_csv("model/data/traffic_data.csv")

FEATURES = [
    "road_id", "hour", "day_of_week", "is_weekend",
    "is_peak_hour", "weather", "event_nearby",
    "past_congestion_30", "past_congestion_60"
]

X = df[FEATURES]
y = df["congestion_label"]

le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

model = XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    eval_metric="mlogloss",
    random_state=42
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred, target_names=le.classes_))

os.makedirs("model", exist_ok=True)
joblib.dump(model, "model/model.pkl")
joblib.dump(le, "model/label_encoder.pkl")
print("model.pkl and label_encoder.pkl saved")