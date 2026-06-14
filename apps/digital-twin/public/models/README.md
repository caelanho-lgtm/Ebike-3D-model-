# 3D models

The viewer renders a **procedural** bike + holographic rider by default, so the
platform works with no binary assets in the repo.

To use real GLB/GLTF assets (white-label brands typically supply their own):

1. Drop `bike.glb` (and optionally `rider.glb`) into this folder.
2. Pass the URL to the viewer, e.g.
   `<BikeViewer3D ... glbUrl="/models/bike.glb" />`, or set
   `NEXT_PUBLIC_BIKE_GLB=/models/bike.glb` and wire it in.

GLB files are intentionally **not** committed here to keep the repository
text-only; add your own assets locally or via your asset pipeline / CDN.
