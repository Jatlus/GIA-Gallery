# GIA Gallery ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Phase Checklist

## How to use this file
- The agent updates this file in place during each session.
- Mark items [ ] ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ [x] as they pass their corresponding test in TESTS.md.
- Do not mark an item [x] unless its test ID in TESTS.md shows PASS.
- Change STATUS to IN PROGRESS when the phase begins.
- Change STATUS to AWAITING HUMAN APPROVAL when all agent tests pass ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â then halt.
- Change STATUS to COMPLETE only after the human sends written approval ("Phase N approved. Begin Phase N+1.").
- Change STATUS to BLOCKED if any item cannot be resolved after 3 debug attempts ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â then halt.
- Never mark a later phase IN PROGRESS while an earlier phase is not COMPLETE.
- The human runs HUMAN_REVIEW.md (not this file) for their verification checklist.

---

## Phase 1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Vite scaffold + Three.js surface
STATUS: COMPLETE

### Console & load
- [ ] P1-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Clean load, zero console errors
- [ ] P1-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Canvas fills viewport
- [ ] P1-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No CORS or module errors
- [ ] P1-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Hot reload works

### Animation
- [ ] P1-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Surface is animated
- [x] P1-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Animation uses u_time uniform (code verification)
- [ ] P1-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Animation does not freeze after 60 seconds
- [ ] P1-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tab background throttle recovery

### Performance
- [ ] P1-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Baseline FPS ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 58
- [ ] P1-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No memory growth over 30 seconds
- [x] P1-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Geometry segment count = 128 (code verification)

### lil-gui controls
- [ ] P1-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GUI panel is visible
- [ ] P1-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Noise scale slider changes surface complexity
- [ ] P1-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Noise speed slider changes animation rate
- [ ] P1-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Color hue slider changes surface color
- [ ] P1-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GUI state persists across slider interaction
- [ ] P1-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GUI does not cause console errors

### Shader correctness
- [ ] P1-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Vertex shader compiles without errors
- [ ] P1-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fragment shader compiles without errors
- [x] P1-T20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Simplex noise implementation present (code verification)

---

## Phase 2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Ping-pong deformation buffer
STATUS: COMPLETE

### Render target setup
- [x] P2-T01 - Two WebGLRenderTargets exist (code verification)
- [x] P2-T02 - Render target format correct (code verification)
- [x] P2-T03 - Render target size = 512x512 (code verification)
- [x] P2-T04 - Ping-pong swap happens every frame (code verification)
- [x] P2-T05 - No CPU vertex reads in render loop (code verification)

### Deformation behavior
- [ ] P2-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Click creates deformation
- [ ] P2-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation is at click location ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â top-left
- [ ] P2-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation is at click location ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â bottom-right
- [ ] P2-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Multiple clicks accumulate simultaneously
- [ ] P2-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation shape has smooth falloff
- [ ] P2-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Repeated clicks in same spot accumulate

### Decay behavior
- [ ] P2-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â decay=0 is permanent after 30 seconds
- [ ] P2-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â decay=0.5 fades within 5 seconds
- [ ] P2-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â decay=1.0 fades within 1-2 seconds
- [ ] P2-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Decay GUI updates in real time

### Stability & GPU
- [ ] P2-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No WebGL errors during rapid clicking
- [ ] P2-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS maintained during deformation
- [ ] P2-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No GPU memory growth over 60 seconds
- [x] P2-T19 - u_deformationTexture in vertex shader (code verification)
- [x] P2-T20 - u_decay in deform shader (code verification)

---

## Phase 3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam overlay + MediaPipe bootstrap
STATUS: COMPLETE

### Permission denied path
- [ ] P3-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Permission prompt appears on load
- [ ] P3-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deny permission ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no crash
- [ ] P3-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deny permission ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â fallback UI shown
- [ ] P3-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deny permission ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no console errors
- [ ] P3-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deny then grant ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â recovery on reload

### Webcam overlay
- [ ] P3-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Video element is overlaid and full screen
- [ ] P3-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Overlay opacity is between 0.15 and 0.22
- [ ] P3-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Overlay is mirrored horizontally
- [ ] P3-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Overlay does not capture pointer events
- [ ] P3-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Overlay fills canvas ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â left edge aligned
- [ ] P3-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Overlay fills canvas ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â right edge aligned
- [ ] P3-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Overlay fills canvas ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â top and bottom aligned
- [ ] P3-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Canvas artwork visible through overlay

### MediaPipe landmark tracking
- [ ] P3-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Landmarks appear when hand visible
- [ ] P3-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Landmarks disappear when hand leaves
- [ ] P3-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tracking handles two hands
- [ ] P3-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tracking handles one hand leaving
- [ ] P3-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Landmark positions are mirrored correctly
- [ ] P3-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tracking at screen edges
- [ ] P3-T20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No crash when webcam is covered
- [ ] P3-T21 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tracking lag < 100ms
- [ ] P3-T22 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No console errors during 30-second tracking session

---

## Phase 4 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Single-hand pinch + raycasting
STATUS: COMPLETE

### Pinch detection
- [ ] P4-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Open hand produces no deformation
- [ ] P4-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Pinch activates deformation
- [ ] P4-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Pinch threshold is correct (~0.07)
- [x] P4-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Pinch strength is analog smoothstep (code verification)
- [ ] P4-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Releasing pinch stops deformation
- [ ] P4-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Rapid pinch-release cycles stable

### Coordinate mapping
- [ ] P4-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Left side of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ left of mesh
- [ ] P4-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right side of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ right of mesh
- [ ] P4-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Top of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ top of mesh
- [ ] P4-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Bottom of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ bottom of mesh
- [x] P4-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â X-flip applied in coordinate conversion (code verification)
- [x] P4-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Raycasting hits the mesh (code verification)
- [ ] P4-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No deformation when raycast misses

### Smoothing
- [x] P4-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Position lerped with LERP_FACTOR (code verification)
- [ ] P4-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fast movement does not cause spike jumps
- [ ] P4-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Stationary hand jitter is minimal

### Sphere indicator
- [ ] P4-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sphere appears when hand in frame
- [ ] P4-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sphere is gray when not pinching
- [ ] P4-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sphere changes color when pinching
- [ ] P4-T20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sphere disappears when hand leaves frame
- [ ] P4-T21 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sphere position matches deformation location

### Edge cases
- [ ] P4-T22 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Non-dominant hand works
- [ ] P4-T23 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Partially visible hand works
- [ ] P4-T24 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Angled hand works
- [ ] P4-T25 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 55 during active pinching

---

## Phase 5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Two-hand simultaneous interaction
STATUS: COMPLETE

### Independent hand tracking
- [ ] P5-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Two sphere indicators appear
- [ ] P5-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Indicators track independently
- [x] P5-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ maxNumHands set to 2 (code verification)
- [x] P5-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Per-hand state stored separately (code verification)

### Independent deformation
- [ ] P5-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Left pinch only affects left region
- [ ] P5-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right pinch only affects right region
- [ ] P5-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Both pinching simultaneously works
- [x] P5-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Both hands write to same deformation texture (code verification)

### Stretch effect
- [ ] P5-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Stretch effect activates when both hands pinch
- [x] P5-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Stretch scales by hand distance (code verification)
- [ ] P5-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Stretch reverts when one hand releases
- [ ] P5-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Stretch at minimum distance ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no artifacts
- [ ] P5-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Stretch at maximum distance ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â reasonable upper bound

### Hand entry and exit edge cases
- [ ] P5-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â One hand enters mid-session
- [ ] P5-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â One hand exits mid-session
- [ ] P5-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Both hands exit simultaneously
- [ ] P5-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Both hands re-enter after leaving
- [ ] P5-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Hand index assignment is stable
- [ ] P5-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Rapid hand swap

### Crossing and occlusion
- [ ] P5-T20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Hands crossed
- [ ] P5-T21 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Hands overlapping
- [ ] P5-T22 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â One hand occluding other

### Performance
- [ ] P5-T23 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 55 with both hands active for 30 seconds
- [ ] P5-T24 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 50 with rapid movement
- [x] P5-T25 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Uniforms u_pinchPositions[2] and u_pinchStrengths[2] declared (code verification)

---

## Phase 6 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Polish + performance audit
STATUS: COMPLETE

### Debug artifacts removed
- [ ] P6-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No debug landmark canvas in DOM
- [x] P6-T02 - No console.log calls in source
- [x] P6-T03 - No commented-out debug code

### Final GUI
- [ ] P6-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â All 7 controls present
- [ ] P6-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam opacity ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 0 hides overlay
- [ ] P6-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam opacity at max
- [ ] P6-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation strength at minimum is weak
- [ ] P6-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation strength at maximum is dramatic
- [ ] P6-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Falloff radius at minimum is tight
- [ ] P6-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Falloff radius at maximum spreads wide
- [ ] P6-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â All controls update in real time

### GPU-only verification
- [x] P6-T12 - No vertex attribute reads in JS render loop (code verification)
- [ ] P6-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation appears in GPU timeline
- [ ] P6-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Main thread JS frame budget ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¤ 8ms per frame

### Stress tests
- [ ] P6-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 5-minute sustained run without crash or memory growth
- [ ] P6-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Window resize ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â canvas and overlay re-align
- [ ] P6-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Window resize ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â restore to full size
- [ ] P6-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fullscreen mode works
- [ ] P6-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Rapid GUI interaction during hand tracking
- [ ] P6-T20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Browser zoom at 125%
- [ ] P6-T21 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Browser zoom at 75%
### README and documentation
- [x] P6-T22 - README.md exists
- [x] P6-T23 - README has setup instructions
- [x] P6-T24 - README has browser requirements
- [x] P6-T25 - README has controls reference
- [ ] P6-T26 - Fresh install test passes

---

## Phase 7 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Splash page, mouse interaction, and webcam toggle
STATUS: COMPLETE

### Splash page
- [ ] P7-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Splash appears on load over animated surface
- [ ] P7-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Surface animates behind splash before dismiss
- [ ] P7-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Splash contains correct heading and all instruction content
- [ ] P7-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Enter Gallery button dismisses splash with fade
- [ ] P7-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Escape key dismisses splash
- [ ] P7-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Help button (?) re-opens splash from main UI
- [ ] P7-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Re-opening splash does not stack overlays
- [ ] P7-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Pressing ? key re-opens splash when not already open
- [ ] P7-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation on surface is preserved when splash re-opens and closes
- [ ] P7-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Splash has no console errors on load or dismiss

### Mode toggle
- [ ] P7-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Toggle button is visible at bottom-center of screen
- [ ] P7-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Toggle shows current mode (Mouse or Webcam)
- [ ] P7-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Default mode on load is Mouse
- [ ] P7-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Clicking toggle switches to Webcam Mode
- [ ] P7-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Clicking toggle again returns to Mouse Mode
- [x] P7-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mode switch resets hand state immediately (code verification)
- [ ] P7-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam denied ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â toggle reverts to Mouse Mode
- [ ] P7-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam denied ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â inline error appears then fades
- [ ] P7-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam denied ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no crash, app stays in Mouse Mode
- [ ] P7-T20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation preserved across mode switches

### Mouse interaction ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â core
- [ ] P7-T21 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Click and drag sculpts surface
- [ ] P7-T22 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sculpt follows cursor continuously while held
- [ ] P7-T23 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Releasing mouse stops deformation
- [ ] P7-T24 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation persists after release (decay=0)
- [ ] P7-T25 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse cursor shows crosshair on canvas
- [ ] P7-T26 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Cursor changes to grabbing while left button held
- [ ] P7-T27 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse indicator circle follows cursor on canvas

### Mouse interaction ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â coordinate mapping
- [ ] P7-T28 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Left side of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ left of mesh (no X flip)
- [ ] P7-T29 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right side of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ right of mesh
- [ ] P7-T30 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Top of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ top of mesh
- [ ] P7-T31 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Bottom of screen ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ bottom of mesh
- [x] P7-T32 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No X flip applied to mouse coordinates (code verification)

### Mouse interaction ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â stretch simulation
- [ ] P7-T33 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right-click context menu disabled on canvas
- [ ] P7-T34 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right-click held while dragging activates stretch
- [ ] P7-T35 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Stretch point fixed at right-click position
- [ ] P7-T36 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Releasing right-click deactivates stretch
- [ ] P7-T37 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Stretch effect matches webcam two-hand stretch visually

### Mouse interaction ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â edge cases
- [ ] P7-T38 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse leaves canvas ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â deformation stops
- [ ] P7-T39 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Rapid click-release cycles stable
- [ ] P7-T40 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â¥ 55 during active mouse sculpting
- [x] P7-T41 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse input disabled when in Webcam Mode (code verification)
- [x] P7-T42 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam input disabled when in Mouse Mode (code verification)

### Interaction parity
- [ ] P7-T43 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Same click position produces same deformation as equivalent pinch position
- [x] P7-T44 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Both modes use same handState[] array (code verification)
- [x] P7-T45 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Both modes use same deform shader uniforms (code verification)

### Final polish
- [x] P7-T46 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No console.log calls in any Phase 7 source files
- [x] P7-T47 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No commented-out code in Phase 7 source files
- [x] P7-T48 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â README.md updated with Mouse Mode, Webcam Mode, toggle instructions
- [ ] P7-T49 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fresh install test ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â splash appears, Mouse Mode works, Webcam Mode toggles correctly
- [ ] P7-T50 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 5-minute sustained run in Mouse Mode ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no crash, no memory growth

---

## Phase 8 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 3D environment foundation
STATUS: COMPLETE

### Camera repositioning
- [ ] P8-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Camera views scene from an angle
- [ ] P8-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Surface still animates
- [ ] P8-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse Mode sculpting still works
- [ ] P8-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam Mode pinch still works
- [x] P8-T05 - Camera uses spherical coordinates (code verification)
- [x] P8-T06 - camera.lookAt(0,0,0) called every frame (code verification)

### Axis gizmo
- [ ] P8-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Axis gizmo visible on load
- [ ] P8-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Axis arrowheads visible
- [ ] P8-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Axis labels visible
- [ ] P8-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Axis labels always face camera (verify after Phase 11)
- [ ] P8-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â A key toggles axis
- [ ] P8-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â GUI Axis Lines toggle works
- [ ] P8-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Axis does not interfere with sculpting
- [x] P8-T14 - Axis gizmo uses tube geometry not Line (code verification)

### Preserved behavior
- [ ] P8-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â All 6 GUI controls present and functional
- [ ] P8-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Splash page still works
- [ ] P8-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mode toggle still works
- [ ] P8-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No console errors on load
- [ ] P8-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS above 55 at rest

---

## Phase 9 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation architecture migration
STATUS: COMPLETE

### Migration correctness
- [ ] P9-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Flat plane deforms as before
- [ ] P9-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation persists at decay=0
- [ ] P9-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Decay works correctly
- [ ] P9-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Multiple simultaneous deformations
- [x] P9-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â pingpong.js deleted (code verification)
- [x] P9-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â deform.vert deleted (code verification)
- [x] P9-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â deform.frag deleted (code verification)
- [x] P9-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â DataTexture used for displacement (code verification)
- [x] P9-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Vertex world space transform applied (code verification)
- [x] P9-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â npm run build succeeds after deletion
- [ ] P9-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No console errors during sculpting
- [ ] P9-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam pinch sculpting still works
- [ ] P9-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS above 55 during active sculpting
- [x] P9-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Decay snap-to-zero (code verification)

---

## Phase 10 - Object spawner
STATUS: COMPLETE

### Object switching
- [ ] P10-T01 - Object selector in GUI
- [ ] P10-T02 - Switching to Sphere
- [ ] P10-T03 - Switching to Cube
- [ ] P10-T04 - Switching to Torus
- [ ] P10-T05 - Switching to Torus Knot
- [ ] P10-T06 - Switching to Icosahedron
- [ ] P10-T07 - Switching to Particles
- [ ] P10-T08 - All objects spawn without console errors
- [ ] P10-T09 - Deformation clears on object switch
- [ ] P10-T10 - Sphere deforms smoothly
- [ ] P10-T11 - Cube deforms
- [ ] P10-T12 - Torus deforms
- [ ] P10-T13 - Torus Knot deforms
- [ ] P10-T14 - Icosahedron deforms
- [ ] P10-T15 - Particles respond to sculpt
- [ ] P10-T16 - Decay works on all objects
- [ ] P10-T17 - GUI slider values preserved after object switch
- [ ] P10-T18 - FPS above 50 sculpting Icosahedron
- [ ] P10-T19 - Plane still behaves as in Phase 7/9
- [ ] P10-T20 - Scale slider resizes current object and resets on object switch
- [ ] P10-T21 - Mouse axis drag stretches along selected axis without sculpting or shader side effects
- [ ] P10-T22 - Webcam axis pinch-drag stretches along selected axis without sculpting
- [ ] P10-T23 - Two-hand empty-space pinch scales the object and updates the Scale slider

---
## Phase 11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse camera controls
STATUS: COMPLETE

### Zoom
- [ ] P11-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Ctrl+scroll up zooms in
- [ ] P11-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Ctrl+scroll down zooms out
- [ ] P11-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Scroll without Ctrl does not zoom
- [ ] P11-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom clamped at minimum
- [ ] P11-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom clamped at maximum
- [ ] P11-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom is smooth not jumpy

### Orbit
- [ ] P11-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right-click drag on empty space orbits
- [ ] P11-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Horizontal drag orbits horizontally
- [ ] P11-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Vertical drag orbits vertically
- [ ] P11-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Camera always looks at origin during orbit
- [ ] P11-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Camera does not flip over poles
- [ ] P11-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right-click on mesh activates stretch not orbit
- [ ] P11-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Right-click on empty space does not activate stretch

### Sculpting after camera movement
- [ ] P11-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sculpting works after zoom
- [ ] P11-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sculpting works after orbit
- [ ] P11-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS above 50 during active orbit
- [ ] P11-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No console errors during camera controls

---

## Phase 12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Gesture camera controls
STATUS: COMPLETE

### Gesture detection visual feedback
- [ ] P12-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fist gesture shows coral filled circle
- [ ] P12-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Open palm shows teal ring
- [ ] P12-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fist and palm indicators are mutually exclusive
- [ ] P12-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Pinch indicator takes priority over fist indicator

### Fist zoom
- [ ] P12-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Single fist zooms in continuously
- [ ] P12-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom in stops when fist opens
- [ ] P12-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom in indicator shows
- [ ] P12-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fist zoom does not activate when pinching
- [ ] P12-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom clamped at minimum during fist zoom

### Fist-to-palm zoom out
- [ ] P12-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fist-to-palm triggers one zoom out
- [ ] P12-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom out is one-shot not continuous
- [ ] P12-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Zoom out indicator shows

### Two-hand orbit
- [ ] P12-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Both open palms moving right orbits camera right
- [ ] P12-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Both open palms moving upward pitches camera up
- [ ] P12-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Opposite hand directions do not orbit
- [ ] P12-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 5-frame gate prevents accidental orbit
- [ ] P12-T17 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Orbit indicator shows
- [ ] P12-T18 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Two-hand orbit does not activate while one hand is pinching

### Sculpting after gesture camera
- [ ] P12-T19 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Sculpting works after fist zoom
- [ ] P12-T20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Deformation persists through camera orbit
- [ ] P12-T21 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS above 50 with gesture detection active
- [ ] P12-T22 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No console errors during gesture session

---

## Phase 13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Final polish and preserved behavior audit
STATUS: COMPLETE

### Cleanup
- [x] P13-T01 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No console.log in phases 8-12 source files
- [x] P13-T02 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No commented-out code in new files

### Full preserved behavior audit
- [ ] P13-T03 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Splash appears on load and is dismissible
- [ ] P13-T04 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Splash contains updated instructions
- [ ] P13-T05 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse Mode sculpting works on all 7 objects
- [ ] P13-T06 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse Mode orbit works on all 7 objects
- [ ] P13-T07 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Mouse Mode stretch works on all 7 objects
- [ ] P13-T08 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam Mode pinch works on all 7 objects
- [ ] P13-T09 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Webcam Mode gestures do not activate in Mouse Mode
- [ ] P13-T10 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Axis gizmo visible and toggleable in all states
- [ ] P13-T11 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â All GUI controls respond on all objects

### Performance
- [ ] P13-T12 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FPS above 50 with all systems active
- [ ] P13-T13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No memory growth over 5 minutes
- [x] P13-T14 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â No DataTexture needsUpdate spam (code verification)

### Documentation
- [x] P13-T15 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â README updated with all new features
- [ ] P13-T16 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Fresh install works

---

## Phase 14 — Color system overhaul
STATUS: COMPLETE

### Shader uniform migration
- [ ] P14-T01 — Surface renders with correct default color
- [x] P14-T02 – u_hue removed from shader (code verification)
- [x] P14-T03 – u_color present in shader (code verification)
- [x] P14-T04 – npm run build succeeds after uniform change
- [ ] P14-T05 — No console errors on load

### Color picker UI
- [ ] P14-T06 — Color swatch button present in lil-gui panel
- [ ] P14-T07 — Clicking swatch opens color picker panel
- [ ] P14-T08 — Color picker contains saturation/brightness field
- [ ] P14-T09 — Color picker contains hue bar
- [ ] P14-T10 — Color picker contains preview boxes
- [ ] P14-T11 — RGB mode inputs present
- [ ] P14-T12 — CMYK mode toggle works
- [ ] P14-T13 — Hex input present and correct
- [ ] P14-T14 — Dragging saturation field updates surface color
- [ ] P14-T15 — Dragging hue bar updates surface color
- [ ] P14-T16 — Typing RGB values updates surface color
- [ ] P14-T17 — Typing hex value updates color
- [ ] P14-T18 — Clicking outside picker closes it
- [ ] P14-T19 — Clicking swatch again closes picker
- [ ] P14-T20 — Swatch button reflects current color

### Preserved behavior
- [ ] P14-T21 — All sculpting still works
- [ ] P14-T22 — All other GUI controls still work
- [ ] P14-T23 — FPS above 50 with color picker open

---

## Phase 15 — Audio capture and band analysis
STATUS: COMPLETE

### Audio controls
- [ ] P15-T01 — Audio Reactive toggle present in GUI
- [ ] P15-T02 — Reactivity slider hidden by default
- [ ] P15-T03 — Enabling Audio Reactive shows sub-controls
- [ ] P15-T04 — Instructions text visible
- [ ] P15-T05 — Start Audio opens screen share dialog
- [ ] P15-T06 — Cancelling dialog does not crash
- [ ] P15-T07 — Sharing with system audio activates audio
- [ ] P15-T08 — Bass affects noise scale
- [ ] P15-T09 — Mids affect noise speed
- [ ] P15-T10 — Reactivity slider at 0 makes surface unresponsive
- [ ] P15-T11 — Reactivity slider at max amplifies response
- [ ] P15-T12 — Stop Audio button stops audio
- [ ] P15-T13 — Disabling Audio Reactive stops audio
- [ ] P15-T14 — Noise Scale and Speed sliders resume after audio stops
- [ ] P15-T15 — No audio detected warning
- [ ] P15-T16 — Particles respond more dramatically to bass
- [ ] P15-T17 — FPS above 50 with audio active
- [ ] P15-T18 — No console errors during audio session

---

## Phase 16 — High frequency shimmer
STATUS: COMPLETE

- [x] P16-T01 — u_highFreq uniform present (code verification)
- [x] P16-T02 — No shimmer when audio is off
- [ ] P16-T03 — Shimmer appears with high frequency audio
- [ ] P16-T04 — Shimmer more dramatic on particles
- [ ] P16-T05 — Shimmer resets to zero when audio stops
- [ ] P16-T06 — Shimmer does not affect sculpting
- [x] P16-T07 — FPS above 50 with shimmer active
- [x] P16-T08 — npm run build succeeds after shader addition

---

## Phase 17 — Gradient editor and color reactivity
STATUS: AWAITING HUMAN APPROVAL

### Gradient editor UI
- [ ] P17-T01 — Color Reactive toggle hidden when audio off
- [ ] P17-T02 — Color Reactive toggle appears when audio enabled
- [ ] P17-T03 — Enabling Color Reactive shows gradient editor
- [ ] P17-T04 — Default gradient is full rainbow
- [ ] P17-T05 — Stop handles visible below gradient bar
- [ ] P17-T06 — Clicking a stop opens color picker
- [ ] P17-T07 — Changing stop color updates gradient bar
- [ ] P17-T08 — Dragging a stop repositions it
- [ ] P17-T09 — Clicking gradient bar adds a new stop
- [ ] P17-T10 — Dragging stop below bar deletes it
- [ ] P17-T11 — Cannot delete below 2 stops
- [ ] P17-T12 — Midpoint diamonds visible between stops
- [ ] P17-T13 — Dragging midpoint adjusts gradient easing

### Color reactivity
- [ ] P17-T14 — Surface color changes with audio energy
- [ ] P17-T15 — Low energy maps to start of gradient
- [ ] P17-T16 — High energy maps to end of gradient
- [ ] P17-T17 — Color reactive off restores single color
- [ ] P17-T18 — Custom gradient colors drive surface
- [ ] P17-T19 — Color transitions are smooth
- [ ] P17-T20 — Gradient editor hidden when Color Reactive off
- [ ] P17-T21 — Sculpting works with color reactive on
- [ ] P17-T22 — FPS above 50 with all audio features active
- [ ] P17-T23 — No console errors during full audio session
