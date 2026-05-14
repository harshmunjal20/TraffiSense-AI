import pandas as pd
import numpy as np
import joblib
import os
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report

df = pd.read_excel("model/data/TrafficCongestion_MultiLocation_7000Rows.xlsx")

df['Timestamp']    = pd.to_datetime(df['Timestamp'])
df['hour']         = df['Timestamp'].dt.hour
df['day_of_week']  = df['Timestamp'].dt.dayofweek
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
df['is_peak'] = df['hour'].isin([8,9,10,17,18,19]).astype(int)
df['weather_code'] = df['Weather'].map({
    'Clear': 0, 'Cloudy': 0, 'Fog': 1, 'Rain': 1, 'Heavy Rain': 2
}).fillna(0).astype(int)
df['Accident'] = df['Accident'].map({'Yes': 1, 'No': 0})
df['Event'] = df['Event'].map({'Yes': 1, 'No': 0})
df['Congestion Level'] = df['Congestion Level'].map({
    'Low': 0, 'Medium': 1, 'High': 2, 'Very High': 3
})

print("Congestion levels:", df['Congestion Level'].value_counts())

FEATURES = [
    'hour', 'day_of_week', 'is_weekend', 'is_peak',
    'weather_code', 'Rain(mm)', 'accident', 'event',
    'Public Transport Density', 'Traffic Volume', 'Avg Speed (km/h)'
]

X = df[FEATURES].copy()
y = df['Congestion Level']

np.random.seed(42)
X['Traffic Volume']   = X['Traffic Volume']   + np.random.normal(0, X['Traffic Volume'].std()   * 0.15, len(X))
X['Avg Speed (km/h)'] = X['Avg Speed (km/h)'] + np.random.normal(0, X['Avg Speed (km/h)'].std() * 0.15, len(X))
X['Rain(mm)']         = (X['Rain(mm)']         + np.random.normal(0, 0.5, len(X))).clip(0)

le = LabelEncoder()
y_enc = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)

model = XGBClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric='mlogloss',
    random_state=42
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred, target_names=le.classes_))

os.makedirs("backend", exist_ok=True)
joblib.dump(model,    "backend/model.pkl")
joblib.dump(le,       "backend/label_encoder.pkl")
joblib.dump(model,    "model/model.pkl")
joblib.dump(le,       "model/label_encoder.pkl")
joblib.dump(FEATURES, "backend/feature_names.pkl")

print("Saved. Classes:", le.classes_)