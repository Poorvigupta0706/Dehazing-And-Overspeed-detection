import os
import cv2
import torch
import numpy as np
from model import AOD_pono_net   # ✅ USE PONO MODEL

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ✅ Initialize model
model = AOD_pono_net().to(device)

# ✅ Load your .pkl file
checkpoint = torch.load(r"C:\Users\dell\PycharmProjects\Dehazing\ponomodels (1)\ponomodels\aod-xavier\AOD_9.pkl", map_location=device)

try:
    model.load_state_dict(checkpoint)
except:
    model.load_state_dict(checkpoint['state_dict'])

model.eval()

# ✅ Your frames are here
input_root = "output"

# ✅ Save results here
output_root = "dehazed"

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

        img = cv2.resize(img, (256, 256))
        img = img / 255.0

        img_tensor = torch.from_numpy(img.transpose(2, 0, 1)).float().unsqueeze(0).to(device)

        with torch.no_grad():
            output = model(img_tensor)

        output = output.squeeze().cpu().numpy().transpose(1, 2, 0)
        output = (output * 255).clip(0, 255).astype(np.uint8)

        cv2.imwrite(os.path.join(output_path, file), output)

    print("Processed:", folder)

print("🎉 Dehazing complete")