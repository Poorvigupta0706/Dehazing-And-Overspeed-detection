import os
import cv2
from ultralytics import YOLO

# ✅ Load YOLO model
model = YOLO("yolov8n.pt")

# ✅ Input folder (your enhanced frames)
input_root = r"C:\Users\dell\PycharmProjects\Dehazing\enhanced_frames"

# ✅ Output folder
output_root = r"C:\Users\dell\PycharmProjects\Dehazing\detections"
os.makedirs(output_root, exist_ok=True)

# Loop through each video folder
for folder in os.listdir(input_root):

    input_path = os.path.join(input_root, folder)
    output_path = os.path.join(output_root, folder)

    os.makedirs(output_path, exist_ok=True)

    # Loop through each frame
    for file in os.listdir(input_path):

        img_path = os.path.join(input_path, file)
        frame = cv2.imread(img_path)

        if frame is None:
            continue

        # ✅ Run detection
        results = model(frame)

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])

                cls = int(box.cls[0])

                # 👉 Filter only vehicles (car, truck, bus, bike)
                if cls in [2, 3, 5, 7]:   # COCO classes
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # ✅ Save output
        cv2.imwrite(os.path.join(output_path, file), frame)

    print("Processed:", folder)

print("🎉 Detection complete")