import sys

def clamp(value, min_val, max_val):
    return max(min_val, min(value, max_val))

def calc_viewport(width, zoom=1.0):
    rowGap = 205 * zoom
    platformWidth = 104 * (0.98 + 0.02 * zoom)
    playerRadius = 32 * zoom
    padding = 8
    
    columns = [0.18, 0.50, 0.82]
    platforms = []
    
    for c in columns:
        px = c * width
        pw = min(platformWidth, width * 0.30)
        platforms.append({
            'x': px,
            'w': pw,
            'left': px - pw/2 - padding,
            'right': px + pw/2 + padding
        })
        
    rects = sorted(platforms, key=lambda p: p['left'])
    corridors = []
    cursor = 2
    
    for r in rects:
        c_width = r['left'] - cursor
        corridors.append(c_width)
        cursor = max(cursor, r['right'])
        
    rightEdge = width - 2
    c_width = rightEdge - cursor
    corridors.append(c_width)
    
    # corridors are A, B, C, D
    # Player diameter
    playerDiameter = playerRadius * 2
    
    print(f"Viewport: {width}px")
    print(f"  Platform Width: {platforms[0]['w']:.1f}, Player Diameter: {playerDiameter:.1f}")
    print(f"  Corridors (Clear width): A={corridors[0]:.1f}, B={corridors[1]:.1f}, C={corridors[2]:.1f}, D={corridors[3]:.1f}")
    
    for i, c in enumerate(['A', 'B', 'C', 'D']):
        passable = "PASSABLE" if corridors[i] >= playerDiameter + 8 else ("MARGINALLY PASSABLE" if corridors[i] >= playerDiameter else "NOT PASSABLE")
        print(f"  {c}: {passable}")

for w in [320, 360, 375, 390, 400, 430, 768, 1024]:
    calc_viewport(w)
