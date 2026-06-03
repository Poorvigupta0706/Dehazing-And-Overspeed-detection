import os
import cv2
import csv
import glob #used to find files inside folders and subfolders 

from ultralytics import YOLO
from tracking.tracker import track_objects

# =========================
# LOAD YOLO
# =========================
model = YOLO("yolov8n.pt")

# =========================
# INPUT FOLDER
# =========================
input_folder = r"C:\Users\dell\PycharmProjects\Dehazing\enhanced_frames"

# =========================
# OUTPUT FOLDER
# =========================
output_folder = r"C:\Users\dell\PycharmProjects\Dehazing\tracked_frames"
os.makedirs(output_folder, exist_ok=True)

# =========================
# CSV FILE
# =========================
csv_file = r"C:\Users\dell\PycharmProjects\Dehazing\tracking_data.csv"

# =========================
# VEHICLE CLASSES
# =========================
VEHICLE_CLASSES = [2, 3, 5, 7]

# =========================
# FIND ALL JPG FILES
# =========================
frame_list = sorted(
    glob.glob(
        os.path.join(input_folder, "**", "*.jpg"),
        recursive=True
    )
)

print("Total Frames:", len(frame_list))

# =========================
# OPEN CSV
# =========================
with open(csv_file, "w", newline="") as f:

    writer = csv.writer(f)

    # CSV HEADER
    writer.writerow([
        "frame_no",
        "track_id",
        "cx",
        "cy"
    ])

    frame_no = 0

    # =========================
    # PROCESS FRAMES
    # =========================
    for frame_path in frame_list:

        frame = cv2.imread(frame_path)

        if frame is None:
            continue

        detections = []

        # =========================
        # YOLO DETECTION
        # =========================
        results = model(frame)

        for result in results:

            for box in result.boxes:

                cls = int(box.cls[0])

                if cls in VEHICLE_CLASSES:

                    x1, y1, x2, y2 = box.xyxy[0]

                    confidence = float(box.conf[0])

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

        # =========================
        # TRACKING
        # =========================
        tracked_objects = track_objects(
            detections,
            frame
        )

        # =========================
        # DRAW + SAVE CSV
        # =========================
        for track_id, bbox in tracked_objects:

            x1, y1, x2, y2 = map(int, bbox)

            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2

            # Save to CSV
            writer.writerow([
                frame_no,
                track_id,
                cx,
                cy
            ])

            # Draw box
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
                f"ID:{track_id}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2
            )

        frame_name = os.path.basename(frame_path)

        save_path = os.path.join(
            output_folder,
            frame_name
        )

        cv2.imwrite(save_path, frame)

        print("Processed:", frame_name)

        frame_no += 1

print("\nTracking completed")
print("CSV saved:", csv_file)