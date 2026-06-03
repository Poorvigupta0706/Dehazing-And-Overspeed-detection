import cv2
import os
import glob

from ultralytics import YOLO
from tracking.tracker import track_objects

# =========================
# OUTPUT FOLDER
# =========================
output_folder = r"C:\Users\dell\PycharmProjects\Dehazing\tracked_frames"

os.makedirs(output_folder, exist_ok=True)

# =========================
# LOAD YOLO MODEL
# =========================
model = YOLO("yolov8n.pt")

# =========================
# VEHICLE CLASSES
# =========================
# car = 2
# motorcycle = 3
# bus = 5
# truck = 7
VEHICLE_CLASSES = [2, 3, 5, 7]

# =========================
# INPUT FRAMES ROOT FOLDER
# =========================
frame_folder = r"C:\Users\dell\PycharmProjects\Dehazing\enhanced_frames"

# =========================
# FIND ALL JPG FILES
# =========================
frame_list = sorted(
    glob.glob(
        os.path.join(frame_folder, "**", "*.jpg"),
        recursive=True
    )
)

print(f"Total frames found: {len(frame_list)}")


for frame_path in frame_list:

    # Frame name only
    frame_name = os.path.basename(frame_path)

    # Read frame
    frame = cv2.imread(frame_path)

    if frame is None:
        print(f"Could not read: {frame_path}")
        continue

    print(f"\nProcessing: {frame_name}")

    # =========================
    # YOLO DETECTION
    # =========================
    results = model(frame)

    detections = []

    for result in results:

        boxes = result.boxes

        print(f"Total boxes detected: {len(boxes)}")

        for box in boxes:

            cls = int(box.cls[0])

            confidence = float(box.conf[0])

            print(f"Class: {cls}, Confidence: {confidence}")

            # Vehicle only
            if cls in VEHICLE_CLASSES:

                x1, y1, x2, y2 = box.xyxy[0]

                detections.append([
                    [
                        int(x1),
                        int(y1),
                        int(x2 - x1),
                        int(y2 - y1)
                    ],
                    confidence,
                    "vehicle"
                ])

    print(f"Vehicle detections: {len(detections)}")

    # =========================
    # DEEPSORT TRACKING
    # =========================
    tracked_objects = track_objects(
        detections,
        frame
    )

    print(f"Tracked objects: {len(tracked_objects)}")

    # =========================
    # DRAW TRACKING RESULTS
    # =========================
    for track_id, bbox in tracked_objects:

        x1, y1, x2, y2 = map(int, bbox)

        # Draw rectangle
        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        # Draw ID
        cv2.putText(
            frame,
            f"ID: {track_id}",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255),
            2
        )

    # =========================
    # SAVE TRACKED FRAME
    # =========================
    save_path = os.path.join(
        output_folder,
        frame_name
    )

    success = cv2.imwrite(save_path, frame)

    print(f"Saved: {success} -> {save_path}")

print("\nAll tracked frames saved successfully")