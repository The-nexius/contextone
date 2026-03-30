from PIL import Image, ImageDraw

sizes = [(16, 16), (32, 32), (48, 48), (128, 128), (256, 256)]
for size in sizes:
    img = Image.new('RGBA', size, (37, 99, 235, 255))  # Blue background
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "C" shape
    margin = size[0] // 6
    draw.ellipse([margin, margin, size[0]-margin, size[1]-margin], outline=(255,255,255,255), width=size[0]//8)
    
    base_name = f"icon{size[0]}.png"
    img.save(base_name)
    print(f"Created {base_name}")