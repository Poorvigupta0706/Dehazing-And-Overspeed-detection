from fastapi import FastAPI
import pandas as pd
import os
from datetime import datetime

app = FastAPI(
    title="AI Traffic Monitoring & Dehazing System",
    description="""
    Real-Time Traffic Monitoring System using:
    - AOD-Net + PONO for Image Dehazing
    - YOLOv8 Vehicle Detection
    - DeepSORT Multi-Object Tracking
    - Vehicle Speed Estimation
    - Overspeed Detection
    - FastAPI Analytics Services
    """,
    version="2.0"
)

CSV_FILE = "vehicle_speed.csv"
SPEED_LIMIT = 60


# ==========================
# ROOT
# ==========================
@app.get("/")
def root():
    return {
        "project": "AI Traffic Monitoring & Dehazing System",
        "status": "running",
        "version": "2.0",
        "timestamp": str(datetime.now())
    }


# ==========================
# HEALTH CHECK
# ==========================
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "api": "running"
    }


# ==========================
# DEHAZING INFO
# ==========================
@app.get("/dehazing")
def dehazing():
    return {
        "model": "AOD-Net",
        "normalization": "PONO",
        "purpose": "Fog Removal and Visibility Enhancement",
        "application": "Improves vehicle detection accuracy in adverse weather conditions"
    }


# ==========================
# SYSTEM INFO
# ==========================
@app.get("/system")
def system_info():
    return {
        "dehazing_model": "AOD-Net + PONO",
        "detection_model": "YOLOv8",
        "tracking_model": "DeepSORT",
        "analytics": "FastAPI",
        "dashboard": "React + TypeScript",
        "containerization": "Docker"
    }


# ==========================
# HELPER FUNCTION
# ==========================
def load_data():

    if not os.path.exists(CSV_FILE):
        return None

    return pd.read_csv(CSV_FILE)


# ==========================
# VEHICLE STATS
# ==========================
@app.get("/stats")
def get_stats():

    df = load_data()

    if df is None:
        return {"error": "vehicle_speed.csv not found"}

    return {
        "total_vehicles": len(df),
        "average_speed": round(float(df["avg_speed_kmph"].mean()), 2),
        "max_speed": round(float(df["avg_speed_kmph"].max()), 2),
        "min_speed": round(float(df["avg_speed_kmph"].min()), 2)
    }


# ==========================
# ALL VEHICLES
# ==========================
@app.get("/vehicles")
def get_vehicles():

    df = load_data()

    if df is None:
        return {"error": "vehicle_speed.csv not found"}

    return df.to_dict(orient="records")


# ==========================
# OVERSPEED VEHICLES
# ==========================
@app.get("/overspeed")
def get_overspeed():

    df = load_data()

    if df is None:
        return {"error": "vehicle_speed.csv not found"}

    overspeed_df = df[
        df["avg_speed_kmph"] > SPEED_LIMIT
    ]

    return {
        "speed_limit": SPEED_LIMIT,
        "overspeed_count": len(overspeed_df),
        "vehicles": overspeed_df.to_dict(orient="records")
    }


# ==========================
# ANALYTICS
# ==========================
@app.get("/analytics")
def analytics():

    df = load_data()

    if df is None:
        return {"error": "vehicle_speed.csv not found"}

    overspeed_count = len(
        df[df["avg_speed_kmph"] > SPEED_LIMIT]
    )

    return {
        "total_vehicles": len(df),
        "average_speed": round(
            float(df["avg_speed_kmph"].mean()), 2
        ),
        "maximum_speed": round(
            float(df["avg_speed_kmph"].max()), 2
        ),
        "minimum_speed": round(
            float(df["avg_speed_kmph"].min()), 2
        ),
        "overspeed_count": overspeed_count,
        "speed_limit": SPEED_LIMIT
    }


# ==========================
# DEHAZING STATUS
# ==========================
@app.get("/dehazing-info")
def dehazing_info():

    return {
        "model": "AOD-Net",
        "normalization": "PONO",
        "purpose": "Fog Removal and Visibility Enhancement",
        "status": "Integrated"
    }


# ==========================
# OVERSPEED RATE
# ==========================
@app.get("/overspeed-rate")
def overspeed_rate():

    df = load_data()

    if df is None:
        return {"error": "vehicle_speed.csv not found"}

    total = len(df)

    overspeed = len(
        df[df["avg_speed_kmph"] > SPEED_LIMIT]
    )

    rate = (overspeed / total) * 100 if total else 0

    return {
        "total_vehicles": total,
        "overspeed_vehicles": overspeed,
        "overspeed_percentage": round(rate, 2)
    }


# ==========================
# VEHICLE VIOLATIONS
# ==========================
@app.get("/violations")
def violations():

    df = load_data()

    if df is None:
        return {"error": "vehicle_speed.csv not found"}

    violation_df = df[
        df["violation"] == "YES"
    ]

    return {
        "count": len(violation_df),
        "vehicles": violation_df.to_dict(orient="records")
    }


# ==========================
# DEBUG
# ==========================
@app.get("/debug")
def debug():

    return {
        "current_directory": os.getcwd(),
        "files": os.listdir("."),
        "csv_exists": os.path.exists(CSV_FILE)
    }