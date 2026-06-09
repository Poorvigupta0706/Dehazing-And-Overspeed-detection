# 🚦 TrafficAI — Real-Time Monitoring Dashboard

AI-powered traffic monitoring with image dehazing, vehicle detection, multi-object tracking, and speed analytics.

## Stack

| Layer | Technology |
|---|---|
| **Dehazing** | AOD-Net + PONO normalization |
| **Detection** | YOLOv8 |
| **Tracking** | DeepSORT |
| **Backend** | FastAPI + Python |
| **Frontend** | React + TypeScript + Vite |
| **Container** | Docker + Docker Compose |

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000  
- **Backend API**: http://localhost:8000  
- **API Docs**: http://localhost:8000/docs

---

### Option B — Local Dev

#### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/upload/image` | Upload & process image |
| `POST` | `/api/upload/video` | Upload & process video |
| `GET` | `/api/analytics` | Full analytics summary |
| `GET` | `/api/vehicles` | All tracked vehicles |
| `GET` | `/api/overspeed` | Speeding violations |
| `GET` | `/api/stats` | Speed stats |
| `GET` | `/api/violations` | Violation records |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/system` | Model/stack info |

Interactive Swagger docs at `/docs`.

---

## Replacing Mock Models with Real Models

The backend currently uses **mock AI functions** for demo purposes.  
Swap them with real implementations in `main.py`:

### Dehazing — AOD-Net

```python
# Replace mock_dehaze() with your trained AOD-Net model:
def mock_dehaze(img: np.ndarray) -> np.ndarray:
    tensor = preprocess(img)
    with torch.no_grad():
        dehazed_tensor = aod_net_model(tensor)
    return postprocess(dehazed_tensor)
```

### Detection — YOLOv8

```python
from ultralytics import YOLO
yolo = YOLO("yolov8n.pt")   # or your custom weights

def mock_detect_and_track(img, frame_idx=0):
    results = yolo(img, conf=CONF_THRESHOLD)
    # parse results.boxes into detection dicts
```

### Tracking — DeepSORT

```python
from deep_sort_realtime.deepsort_tracker import DeepSort
tracker = DeepSort(max_age=30)

# In your pipeline, pass detections to tracker.update_tracks()
```

---

## Project Structure

```
traffic-system/
├── backend/
│   ├── main.py              # FastAPI app — all endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── uploads/             # Raw uploaded files
│   ├── processed/           # AI-processed outputs
│   └── vehicle_speed.csv    # Detection log (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Root layout + navigation
│   │   ├── pages/
│   │   │   ├── UploadPage.tsx    # Upload + result display
│   │   │   └── AnalyticsPage.tsx # Analytics dashboard
│   │   ├── components/
│   │   │   ├── BoundingBoxOverlay.tsx
│   │   │   ├── DetectionTable.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── SpeedChart.tsx
│   │   ├── services/
│   │   │   └── api.ts        # Axios service layer
│   │   ├── hooks/
│   │   │   └── useTraffic.ts # Custom hooks
│   │   └── types/
│   │       └── api.ts        # TypeScript interfaces
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```
