"""
Quick verification that the validation plots were generated correctly
"""
from PIL import Image
import os

# Check validation_plots.png
print("=" * 70)
print("VALIDATION PLOTS VERIFICATION")
print("=" * 70)

val_plot = 'validation_plots.png'
feat_plot = 'feature_importance.png'

if os.path.exists(val_plot):
    img = Image.open(val_plot)
    print(f"\n✅ {val_plot}")
    print(f"   Size: {os.path.getsize(val_plot) / 1024:.1f} KB")
    print(f"   Dimensions: {img.size[0]} x {img.size[1]} pixels")
    print(f"   Mode: {img.mode}")
    print(f"   Format: {img.format}")

    # Check if image is mostly white/empty
    # Convert to RGB and get extrema
    if img.mode == 'RGBA':
        img_rgb = img.convert('RGB')
    else:
        img_rgb = img

    extrema = img_rgb.getextrema()
    print(f"   Pixel value range:")
    print(f"     Red:   {extrema[0]}")
    print(f"     Green: {extrema[1]}")
    print(f"     Blue:  {extrema[2]}")

    # If all channels are near (255, 255), image might be blank
    all_channels_bright = all(e[1] == 255 for e in extrema)
    has_dark_pixels = any(e[0] < 100 for e in extrema)

    if has_dark_pixels:
        print("   Status: ✅ Contains plot data (has dark pixels for text/lines)")
    else:
        print("   Status: ⚠️  Might be blank (no dark pixels detected)")
else:
    print(f"\n❌ {val_plot} not found!")

print()

if os.path.exists(feat_plot):
    img = Image.open(feat_plot)
    print(f"✅ {feat_plot}")
    print(f"   Size: {os.path.getsize(feat_plot) / 1024:.1f} KB")
    print(f"   Dimensions: {img.size[0]} x {img.size[1]} pixels")
    print(f"   Mode: {img.mode}")
    print(f"   Format: {img.format}")
else:
    print(f"❌ {feat_plot} not found!")

print("\n" + "=" * 70)
print("VERIFICATION COMPLETE")
print("=" * 70)
print("\nIf both files show '✅ Contains plot data', your plots are ready!")
print("You can now open them in any image viewer to visually inspect.")
