import streamlit as st
import pandas as pd
import numpy as np
import requests
df = pd.read_csv("tracking_data.csv")

st.title("🚦 Vehicle Speed & Violation Dashboard")

st.write("Raw Tracking Data")
st.dataframe(df)
FPS = 30  # change if needed
PIXEL_TO_METER = 0.05  # adjust for real-world scaling
SPEED_LIMIT = 40  # km/h
def compute_speed(data):

    results = []

    for track_id in data["track_id"].unique():

        track_data = data[data["track_id"] == track_id].sort_values("frame_no")

        prev = None
        speeds = []

        for _, row in track_data.iterrows():

            if prev is None:
                prev = row
                continue

            dx = row["cx"] - prev["cx"]
            dy = row["cy"] - prev["cy"]

            pixel_dist = np.sqrt(dx**2 + dy**2)

            # convert to meters
            distance_m = pixel_dist * PIXEL_TO_METER

            time_sec = 1 / FPS

            speed_mps = distance_m / time_sec
            speed_kmph = speed_mps * 3.6

            speeds.append(speed_kmph)

            prev = row

        avg_speed = np.mean(speeds) if len(speeds) > 0 else 0

        violation = "YES" if avg_speed > SPEED_LIMIT else "NO"

        results.append([track_id, avg_speed, violation])

    return pd.DataFrame(results, columns=["track_id", "avg_speed_kmph", "violation"])

result_df = compute_speed(df)

st.subheader("🚗 Speed Estimation Result")
st.dataframe(result_df)
st.subheader("📊 Summary")

col1, col2, col3 = st.columns(3)

col1.metric("Total Vehicles", len(result_df))
col2.metric("Violations", len(result_df[result_df["violation"] == "YES"]))
col3.metric("Avg Speed", round(result_df["avg_speed_kmph"].mean(), 2))

st.subheader("📈 Speed Distribution")
st.bar_chart(result_df.set_index("track_id")["avg_speed_kmph"])
st.header("📊 FastAPI Analytics")

response = requests.get("http://127.0.0.1:8000/analytics")

if response.status_code == 200:
    data = response.json()

    col1, col2, col3, col4 = st.columns(4)

    col1.metric("Vehicles", data["total_vehicles"])
    col2.metric("Average Speed", round(data["average_speed"], 2))
    col3.metric("Max Speed", round(data["max_speed"], 2))
    col4.metric("Overspeed", data["overspeed_count"])