import pandas as pd
import numpy as np

FPS = 30
PIXEL_TO_METER = 0.05
SPEED_LIMIT = 20

df = pd.read_csv("tracking_data.csv")

results = []

for track_id in df["track_id"].unique():

    vehicle = df[df["track_id"] == track_id]

    vehicle = vehicle.sort_values("frame_no")

    speeds = []

    # Multi-frame averaging
    for i in range(1, len(vehicle)):

        x1 = vehicle.iloc[i-1]["cx"]
        y1 = vehicle.iloc[i-1]["cy"]

        x2 = vehicle.iloc[i]["cx"]
        y2 = vehicle.iloc[i]["cy"]

        frame1 = vehicle.iloc[i-1]["frame_no"]
        frame2 = vehicle.iloc[i]["frame_no"]

        distance_pixels = np.sqrt(
            (x2 - x1)**2 +
            (y2 - y1)**2
        )

        distance_meters = distance_pixels * PIXEL_TO_METER

        time_seconds = (frame2 - frame1) / FPS

        if time_seconds == 0:
            continue

        speed_mps = distance_meters / time_seconds

        speed_kmph = speed_mps * 3.6

        speeds.append(speed_kmph)

    if len(speeds) == 0:
        continue

    # Multi-frame average speed
    avg_speed = np.mean(speeds)

    violation = "YES" if avg_speed > SPEED_LIMIT else "NO"

    results.append([
        track_id,
        round(avg_speed, 2),
        violation
    ])

output = pd.DataFrame(
    results,
    columns=[
        "track_id",
        "avg_speed_kmph",
        "violation"
    ]
)

output.to_csv(
    "vehicle_speed.csv",
    index=False
)

print(output)

print("\nSaved: vehicle_speed.csv")