import os
import cv2

video_dir = r"C:\Users\dell\PycharmProjects\Dehazing\dataset"
output_root = "/content/output"

os.makedirs(output_root, exist_ok=True)

frame_skip = 2 # take every 5th frame

for video_name in os.listdir(video_dir):
    if not video_name.endswith(".mp4"):
        continue

    video_path = os.path.join(video_dir, video_name)
    cap = cv2.VideoCapture(video_path)

    count = 0
    saved = 0

    video_id = video_name.split(".")[0]

    # 👉 Create a separate folder for each video
    video_output_dir = os.path.join(output_root, video_id)
    os.makedirs(video_output_dir, exist_ok=True)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if count % frame_skip != 0:
            count += 1
            continue

        frame = cv2.resize(frame, (256, 256))

        filename = f"{video_id}_frame_{saved:05d}.jpg"
        cv2.imwrite(os.path.join(video_output_dir, filename), frame)

        saved += 1
        count += 1

    cap.release()
    print(f"{video_name} → {saved} frames extracted into {video_output_dir}")

print("All videos processed")