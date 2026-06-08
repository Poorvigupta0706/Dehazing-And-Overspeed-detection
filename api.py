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
def dehazing_info():
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
        "dashboard": "Streamlit",
        "containerization": "Docker"
    }


# ==========================
# VEHICLE STATS
# ==========================
@app.get("/stats")
def get_stats():

    if not os.path.exists(CSV_FILE):
        return {"error": "vehicle_speed.csv not found"}

    df = pd.read_csv(CSV_FILE)

    return {
        "total_vehicles": len(df),
        "average_speed": round(float(df["speed"].mean()), 2),
        "max_speed": round(float(df["speed"].max()), 2),
        "min_speed": round(float(df["speed"].min()), 2)
    }


# ==========================
# ALL VEHICLES
# ==========================
@app.get("/vehicles")
def get_vehicles():

    if not os.path.exists(CSV_FILE):
        return {"error": "vehicle_speed.csv not found"}

    df = pd.read_csv(CSV_FILE)

    return df.to_dict(orient="records")


# ==========================
# OVERSPEED VEHICLES
# ==========================
@app.get("/overspeed")
def get_overspeed():

    if not os.path.exists(CSV_FILE):
        return {"error": "vehicle_speed.csv not found"}

    df = pd.read_csv(CSV_FILE)

    overspeed_df = df[df["speed"] > SPEED_LIMIT]

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

    if not os.path.exists(CSV_FILE):
        return {"error": "vehicle_speed.csv not found"}

    df = pd.read_csv(CSV_FILE)

    overspeed_count = len(df[df["speed"] > SPEED_LIMIT])

    return {
        "total_vehicles": len(df),
        "average_speed": round(float(df["speed"].mean()), 2),
        "maximum_speed": round(float(df["speed"].max()), 2),
        "minimum_speed": round(float(df["speed"].min()), 2),
        "overspeed_count": overspeed_count,
        "speed_limit": SPEED_LIMIT
    }
@app.get("/dehazing-info")
def dehazing_info():

    return {
        "model": "AOD-Net",
        "normalization": "PONO",
        "purpose": "Fog Removal and Visibility Enhancement",
        "status": "Integrated"
    }
@app.get("/overspeed-rate")
def overspeed_rate():

    if not os.path.exists("vehicle_speed.csv"):
        return {"error": "vehicle_speed.csv not found"}

    df = pd.read_csv("vehicle_speed.csv")

    total = len(df)

    overspeed = len(df[df["speed"] > 60])

    rate = (overspeed / total) * 100 if total else 0

    return {
        "total_vehicles": total,
        "overspeed_vehicles": overspeed,
        "overspeed_percentage": round(rate, 2)
    }
@app.get("/debug")
def debug():
    return {
        "current_directory": os.getcwd(),
        "files": os.listdir(".")
    }