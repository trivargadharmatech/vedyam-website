"""
Remove dark background from the golden tilak emblem logo.
This logo has a dark grey/charcoal background with a golden circular medallion.
We use luminance + color-based masking to isolate the emblem.
"""
from PIL import Image, ImageFilter
import numpy as np

input_path = r"src\assets\tilak.png"
output_path = r"src\assets\tilak.png"

print(f"Processing: {input_path}")
img = Image.open(input_path).convert("RGBA")
data = np.array(img, dtype=np.float64)

r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]

# Calculate luminance
luminance = 0.299 * r + 0.587 * g + 0.114 * b

# Calculate saturation (golden colors have high saturation, grey bg has low)
max_rgb = np.maximum(np.maximum(r, g), b)
min_rgb = np.minimum(np.minimum(r, g), b)
saturation = np.where(max_rgb > 0, (max_rgb - min_rgb) / max_rgb, 0)

# The dark background is characterized by:
# - Low luminance (dark grey/charcoal ~50-70 range)
# - Low saturation (grey has near-zero saturation)
# The golden emblem has:
# - Higher luminance (golden is bright)
# - High saturation (golden/orange is saturated)
# The subtle light glow around the emblem is slightly brighter but still low saturation

# Create alpha: combine luminance threshold with saturation boost
# Base alpha from luminance
lum_alpha = np.clip((luminance - 55) / 40, 0, 1)

# Saturation boost - saturated (golden) pixels get stronger alpha
sat_alpha = np.clip(saturation * 3, 0, 1)

# Combine: use whichever gives higher alpha (golden areas via saturation, bright areas via luminance)
alpha = np.maximum(lum_alpha, sat_alpha)

# Suppress very dark AND unsaturated pixels (the background)
bg_mask = (luminance < 75) & (saturation < 0.15)
alpha[bg_mask] = 0

# Make sure bright golden areas are fully opaque
golden_mask = (luminance > 100) & (saturation > 0.2)
alpha[golden_mask] = 1.0

# Convert to uint8
alpha = (alpha * 255).astype(np.uint8)
data[:,:,3] = alpha

result = Image.fromarray(data.astype(np.uint8))

# Smooth edges
r_ch, g_ch, b_ch, a_ch = result.split()
a_ch = a_ch.filter(ImageFilter.GaussianBlur(radius=1.2))
result = Image.merge("RGBA", (r_ch, g_ch, b_ch, a_ch))

result.save(output_path, "PNG", optimize=True)
print(f"Saved: {output_path} ({result.size[0]}x{result.size[1]})")
print("Done!")
