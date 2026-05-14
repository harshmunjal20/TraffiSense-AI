import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pickle

df = pd.read_excel('/Users/jami/traffic-predictor/model/data/TrafficCongestion_MultiLocation_7000Rows.xlsx')
df['Timestamp'] = pd.to_datetime(df['Timestamp'])

df['hour'] = df['Timestamp'].dt.hour
df['day_of_week'] = df['Timestamp'].dt.dayofweek
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
df['is_peak'] = df['hour'].isin([8,9,10,17,18,19]).astype(int)

df['Accident'] = df['Accident'].map({'Yes': 1, 'No': 0})
df['Event'] = df['Event'].map({'Yes': 1, 'No': 0})

le_weather = LabelEncoder()
df['Weather_enc'] = le_weather.fit_transform(df['Weather'])

le_location = LabelEncoder()
df['Location_enc'] = le_location.fit_transform(df['Location'])

df['Congestion_enc'] = df['Congestion Level'].map({
    'Low': 0, 'Medium': 1, 'High': 2, 'Very High': 3
})

features = [
    'Traffic Volume', 'Avg Speed (km/h)', 'Rain(mm)',
    'Accident', 'Event', 'Public Transport Density',
    'Weather_enc', 'Location_enc',
    'hour', 'day_of_week', 'is_weekend', 'is_peak'
]

X = df[features]
y = df['Congestion_enc']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    use_label_encoder=False,
    eval_metric='mlogloss',
    random_state=42
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred,
      target_names=['Low','Medium','High','Very High']))

with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('label_encoder_weather.pkl', 'wb') as f:
    pickle.dump(le_weather, f)
with open('label_encoder_location.pkl', 'wb') as f:
    pickle.dump(le_location, f)

print("Saved.")