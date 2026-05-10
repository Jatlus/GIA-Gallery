# GIA Gallery Ã¢â‚¬â€ Phase Test Suite

## How to use this file

The agent runs every test in the current phase before marking it COMPLETE.
Each test has:
- A unique ID (e.g. P1-T03)
- An exact action to perform
- An exact expected result
- A PASS / FAIL / BLOCKED outcome

The agent writes results to PROGRESS.md like: `P1-T03: PASS`
If any test is FAIL, the agent enters the debug loop for that test before continuing.
If a test is BLOCKED (cannot be run due to a prior failure), log it as BLOCKED with a reason.
A phase is COMPLETE only when every test shows PASS. No exceptions.

---

## Phase 1 Ã¢â‚¬â€ Vite scaffold + Three.js surface

### Setup
```
npm install
npm run dev
```
Open http://localhost:5173 in Chrome. Keep DevTools open on Console tab.

---

### P1 Ã¢â‚¬â€ Console & load

**P1-T01 Ã¢â‚¬â€ Clean load**
Action: Open http://localhost:5173. Wait 5 seconds.
Expected: Zero errors, zero warnings in console.
Notes: Deprecation warnings from Three.js internals are acceptable. Any red error = FAIL.

**P1-T02 Ã¢â‚¬â€ Canvas fills viewport**
Action: Observe the page.
Expected: Three.js canvas occupies 100% of browser window with no white borders, no scrollbars.

**P1-T03 Ã¢â‚¬â€ No CORS or module errors**
Action: Check Network tab. Filter by "Errors".
Expected: No failed requests. All scripts and WASM loads return 200.

**P1-T04 Ã¢â‚¬â€ Hot reload works**
Action: Open src/surface.js. Change any constant. Save.
Expected: Browser updates within 2 seconds without a full page reload. No console errors after update.

---

### P1 Ã¢â‚¬â€ Animation

**P1-T05 Ã¢â‚¬â€ Surface is animated**
Action: Observe the canvas for 3 seconds.
Expected: Vertices are visibly moving. The surface is not static.

**P1-T06 Ã¢â‚¬â€ Animation uses u_time**
Action: Open src/shaders/surface.vert. Confirm u_time uniform is declared and used in vertex displacement.
Expected: Uniform present and used. Code verification.

**P1-T07 Ã¢â‚¬â€ Animation does not freeze**
Action: Leave the page open for 60 seconds with no interaction.
Expected: Surface still animating at 60 seconds. No freeze, no black screen.

**P1-T08 Ã¢â‚¬â€ Tab background throttle recovery**
Action: Switch to another browser tab. Wait 10 seconds. Switch back.
Expected: Surface resumes animation within 1 second of returning. No frozen frame.

---

### P1 Ã¢â‚¬â€ Performance

**P1-T09 Ã¢â‚¬â€ Baseline FPS Ã¢â€°Â¥ 58**
Action: Open DevTools Ã¢â€ â€™ Performance tab. Record for 10 seconds while surface animates.
Expected: Frame rate stays at or above 58fps for the entire 10-second window.

**P1-T10 Ã¢â‚¬â€ No memory growth**
Action: Open DevTools Ã¢â€ â€™ Memory tab. Take heap snapshot. Wait 30 seconds. Take another snapshot.
Expected: Heap size does not grow by more than 5MB between snapshots.

**P1-T11 Ã¢â‚¬â€ Geometry segment count**
Action: Open src/surface.js. Confirm PlaneGeometry constructed with 128 segments on each axis.
Expected: new THREE.PlaneGeometry(w, h, 128, 128) or equivalent. Code verification.

---

### P1 Ã¢â‚¬â€ lil-gui controls

**P1-T12 Ã¢â‚¬â€ GUI panel is visible**
Action: Observe top-right corner of browser window.
Expected: lil-gui panel visible and not obscured by canvas.

**P1-T13 Ã¢â‚¬â€ Noise scale slider changes surface**
Action: Drag noise scale slider from min to max.
Expected: Surface complexity changes visibly in real time. Low = smooth, high = detailed.

**P1-T14 Ã¢â‚¬â€ Noise speed slider changes animation rate**
Action: Set noise speed to minimum. Observe. Set to maximum. Observe.
Expected: Minimum = surface barely moves. Maximum = noticeably faster than default.

**P1-T15 Ã¢â‚¬â€ Color hue slider changes surface color**
Action: Drag hue slider across full range.
Expected: Surface color shifts continuously through the hue spectrum.

**P1-T16 Ã¢â‚¬â€ GUI state persists**
Action: Set noise scale to 0.8. Set speed to 0.2. Wait 5 seconds.
Expected: Surface still reflects both values. No reset to defaults.

**P1-T17 Ã¢â‚¬â€ GUI does not cause console errors**
Action: Move every slider from min to max and back. Check console.
Expected: Zero new errors during or after slider interaction.

---

### P1 Ã¢â‚¬â€ Shader correctness

**P1-T18 Ã¢â‚¬â€ Vertex shader compiles**
Action: Open DevTools Console. Look for any THREE.WebGLProgram shader error messages on load.
Expected: No shader compilation errors.

**P1-T19 Ã¢â‚¬â€ Fragment shader compiles**
Action: Same as P1-T18.
Expected: No fragment shader errors.

**P1-T20 Ã¢â‚¬â€ Simplex noise implementation present**
Action: Open src/shaders/surface.vert. Confirm simplex or Perlin noise function is defined or inlined.
Expected: Noise function present in shader source. Not a sine wave approximation.

---

## Phase 2 Ã¢â‚¬â€ Ping-pong deformation buffer

### Setup
Continue from Phase 1. Phase 1 must be COMPLETE.
Add mouse-click test input as described in PROMPT.md before running these tests.

---

### P2 Ã¢â‚¬â€ Render target setup

**P2-T01 Ã¢â‚¬â€ Two render targets exist**
Action: Open src/pingpong.js. Confirm two THREE.WebGLRenderTarget instances created (RTa and RTb).
Expected: Both targets present. Code verification.

**P2-T02 Ã¢â‚¬â€ Render target format**
Action: In src/pingpong.js, confirm each render target uses THREE.RGBAFormat and THREE.LinearFilter.
Expected: Both format properties set correctly. Code verification.

**P2-T03 Ã¢â‚¬â€ Deformation texture size**
Action: Confirm render target dimensions are 512x512.
Expected: Width and height both 512. Code verification.

**P2-T04 Ã¢â‚¬â€ Ping-pong swap happens every frame**
Action: Open src/main.js render loop. Confirm RTa and RTb are swapped after deformation pass.
Expected: Swap logic present (e.g. [RTa, RTb] = [RTb, RTa]). Code verification.

**P2-T05 Ã¢â‚¬â€ No CPU vertex reads**
Action: Open src/surface.js and src/main.js. Search for any calls to geometry.attributes.position.getX,
getY, getZ, or .array access on vertex buffers in the render loop.
Expected: None found. Code verification.

---

### P2 Ã¢â‚¬â€ Deformation behavior

**P2-T06 Ã¢â‚¬â€ Click creates deformation**
Action: Click once anywhere on the canvas.
Expected: A visible bump or dent appears at click location within one frame.

**P2-T07 Ã¢â‚¬â€ Deformation at click location Ã¢â‚¬â€ top-left**
Action: Click the top-left quadrant of the canvas.
Expected: Deformation appears in the top-left region of the mesh.

**P2-T08 Ã¢â‚¬â€ Deformation at click location Ã¢â‚¬â€ bottom-right**
Action: Click the bottom-right corner area.
Expected: Deformation appears in the bottom-right region of the mesh.

**P2-T09 Ã¢â‚¬â€ Multiple clicks accumulate**
Action: Click 5 different well-separated areas of the canvas.
Expected: All 5 deformations remain visible simultaneously.

**P2-T10 Ã¢â‚¬â€ Deformation shape has falloff**
Action: Click once. Observe the deformation shape.
Expected: Deformation strongest at click center, fades smoothly outward. Not a hard-edged square or spike.

**P2-T11 Ã¢â‚¬â€ Repeated clicks in same spot accumulate**
Action: Click the same spot 5 times rapidly.
Expected: Deformation grows with each click. Not capped at first click value.

---

### P2 Ã¢â‚¬â€ Decay behavior

**P2-T12 Ã¢â‚¬â€ decay=0 is permanent**
Action: Set decay to 0.0 in GUI. Click canvas. Wait 30 seconds.
Expected: Deformation still fully visible at 30 seconds. No fading.

**P2-T13 Ã¢â‚¬â€ decay=0.5 fades**
Action: Set decay to 0.5. Click canvas. Observe over 5 seconds.
Expected: Deformation visibly shrinks and approaches zero within 5 seconds.

**P2-T14 Ã¢â‚¬â€ decay=1.0 fades fastest**
Action: Set decay to 1.0. Click canvas.
Expected: Deformation nearly gone within 1-2 seconds.

**P2-T15 Ã¢â‚¬â€ Decay GUI updates in real time**
Action: Click canvas. Set decay=0. Observe hold. Slide decay to 0.8.
Expected: Deformation begins fading immediately after slider is moved.

---

### P2 Ã¢â‚¬â€ Stability & GPU

**P2-T16 Ã¢â‚¬â€ No WebGL errors during deformation**
Action: Click canvas 20 times rapidly. Check console.
Expected: No INVALID_OPERATION, INVALID_VALUE, or OUT_OF_MEMORY errors.

**P2-T17 Ã¢â‚¬â€ FPS maintained during deformation**
Action: Record performance while clicking rapidly (20 clicks over 5 seconds).
Expected: FPS stays Ã¢â€°Â¥ 55 throughout.

**P2-T18 Ã¢â‚¬â€ No GPU memory growth**
Action: Click canvas every 2 seconds for 60 seconds. Check GPU memory.
Expected: GPU memory does not grow unboundedly. Plateaus after initial allocation.

**P2-T19 Ã¢â‚¬â€ Deformation texture in vertex shader**
Action: Open src/shaders/surface.vert. Confirm u_deformationTexture uniform declared and sampled.
Expected: uniform sampler2D u_deformationTexture declared and used. Code verification.

**P2-T20 Ã¢â‚¬â€ u_decay in deform shader**
Action: Open src/shaders/deform.frag. Confirm u_decay uniform declared and applied.
Expected: Decay applied as: existing * (1.0 - u_decay) or equivalent. Code verification.

---

## Phase 3 Ã¢â‚¬â€ Webcam overlay + MediaPipe bootstrap

### Setup
Phase 2 must be COMPLETE.
Tests P3-T01 through P3-T05 require webcam permission to be denied.
Tests P3-T06 onward require webcam permission to be granted.
Use Chrome site settings to toggle camera permission for localhost.

---

### P3 Ã¢â‚¬â€ Permission denied path

**P3-T01 Ã¢â‚¬â€ Permission prompt appears on load**
Action: Clear camera permissions for localhost. Reload page.
Expected: Browser shows camera permission prompt within 2 seconds of page load.

**P3-T02 Ã¢â‚¬â€ Deny permission Ã¢â‚¬â€ no crash**
Action: When prompted, deny camera permission.
Expected: Page does not crash. Three.js surface continues animating.

**P3-T03 Ã¢â‚¬â€ Deny permission Ã¢â‚¬â€ fallback UI shown**
Action: After denying, observe the page.
Expected: A visible message appears explaining webcam is required and how to enable it. Not just a console log.

**P3-T04 Ã¢â‚¬â€ Deny permission Ã¢â‚¬â€ no console errors**
Action: Check console after denying.
Expected: Permission denial caught and handled. No uncaught promise rejections. No red errors.

**P3-T05 Ã¢â‚¬â€ Deny then grant Ã¢â‚¬â€ recovery**
Action: Deny permission. Grant permission in Chrome site settings. Reload.
Expected: Page loads normally with webcam active. No stale error state.

---

### P3 Ã¢â‚¬â€ Webcam overlay

**P3-T06 Ã¢â‚¬â€ Video element is overlaid**
Action: Grant permission. Open DevTools Elements. Find the video element.
Expected: Video element has position: absolute, covers full screen, pointer-events: none.

**P3-T07 Ã¢â‚¬â€ Overlay opacity is low**
Action: Inspect video element styles.
Expected: Opacity is between 0.15 and 0.22.

**P3-T08 Ã¢â‚¬â€ Overlay is mirrored**
Action: Hold an asymmetric object (e.g. a mug with text) in front of webcam.
Expected: Text in overlay appears mirrored as in a mirror. transform: scaleX(-1) applied.

**P3-T09 Ã¢â‚¬â€ Overlay does not capture pointer events**
Action: Click on the canvas while webcam overlay is visible.
Expected: Canvas receives the click (deformation test mark appears). Overlay does not intercept it.

**P3-T10 Ã¢â‚¬â€ Overlay fills canvas Ã¢â‚¬â€ left edge**
Action: Hold hand at the extreme left edge of the browser window.
Expected: Webcam feed shows hand at left edge. Overlay boundary aligns with canvas boundary.

**P3-T11 Ã¢â‚¬â€ Overlay fills canvas Ã¢â‚¬â€ right edge**
Action: Same as P3-T10, right edge.
Expected: Right edges align.

**P3-T12 Ã¢â‚¬â€ Overlay fills canvas Ã¢â‚¬â€ top and bottom**
Action: Same as P3-T10, top and bottom edges.
Expected: Top and bottom edges align.

**P3-T13 Ã¢â‚¬â€ Canvas is not obscured**
Action: Observe the canvas through the overlay.
Expected: Three.js surface clearly visible through the overlay. Artwork not washed out.

---

### P3 Ã¢â‚¬â€ MediaPipe landmark tracking

**P3-T14 Ã¢â‚¬â€ Landmarks appear when hand visible**
Action: Hold one hand in front of webcam.
Expected: 21 landmark dots appear on debug canvas. All finger joints visible.

**P3-T15 Ã¢â‚¬â€ Landmarks disappear when hand leaves**
Action: Move hand out of webcam frame.
Expected: Landmarks disappear within 2 frames. No ghost landmarks persist.

**P3-T16 Ã¢â‚¬â€ Tracking handles two hands**
Action: Hold both hands in front of webcam.
Expected: Landmarks appear on both hands simultaneously.

**P3-T17 Ã¢â‚¬â€ Tracking handles one hand leaving**
Action: Hold both hands up. Remove left hand. Leave right hand in frame.
Expected: Right hand landmarks remain stable. Left hand landmarks disappear cleanly.

**P3-T18 Ã¢â‚¬â€ Landmark positions are mirrored correctly**
Action: Hold right hand up. Move it to the right side of your body.
Expected: Landmark dot cluster appears on the RIGHT side of the screen.

**P3-T19 Ã¢â‚¬â€ Tracking at screen edges**
Action: Move hand to extreme corners one at a time (top-left, top-right, bottom-left, bottom-right).
Expected: Landmarks track to each corner without jumping to center or disappearing prematurely.

**P3-T20 Ã¢â‚¬â€ No crash when webcam is covered**
Action: Cover the webcam lens while hand tracking is running.
Expected: Landmarks disappear. Page does not crash. Surface continues animating. Uncovering restores tracking.

**P3-T21 Ã¢â‚¬â€ Tracking lag is acceptable**
Action: Move hand at moderate speed (~20cm/s). Observe landmark positions vs actual hand.
Expected: Landmark lag is less than 100ms visually. Landmarks appear on the hand, not trailing far behind.

**P3-T22 Ã¢â‚¬â€ No console errors during normal tracking**
Action: Track hand for 30 seconds with normal movement. Check console.
Expected: Zero new errors logged during the tracking session.

---

## Phase 4 Ã¢â‚¬â€ Single-hand pinch + raycasting

### Setup
Phase 3 must be COMPLETE. Debug landmark canvas may still be visible.
All tests require webcam active and hand in frame unless noted.

---

### P4 Ã¢â‚¬â€ Pinch detection

**P4-T01 Ã¢â‚¬â€ Open hand produces no deformation**
Action: Hold open hand over canvas for 5 seconds. Do not pinch.
Expected: No new deformation written to surface.

**P4-T02 Ã¢â‚¬â€ Pinch activates deformation**
Action: Bring thumb tip and index tip together until touching.
Expected: Deformation appears on the surface at sphere indicator location.

**P4-T03 Ã¢â‚¬â€ Pinch threshold is correct**
Action: Slowly bring thumb and index together. Note distance at which deformation begins.
Expected: Deformation begins when finger tips are approximately 3-7cm apart (normalized ~0.07).
Not triggered at 15cm, not requiring full contact.

**P4-T04 Ã¢â‚¬â€ Pinch strength is analog**
Action: Open src/hands.js. Confirm pinch strength uses smoothstep between PINCH_OPEN and PINCH_CLOSED.
Expected: smoothstep(PINCH_OPEN, PINCH_CLOSED, dist) or equivalent. Code verification.

**P4-T05 Ã¢â‚¬â€ Releasing pinch stops deformation**
Action: Pinch and hold (deformation grows). Release pinch.
Expected: Deformation stops growing immediately on release. Existing deformation remains.

**P4-T06 Ã¢â‚¬â€ Rapid pinch-release cycles**
Action: Pinch and release 10 times in quick succession (roughly 1 per second).
Expected: Each pinch cycle adds deformation. No crashes, no console errors, no landmark dropout.

---

### P4 Ã¢â‚¬â€ Coordinate mapping

**P4-T07 Ã¢â‚¬â€ Left side of screen maps to left of mesh**
Action: Hold hand and pinch on the LEFT side of the screen.
Expected: Deformation appears on the LEFT side of the Three.js mesh.

**P4-T08 Ã¢â‚¬â€ Right side of screen maps to right of mesh**
Action: Pinch on the RIGHT side of the screen.
Expected: Deformation on RIGHT side of mesh.

**P4-T09 Ã¢â‚¬â€ Top of screen maps to top of mesh**
Action: Pinch near the TOP of the screen.
Expected: Deformation near TOP of mesh.

**P4-T10 Ã¢â‚¬â€ Bottom of screen maps to bottom of mesh**
Action: Pinch near the BOTTOM of the screen.
Expected: Deformation near BOTTOM of mesh.

**P4-T11 Ã¢â‚¬â€ X-flip is applied**
Action: Open src/hands.js. Confirm NDC x conversion flips the x axis.
Expected: ndcX = 1 - (lm.x * 2) or equivalent. Code verification.

**P4-T12 Ã¢â‚¬â€ Raycasting hits the mesh**
Action: Open src/surface.js or main.js. Confirm Raycaster used against plane mesh.
Expected: raycaster.intersectObject(mesh) or equivalent. Code verification.

**P4-T13 Ã¢â‚¬â€ No deformation when raycast misses**
Action: Hold hand at extreme corner where mesh may not extend.
Expected: If raycast misses, no deformation written. No console error.

---

### P4 Ã¢â‚¬â€ Smoothing

**P4-T14 Ã¢â‚¬â€ Position is lerped**
Action: Open src/hands.js. Confirm smoothed position uses lerp with LERP_FACTOR (0.25).
Expected: smoothPos.lerp(rawPos, LERP_FACTOR) or equivalent. Code verification.

**P4-T15 Ã¢â‚¬â€ Fast movement does not cause spike jumps**
Action: Move hand very fast across the full screen width in under 0.5 seconds.
Expected: Sphere indicator moves smoothly, not teleporting. Deformation trail is a smooth curve.

**P4-T16 Ã¢â‚¬â€ Stationary hand jitter is minimal**
Action: Hold hand as still as possible over one spot for 10 seconds while pinching.
Expected: Deformation grows in one concentrated area. Not scattered due to tracking noise.

---

### P4 Ã¢â‚¬â€ Sphere indicator

**P4-T17 Ã¢â‚¬â€ Sphere appears when hand is in frame**
Action: Hold hand over canvas (no pinch).
Expected: A sphere/circle indicator is visible at index finger tip position.

**P4-T18 Ã¢â‚¬â€ Sphere is gray when not pinching**
Action: Observe sphere with open hand.
Expected: Sphere is gray or muted color.

**P4-T19 Ã¢â‚¬â€ Sphere changes color when pinching**
Action: Pinch fingers together.
Expected: Sphere changes to a bright/saturated color distinctly different from open-hand state.

**P4-T20 Ã¢â‚¬â€ Sphere disappears when hand leaves frame**
Action: Remove hand from webcam view.
Expected: Sphere disappears within 2 frames.

**P4-T21 Ã¢â‚¬â€ Sphere position matches deformation location**
Action: Pinch at center of screen. Observe sphere position and deformation position.
Expected: Deformation appears at or very near sphere location. Not offset by more than 5% of screen width.

---

### P4 Ã¢â‚¬â€ Edge cases

**P4-T22 Ã¢â‚¬â€ Non-dominant hand works**
Action: Repeat P4-T02, P4-T07, P4-T08 using opposite hand from usual.
Expected: All tests pass for both hands in single-hand mode.

**P4-T23 Ã¢â‚¬â€ Partially visible hand**
Action: Hold hand so only index and thumb are in frame, other fingers out of frame.
Expected: Pinch still detected. No crash.

**P4-T24 Ã¢â‚¬â€ Angled hand**
Action: Rotate hand 45 degrees sideways while pinching and moving.
Expected: Tracking continues. Deformation writes correctly. No landmark errors in console.

**P4-T25 Ã¢â‚¬â€ Performance during pinching**
Action: Actively pinch and drag across canvas for 30 seconds. Check FPS.
Expected: FPS stays Ã¢â€°Â¥ 55 throughout.

---

## Phase 5 Ã¢â‚¬â€ Two-hand simultaneous interaction

### Setup
Phase 4 must be COMPLETE.
All tests require both hands visible to webcam unless stated.

---

### P5 Ã¢â‚¬â€ Independent hand tracking

**P5-T01 Ã¢â‚¬â€ Two sphere indicators appear**
Action: Hold both hands in frame.
Expected: Two distinct sphere indicators visible, one per hand.

**P5-T02 Ã¢â‚¬â€ Indicators track independently**
Action: Move left hand left, right hand right simultaneously.
Expected: Both spheres move in their respective directions without influencing each other.

**P5-T03 Ã¢â‚¬â€ maxNumHands set to 2**
Action: Open src/hands.js. Confirm maxNumHands: 2 in MediaPipe Hands config.
Expected: Parameter set. Code verification.

**P5-T04 Ã¢â‚¬â€ Per-hand state stored separately**
Action: Open src/hands.js. Confirm data structure stores independent state per hand index.
Expected: State array or two separate objects for hand 0 and hand 1. Code verification.

---

### P5 Ã¢â‚¬â€ Independent deformation

**P5-T05 Ã¢â‚¬â€ Left pinch only affects left region**
Action: Pinch left hand on left side of screen. Keep right hand open.
Expected: Deformation appears on left side only. Right side of mesh unchanged.

**P5-T06 Ã¢â‚¬â€ Right pinch only affects right region**
Action: Pinch right hand on right side. Keep left hand open.
Expected: Deformation on right side only.

**P5-T07 Ã¢â‚¬â€ Both pinching simultaneously**
Action: Pinch both hands at same time in different screen regions.
Expected: Deformation appears in both regions simultaneously within the same frame.

**P5-T08 Ã¢â‚¬â€ Both hands write to same deformation texture**
Action: Open src/main.js or pingpong.js. Confirm both pinch positions handled in single deformation pass.
Expected: Single pass handles both hands. Not two separate passes. Code verification.

---

### P5 Ã¢â‚¬â€ Stretch effect

**P5-T09 Ã¢â‚¬â€ Stretch effect activates when both hands pinch**
Action: Pinch both hands. Move them apart slowly.
Expected: Falloff radius of deformation visibly expands as hands move apart.

**P5-T10 Ã¢â‚¬â€ Stretch scales by hand distance**
Action: Open src/main.js or pingpong.js. Confirm falloff scaled by distance(hand0, hand1) * 1.5 when both pinching.
Expected: Formula present. Code verification.

**P5-T11 Ã¢â‚¬â€ Stretch reverts when one hand releases**
Action: Pinch both hands far apart. Release one hand.
Expected: Falloff radius returns to normal within 1-2 frames.

**P5-T12 Ã¢â‚¬â€ Stretch at minimum distance Ã¢â‚¬â€ no artifacts**
Action: Bring both pinching hands very close together (nearly touching).
Expected: Falloff radius at or near default minimum. No negative or zero radius artifacts.

**P5-T13 Ã¢â‚¬â€ Stretch at maximum distance Ã¢â‚¬â€ reasonable upper bound**
Action: Move both pinching hands to opposite corners of the screen.
Expected: Falloff expands but does not cause entire mesh to deform. Reasonable upper bound.

---

### P5 Ã¢â‚¬â€ Hand entry and exit edge cases

**P5-T14 Ã¢â‚¬â€ One hand enters mid-session**
Action: Start with one hand tracking and pinching. Bring second hand into frame.
Expected: Second sphere indicator appears immediately. No disruption to first hand tracking.

**P5-T15 Ã¢â‚¬â€ One hand exits mid-session**
Action: Have both hands tracking. Remove one hand from frame.
Expected: Remaining hand continues tracking without interruption.

**P5-T16 Ã¢â‚¬â€ Both hands exit simultaneously**
Action: Move both hands out of webcam frame at same time.
Expected: Both sphere indicators disappear. No crash. Surface continues animating. Deformations persist.

**P5-T17 Ã¢â‚¬â€ Both hands re-enter after leaving**
Action: Remove both hands. Wait 3 seconds. Bring both hands back.
Expected: Both hands detected again. Tracking resumes correctly. No stale state.

**P5-T18 Ã¢â‚¬â€ Hand index assignment is stable**
Action: Hold both hands steady for 10 seconds. Observe which sphere tracks which hand.
Expected: Left sphere consistently tracks left hand. No swapping between frames.

**P5-T19 Ã¢â‚¬â€ Rapid hand swap**
Action: Hold one hand in frame. Quickly replace with other hand (under 0.5 second overlap).
Expected: Tracking transitions without crash. No console errors.

---

### P5 Ã¢â‚¬â€ Crossing and occlusion

**P5-T20 Ã¢â‚¬â€ Hands crossed**
Action: Cross both hands (left hand on right side, right hand on left side). Pinch both.
Expected: Both deformations appear. Sphere indicators track to each hand's actual position. No locked tracking.

**P5-T21 Ã¢â‚¬â€ Hands overlapping**
Action: Bring both hands very close together so landmarks overlap.
Expected: Tracking may briefly become unstable but must not crash. No console errors. Surface continues animating.

**P5-T22 Ã¢â‚¬â€ One hand occluding other**
Action: Hold right hand in front of left hand from webcam's perspective.
Expected: At minimum, one hand tracked. No crash regardless of outcome.

---

### P5 Ã¢â‚¬â€ Performance

**P5-T23 Ã¢â‚¬â€ FPS with both hands active**
Action: Track both hands, both pinching, both moving for 30 seconds. Record FPS.
Expected: FPS stays Ã¢â€°Â¥ 55 throughout.

**P5-T24 Ã¢â‚¬â€ FPS with rapid movement**
Action: Move both hands quickly and randomly for 10 seconds while pinching.
Expected: FPS stays Ã¢â€°Â¥ 50. No frame rate collapse.

**P5-T25 Ã¢â‚¬â€ Uniforms declared**
Action: Open src/shaders/deform.frag. Confirm uniform vec2 u_pinchPositions[2] and uniform float u_pinchStrengths[2] declared.
Expected: Both uniforms present. Code verification.

---

## Phase 6 Ã¢â‚¬â€ Polish + performance audit

### Setup
Phase 5 must be COMPLETE.

---

### P6 Ã¢â‚¬â€ Debug artifacts removed

**P6-T01 Ã¢â‚¬â€ No debug landmark canvas**
Action: Observe the page. Inspect DOM in DevTools Elements.
Expected: No debug overlay canvas showing raw MediaPipe landmarks. Removed from DOM entirely.

**P6-T02 Ã¢â‚¬â€ No console.log calls in production code**
Action: Search entire src/ directory for console.log.
Expected: No console.log calls found. console.error for genuine errors is acceptable.

**P6-T03 Ã¢â‚¬â€ No commented-out debug code**
Action: Skim each src/ file for large blocks of commented-out code.
Expected: No commented-out debug blocks. Dead code removed.

---

### P6 Ã¢â‚¬â€ Final GUI

**P6-T04 Ã¢â‚¬â€ All 7 controls present**
Action: Open lil-gui panel. Count controls.
Expected: Exactly these 7: noise scale, noise speed, deformation strength, falloff radius, decay, color hue, webcam opacity.

**P6-T05 Ã¢â‚¬â€ Webcam opacity control works**
Action: Drag webcam opacity slider to 0.
Expected: Webcam overlay becomes invisible. Surface fully visible.

**P6-T06 Ã¢â‚¬â€ Webcam opacity at max**
Action: Drag webcam opacity to maximum.
Expected: Webcam overlay more opaque but still not fully blocking surface.

**P6-T07 Ã¢â‚¬â€ Deformation strength at minimum**
Action: Set deformation strength to minimum. Pinch and drag.
Expected: Deformation barely perceptible. Visibly weaker than default.

**P6-T08 Ã¢â‚¬â€ Deformation strength at maximum**
Action: Set deformation strength to maximum. Pinch once.
Expected: Deformation significantly more dramatic than default.

**P6-T09 Ã¢â‚¬â€ Falloff radius at minimum**
Action: Set falloff radius to minimum. Pinch.
Expected: Deformation very tightly focused (small radius).

**P6-T10 Ã¢â‚¬â€ Falloff radius at maximum**
Action: Set falloff radius to maximum. Pinch.
Expected: Deformation spreads across a large area of the mesh.

**P6-T11 Ã¢â‚¬â€ All controls update in real time**
Action: Adjust each slider while surface is active with deformation.
Expected: Every slider takes effect immediately without page reload.

---

### P6 Ã¢â‚¬â€ GPU-only verification

**P6-T12 Ã¢â‚¬â€ No vertex attribute reads in JS**
Action: Search entire src/ directory for: geometry.attributes, .getX(, .getY(, .getZ(, .array, position.array
Expected: Zero matches within the render loop. Code verification.

**P6-T13 Ã¢â‚¬â€ Deformation in GPU timeline**
Action: DevTools Performance. Record 5 seconds of interaction. Examine GPU timeline.
Expected: Deformation work appears as GPU tasks, not as long JS tasks on main thread.

**P6-T14 Ã¢â‚¬â€ Main thread JS frame budget**
Action: In same performance recording, check main thread JS tasks per frame.
Expected: No single JS task per frame exceeds 8ms.

---

### P6 Ã¢â‚¬â€ Stress tests

**P6-T15 Ã¢â‚¬â€ 5-minute sustained run**
Action: Run app for 5 minutes with continuous two-hand interaction.
Expected: No crash. Memory growth Ã¢â€°Â¤ 10MB from baseline. FPS Ã¢â€°Â¥ 50 at end of 5 minutes.

**P6-T16 Ã¢â‚¬â€ Window resize**
Action: Resize browser window to half width while app is running.
Expected: Canvas resizes to fill new window. Webcam overlay stays aligned. Hand tracking maps correctly. No console errors.

**P6-T17 Ã¢â‚¬â€ Window resize Ã¢â‚¬â€ restore**
Action: After P6-T16, resize window back to full size.
Expected: Canvas fills full window again. All alignment checks still pass.

**P6-T18 Ã¢â‚¬â€ Fullscreen mode**
Action: Press F11 to enter fullscreen. Use app for 10 seconds.
Expected: Canvas fills fullscreen. Webcam overlay aligned. Hand tracking works. Exit fullscreen restores correctly.

**P6-T19 Ã¢â‚¬â€ Rapid GUI interaction during hand tracking**
Action: While both hands are tracking and pinching, rapidly drag all GUI sliders.
Expected: No crashes, no console errors, no FPS collapse below 45.

**P6-T20 Ã¢â‚¬â€ Browser zoom at 125%**
Action: Set Chrome zoom to 125% (Ctrl+Plus). Reload. Test pinch deformation.
Expected: Coordinate mapping still works. Deformation appears at sphere indicator location. Overlay aligned.

**P6-T21 Ã¢â‚¬â€ Browser zoom at 75%**
Action: Set Chrome zoom to 75% (Ctrl+Minus). Reload. Test pinch deformation.
Expected: Same as P6-T20. Alignment holds at reduced zoom.

---

### P6 Ã¢â‚¬â€ README and documentation

**P6-T22 Ã¢â‚¬â€ README.md exists**
Action: Check project root for README.md.
Expected: File exists.

**P6-T23 Ã¢â‚¬â€ README has setup instructions**
Action: Read README.md.
Expected: Contains: npm install, npm run dev, URL to open. Steps are correct and complete.

**P6-T24 Ã¢â‚¬â€ README has browser requirements**
Action: Read README.md.
Expected: States Chrome is required. States webcam permission is required. States HTTPS or localhost required for MediaPipe WASM.

**P6-T25 Ã¢â‚¬â€ README has controls reference**
Action: Read README.md.
Expected: Lists all 7 GUI controls with one-line description each. Lists hand gestures (pinch to sculpt, two-hand stretch).

**P6-T26 Ã¢â‚¬â€ Fresh install test**
Action: On a second machine or fresh browser profile (clear all site data for localhost):
  1. Clone or copy project
  2. npm install
  3. npm run dev
  4. Open http://localhost:5173
Expected: App loads with zero errors. Webcam permission prompt appears. Full functionality without manual configuration.

---

## Test result log template

Copy this block into PROGRESS.md after running each phase:

```
## Phase N test results Ã¢â‚¬â€ [DATE]

PASSED:  [count]
FAILED:  [count]
BLOCKED: [count]

Failed tests:
- [TEST ID]: [symptom] | [hypothesis] | [fix applied] | [re-test result]

Blocked tests:
- [TEST ID]: blocked by [TEST ID]

Phase status: COMPLETE / BLOCKED
```

---

## Constants reference (do not change without updating all test thresholds)

```
PINCH_OPEN          = 0.07    (P4-T03 threshold)
PINCH_CLOSED        = 0.03
LERP_FACTOR         = 0.25    (P4-T14)
PLANE_SEGMENTS      = 128     (P1-T11)
DEFORM_TEXTURE_SIZE = 512     (P2-T03)
MIN_FPS_SUSTAINED   = 58      (P1-T09)
MIN_FPS_INTERACTION = 55      (P4-T25, P5-T23)
MIN_FPS_STRESS      = 50      (P5-T24, P6-T15)
MAX_MEMORY_GROWTH   = 5MB     (P1-T10, P2-T18)
MAX_TRACKING_LAG    = 100ms   (P3-T21)
```

---

## Phase 7 Ã¢â‚¬â€ Splash page, mouse interaction, and webcam toggle

### Setup
Phase 6 must be COMPLETE.
All Phase 7 tests run in Chrome at localhost:5173 unless stated otherwise.
Mouse interaction tests require no webcam. Webcam toggle tests require a working webcam.

---

### P7 Ã¢â‚¬â€ Splash page

**P7-T01 Ã¢â‚¬â€ Splash appears on load**
Action: Reload the page. Observe immediately.
Expected: A full-screen semi-transparent overlay appears within 1 second of page load. The GIA Gallery heading is visible.

**P7-T02 Ã¢â‚¬â€ Surface animates behind splash**
Action: While the splash is visible, observe the background.
Expected: The Three.js generative surface is visibly animating through the semi-transparent overlay. It is not static or black.

**P7-T03 Ã¢â‚¬â€ Splash contains correct content**
Action: Read the splash page text carefully.
Expected: Contains all of: "GIA Gallery" heading, Mouse Mode instructions, Webcam Mode instructions, reference to panel controls, reference to Decay slider, "Enter Gallery" button. No placeholder or lorem ipsum text.

**P7-T04 Ã¢â‚¬â€ Enter Gallery button dismisses with fade**
Action: Click the "Enter Gallery" button.
Expected: The splash fades out smoothly over approximately 0.4 seconds then is removed from the DOM. The surface and UI are fully visible after dismiss.

**P7-T05 Ã¢â‚¬â€ Escape key dismisses splash**
Action: While splash is visible, press the Escape key.
Expected: Splash dismisses with the same fade animation as the button. No console errors.

**P7-T06 Ã¢â‚¬â€ Help button re-opens splash**
Action: Dismiss the splash. Locate the "?" button in the UI. Click it.
Expected: Splash reappears with the same fade-in animation. Surface continues animating behind it.

**P7-T07 Ã¢â‚¬â€ Re-opening does not stack overlays**
Action: Click "?" three times in quick succession.
Expected: Only one splash overlay exists in the DOM. Inspect DevTools Elements Ã¢â‚¬â€ exactly one element with id="gia-splash".

**P7-T08 Ã¢â‚¬â€ ? key re-opens splash**
Action: With splash dismissed, press the ? key on the keyboard.
Expected: Splash reappears. If splash is already open, pressing ? has no effect (does not stack).

**P7-T09 Ã¢â‚¬â€ Deformation preserved through splash cycle**
Action: Sculpt several marks on the surface. Open splash with ?. Close with Escape.
Expected: All sculpted deformation marks are still visible after the splash closes. Ping-pong buffer not cleared by splash open/close.

**P7-T10 Ã¢â‚¬â€ No splash-related console errors**
Action: Open splash, dismiss, re-open, dismiss again. Check console.
Expected: Zero console errors during the full splash lifecycle.

---

### P7 Ã¢â‚¬â€ Mode toggle

**P7-T11 Ã¢â‚¬â€ Toggle is visible**
Action: Observe the bottom center of the screen after dismissing the splash.
Expected: A toggle button/switch labeled with "Mouse" and "Webcam" is visible and not obscured by any other UI element.

**P7-T12 Ã¢â‚¬â€ Toggle shows current mode**
Action: Observe the toggle on load.
Expected: The active side clearly indicates "Mouse" as the current mode. The visual state is unambiguous.

**P7-T13 Ã¢â‚¬â€ Default mode is Mouse**
Action: Reload page. Dismiss splash. Do not touch the toggle.
Expected: App is in Mouse Mode. Dragging on canvas produces deformation. No webcam permission prompt has appeared.

**P7-T14 Ã¢â‚¬â€ Toggle switches to Webcam Mode**
Action: Click the toggle.
Expected: The toggle visual updates to show "Webcam" as active. Browser camera permission prompt appears (if not previously granted). Webcam overlay becomes visible.

**P7-T15 Ã¢â‚¬â€ Toggle returns to Mouse Mode**
Action: After switching to Webcam Mode, click the toggle again.
Expected: Toggle shows "Mouse" as active. Webcam overlay disappears. Mouse sculpting works again.

**P7-T16 Ã¢â‚¬â€ Mode switch resets hand state**
Action: Open src/modeToggle.js or src/interaction.js. Confirm resetAllHandState() is called inside the mode switch handler.
Expected: resetAllHandState() called on every mode switch. Code verification.

**P7-T17 Ã¢â‚¬â€ Webcam denied reverts toggle**
Action: Set Chrome to block camera for localhost. Click toggle to Webcam Mode.
Expected: Toggle reverts to Mouse Mode automatically. A small error message appears near the toggle.

**P7-T18 Ã¢â‚¬â€ Inline error appears and fades**
Action: Same as P7-T17.
Expected: Error text "Camera access denied. Using mouse mode." or similar appears near the toggle and fades out within 4 seconds. Does not use alert() or block interaction.

**P7-T19 Ã¢â‚¬â€ Webcam denied leaves app functional**
Action: After P7-T17, attempt mouse sculpting.
Expected: Mouse sculpting works normally. No crash. No console errors. App fully functional in Mouse Mode.

**P7-T20 Ã¢â‚¬â€ Deformation preserved across mode switch**
Action: Sculpt marks in Mouse Mode. Switch to Webcam Mode. Switch back to Mouse Mode.
Expected: All sculpted deformation marks remain visible after both switches.

---

### P7 Ã¢â‚¬â€ Mouse interaction Ã¢â‚¬â€ core

**P7-T21 Ã¢â‚¬â€ Click and drag sculpts**
Action: Left-click on the canvas and drag slowly.
Expected: A deformation trail appears on the surface following the cursor path.

**P7-T22 Ã¢â‚¬â€ Sculpt follows cursor continuously**
Action: Hold left button and move the mouse continuously across the canvas for 5 seconds.
Expected: Deformation appears at every point along the cursor path. No gaps or jumps when moving at moderate speed.

**P7-T23 Ã¢â‚¬â€ Releasing mouse stops deformation**
Action: Hold left button (deformation active). Release button.
Expected: Deformation stops immediately on release. Cursor position after release produces no further deformation.

**P7-T24 Ã¢â‚¬â€ Deformation persists after release**
Action: Click, drag, release. Observe the surface for 10 seconds with decay=0.
Expected: Sculpted marks remain fully visible 10 seconds after releasing the mouse.

**P7-T25 Ã¢â‚¬â€ Crosshair cursor on canvas**
Action: Move mouse over the canvas without clicking.
Expected: Cursor style is crosshair. Not the default arrow cursor.

**P7-T26 Ã¢â‚¬â€ Grabbing cursor while sculpting**
Action: Hold left mouse button while over the canvas.
Expected: Cursor changes to "grabbing" style while the button is held. Returns to crosshair on release.

**P7-T27 Ã¢â‚¬â€ Mouse indicator circle visible**
Action: Move mouse over the canvas.
Expected: A small circle (approximately 10px radius) follows the cursor position on the canvas. It is distinct from the cursor itself.

---

### P7 Ã¢â‚¬â€ Mouse interaction Ã¢â‚¬â€ coordinate mapping

**P7-T28 Ã¢â‚¬â€ Left screen Ã¢â€ â€™ left mesh**
Action: Click and drag on the LEFT side of the canvas.
Expected: Deformation appears on the LEFT side of the mesh. Not center, not right.

**P7-T29 Ã¢â‚¬â€ Right screen Ã¢â€ â€™ right mesh**
Action: Click and drag on the RIGHT side of the canvas.
Expected: Deformation on RIGHT side of mesh.

**P7-T30 Ã¢â‚¬â€ Top screen Ã¢â€ â€™ top mesh**
Action: Click and drag near the TOP of the canvas.
Expected: Deformation near TOP of mesh.

**P7-T31 Ã¢â‚¬â€ Bottom screen Ã¢â€ â€™ bottom mesh**
Action: Click and drag near the BOTTOM of the canvas.
Expected: Deformation near BOTTOM of mesh.

**P7-T32 Ã¢â‚¬â€ No X flip on mouse coordinates**
Action: Open src/interaction.js. Find the mouseToNDC function.
Expected: NDC x = (clientX / window.innerWidth) * 2.0 - 1.0 Ã¢â‚¬â€ no (1.0 - x) flip. Code verification.

---

### P7 Ã¢â‚¬â€ Mouse interaction Ã¢â‚¬â€ stretch simulation

**P7-T33 Ã¢â‚¬â€ Right-click menu disabled**
Action: Right-click anywhere on the canvas.
Expected: No browser context menu appears.

**P7-T34 Ã¢â‚¬â€ Right-click while dragging activates stretch**
Action: Hold left button and drag. While still holding left, also hold right button.
Expected: Falloff radius visibly expands. Deformation spread increases. The stretch effect is the same as two-hand webcam stretch.

**P7-T35 Ã¢â‚¬â€ Right-click position is fixed**
Action: Hold left button and drag to center. Hold right button at top-left. Move mouse toward bottom-right.
Expected: The right-click anchor point stays at the top-left position where the right button was pressed. Only the left-button sculpt point moves.

**P7-T36 Ã¢â‚¬â€ Releasing right-click deactivates stretch**
Action: Hold both buttons (stretch active). Release right button only. Keep dragging with left.
Expected: Falloff radius returns to normal immediately. Single-point sculpting resumes.

**P7-T37 Ã¢â‚¬â€ Stretch matches webcam two-hand stretch**
Action: In Mouse Mode, hold both buttons with hands at opposite corners. In Webcam Mode, pinch both hands at opposite corners. Compare falloff radius visually.
Expected: The deformation spread is visually similar between both modes at equivalent positions.

---

### P7 Ã¢â‚¬â€ Mouse interaction Ã¢â‚¬â€ edge cases

**P7-T38 Ã¢â‚¬â€ Mouse leave stops deformation**
Action: Hold left button. Move cursor outside the browser window or off the canvas.
Expected: Deformation stops when cursor leaves the canvas. No ghost deformation continues. handState[0].active becomes false.

**P7-T39 Ã¢â‚¬â€ Rapid click-release cycles**
Action: Click and release on the canvas 20 times in 5 seconds.
Expected: Each click adds a deformation mark. No crashes, no console errors, FPS remains Ã¢â€°Â¥ 55.

**P7-T40 Ã¢â‚¬â€ FPS during mouse sculpting**
Action: Hold left button and drag continuously for 30 seconds. Monitor FPS.
Expected: FPS stays Ã¢â€°Â¥ 55 throughout.

**P7-T41 Ã¢â‚¬â€ Mouse disabled in Webcam Mode**
Action: Switch to Webcam Mode. Click and drag on canvas.
Expected: Mouse drag produces no deformation. Canvas does not respond to mouse sculpt input.
Verify: Open src/interaction.js Ã¢â‚¬â€ mouse event listeners must be removed or gated when mode is WEBCAM. Code verification.

**P7-T42 Ã¢â‚¬â€ Webcam disabled in Mouse Mode**
Action: Confirm hands.send() is not called when mode is MOUSE.
Expected: Open src/main.js Ã¢â‚¬â€ hands.send() is gated behind webcamActive flag. Code verification.

---

### P7 Ã¢â‚¬â€ Interaction parity

**P7-T43 Ã¢â‚¬â€ Same position, same deformation**
Action: In Mouse Mode, click the exact center of the canvas. Observe deformation size and shape.
Switch to Webcam Mode. Position index finger at the center of the canvas and pinch.
Expected: The deformation mark at center screen is visually the same size and shape in both modes.

**P7-T44 Ã¢â‚¬â€ Shared handState array**
Action: Open src/interaction.js and src/hands.js.
Expected: Both mouse and webcam input paths write to the same handState[] array exported from hands.js (or a shared state module). Code verification.

**P7-T45 Ã¢â‚¬â€ Shared deform shader uniforms**
Action: Open src/main.js render loop.
Expected: u_pinchPositions and u_pinchStrengths are read from handState[] regardless of active mode. The uniform update code path is the same for both modes. Code verification.

---

### P7 Ã¢â‚¬â€ Final polish

**P7-T46 Ã¢â‚¬â€ No console.log in Phase 7 files**
Action: Search src/splash.js, src/interaction.js, src/modeToggle.js for console.log.
Expected: Zero matches.

**P7-T47 Ã¢â‚¬â€ No commented-out code in Phase 7 files**
Action: Skim all three Phase 7 source files.
Expected: No large commented-out blocks. No dead code.

**P7-T48 Ã¢â‚¬â€ README updated**
Action: Read README.md.
Expected: Contains sections for: Mouse Mode instructions, Webcam Mode instructions, how to use the toggle, how to re-open instructions (? button or key), and splash page description. All 7 GUI controls still documented.

**P7-T49 Ã¢â‚¬â€ Fresh install Ã¢â‚¬â€ full Phase 7 feature test**
Action: On a second machine or fresh browser profile:
  1. Clone or copy project
  2. npm install
  3. npm run dev
  4. Open http://localhost:5173
Expected: Splash appears immediately. Enter Gallery dismisses it. Mouse Mode sculpts correctly. Toggle switches to Webcam Mode (permission prompt appears). Toggle back to Mouse Mode works. No errors throughout.

**P7-T50 Ã¢â‚¬â€ 5-minute sustained Mouse Mode run**
Action: Use mouse sculpting continuously for 5 minutes. Monitor memory and FPS.
Expected: No crash. Memory growth Ã¢â€°Â¤ 10MB from baseline. FPS Ã¢â€°Â¥ 50 at end of 5 minutes.

---

## Phase 8 Ã¢â‚¬â€ 3D environment foundation

### Setup
Phase 7 must be COMPLETE. Run npm run dev. Open http://localhost:5173 in Chrome.

---

### P8 Ã¢â‚¬â€ Camera repositioning

**P8-T01 Ã¢â‚¬â€ Camera views scene from an angle**
Action: Load the app and dismiss the splash.
Expected: The flat plane is visible from an angled 3D perspective Ã¢â‚¬â€ not top-down, not front-on. Depth and 3D shape are clearly visible.

**P8-T02 Ã¢â‚¬â€ Surface still animates**
Action: Observe the plane for 5 seconds.
Expected: Simplex noise animation still running. Hills and valleys moving.

**P8-T03 Ã¢â‚¬â€ Mouse Mode sculpting still works**
Action: Click and drag on the plane surface.
Expected: Deformation appears at cursor position. Identical feel to Phase 7.

**P8-T04 Ã¢â‚¬â€ Webcam Mode pinch still works**
Action: Switch to Webcam Mode. Pinch and sculpt.
Expected: Deformation appears under pinch position. Landmark dots visible.

**P8-T05 Ã¢â‚¬â€ Camera uses spherical coordinates (code verification)**
Action: Open src/scene.js or src/main.js. Confirm camTheta, camPhi, camRadius variables exist and are used to set camera.position each frame.
Expected: Three spherical coordinate variables present. Camera position computed from them. Code verification.

**P8-T06 Ã¢â‚¬â€ camera.lookAt(0,0,0) called every frame (code verification)**
Action: Open main.js render loop. Find camera.lookAt call.
Expected: camera.lookAt(0, 0, 0) inside the render loop, not just at init. Code verification.

---

### P8 Ã¢â‚¬â€ Axis gizmo

**P8-T07 Ã¢â‚¬â€ Axis gizmo visible on load**
Action: Dismiss splash. Observe the scene.
Expected: Three colored lines extending from the world origin are visible. X is warm coral/red, Y is soft teal/green, Z is muted purple.

**P8-T08 Ã¢â‚¬â€ Axis arrowheads visible**
Action: Observe the positive ends of each axis.
Expected: Small cone arrowheads visible at the tip of each positive axis direction.

**P8-T09 Ã¢â‚¬â€ Axis labels visible**
Action: Observe near the axis tips.
Expected: "X", "Y", "Z" labels visible near each positive arrowhead tip.

**P8-T10 Ã¢â‚¬â€ Axis labels always face camera**
Action: (Test after Phase 11 camera controls.) Orbit the camera to different angles.
Expected: X, Y, Z labels remain readable from any camera angle Ã¢â‚¬â€ they rotate to face the camera.
Note: This test is marked NEEDS HUMAN VERIFICATION until Phase 11 is complete.

**P8-T11 Ã¢â‚¬â€ A key toggles axis**
Action: Press the lowercase 'a' key.
Expected: All axis geometry disappears. Press 'a' again Ã¢â‚¬â€ it reappears.

**P8-T12 Ã¢â‚¬â€ GUI Axis Lines toggle works**
Action: Find the Axis Lines toggle in lil-gui. Toggle it off.
Expected: Axis disappears. Toggle on Ã¢â‚¬â€ reappears. State stays in sync if A key is also used.

**P8-T13 Ã¢â‚¬â€ Axis does not interfere with sculpting**
Action: Click or pinch directly on an axis tube.
Expected: No deformation applied. The axis is not part of the sculptable mesh.

**P8-T14 Ã¢â‚¬â€ Axis gizmo uses tube geometry not Line (code verification)**
Action: Open src/axisgizmo.js. Confirm CylinderGeometry used for axis tubes, not THREE.Line.
Expected: CylinderGeometry or equivalent solid tube geometry. No THREE.Line with linewidth. Code verification.

---

### P8 Ã¢â‚¬â€ Preserved Phase 7 behavior

**P8-T15 Ã¢â‚¬â€ All 6 GUI controls present and functional**
Action: Open lil-gui panel. Test each slider.
Expected: Noise Scale, Noise Speed, Deformation Strength, Falloff Radius, Decay, Color Hue all work. Plus new Axis Lines toggle and (in Phase 10) Object selector.

**P8-T16 Ã¢â‚¬â€ Splash page still works**
Action: Reload page. Observe. Dismiss with Enter Gallery. Press ? key.
Expected: Splash appears on load. Dismisses with button or Escape. Reopens with ?.

**P8-T17 Ã¢â‚¬â€ Mode toggle still works**
Action: Click the Mouse/Webcam toggle.
Expected: Mode switches. Webcam permission prompt appears if switching to Webcam first time.

**P8-T18 Ã¢â‚¬â€ No console errors on load**
Action: Check DevTools Console after dismissing splash.
Expected: Zero red errors. MediaPipe WebGL info messages acceptable.

**P8-T19 Ã¢â‚¬â€ FPS above 55 at rest**
Action: Let the app run for 10 seconds with no interaction.
Expected: FPS stays at or above 55. Axis gizmo has no significant performance cost.

---

## Phase 9 Ã¢â‚¬â€ Deformation architecture migration

### Setup
Phase 8 must be COMPLETE.

---

### P9 Ã¢â‚¬â€ Migration correctness

**P9-T01 Ã¢â‚¬â€ Flat plane deforms as before**
Action: In Mouse Mode, click and drag on the flat plane.
Expected: Smooth Gaussian deformation appears at cursor position. Identical feel to Phase 7. No visible regression from the migration.

**P9-T02 Ã¢â‚¬â€ Deformation persists at decay=0**
Action: Set Decay to 0. Sculpt several marks. Wait 30 seconds.
Expected: All marks still fully visible after 30 seconds.

**P9-T03 Ã¢â‚¬â€ Decay works correctly**
Action: Set Decay to 0.5. Sculpt a mark.
Expected: Mark fades over several seconds, not instantly.

**P9-T04 Ã¢â‚¬â€ Multiple simultaneous deformations**
Action: Click 5 different areas of the plane.
Expected: All 5 marks visible simultaneously.

**P9-T05 Ã¢â‚¬â€ pingpong.js deleted (code verification)**
Action: Check src/ directory for pingpong.js.
Expected: File does not exist. Code verification.

**P9-T06 Ã¢â‚¬â€ deform.vert deleted (code verification)**
Action: Check src/shaders/ for deform.vert.
Expected: File does not exist. Code verification.

**P9-T07 Ã¢â‚¬â€ deform.frag deleted (code verification)**
Action: Check src/shaders/ for deform.frag.
Expected: File does not exist. Code verification.

**P9-T08 Ã¢â‚¬â€ DataTexture used for displacement (code verification)**
Action: Open src/surface.js or equivalent. Find DataTexture creation.
Expected: THREE.DataTexture with THREE.RedFormat and THREE.FloatType present. Code verification.

**P9-T09 Ã¢â‚¬â€ Vertex world space transform applied (code verification)**
Action: Open the applyImpulse function. Find vertex position read and distance computation.
Expected: Each vertex position transformed via mesh.matrixWorld before distance to hitPoint is computed. Code verification.

**P9-T10 Ã¢â‚¬â€ npm run build succeeds after deletion**
Action: Run npm run build in terminal.
Expected: Build completes with zero errors.

**P9-T11 Ã¢â‚¬â€ No console errors during sculpting**
Action: Sculpt actively for 30 seconds. Check console.
Expected: Zero new errors during sculpting session.

**P9-T12 Ã¢â‚¬â€ Webcam pinch sculpting still works**
Action: Switch to Webcam Mode. Pinch and sculpt.
Expected: Deformation appears under pinch position. Same feel as Phase 7.

**P9-T13 Ã¢â‚¬â€ FPS above 55 during active sculpting**
Action: Sculpt continuously for 30 seconds. Check DevTools Performance.
Expected: FPS stays at or above 55.

**P9-T14 Ã¢â‚¬â€ Decay snap-to-zero (code verification)**
Action: Find applyDecay function. Confirm snap-to-zero logic.
Expected: data[i] < 0.0005 sets data[i] = 0.0 present in applyDecay. Code verification.

---

## Phase 10 - Object spawner

### Setup
Phase 9 must be COMPLETE.

---

### P10 - Object switching

**P10-T01 - Object selector in GUI**
Action: Open lil-gui panel.
Expected: Object dropdown present listing: Plane, Sphere, Cube, Torus, Torus Knot, Icosahedron, Particles.

**P10-T02 - Switching to Sphere**
Action: Select Sphere in GUI.
Expected: Flat plane disappears. Sphere appears at origin. Fade transition visible.

**P10-T03 - Switching to Cube**
Action: Select Cube.
Expected: Cube appears at origin centered on all axes.

**P10-T04 - Switching to Torus**
Action: Select Torus.
Expected: Torus appears. Ring shape visible from current camera angle.

**P10-T05 - Switching to Torus Knot**
Action: Select Torus Knot.
Expected: Complex knotted tube shape appears.

**P10-T06 - Switching to Icosahedron**
Action: Select Icosahedron.
Expected: Multi-faceted sphere-like polyhedron appears.

**P10-T07 - Switching to Particles**
Action: Select Particles.
Expected: Cloud of small points in a spherical distribution appears.

**P10-T08 - All objects spawn without console errors**
Action: Switch through all 7 objects one by one. Check console after each switch.
Expected: Zero console errors during any object switch.

**P10-T09 - Deformation clears on object switch**
Action: Sculpt marks on Sphere. Switch to Cube.
Expected: Cube appears with zero deformation. Sphere deformation is gone.

**P10-T10 - Sphere deforms smoothly**
Action: Click-drag on the Sphere surface.
Expected: Smooth Gaussian bump on sphere surface. No faceting visible at the deformation edge.

**P10-T11 - Cube deforms**
Action: Click-drag on a Cube face.
Expected: Visible deformation on the cube face at click position.

**P10-T12 - Torus deforms**
Action: Click-drag on Torus surface.
Expected: Visible deformation on torus ring at click position.

**P10-T13 - Torus Knot deforms**
Action: Click-drag on Torus Knot.
Expected: Visible deformation on knotted surface.

**P10-T14 - Icosahedron deforms**
Action: Click-drag on Icosahedron.
Expected: Visible deformation with no sharp polygon faceting.

**P10-T15 - Particles respond to sculpt**
Action: Click-drag into the Particle cloud.
Expected: Particles visibly displaced at the click position. Disturbance in the cloud.

**P10-T16 - Decay works on all objects**
Action: Sculpt marks on Sphere. Set Decay to 0.5. Observe.
Expected: Deformation fades over several seconds on the sphere.

**P10-T17 - GUI slider values preserved after object switch**
Action: Set Deformation Strength to 0.8. Switch from Sphere to Cube. Sculpt.
Expected: Deformation strength is still 0.8 on the Cube. Values not reset to defaults.

**P10-T18 - FPS above 50 sculpting Icosahedron**
Action: Select Icosahedron. Sculpt actively for 30 seconds.
Expected: FPS stays at or above 50.

**P10-T19 - Plane still behaves as in Phase 7/9**
Action: Switch back to Plane. Sculpt.
Expected: Plane deforms identically to Phase 9 behavior.

**P10-T20 - Scale slider resizes current object and resets on object switch**
Action: Move the Scale slider to 0.5, then to 2.0, then switch to a different object.
Expected: The current object scales uniformly in real time as the slider moves. After switching objects, the new object appears back at scale 1.0 and the slider display also resets to 1.0.

**P10-T21 - Mouse axis drag stretches along selected axis without sculpting**
Action: In Mouse Mode, left-click and drag the X, Y, and Z axis tubes one at a time.
Expected: The dragged axis highlights while active, the current object stretches only along that selected axis, no sculpt deformation is written while the axis is being dragged, and dragging the Plane's Y axis does not change the Noise Scale or Noise Speed slider values or make shader-driven surface height look stronger.

**P10-T22 - Webcam axis pinch-drag stretches along selected axis without sculpting**
Action: In Webcam Mode, pinch directly on an axis tube and drag along it.
Expected: The corresponding axis highlights while the pinch-drag is active, the object stretches along that axis, and the pinch does not simultaneously sculpt the mesh.

**P10-T23 - Two-hand empty-space pinch scales the object and updates the Scale slider**
Action: In Webcam Mode, pinch with both hands in empty space so neither pinch raycast hits the current object, then move the pinches farther apart and closer together.
Expected: The object scales uniformly up and down based on the pinch distance, the Scale slider updates live to match the gesture-driven value, the value stays clamped between 0.25 and 3.0, and a double-headed arrow appears between the palms while the gesture is active.

---
## Phase 11 Ã¢â‚¬â€ Mouse camera controls

### Setup
Phase 10 must be COMPLETE.

---

### P11 Ã¢â‚¬â€ Zoom

**P11-T01 Ã¢â‚¬â€ Ctrl+scroll up zooms in**
Action: Hold Ctrl. Scroll wheel up 3 ticks.
Expected: Camera moves noticeably closer to the origin. Objects appear larger.

**P11-T02 Ã¢â‚¬â€ Ctrl+scroll down zooms out**
Action: Hold Ctrl. Scroll wheel down 3 ticks.
Expected: Camera moves noticeably further from the origin. Objects appear smaller.

**P11-T03 Ã¢â‚¬â€ Scroll without Ctrl does not zoom**
Action: Scroll wheel without holding Ctrl.
Expected: Page does not scroll (canvas has no overflow). Camera does not zoom. No browser zoom.

**P11-T04 Ã¢â‚¬â€ Zoom clamped at minimum**
Action: Ctrl+scroll in past the minimum distance repeatedly.
Expected: Camera stops at CAM_RADIUS_MIN. Does not pass through the object.

**P11-T05 Ã¢â‚¬â€ Zoom clamped at maximum**
Action: Ctrl+scroll out past the maximum distance repeatedly.
Expected: Camera stops at CAM_RADIUS_MAX. Does not fly off to infinity.

**P11-T06 Ã¢â‚¬â€ Zoom is smooth not jumpy**
Action: Ctrl+scroll in very slowly, one tick at a time.
Expected: Each tick produces a consistent, predictable zoom increment.

---

### P11 Ã¢â‚¬â€ Orbit

**P11-T07 Ã¢â‚¬â€ Right-click drag on empty space orbits**
Action: Right-click on empty space (no mesh visible at that pixel). Drag left.
Expected: Camera orbits to the left. The object rotates in the opposite direction from the camera's perspective.

**P11-T08 Ã¢â‚¬â€ Horizontal drag orbits horizontally**
Action: Right-click empty space. Drag purely horizontally.
Expected: Camera orbits around the Y axis. No vertical tilt.

**P11-T09 Ã¢â‚¬â€ Vertical drag orbits vertically**
Action: Right-click empty space. Drag purely upward.
Expected: Camera pitches upward. Looking more down at the top of the object.

**P11-T10 Ã¢â‚¬â€ Camera always looks at origin during orbit**
Action: Orbit to any angle.
Expected: The world origin (where the object sits) remains centered in the viewport throughout all orbit angles.

**P11-T11 Ã¢â‚¬â€ Camera does not flip over poles**
Action: Right-click drag up repeatedly past vertical.
Expected: Camera stops just before the Y axis Ã¢â‚¬â€ does not flip upside down.

**P11-T12 Ã¢â‚¬â€ Right-click on mesh activates stretch not orbit**
Action: Right-click directly on a visible part of the spawned mesh. Drag.
Expected: Stretch effect activates (falloff radius expands). Camera does NOT orbit.

**P11-T13 Ã¢â‚¬â€ Right-click on empty space does not activate stretch**
Action: Right-click on empty black space (no mesh). Drag.
Expected: Camera orbits. No stretch effect.

---

### P11 Ã¢â‚¬â€ Sculpting after camera movement

**P11-T14 Ã¢â‚¬â€ Sculpting works after zoom**
Action: Zoom in with Ctrl+scroll. Then click-drag on the mesh.
Expected: Deformation appears at cursor position at the new zoom level.

**P11-T15 Ã¢â‚¬â€ Sculpting works after orbit**
Action: Orbit to a completely new angle. Then click-drag on the mesh.
Expected: Deformation appears at cursor position from the new viewing angle.

**P11-T16 Ã¢â‚¬â€ FPS above 50 during active orbit**
Action: Hold right-click and sweep orbit continuously for 10 seconds.
Expected: FPS stays at or above 50 during orbit.

**P11-T17 Ã¢â‚¬â€ No console errors during camera controls**
Action: Zoom in and out. Orbit around fully. Check console.
Expected: Zero red errors. No warnings about missing or disposed objects.

---

## Phase 12 Ã¢â‚¬â€ Gesture camera controls

### Setup
Phase 11 must be COMPLETE. Webcam Mode must be active for all gesture tests.

---

### P12 Ã¢â‚¬â€ Gesture detection visual feedback

**P12-T01 Ã¢â‚¬â€ Fist gesture shows coral filled circle**
Action: Make a closed fist with one hand.
Expected: A filled coral/red circle appears at the palm center position on the landmark canvas.

**P12-T02 Ã¢â‚¬â€ Open palm shows teal ring**
Action: Hold hand open flat toward camera.
Expected: A teal/green ring (unfilled circle) appears at the palm center.

**P12-T03 Ã¢â‚¬â€ Fist and palm indicators are mutually exclusive**
Action: Transition slowly from fist to open palm.
Expected: Coral filled circle disappears as teal ring appears. Both do not show simultaneously.

**P12-T04 Ã¢â‚¬â€ Pinch indicator takes priority over fist indicator**
Action: Make a pinch gesture.
Expected: The existing sphere indicator shows for pinch. Fist coral circle does NOT appear simultaneously.

---

### P12 Ã¢â‚¬â€ Fist zoom

**P12-T05 Ã¢â‚¬â€ Single fist zooms in continuously**
Action: Make a closed fist with one hand and hold it.
Expected: Camera continuously zooms in (objects grow larger) while fist is maintained.

**P12-T06 Ã¢â‚¬â€ Zoom in stops when fist opens**
Action: Hold fist (zoom active). Open hand.
Expected: Zoom stops immediately when hand opens.

**P12-T07 Ã¢â‚¬â€ Zoom in indicator shows**
Action: Make a fist (zoom in active).
Expected: Small "+" symbol appears in the top-right area of the landmark canvas.

**P12-T08 Ã¢â‚¬â€ Fist zoom does not activate when pinching**
Action: Pinch with one hand (sculpting). Make a fist with the other hand.
Expected: Sculpting continues normally. Camera does NOT zoom in. Pinch takes priority.

**P12-T09 Ã¢â‚¬â€ Zoom clamped at minimum during fist zoom**
Action: Hold fist until camera reaches minimum zoom.
Expected: Camera stops at minimum. Does not pass through the mesh.

---

### P12 Ã¢â‚¬â€ Fist-to-palm zoom out

**P12-T10 Ã¢â‚¬â€ Fist-to-palm triggers one zoom out**
Action: Make a fist. Then quickly open to full open palm.
Expected: Camera jumps outward by one zoom increment.

**P12-T11 Ã¢â‚¬â€ Zoom out is one-shot not continuous**
Action: Make a fist, open to palm, hold open palm.
Expected: Camera jumps out once on the transition. Does not continuously zoom out while palm is held.

**P12-T12 Ã¢â‚¬â€ Zoom out indicator shows**
Action: Perform fist-to-palm transition.
Expected: Small "Ã¢Ë†â€™" symbol briefly visible in top-right of landmark canvas after the transition.

---

### P12 Ã¢â‚¬â€ Two-hand orbit

**P12-T13 Ã¢â‚¬â€ Both open palms moving right orbits camera right**
Action: Hold both hands open. Move both hands slowly to the right.
Expected: Camera orbits to the right around the origin.

**P12-T14 Ã¢â‚¬â€ Both open palms moving upward pitches camera up**
Action: Hold both hands open. Move both hands upward.
Expected: Camera pitches upward Ã¢â‚¬â€ viewing angle shifts to look more from above.

**P12-T15 Ã¢â‚¬â€ Opposite hand directions do not orbit**
Action: Move one hand left and one hand right simultaneously.
Expected: Camera does NOT orbit. Opposite directions cancel out.

**P12-T16 Ã¢â‚¬â€ 5-frame gate prevents accidental orbit**
Action: Briefly flash both hands open for 2-3 frames then close them.
Expected: No orbit activates. The gate requires 5 consecutive open-palm frames.

**P12-T17 Ã¢â‚¬â€ Orbit indicator shows**
Action: Activate two-hand orbit.
Expected: A curved arc or dashed line between the two palm positions visible on landmark canvas.

**P12-T18 Ã¢â‚¬â€ Two-hand orbit does not activate while one hand is pinching**
Action: Pinch with one hand. Hold other hand open.
Expected: Sculpting occurs. Camera does NOT orbit. Pinch takes priority.

---

### P12 Ã¢â‚¬â€ Sculpting after gesture camera

**P12-T19 Ã¢â‚¬â€ Sculpting works after fist zoom**
Action: Use fist zoom to zoom in significantly. Then pinch and sculpt.
Expected: Deformation appears at the pinch position at the new zoom level.

**P12-T20 Ã¢â‚¬â€ Deformation persists through camera orbit**
Action: Sculpt marks on an object. Then use two-hand orbit to view from a different angle.
Expected: All sculpted deformation marks are visible from the new camera angle.

**P12-T21 Ã¢â‚¬â€ FPS above 50 with gesture detection active**
Action: Hold both hands up performing various gestures for 60 seconds.
Expected: FPS stays at or above 50. No memory growth.

**P12-T22 Ã¢â‚¬â€ No console errors during gesture session**
Action: Run through all gesture types for 2 minutes.
Expected: Zero red console errors. MediaPipe internal messages acceptable.

---

## Phase 13 Ã¢â‚¬â€ Final polish and preserved behavior audit

### Setup
Phase 12 must be COMPLETE.

---

### P13 Ã¢â‚¬â€ Cleanup

**P13-T01 Ã¢â‚¬â€ No console.log in phases 8Ã¢â‚¬â€œ12 source files**
Action: Search src/axisgizmo.js, src/objectspawner.js, src/cameracontrols.js, src/gesturecamera.js for console.log.
Expected: Zero matches.

**P13-T02 Ã¢â‚¬â€ No commented-out code in new files**
Action: Skim all four new Phase 8Ã¢â‚¬â€œ12 source files.
Expected: No large commented-out blocks. No dead code.

---

### P13 Ã¢â‚¬â€ Full preserved behavior audit

**P13-T03 Ã¢â‚¬â€ Splash appears on load and is dismissible**
Action: Reload page.
Expected: Splash appears. Enter Gallery dismisses. ? reopens. Escape closes.

**P13-T04 Ã¢â‚¬â€ Splash contains updated instructions**
Action: Open splash. Read content.
Expected: Splash mentions Mouse Mode orbit, zoom, Webcam Mode fist/palm gestures, A key for axis, object switcher.

**P13-T05 Ã¢â‚¬â€ Mouse Mode sculpting works on all 7 objects**
Action: Switch through each object. Click-drag on each.
Expected: Each object deforms correctly.

**P13-T06 Ã¢â‚¬â€ Mouse Mode orbit works on all 7 objects**
Action: With each object spawned, right-click drag on empty space.
Expected: Camera orbits correctly regardless of which object is spawned.

**P13-T07 Ã¢â‚¬â€ Mouse Mode stretch works on all 7 objects**
Action: With each object, right-click on the mesh surface. Drag.
Expected: Stretch effect activates on each object.

**P13-T08 Ã¢â‚¬â€ Webcam Mode pinch works on all 7 objects**
Action: Switch to Webcam Mode. With each object spawned, pinch and sculpt.
Expected: Each object deforms under the pinch position.

**P13-T09 Ã¢â‚¬â€ Webcam Mode gestures do not accidentally activate in Mouse Mode**
Action: Ensure Mouse Mode is active. Make a fist.
Expected: Nothing happens. Gesture camera controls are Webcam Mode only.

**P13-T10 Ã¢â‚¬â€ Axis gizmo visible and toggleable in all states**
Action: Switch objects. Toggle Webcam/Mouse mode. Press A key in each state.
Expected: Axis toggle works correctly regardless of object or mode.

**P13-T11 Ã¢â‚¬â€ All GUI controls respond on all objects**
Action: Switch to Sphere. Adjust each GUI slider.
Expected: Noise Scale, Noise Speed, Deformation Strength, Falloff Radius, Decay, Color Hue all affect the Sphere immediately.

---

### P13 Ã¢â‚¬â€ Performance

**P13-T12 Ã¢â‚¬â€ FPS above 50 with all systems active**
Action: Enable Webcam Mode. Spawn Icosahedron. Sculpt with one hand. Let MediaPipe run.
Expected: FPS stays at or above 50.

**P13-T13 Ã¢â‚¬â€ No memory growth over 5 minutes**
Action: Run the app for 5 minutes with active sculpting and object switching.
Expected: Memory usage plateaus. No unbounded growth.

**P13-T14 Ã¢â‚¬â€ No DataTexture needsUpdate spam (code verification)**
Action: Open applyImpulse and applyDecay functions.
Expected: tex.needsUpdate = true only set when data actually changed (when a pinch is active or decay is non-zero). Not set every frame unconditionally. Code verification.

---

### P13 Ã¢â‚¬â€ Documentation

**P13-T15 Ã¢â‚¬â€ README updated with all new features**
Action: Read README.md.
Expected: Documents all 7 objects, all mouse controls (sculpt, orbit, stretch, zoom), all webcam gestures (pinch, stretch, fist zoom, palm zoom-out, two-palm orbit), keyboard shortcuts (A, ?, Escape).

**P13-T16 Ã¢â‚¬â€ Fresh install works**
Action: Clone project to a fresh directory. npm install. npm run dev. Open localhost:5173.
Expected: App loads with no errors. Splash appears. All features accessible without setup.

---

## Phase 14 — Color system overhaul

### Setup
Phase 13 must be COMPLETE. Run npm run dev. Open http://localhost:5173 in Chrome.

---

### P14 — Shader uniform migration

**P14-T01 — Surface renders with correct default color**
Action: Load the app and dismiss the splash.
Expected: Surface has a blue color (matching the previous default hue). Not black, not white, not grey.

**P14-T02 — u_hue removed from shader (code verification)**
Action: Open src/shaders/surface.frag. Search for u_hue.
Expected: Zero matches. No reference to u_hue anywhere in the file. Code verification.

**P14-T03 — u_color present in shader (code verification)**
Action: Open src/shaders/surface.frag. Search for u_color.
Expected: uniform vec3 u_color present and used in fragment color output. Code verification.

**P14-T04 — npm run build succeeds after uniform change**
Action: Run npm run build in terminal.
Expected: Build completes with zero errors. Only the existing Vite chunk-size warning is acceptable.

**P14-T05 — No console errors on load**
Action: Check DevTools Console after dismissing splash.
Expected: Zero red errors. No shader compilation errors.

---

### P14 — Color picker UI

**P14-T06 — Color swatch button present in lil-gui panel**
Action: Open the lil-gui Controls panel.
Expected: A "Color" row is visible with a colored swatch button. No "Color Hue" slider present.

**P14-T07 — Clicking swatch opens color picker panel**
Action: Click the color swatch button.
Expected: A floating color picker panel appears below the lil-gui panel on the right side.

**P14-T08 — Color picker contains saturation/brightness field**
Action: Open the color picker. Observe.
Expected: A large square canvas visible with a color gradient from white (top-left) to the selected hue (top-right) to black (bottom). A circle cursor shows the current position.

**P14-T09 — Color picker contains hue bar**
Action: Open the color picker. Observe the right side.
Expected: A vertical rainbow gradient bar visible to the right of the main field. A triangle cursor shows the current hue.

**P14-T10 — Color picker contains preview boxes**
Action: Open the color picker. Observe below the main field.
Expected: Two small colored squares side by side. Left shows the color before the picker opened (current). Right shows the color as it is being adjusted (new).

**P14-T11 — RGB mode inputs present**
Action: Open color picker. Observe input fields.
Expected: R, G, B numeric inputs visible. Values match the current color.

**P14-T12 — CMYK mode toggle works**
Action: Open color picker. Click CMYK.
Expected: Input fields change to C, M, Y, K. Values correctly represent the same color in CMYK space.

**P14-T13 — Hex input present and correct**
Action: Open color picker. Observe hex field.
Expected: A hex input showing the current color as a 6-character hex value. Matches the displayed color.

**P14-T14 — Dragging saturation field updates surface color**
Action: Open color picker. Click and drag in the saturation/brightness field.
Expected: Surface color updates in real time as the cursor moves. Color picker "new" preview box updates.

**P14-T15 — Dragging hue bar updates surface color**
Action: Open color picker. Drag the hue bar cursor up or down.
Expected: Surface color hue changes in real time. Saturation field background updates to match new hue.

**P14-T16 — Typing RGB values updates surface color**
Action: Open color picker. Type a new value in the R input field.
Expected: Surface color updates immediately. Hex field updates. Saturation field cursor moves.

**P14-T17 — Typing hex value updates color**
Action: Open color picker. Type a valid 6-character hex in the hex field.
Expected: All inputs update to reflect the new color. Surface color updates.

**P14-T18 — Clicking outside picker closes it**
Action: Open color picker. Click anywhere outside the picker panel and outside the swatch button.
Expected: Picker closes. Surface retains the last selected color.

**P14-T19 — Clicking swatch again closes picker**
Action: Open color picker. Click the swatch button again.
Expected: Picker closes.

**P14-T20 — Swatch button reflects current color**
Action: Pick a red color in the picker. Close it.
Expected: The swatch button background is now red.

---

### P14 — Preserved behavior

**P14-T21 — All sculpting still works after color system change**
Action: Click-drag sculpt on the plane and on the sphere.
Expected: Deformation appears correctly. Color change does not affect sculpting.

**P14-T22 — All other GUI controls still work**
Action: Adjust Noise Scale, Noise Speed, Deformation Strength, Falloff Radius, Decay sliders.
Expected: All controls respond correctly. None affected by the color system change.

**P14-T23 — FPS above 50 with color picker open**
Action: Open the color picker. Check FPS.
Expected: FPS stays at or above 50. Color picker DOM has no performance impact.

---

## Phase 15 — Audio capture and band analysis

### Setup
Phase 14 must be COMPLETE. Have music or audio playing on your computer before testing.

---

### P15 — Audio capture

**P15-T01 — Audio Reactive toggle present in GUI**
Action: Open lil-gui panel.
Expected: "Audio Reactive" boolean toggle visible below the color controls.

**P15-T02 — Reactivity slider hidden by default**
Action: Observe lil-gui with Audio Reactive off.
Expected: No "Reactivity" slider visible. No "Start Audio" button visible.

**P15-T03 — Enabling Audio Reactive shows sub-controls**
Action: Toggle Audio Reactive on.
Expected: "Reactivity" slider appears. "Start Audio" button appears. Instructions text appears below.

**P15-T04 — Instructions text visible**
Action: Enable Audio Reactive. Read the instructions text.
Expected: Text says to select "Entire Screen" and check "Share system audio" in the dialog.

**P15-T05 — Start Audio opens screen share dialog**
Action: Enable Audio Reactive. Click "Start Audio".
Expected: Chrome screen share / display capture dialog opens.

**P15-T06 — Cancelling dialog does not crash**
Action: Click Start Audio. Cancel the dialog without sharing.
Expected: No crash. Button remains "Start Audio". No console errors.

**P15-T07 — Sharing with system audio activates audio**
Action: Click Start Audio. Select Entire Screen. Check Share system audio. Click Share.
Expected: Button changes to "Stop Audio". Music playing on computer begins affecting surface.

**P15-T08 — Bass affects noise scale**
Action: Play bass-heavy music. Observe the surface.
Expected: Surface complexity (noise scale) increases with bass hits.

**P15-T09 — Mids affect noise speed**
Action: Play music with prominent midrange. Observe the surface animation speed.
Expected: Animation speeds up and slows down with midrange energy.

**P15-T10 — Reactivity slider at 0 makes surface unresponsive**
Action: With audio active, drag Reactivity to 0.
Expected: Surface stops responding to audio — noise scale and speed do not change with music.

**P15-T11 — Reactivity slider at max amplifies response**
Action: Drag Reactivity to 3. Play quiet audio.
Expected: Even quiet audio causes noticeable surface response.

**P15-T12 — Stop Audio button stops audio**
Action: Click Stop Audio.
Expected: Button changes back to "Start Audio". Surface reverts to noise slider values.

**P15-T13 — Disabling Audio Reactive stops audio**
Action: With audio active, toggle Audio Reactive off.
Expected: Audio stops. Sub-controls hide. Surface reverts to noise slider values.

**P15-T14 — Noise Scale and Speed sliders resume control after audio stops**
Action: Turn audio off. Adjust Noise Scale slider.
Expected: Surface complexity changes with the slider value.

**P15-T15 — No audio detected warning**
Action: Start Audio but share a source with no audio.
Expected: Warning message appears near the Start Audio button after a few seconds indicating no audio is detected.

**P15-T16 — Particles respond more dramatically to bass**
Action: Switch to Particles object. Start audio with bass-heavy music.
Expected: Particle cloud reacts more dramatically than the sphere does to the same music.

**P15-T17 — FPS above 50 with audio active**
Action: Start audio. Play music. Check FPS.
Expected: FPS stays at or above 50 throughout.

**P15-T18 — No console errors during audio session**
Action: Start audio. Play music for 30 seconds. Check console.
Expected: Zero red console errors. No WebAudio warnings.

---

## Phase 16 — High frequency shimmer

### Setup
Phase 15 must be COMPLETE. Have music with cymbals or high-frequency content playing.

---

**P16-T01 — u_highFreq uniform present (code verification)**
Action: Open src/shaders/surface.vert. Search for u_highFreq.
Expected: uniform float u_highFreq present and used in displacement computation. Code verification.

**P16-T02 — No shimmer when audio is off**
Action: Ensure Audio Reactive is off. Observe surface carefully.
Expected: No fine ripple or shimmer layer visible. Surface looks identical to Phase 15 with audio off.

**P16-T03 — Shimmer appears with high frequency audio**
Action: Start audio. Play music with prominent cymbals or hi-hats.
Expected: Fine rapid ripple visible on the surface surface during high-frequency moments.

**P16-T04 — Shimmer more dramatic on particles**
Action: Switch to Particles. Start audio with high-frequency content.
Expected: Particle shimmer is clearly more intense than on the sphere with the same music.

**P16-T05 — Shimmer resets to zero when audio stops**
Action: Stop audio. Observe surface.
Expected: Fine ripple disappears immediately. Surface returns to clean noise displacement.

**P16-T06 — Shimmer does not affect sculpting**
Action: With shimmer active, click-drag sculpt on the sphere.
Expected: Deformation appears correctly. Shimmer and sculpting coexist without interference.

**P16-T07 — FPS above 50 with shimmer active**
Action: Start audio with high-frequency content. Check FPS.
Expected: FPS stays at or above 50. Shimmer shader addition has acceptable performance cost.

**P16-T08 — npm run build succeeds after shader addition**
Action: Run npm run build.
Expected: Build completes with zero errors.

---

## Phase 17 — Gradient editor and color reactivity

### Setup
Phase 16 must be COMPLETE.

---

### P17 — Gradient editor UI

**P17-T01 — Color Reactive toggle hidden when audio off**
Action: Ensure Audio Reactive is off. Observe lil-gui.
Expected: No "Color Reactive" toggle visible.

**P17-T02 — Color Reactive toggle appears when audio enabled**
Action: Enable Audio Reactive.
Expected: "Color Reactive" toggle appears in lil-gui below the audio controls.

**P17-T03 — Enabling Color Reactive shows gradient editor**
Action: Enable Audio Reactive. Enable Color Reactive.
Expected: Gradient editor panel appears below lil-gui. Rainbow gradient visible in the bar.

**P17-T04 — Default gradient is full rainbow**
Action: Open gradient editor.
Expected: Gradient bar shows red → orange → yellow → green → cyan → blue → violet.

**P17-T05 — Stop handles visible below gradient bar**
Action: Observe gradient editor.
Expected: Small colored square handles visible below the bar at each stop position (7 by default).

**P17-T06 — Clicking a stop opens color picker**
Action: Click one of the stop handles.
Expected: Color picker opens showing that stop's color. Matches the stop's color.

**P17-T07 — Changing stop color updates gradient bar**
Action: Click a stop. Change its color in the picker.
Expected: Gradient bar redraws immediately showing the new color at that stop.

**P17-T08 — Dragging a stop repositions it**
Action: Click and drag a middle stop left or right.
Expected: Stop handle moves. Gradient bar redraws showing the color transition at the new position.

**P17-T09 — Clicking gradient bar adds a new stop**
Action: Click on an empty area of the gradient bar.
Expected: New stop handle appears at that position. Color matches the gradient at that point. Gradient bar redraws.

**P17-T10 — Dragging stop below bar deletes it**
Action: Click and drag a stop handle more than 20px below the bar.
Expected: Stop handle disappears. Gradient redraws without that stop. Minimum 2 stops enforced.

**P17-T11 — Cannot delete below 2 stops**
Action: Delete stops until only 2 remain. Try to delete one more.
Expected: Stop cannot be deleted. Minimum 2 stops enforced.

**P17-T12 — Midpoint diamonds visible between stops**
Action: Observe gradient editor with multiple stops.
Expected: Small diamond shapes visible between each pair of adjacent stops.

**P17-T13 — Dragging midpoint adjusts gradient easing**
Action: Drag a midpoint diamond toward one of its surrounding stops.
Expected: Gradient bar updates showing the transition skewed toward or away from that stop.

---

### P17 — Color reactivity

**P17-T14 — Surface color changes with audio energy**
Action: Enable Audio Reactive. Enable Color Reactive. Play music.
Expected: Surface color shifts through the gradient colors as music energy changes.

**P17-T15 — Low energy maps to start of gradient**
Action: Play very quiet audio or near-silence.
Expected: Surface color is near the first stop color (red end of default rainbow).

**P17-T16 — High energy maps to end of gradient**
Action: Play loud audio.
Expected: Surface color shifts toward the last stop color (violet end of default rainbow).

**P17-T17 — Color reactive off restores single color**
Action: Enable Color Reactive. Observe. Disable Color Reactive.
Expected: Surface returns to the single color from the color swatch. No jarring jump.

**P17-T18 — Custom gradient colors drive surface**
Action: Change all stops to shades of blue and green. Enable Color Reactive. Play music.
Expected: Surface color shifts only through blues and greens — the custom gradient.

**P17-T19 — Color transitions are smooth not jarring**
Action: Play music with sharp beat changes. Observe color transitions.
Expected: Color changes are smooth — no instant frame-to-frame jumps between distant colors.

**P17-T20 — Gradient editor hidden when Color Reactive off**
Action: Toggle Color Reactive off.
Expected: Gradient editor panel hides. Single color swatch button still visible.

**P17-T21 — Sculpting works with color reactive on**
Action: Enable Color Reactive. Click-drag sculpt.
Expected: Deformation appears correctly. Color reactivity does not interfere with sculpting.

**P17-T22 — FPS above 50 with all audio features active**
Action: Enable Audio Reactive, start audio, enable Color Reactive. Play music. Check FPS.
Expected: FPS stays at or above 50 with all audio systems running simultaneously.

**P17-T23 — No console errors during full audio session**
Action: Run all audio features for 2 minutes. Check console.
Expected: Zero red console errors.
