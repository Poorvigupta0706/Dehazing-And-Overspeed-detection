import os
import cv2
import numpy as np

# ✅ Input: your existing frames (dehazed or original)
input_root = "dehazed"        # or "output" if you want original

# ✅ Output: enhanced images
output_root = "enhanced_frames"

os.makedirs(output_root, exist_ok=True)

for folder in os.listdir(input_root):

    input_path = os.path.join(input_root, folder)
    output_path = os.path.join(output_root, folder)

    os.makedirs(output_path, exist_ok=True)

    for file in os.listdir(input_path):

        img_path = os.path.join(input_path, file)
        img = cv2.imread(img_path)

        if img is None:
            continue

        # ===============================
        # ✅ LIGHT ENHANCEMENT
        # ===============================

        # 1. Slight brightness + contrast
        alpha = 1.08   # contrast (1.0–1.2)
        beta = 15      # brightness (10–25)
        enhanced = cv2.convertScaleAbs(img, alpha=alpha, beta=beta)

        # 2. Gamma correction
        gamma = 0.9
        inv_gamma = 1.0 / gamma
        table = np.array([
            (i / 255.0) ** inv_gamma * 255 for i in range(256)
        ]).astype("uint8")
        enhanced = cv2.LUT(enhanced, table)

        # 3. Very light sharpening
        blur = cv2.GaussianBlur(enhanced, (0, 0), sigmaX=1.0)
        enhanced = cv2.addWeighted(enhanced, 1.15, blur, -0.15, 0)

        # ===============================

        cv2.imwrite(os.path.join(output_path, file), enhanced)

    print("Enhanced:", folder)

print("🎉 Light enhancement complete")