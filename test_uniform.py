import sys

def calc_uniform(width):
    # Reference logical world is based on, say, 768px width (or maybe 1024?)
    # But let's assume 768 is the canonical tablet view where it looks good.
    ref_width = 768
    scale = width / ref_width
    
    platformWidth = 104 * scale
    playerRadius = 32 * scale
    padding = 8 * scale
    
    columns = [0.18, 0.50, 0.82]
    platforms = []
    
    for c in columns:
        px = c * width
        platforms.append({
            'x': px,
            'w': platformWidth,
            'left': px - platformWidth/2 - padding,
            'right': px + platformWidth/2 + padding
        })
        
    rects = sorted(platforms, key=lambda p: p['left'])
    corridors = []
    cursor = 2 * scale
    
    for r in rects:
        c_width = r['left'] - cursor
        corridors.append(c_width)
        cursor = max(cursor, r['right'])
        
    rightEdge = width - 2 * scale
    c_width = rightEdge - cursor
    corridors.append(c_width)
    
    playerDiameter = playerRadius * 2
    
    print(f"Viewport: {width}px (Scale: {scale:.3f})")
    print(f"  Platform Width: {platformWidth:.1f}, Player Diameter: {playerDiameter:.1f}")
    print(f"  Corridors (Clear width): A={corridors[0]:.1f}, B={corridors[1]:.1f}, C={corridors[2]:.1f}, D={corridors[3]:.1f}")
    
    for i, c in enumerate(['A', 'B', 'C', 'D']):
        # Scale the 8px safety clearance as well
        passable = "PASSABLE" if corridors[i] >= playerDiameter + 8*scale else ("MARGINALLY PASSABLE" if corridors[i] >= playerDiameter else "NOT PASSABLE")
        print(f"  {c}: {passable}")

for w in [320, 360, 375, 390, 400, 430, 768]:
    calc_uniform(w)
