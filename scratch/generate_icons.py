import os
from PIL import Image, ImageDraw

def create_round_icon(size):
    # Supersampling for crisp anti-aliasing
    scale = 4
    high_res_size = size * scale
    
    img = Image.new("RGBA", (high_res_size, high_res_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = high_res_size / 2
    margin = 16 * scale
    radius = center - margin
    
    # 1. Draw outer circle background (Dark Navy #030a16)
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill=(3, 10, 22, 255),
        outline=(34, 197, 94, 255), # Emerald border #22c55e
        width=int(6 * scale)
    )
    
    # 2. Draw 'V' path: M14 16 L32 48 L50 16
    def n(coord):
        return (coord / 64.0) * high_res_size

    v_points = [
        (n(15), n(18)),
        (n(32), n(46)),
        (n(49), n(18))
    ]
    
    draw.line(v_points, fill=(34, 197, 94, 255), width=int(5.5 * scale), joint="round")
    
    # 3. Draw 'x' path: M38 32 L50 48 and M50 32 L38 48
    x_line1 = [(n(38), n(32)), (n(50), n(46))]
    x_line2 = [(n(50), n(32)), (n(38), n(46))]
    
    draw.line(x_line1, fill=(34, 197, 94, 255), width=int(4.5 * scale))
    draw.line(x_line2, fill=(34, 197, 94, 255), width=int(4.5 * scale))
    
    # Resize down with Lanczos anti-aliasing
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

# Output paths
public_dir = os.path.join(os.getcwd(), "public")

icon_512 = create_round_icon(512)
icon_512.save(os.path.join(public_dir, "icon-512x512.png"), "PNG")

icon_192 = create_round_icon(192)
icon_192.save(os.path.join(public_dir, "icon-192x192.png"), "PNG")

print("Successfully generated round icon-512x512.png and icon-192x192.png with transparent background!")
