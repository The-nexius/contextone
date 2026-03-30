from PIL import Image, ImageDraw

# Create a proper ICO file
sizes = [(16, 16), (32, 32), (48, 48), (256, 256)]
images = []

for size in sizes:
    img = Image.new('RGBA', size, (37, 99, 235, 255))  # Blue background
    draw = ImageDraw.Draw(img)
    
    # Draw a simple "C" shape
    margin = size[0] // 6
    draw.ellipse([margin, margin, size[0]-margin, size[1]-margin], outline=(255,255,255,255), width=max(1, size[0]//12))
    
    images.append(img)

# Save as ICO
images[0].save('/home/charbel/contextone/public/favicon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (256,256)], append_images=images[1:])
print("Created favicon.ico")

# Also save a PNG version for modern browsers
images[-1].save('/home/charbel/contextone/public/favicon.png', format='PNG')
print("Created favicon.png")