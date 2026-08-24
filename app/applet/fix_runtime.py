filepath = 'src/games/circuit-climb/runtime/useCircuitClimbPrototypeRuntime.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Let's locate the first 'const screenY = worldToScreenY(bot.y);'
# and the first '// DEVELOPMENT OVERLAY MARKER'
first_marker_pos = content.find('// DEVELOPMENT OVERLAY MARKER')
if first_marker_pos != -1:
    # Let's find the 'const screenY = worldToScreenY(bot.y);' right before it
    before_part = content[:first_marker_pos]
    screen_y_pos = before_part.rfind('const screenY = worldToScreenY(bot.y);')
    if screen_y_pos != -1:
        # Let's find the matching 'ctx.restore();\n      }' after first_marker_pos
        end_marker_pos = content.find('ctx.restore();\n      }', first_marker_pos)
        if end_marker_pos != -1:
            end_idx = end_marker_pos + len('ctx.restore();\n      }')
            # Slice it out!
            block_to_remove = content[screen_y_pos:end_idx]
            print(f"Slicing out block of length {len(block_to_remove)}...")
            content = content[:screen_y_pos] + content[end_idx:]
            print("Successfully sliced out upper duplicate!")
        else:
            print("ERROR: Matching end ctx.restore() not found.")
    else:
        print("ERROR: Preceding const screenY not found.")
else:
    print("ERROR: // DEVELOPMENT OVERLAY MARKER not found.")

# Let's also verify we replace any CONFIG.showV2Telemetry with showV2Telemetry
if 'CONFIG.showV2Telemetry' in content:
    content = content.replace('CONFIG.showV2Telemetry', 'showV2Telemetry')
    print("Replaced CONFIG.showV2Telemetry with showV2Telemetry.")

with open(filepath, 'w') as f:
    f.write(content)

print("Done!")
