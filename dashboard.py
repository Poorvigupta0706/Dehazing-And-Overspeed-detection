import streamlit as st
import requests
import pandas as pd

API_URL = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="AI Traffic Monitoring Dashboard",
    layout="wide"
)

st.title("🚗 AI Traffic Monitoring & Dehazing Dashboard")

# ==========================
# Health Check
# ==========================

try:
    health = requests.get(f"{API_URL}/health", timeout=5)

    if health.status_code == 200:
        st.success("✅ FastAPI Backend Connected")
    else:
        st.error("❌ FastAPI Backend Error")
        st.stop()

except Exception:
    st.error("❌ Cannot connect to FastAPI")
    st.info("Start FastAPI using:")
    st.code("uvicorn api:app --reload")
    st.stop()

# ==========================
# Analytics
# ==========================

st.subheader("📊 Traffic Analytics")

try:
    analytics = requests.get(
        f"{API_URL}/analytics",
        timeout=5
    ).json()

    if "error" in analytics:
        st.warning(analytics["error"])

    else:
        col1, col2, col3, col4 = st.columns(4)

        col1.metric(
            "Total Vehicles",
            analytics.get("total_vehicles", 0)
        )

        col2.metric(
            "Average Speed",
            f"{analytics.get('average_speed', 0):.2f} km/h"
        )

        col3.metric(
            "Maximum Speed",
            f"{analytics.get('max_speed', 0):.2f} km/h"
        )

        col4.metric(
            "Overspeed Vehicles",
            analytics.get("overspeed_count", 0)
        )

except Exception as e:
    st.error(f"Analytics Error: {e}")

st.divider()

# ==========================
# Vehicle Records
# ==========================

st.subheader("🚘 Vehicle Records")

df = pd.DataFrame()

try:
    vehicles = requests.get(
        f"{API_URL}/vehicles",
        timeout=5
    ).json()

    if isinstance(vehicles, list):

        df = pd.DataFrame(vehicles)

        if not df.empty:
            st.dataframe(
                df,
                use_container_width=True
            )
        else:
            st.info("No vehicle data available")

    else:
        st.warning("Vehicle data not available")

except Exception as e:
    st.error(f"Vehicle Data Error: {e}")

# ==========================
# Speed Distribution
# ==========================

if not df.empty and "speed" in df.columns:

    st.subheader("📈 Speed Distribution")

    chart_df = df[["speed"]]

    st.bar_chart(chart_df)

# ==========================
# Overspeed Vehicles
# ==========================

st.subheader("🚨 Overspeed Vehicles")

try:

    overspeed = requests.get(
        f"{API_URL}/overspeed",
        timeout=5
    ).json()

    if "vehicles" in overspeed:

        overspeed_df = pd.DataFrame(
            overspeed["vehicles"]
        )

        if not overspeed_df.empty:

            st.dataframe(
                overspeed_df,
                use_container_width=True
            )

        else:
            st.success(
                "No overspeed vehicles detected"
            )

    else:
        st.warning(
            "Overspeed data not available"
        )

except Exception as e:
    st.error(f"Overspeed Error: {e}")

# ==========================
# Project Information
# ==========================

st.divider()

st.subheader("⚙️ System Architecture")

st.markdown("""
**Pipeline**

1. AOD-Net + PONO Dehazing
2. YOLOv8 Vehicle Detection
3. DeepSORT Tracking
4. Speed Estimation
5. Overspeed Detection
6. FastAPI Analytics
7. Streamlit Dashboard
8. Docker Deployment
""")