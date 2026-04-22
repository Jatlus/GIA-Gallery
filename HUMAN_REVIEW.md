# GIA Gallery — Human Review Checklist

## How to use this file

After the agent completes all tests for a phase and sets STATUS: AWAITING HUMAN APPROVAL in PROGRESS.md, you run this checklist before sending approval.

This checklist is yours — the agent does not read or update it. It exists because agent tests can pass while behavior still feels wrong, and because some things (smoothness, feel, visual quality) can only be judged by a human.

Work through every item in the phase section. Mark each one:
- [x] Verified — looks and feels correct
- [~] Acceptable — minor issue, not a blocker, note it
- [ ] Failed — do not approve. Send the agent: "Phase N not approved. Issue: [describe exactly what you saw]"

When every item is [x] or [~] with no blockers, send the agent:
"Phase N approved. Begin Phase N+1."

For the final phase (Phase 7), send:
"Phase 7 approved. Project complete."

---

## How to run the app before reviewing

```
npm run dev
```
Open http://localhost:5173 in Chrome.
Keep Chrome DevTools open (F12) on the Console tab while you review.
Any red error in the console during your review = automatic fail for that phase.

---

## Phase 1 Human Review — Three.js surface

Run the app. Observe for 60 seconds before checking anything.

### Visual quality
- [x] The surface fills the entire browser window with no white borders or gaps
- [x] The surface is visibly moving and changing shape — not a flat static plane
- [x] The movement looks organic and continuous, not choppy or stuttering
- [x] The surface has visible height variation — hills and valleys, not just texture

### Controls
- [x] The lil-gui panel is visible in the top-right corner
- [x] Drag the Noise Scale slider from left to right — surface goes from smooth to complex
- [x] Drag the Noise Speed slider from left to right — animation clearly speeds up
- [x] Drag the Color Hue slider — surface color shifts through the spectrum
- [x] All three sliders respond immediately — no lag between slider and visual change

### Performance
- [x] Open DevTools → Performance tab → Record for 10 seconds → Stop
- [x] The FPS readout stays at or above 58fps for the entire recording
- [x] No red "long task" bars visible in the main thread timeline

### Stability
- [x] Leave the app running for 2 minutes — surface still animating at the end
- [x] Switch to a different browser tab for 30 seconds — return — surface resumes within 1 second
- [x] No console errors at any point during your review

Approval message: "Phase 1 approved. Begin Phase 2."

---

## Phase 2 Human Review — Ping-pong deformation

The app still has the temporary mouse-click test input active. Use it.

### Basic deformation
- [x] Click once anywhere on the canvas — a bump or dent appears at that exact location
- [x] The deformation has smooth falloff — it fades at the edges, not a sharp square
- [x] Click 5 different areas — all 5 marks are visible at the same time
- [x] Click the same spot 3 times — the deformation grows with each click (accumulates)

### Location accuracy
- [x] Click the top-left corner — the bump appears in the top-left area of the mesh
- [x] Click the bottom-right corner — the bump appears in the bottom-right area
- [x] Click center — bump appears at center
- [x] The click location and the deformation location feel closely matched

### Decay
- [x] Set Decay slider to 0 — click the canvas — wait 30 seconds — mark is still there
- [x] Set Decay slider to 0.8 — click the canvas — mark fades away within 3-4 seconds
- [x] Set Decay slider to 0 while a mark is fading — fading stops and mark stabilizes
- [x] All Decay changes take effect immediately without reload

### Feel and performance
- [x] Clicking rapidly 10 times feels stable — no freezing, no visual glitches
- [x] FPS stays above 55 while clicking rapidly (check DevTools Performance)
- [x] No console errors during any clicking

Approval message: "Phase 2 approved. Begin Phase 3."

---

## Phase 3 Human Review — Webcam overlay + MediaPipe

You will need to test both the denied and granted webcam permission states.

### Denied permission (test this first)
- [x] Open Chrome settings for localhost — set camera to "Block"
- [x] Reload the app — a permission prompt may appear briefly, then a clear message appears on screen
- [x] The message is readable and explains how to enable the camera
- [x] The Three.js surface is still animating behind the message — it did not stop
- [x] No red console errors appear from the permission denial
- [x] The message is not just a browser alert popup — it is built into the page

### Granted permission
- [x] Set camera back to "Allow" in Chrome settings
- [x] Reload — webcam permission prompt appears (or was already stored as allowed)
- [x] The webcam feed is visible as a semi-transparent overlay covering the full window
- [x] The overlay is clearly mirrored — hold up text in front of camera, confirm it reads reversed
- [x] You can still see the Three.js surface animating through the overlay
- [x] Clicking on the canvas still registers (deformation should still work from Phase 2)

### Overlay alignment
- [x] Hold your hand at the left edge of your body in front of the camera
- [x] Your hand appears at the left edge of the overlay — not offset
- [x] Hold your hand at the top of the frame — appears at top of overlay
- [x] The overlay fills the window fully — no black bars, no letterboxing

### Landmark tracking
- [x] Hold one hand up — 21 green dots appear tracking your hand
- [x] Move your hand — the dots follow smoothly with no more than about 100ms lag
- [x] Remove your hand — dots disappear cleanly within a couple of frames
- [x] Hold both hands up — dots appear on both hands simultaneously
- [x] Remove one hand — remaining hand continues tracking without disruption

### Stability
- [x] Cover the webcam lens with your palm — dots disappear, no crash, surface keeps animating
- [x] Uncover the lens — tracking resumes
- [x] Wave your hand quickly — tracking may lag slightly but should not crash or throw errors
- [x] No console errors during 2 minutes of normal hand movement

Approval message: "Phase 3 approved. Begin Phase 4."

---

## Phase 4 Human Review — Single-hand pinch + raycasting

The debug landmark dots should still be visible in this phase.

### Sphere indicator
- [x] Hold your hand open above the canvas — a sphere/circle appears on the mesh surface
- [x] Move your hand slowly — the sphere follows your hand position smoothly
- [x] The sphere has no jitter when your hand is held still
- [x] Remove your hand — the sphere disappears within 1-2 frames

### Pinch detection
- [x] Hold hand open — sphere is gray/dim, no deformation
- [x] Slowly bring thumb and index finger together — sphere brightens gradually (analog, not a snap)
- [x] Full pinch — sphere is clearly bright, deformation is appearing
- [x] Release pinch — deformation stops growing immediately, existing marks stay

### Coordinate accuracy — this is the most important thing to check
- [x] Pinch on the LEFT side of your screen — deformation appears on the LEFT of the mesh
- [x] Pinch on the RIGHT side — deformation on the RIGHT
- [x] Pinch at the TOP — deformation near the TOP
- [x] Pinch at the BOTTOM — deformation near the BOTTOM
- [x] The sphere indicator and the deformation appear in roughly the same screen region

### Feel
- [x] Moving your hand and sculpting feels smooth — no lag between hand position and sphere
- [x] Moving quickly across the screen — the sphere moves smoothly, not teleporting
- [x] Holding still while pinching — deformation grows in one focused area, not scattered
- [x] The interaction feels responsive and natural

### Performance
- [x] Pinch and drag continuously for 30 seconds — FPS stays above 55 (check DevTools)
- [x] No console errors during any pinch interaction

Approval message: "Phase 4 approved. Begin Phase 5."

---

## Phase 5 Human Review — Two-hand interaction

### Two sphere indicators
- [x] Hold both hands up — two sphere indicators appear, one per hand
- [x] Move hands in opposite directions — both spheres move independently
- [x] Each sphere tracks its respective hand without interfering with the other

### Independent sculpting
- [x] Pinch left hand only on the left side — deformation on left, right is untouched
- [x] Pinch right hand only on the right side — deformation on right, left is untouched
- [x] Pinch both hands at the same time in different areas — both deformations appear simultaneously

### Stretch effect
- [x] Pinch both hands and slowly pull them apart
- [x] The deformation falloff radius visibly expands as hands move apart — wider area affected
- [x] Move hands back together — falloff contracts back toward normal
- [x] Release one hand while stretched — falloff returns to normal immediately

### Edge cases
- [x] Start with one hand, add second mid-session — second sphere appears, first unaffected
- [x] Remove one hand mid-session — remaining hand continues normally
- [x] Remove both hands at same time — both spheres disappear, surface still animates
- [x] Bring both hands back — tracking resumes correctly for both

### Crossing hands
- [x] Cross both hands over each other — tracking may briefly glitch, but must not crash
- [x] Bring hands very close together while pinching — no visual explosion or NaN artifacts

### Performance
- [x] Both hands pinching and moving for 30 seconds — FPS stays above 55
- [x] No console errors during two-hand interaction

Approval message: "Phase 5 approved. Begin Phase 6."

---

## Phase 6 Human Review — Polish + performance audit

### Cleanup
- [ ] The debug landmark dots are GONE — no green dots appear when hand is visible (landmark dots changed to stay)
- [x] Open DevTools Console — zero red errors on load and during 2 minutes of use
- [x] Open DevTools Console — zero yellow warnings (acceptable exception: Three.js deprecation warnings only)

### Final GUI controls
- [x] Open the lil-gui panel — count exactly 7 controls in this exact order:
      Noise Scale, Noise Speed, Deformation Strength, Falloff Radius, Decay, Color Hue, Webcam Opacity
- [x] Deformation Strength at minimum — pinch and drag — deformation barely visible
- [x] Deformation Strength at maximum — single pinch — dramatic, obvious deformation
- [x] Falloff Radius at minimum — pinch — small, tight deformation spot
- [x] Falloff Radius at maximum — pinch — deformation spreads across a wide area
- [ ] Webcam Opacity at 0 — webcam overlay invisible, surface clearly visible (removed)
- [ ] Webcam Opacity at maximum — overlay more opaque but artwork still visible through it (removed)
- [x] All controls respond immediately — no delay between slider move and visual update

### Performance
- [x] Run the app for 5 minutes with webcam active and occasional pinching
- [x] FPS is above 50 at the 5-minute mark (check DevTools Performance)
- [x] Memory usage has not grown dramatically (check DevTools Memory — heap should plateau)

### Resize and zoom
- [x] Drag the browser window to half its width while the app runs — canvas and overlay fill the new size
- [x] Restore to full width — everything realigns correctly
- [x] Press F11 for fullscreen — surface fills the screen, overlay aligned, hand tracking still works
- [x] Press F11 again to exit fullscreen — everything restores correctly

### README
- [x] Open README.md in the project folder
- [x] It exists and has real content — not placeholder text
- [x] It includes setup steps (npm install, npm run dev)
- [x] It explains the browser requirement (Chrome)
- [x] It lists the 7 GUI controls with plain-language descriptions

Approval message: "Phase 6 approved. Begin Phase 7."

---

## Phase 7 Human Review — Splash page, mouse interaction, webcam toggle

This is the final phase. Be thorough.

### Splash page
- [x] Reload the app — a splash page appears immediately over the surface
- [x] The Three.js surface is visibly animating behind the splash — it is not static or black
- [x] The heading says "GIA Gallery"
- [x] The splash explains Mouse Mode clearly (click-drag to sculpt, right-click to stretch)
- [x] The splash explains Webcam Mode clearly (pinch to sculpt, two-hand stretch)
- [x] The splash mentions the panel controls and the Decay slider
- [x] The "Enter Gallery" button is clearly visible
- [x] Clicking "Enter Gallery" — splash fades out smoothly over about half a second
- [x] Pressing Escape — splash fades out the same way
- [x] After dismissing, the surface and UI are fully accessible

### Help button and re-open
- [x] A "?" button is visible in the UI after dismissing the splash
- [x] Clicking it — splash reappears with the fade-in animation
- [x] Pressing the ? key — same result
- [x] Click "?" three times quickly — only ONE splash overlay appears, not multiple stacked

### Mode toggle
- [x] The toggle button is visible at the bottom-center of the screen
- [x] On load, it clearly shows "Mouse" as the active mode
- [x] Click the toggle — it switches to "Webcam" and the webcam permission prompt appears (or overlay appears if already granted)
- [x] Click the toggle again — returns to "Mouse", webcam overlay hides
- [x] Any deformation on the surface from before the switch is still there after switching back

### Mouse mode — sculpting
- [x] Click and drag on the canvas — deformation appears and follows the cursor
- [x] The deformation appears directly at the cursor position, not offset
- [x] Releasing the mouse button — sculpting stops, marks remain
- [x] Mouse cursor shows a crosshair when hovering over the canvas
- [x] Cursor changes to a grabbing hand while left button is held
- [x] A small circle follows the cursor on the canvas

### Mouse mode — coordinate accuracy
- [x] Drag on the left side — deformation on the left of the mesh
- [x] Drag on the right side — deformation on the right
- [x] Drag at the top — deformation near the top
- [x] Drag at the bottom — deformation near the bottom
- [x] The deformation appears where the cursor is, not on the opposite side

### Mouse mode — stretch
- [x] Right-click anywhere on the canvas — no browser context menu appears
- [x] Hold left button + drag to center — hold right button too — falloff radius visibly expands
- [x] Release right button while still dragging — falloff contracts back to normal
- [x] The stretch feels similar to the two-hand webcam stretch

### Mouse mode — edge cases
- [x] Move the cursor off the canvas while holding left button — sculpting stops cleanly
- [x] Rapidly click and release 10 times — no crashes, deformation marks accumulate
- [x] FPS stays above 55 during 30 seconds of active mouse sculpting (DevTools Performance)

### Webcam mode (if camera available)
- [x] Switch to Webcam Mode — webcam overlay appears, hand tracking works
- [x] Pinch sculpts the surface in webcam mode
- [x] Switch back to Mouse Mode — mouse sculpting works again
- [x] No deformation was lost during either switch

### Webcam denied (test this)
- [x] Block camera for localhost in Chrome settings
- [x] Click the toggle to switch to Webcam Mode
- [x] Toggle automatically reverts to Mouse — no permanent switch
- [x] A small red error message appears briefly near the toggle (not a blocking alert)
- [x] The error message fades away on its own within about 4 seconds
- [x] The app remains fully functional in Mouse Mode after the denial

### Interaction parity
- [x] Click the center of the screen in Mouse Mode — note the deformation size and shape
- [x] Switch to Webcam Mode — pinch at the center of the screen — deformation is similar in size and shape
- [x] The two modes feel like they are sculpting the same material

### Final documentation
- [x] Open README.md — it has been updated with Mouse Mode and Webcam Mode instructions
- [x] It explains the mode toggle button
- [x] It explains the "?" button and how to re-open instructions
- [x] It explains mouse controls (click-drag, right-click stretch)
- [x] It explains webcam controls (pinch, two-hand stretch)

### Overall feel
- [x] The app feels polished and intentional — not like a prototype
- [x] The splash page looks professional — not like unstyled HTML
- [x] The mode toggle is easy to find and understand without reading instructions
- [x] You could hand this to someone unfamiliar with the project and they could figure it out

### Final performance check
- [x] Run the app in Mouse Mode for 5 minutes with active sculpting
- [x] FPS above 50 at end of 5 minutes
- [x] Memory usage has plateaued — not growing unboundedly
- [x] Zero console errors during the full 5-minute run

Approval message: "Phase 7 approved. Project complete."

---

## Notes from your reviews

Use this space during the build process to track issues you noticed, things to revisit, or observations for each phase.

### Phase 1 notes
- animation looks like a curtain, adding noise looks like adding pleats
- performance and stability are really good
- sometimes when playing with the noise slider, it looks like the noise isn't edge to edge for the screen
- 3 websocket errors in the console that show up in the chrome dev tools console but that's probably because im launching the site from a terminal and vite is trying to connect to a web socket and failing
- 2 dimensional curtain type visual needs to be changed to be a 3 dimensional animation

Iteration 2 of Phase 1
- all problems resolved

### Phase 2 notes
- decay feels like a weird slider to have, 0 value keeps it persistent but as the number increases, the deformation goes from a giant bump to a small short bump with the same radius, anything between feels like it doesn't make much of a difference
- hard to see much a of a difference when triple clicking a single deformation
- clicking the bottom corners feels like its adding the deformation the edge of the object as opposed to the mouse location. I think its because you can't see the full object due to the camera angle
- decay set to 0.8 fades away almost instantly as opposed to 3-4 seconds
- any amount of decay apart from 0 fades too fast to test changing the value of decay to 0 while the bump is fading
- "A form field element has neither an id nor a name attribute. This might prevent the browser from correctly autofilling the form." error in dev tools log 
- bump is way too big when making deformations

Iteration 2 of Phase 2
- deformations too small now
- everything else is fixed

Iteration 3 of Phase 2
- the deformation size is much more reasonable

### Phase 3 notes
- landmark tracking is not functional so stability cannot be tested either
- overlay and placement looks good

Iteration 2 of Phase 3
- the frame rate slows down to about 47 fps when the landmark tracking of my hand is happening
- when I uncover the lens, the frame rate drop significantly
- needs to be optimized (maybe make it so only my hands when tracked appear instead of overlaying the full webcam or something along those lines)

### Phase 4 notes
- looks accurate based on iteration 1

### Phase 5 notes
- for some reason, using one hand looks fine but when pinching with both hands, the deformations connect to each other no matter how far theyre supposed to be from each other
- the grey dot only appears on one hand at a time

Iteration 2 of Phase 5
- grey dot fixed
- stretch feature should only be activated if one pinch is already happening and the second happens on the same spot. if they are far apart to start with, they should be independent deformations

Iteration 3 of Phase 5
- hands stop being tracked after leaving the site running for a while

Iteration 4 of Phase 5 
- fixed

### Phase 6 notes
- falloff radius at a minimum doesn't seem like a super tight point that is being deformed, difference between 0.4 and 0.5(max) strength doesn't seem to be very different, maybe min needs to be 0.01 and max needs to be 0.25?
- when switching between fullscreen (f11) and back, the handtracking dots are laggy so it might be better to just remove the overlay and go back to only showing the green dots as the hand trackers

Iteration 2 of Phase 6
- stretch feature starts failing when falloff radius is at minimum 0.01 value and it is stretched too far
- when falloff radius is at max, the edges of the deformation starts stuttering when pinch gesture is held with one hand
- hand tracking is smooth again

Iteration 3 of Phase 6
- Stretch feature works now but when pinching the deformation with the second hand and falloff radius being set to min, the size of the deformation increases before actually moving both hands away from each other
- when deformations are held, there is still a bit of a stutter

Iteration 4 of Phase 6
- stutter is still persistent
- deformation has sharp edges now
- stretch works properly now

Iteration 5 of Phase 6
- stutter is fixed but sharp edges persist on deformations
- new warnings and now an undefined mediapipe error

Iteration 6 of Phase 6
- stutter is back
- edges are still sharp
- warnings and error fixed

Iteration 7 of Phase 6
- stutter is still persistent and strong
- edges are sharper than before

Iteration 8 of Phase 6
- stutter is fixed
- fluctuations when holding pinch are caused by a combination of me having shaky hands and MediaPipe landmark jitter
- slight edge sharpness on deformations is inherent to Gaussian falloff viewed from shallow camera angle — acceptable, not a defect

### Phase 7 notes
- completed phase 7 with no issues

---

## Phase 8 Human Review — 3D environment foundation

Run the app. Dismiss the splash. Observe before testing anything.

### Camera and scene
- [x] The flat plane is visible from an angled 3D perspective — not flat-on, not top-down
- [x] Depth is clearly visible — you can see the plane receding into the distance
- [x] The simplex noise animation is running — hills and valleys moving

### Axis gizmo
- [x] Three colored lines visible extending from the center of the scene
- [x] One axis is warm coral/red, one is soft teal, one is muted purple
- [x] Small arrowheads visible at the tips of each axis
- [x] X, Y, Z letter labels visible near the arrowhead tips
- [x] Press the 'a' key — all axis lines disappear
- [x] Press 'a' again — they reappear
- [x] The Axis Lines toggle in lil-gui also works and stays in sync with the key

### Preserved Phase 7 behavior
- [x] Click and drag on the plane — deformation appears correctly
- [x] All GUI sliders (Noise Scale, Noise Speed, Deformation Strength, Falloff Radius, Decay, Color Hue) still work
- [x] Splash page appears on load. ? button reopens it. Escape closes it.
- [x] Mode toggle (Mouse/Webcam) still works
- [x] No red console errors

### Phase 8 notes
- the axis colors do not seem very stylized, the line should be thinner and the letters for each axis seem like they stick out too much
- the entire shape is not visible within the camera upon opening the app

Iteration 2 of Phase 8
- when stretching a deformation too far, the middle starts to sink when it should still be extending the original deformation

Iteration 3 of Phase 8
- stretching a deformation too far still results in the middle sinking

Iteration 4 of Phase 8 
- deformation stretch issue resolved

Approval message: "Phase 8 approved. Begin Phase 9."

---

## Phase 9 Human Review — Deformation architecture migration

The app should look and feel identical to Phase 7/8 for the flat plane. This phase is a behind-the-scenes change. The key question is: does sculpting feel the same?

### Deformation feel
- [x] Click and drag on the flat plane — deformation appears at cursor position
- [x] The deformation shape is smooth — Gaussian falloff, not sharp edges
- [x] Decay=0 leaves marks permanently
- [x] Set Decay to 0.5 — marks fade over a few seconds (not instantly)
- [x] Click 5 separate spots — all 5 marks visible simultaneously
- [x] Webcam Mode pinch still sculpts the plane correctly

### Technical verification
- [x] Open DevTools Console — zero red errors during sculpting
- [x] Check that the src/ folder does NOT contain pingpong.js
- [x] Check that src/shaders/ does NOT contain deform.vert or deform.frag

### Performance
- [x] FPS above 55 during active sculpting

### Phase 9 notes
- deformations are way too large
- stretch not working

Iterration 2 of Phase 9
- deformations are now too small

Iteration 3 of Phase 9 
- stretch no longer works

Iteration 4 of Phase 9
- stretch works again
- deformation size looks good

Approval message: "Phase 9 approved. Begin Phase 10."

---

## Phase 10 Human Review — Object spawner

### Object switching
- [x] The lil-gui panel has an Object dropdown
- [x] Selecting each object shows a fade-in transition
- [x] All 7 objects appear: Plane, Sphere, Cube, Torus, Torus Knot, Icosahedron, Particles
- [x] Switching objects clears all deformation — new object starts clean
- [x] Zero console errors when switching through all 7 objects

### Deformation on each object
Test click-drag sculpting on each:
- [x] Plane — smooth Gaussian bump, same as before
- [x] Sphere — smooth bump on the sphere surface, no faceting
- [x] Cube — visible deformation on the face clicked
- [x] Torus — visible bump on the ring surface
- [x] Torus Knot — visible deformation on the knotted shape
- [x] Icosahedron — smooth deformation, no harsh polygon edges
- [x] Particles — particles visibly displaced in a cloud near the click point

### Quality and feel
- [x] Deformation on the Sphere feels natural — the bump reads as 3D
- [x] Switching objects preserves your current GUI slider values
- [x] FPS stays above 50 while sculpting the Icosahedron

### Phase 10 notes
- cube faces are not connected and move individually, the noise on the surfaces causes each one to move individually
- one console error
- sphere and icosahedron look the same
- plane deformation fps drops below 100 while all other shapes maintain 180+ fps

Iteration 2 of Phase 10
- cube edges still overlap, edge welding issue not resolved
- icosahedron deformation messed up and choppy, still looks like a sphere
- console error still exists

Iteration 3 of Phase 10
- console error is the only thing left

Iteration 4 of Phase 10
- errors fixed
- icosahedron works properly and is distinct now
- cube edges resolved but noise is no longer visible on the cube surface
- mesh fps for deformation up to 120 fps

Iteration 5 of Phase 10
- need to add slider for increasing/decreasing the size of the object
- add functionality so that dragging an axis in a direction (y axis up or down, etc) stretches the object in that direction, should work the same with gestures and pinching the axis
- fps for plane drops to 104 fps now when using both hands for deformation

Iteration 6 of Phase 10
- changing scale should not reset all of the stretch actions that have modified the object
- the axis sliders should always be longer than thobject so they are always accessible, they should be a fixed distance away from each edge so as the edge gets stretched, the slider grows to maintain the distance from the object

Iteration 7 of Phase 10
- need a hand gesture for controlling the object scale without needing a slider
- when interacting with the y axis slider on the plane object, as the axis is dragged upward, the noise scale and speed increase as well as the deformation becomes taller as the slider is raised

Iteration 8 of Phase 10
- when doing the 2-hand pinch for adjusting scale, if one hand passes over a slider while 2 hand pinch is active then the axis overides it and now you are stretching based only on one slider instead of still adjusting scale

Iteration 9 of Phase 10
- already approved starting phase 11 but need to fix regressions
- when deforming surface with either one hand pinch or both simultaneously, the axis sliders get selected

Approval message: "Phase 10 approved. Begin Phase 11."

---

## Phase 11 Human Review — Mouse camera controls

### Zoom
- [x] Hold Ctrl and scroll up — camera zooms in smoothly
- [x] Hold Ctrl and scroll down — camera zooms out smoothly
- [x] Zoom stops at a close limit — does not clip through objects
- [x] Zoom stops at a far limit — does not fly away to infinity
- [x] Scrolling WITHOUT Ctrl does nothing (no page scroll, no zoom)

### Orbit
- [x] Right-click drag on empty black space (no mesh) — camera orbits
- [x] Dragging left orbits the camera leftward around the scene
- [x] Dragging upward pitches the camera to look more from above
- [x] The object stays centered in the viewport during all orbit angles
- [x] Camera does NOT flip upside down when orbiting all the way up

### Stretch vs orbit disambiguation
- [x] Right-click drag directly ON a mesh — stretch effect activates, camera does NOT orbit
- [x] Right-click drag on EMPTY space — camera orbits, no stretch effect

### Sculpting after camera movement
- [x] Zoom in. Then click-drag sculpt. Deformation appears at cursor position.
- [x] Orbit to a new angle. Then click-drag sculpt. Deformation appears correctly.

### Feel
- [x] Orbit speed feels natural — not too fast, not too slow
- [x] Zoom feels proportional to scroll input
- [x] No jank or jumping during orbit

### Phase 11 notes
- the stretch functionality creates a valley when stretched too far

Iteration 2 of Phase 11
- stetch valley might be getting created based off of the amount of time that the left click is held, it should take the current height and stretch based off of that

Iteration 3 of Phase 11
- stretching too far causes the stretch to not be retained, the stretch breaks and becomes 2 separate deformations

Iteration 4 of Phase 11
- stretch is fixed

Approval message: "Phase 11 approved. Begin Phase 12."

---

## Phase 12 Human Review — Gesture camera controls

Switch to Webcam Mode before testing. Keep hands clearly visible to webcam.

### Gesture visual feedback
- [x] Make a closed fist — a coral/red filled circle appears at your palm on the landmark canvas
- [x] Open hand flat — a teal ring (unfilled) appears at your palm
- [x] Pinch gesture — the existing sphere indicator shows, fist indicator does NOT show simultaneously

### Fist zoom
- [x] Hold a closed fist — camera zooms in continuously while held (changed to 2 hand pinch)
- [x] Open your fist — zoom stops immediately (changed to 2 hand pinch)
- [x] Pinch with one hand while making fist with other — sculpting happens, camera does NOT zoom
- [x] Zoom in indicator "+" visible while fist is held (removed)

### Fist-to-palm zoom out
- [x] Make a fist then open to full palm — camera jumps outward once (changed to 2 hand pinch)
- [x] Holding the palm open does not continue zooming — it was one-shot
- [x] Zoom out indicator "−" briefly visible after the transition (removed)

### Two-hand orbit
- [x] Hold both hands open and move both to the right — camera orbits right
- [x] Move both hands upward — camera pitches upward
- [x] Move hands in opposite directions — camera does NOT orbit
- [x] Briefly flash hands open for just a moment — no orbit (gate prevents it)
- [x] Orbit arc/indicator visible on landmark canvas during two-hand orbit (removed)

### Sculpting after gestures
- [x] Zoom in with fist. Then pinch-sculpt. Deformation at correct position. (changed to 2 hand pinch)
- [x] Orbit with two hands. Then sculpt. Marks visible from new angle.

### Feel
- [x] Gesture transitions feel natural — switching between sculpt and camera gestures is smooth
- [x] No accidental camera moves while trying to sculpt
- [x] FPS stays above 50 during active gesturing

### Phase 12 notes
- 2 fists registers as 2 handed pinch for scale adjustment
- zoom out gesture doesn't work
- as soon as hands appear, the camera orbit starts happening making it feel way too sensitive
- camera movement speed is too fast
- even when palms are not fully open, camera orbit is happening
- zoom in gesture doesn't work
- no plus sign or minus sign indicators show
- no red/coral filled ring appears when fist closed
- sometimes closed fist is registered as a pinch and causes deformation to start when not intended
- need a way to trigger camera mode with a hand gesture

Iteration 2 of Phase 12
- zoom out not working
- camera mode indicator text is mirrored
- camera mode activation should be 3 seconds and once active, camera controls should stay active until one hand becomes a fist and the other is open
- zoom in doesn't work but coral/red circle appears when fist is closed, indicator is incosistent
- maybe find a way to make hand tracking more accurate? maybe if I give a prerecorded video of my hands to analyze?
- when pinching to deform surface, teal ring is popping up
- no zoom or zoom out indicators visible
- coral ring popping up on top knuckles for both hands occassionally

Iteration 3 of Phase 12
- zoom in works
- zoom out out happens way too fast
- no indicator
- zoom out is still inconsistent
- exit camera mode should be 2 fists for 2 seconds
- shorten activate camera mode to 2 seconds of open palms on both hands
- camera orbit with 2 open palms should move ever so slightly faster so hands don't have to travel as far

Iteration 4 of Phase 12
- zoom out is not working as a gesture/not being recognized
- even if a full fist is not formed, curling fingers halfway is being registered as 2 fists
- when trying to zoom out, zooming in happens too
- camera orbit should be slightly quicker

Iteration 5 of Phase 12
- changed camera controls in camera mode for zoom to function the same as 2-handed pinch for scale while in editing mode
- now none of the camera controls work
- camera mode can be activated but the two hands for the camera orbit no longer works
- 2-hand pinch in camera mode triggers deformations instead of being locked to camera mode and adjusting zoom
- can no longer exit camera mode with the 2 fists which should have been retained

Iteration 6 of Phase 12
- all camera gestures are still broken
- revert to behavior from iteration 4 of phase 12 so that the camera orbit hand gestures of 2 hands with open palms orbit the camera
- revert to behavior from iteration 4 of phase 12 so that forming 2 fists exits camera mode
- revert to behavior from iteration 4 of phase 12 so that closed fists are recognized with the red dot indicator
- make zoom in and zoom out behavior mimic the scaling behavior and gestures from edit mode 

Iteration 7 of Phase 12
- all camera gestures are still broken
- need to revert back to when all were working, maybe skip the pinch zoom techniques for now?

Iteration 8 of Phase 12
- entering and exiting camera mode now works
- closed fist is being detected correctly
- zoom out is not working but we will change that later
- one closed fist controls zooming in but we will change that later
- camera orbit is still not working so we need to get that restored before modifying the behavior of zooming in and out

Iteration 9 of Phase 12
- camera orbit gestures still not working, both open palms in camera mode moving to the same side should orbit the camera
- functionality was working since the first attempt of phase 12

Iteration 10 of Phase 12
- all previous functionality restored
- now need to migrate zoom in/out to work exactly like the scaling 2-hand pinch from edit mode
- 2 hands pinching should work exactly the same as edit mode but in camera mode instead of scaling, it should zoom in/out
- retain fist detection
- retain 2 hand open palm orbit
- retain 2 fist exit camera mode
- retain 2 open palm enter camera mode
- also need to make a backup of this version to revert to in case of emergency

Iteration 11 of Phase 12
- everything works as intended now
- only issue is when making a fist it still zooms in, fist should not zoom in but everything else is perfect

Iteration 12 of Phase 12
- everything for this phase is working perfectly
- decay slider is no longer working

Iteration 13 of Phase 12
-everything working

Approval message: "Phase 12 approved. Begin Phase 13."

---

## Phase 13 Human Review — Final polish and preserved behavior audit

This is the full end-to-end review. Go through everything carefully.

### Splash
- [x] Splash appears on load
- [x] Splash content describes: Mouse Mode orbit/zoom/stretch/sculpt, Webcam Mode gestures, A key, object switcher
- [x] Enter Gallery dismisses it. ? reopens it. Escape closes it.

### Mouse Mode — complete feature test
- [x] Click-drag sculpts on each of the 7 objects
- [x] Right-click on mesh = stretch on each object
- [x] Right-click on empty space = orbit on each object
- [x] Ctrl+scroll = zoom in/out from any object
- [x] No cross-contamination: stretch never accidentally orbits, orbit never accidentally stretches

### Webcam Mode — complete feature test
- [x] Pinch sculpts on each of the 7 objects
- [x] Two-hand pinch = stretch
- [x] Fist = zoom in (changed to 2 hand pinch)
- [x] Fist-to-palm = zoom out (changed to 2 hand pinch)
- [x] Two open palms same direction = orbit

### Axis gizmo
- [x] Visible by default on all objects
- [x] A key and GUI toggle both work in any mode

### GUI controls
- [x] All sliders work on all 7 objects
- [x] Object switcher works cleanly

### Overall feel
- [x] The app feels like a coherent 3D sculpting experience
- [x] Moving between gestures and modes feels natural
- [x] No rough edges — no crashes, no errors, no visual glitches

### Performance
- [x] Run for 5 minutes with active sculpting, object switching, and camera movement
- [x] FPS stays above 50 throughout
- [x] Memory has not grown dramatically

### Documentation
- [x] README.md covers all new features completely

### Final notes
- stretch on 3D objects/surfaces have the same valley forming in the middle, needs to stretch based on the height of the initial deformation
- readme needs to document phases 8-13 in the same way as phases 1-7 were documented in the original readme

Iteration 2 of Phase 13
- stretch still broken

Iteration 3 of Phase 13
- stretch still broken

Iteration 4 of Phase 13
- stretch still broken on 3d objects

Iteration 5 of Phase 13
- stretched deformations now disappear when trying to make a new one with decay set to 0
- new spikes get created in random areas of the object when stretching

Iteration 6 of Phase 13
- deformations still disappear when trying to make a new one with decay set to 0

Iteration 7 of Phase 13
- stretch still doesn't work but deformations are fixed

Iteration 13 of Phase 13
- stretch on plane is now separate from 3d stretch
- 3d stretch has exteremely low spots when deformations are stretched, might need to freeze the distance from the mesh and make the exact distance persistant for deformations made as part of the stretch

Iteration 14 of Phase 13
- now 3d stretch just doesn't even activate

Iteration 15 of Phase 13
- stretching now just grows the original deformation, it is now worse than before

Iteration 16 of Phase 13
- removed 3d stretch
- plane stretch works
- end phase 13

Approval message: "Phase 13 approved. Project complete."

---

## Phase 14 Human Review — Color system overhaul

### Surface color
- [x] Surface loads with a blue color — not black, not white
- [x] No "Color Hue" slider in the lil-gui panel
- [x] A "Color" row is visible with a colored swatch button

### Color picker
- [x] Clicking the swatch opens a floating panel below lil-gui on the right
- [x] Panel contains a large square saturation/brightness field
- [x] Panel contains a vertical hue rainbow bar to the right of the field
- [x] Two small preview boxes visible — left is "current", right is "new"
- [x] R, G, B numeric input fields visible in RGB mode
- [x] A CMYK toggle switches to C, M, Y, K inputs
- [x] A hex input field is always visible
- [x] Dragging in the saturation field updates the surface color in real time
- [x] Dragging the hue bar changes the surface hue in real time
- [x] Typing in R/G/B inputs updates the surface color
- [x] Typing a hex value updates the color
- [x] Clicking outside the picker closes it
- [x] The swatch button shows the currently selected color after closing

### Preserved behavior
- [x] All sculpting still works — deformation appears correctly
- [x] All other GUI sliders respond correctly
- [x] No console errors on load or during color picking
- [x] FPS above 50

### Phase 14 notes
- color row text and style is not consistent with the lil-gui panel
- yellow cmyk button valuee never changes from 0
- 1 console error

Iteration 2 of Phase 14
- gui changes, might make more sense to remove color row and put the color box to the right of the object picker in the same row
- pressing enter after choosing a color should close the color picker
- yellow now updates
- console error gone

Iteration 3 of Phase 14
- color box scale is off now, revert to previous size
- color box should be right aligned

Iteration 4 of Phase 14
- scale is still off but right align is good
- color box should be the same size as the input boxes that are also on the right just like every other row in the lil-gui panel

Iteration 5 of Phase 14
- now color box too long

Iteration 6 of Phase 14
- color box too short now

Iteration 7 of Phase 14
- phase complete

Realized after approving phase 14 that clicking the color button opens the shape picker

Approval message: "Phase 14 approved. Begin Phase 15."

---

## Phase 15 Human Review — Audio capture and band analysis

Have music playing on your computer before testing.

### Audio controls
- [x] "Audio Reactive" toggle visible in lil-gui
- [x] With Audio Reactive off: no Reactivity slider, no Start Audio button visible
- [x] Toggle Audio Reactive on: Reactivity slider, Start Audio button, and instructions text appear
- [x] Instructions text tells you to select "Entire Screen" and check "Share system audio"

### Audio capture
- [x] Click "Start Audio" — Chrome screen share dialog opens
- [x] Cancel the dialog — no crash, button stays "Start Audio"
- [x] Share Entire Screen with system audio checked — button becomes "Stop Audio"
- [x] Music playing on computer visibly affects the surface

### Audio reactivity feel
- [x] Bass hits cause the surface to become more complex (noise scale increases)
- [x] Midrange causes animation speed to change
- [x] Reactivity slider at 0 — surface stops responding to audio
- [x] Reactivity slider at max — even quiet audio causes dramatic response
- [x] Stop Audio — surface immediately reverts to slider-controlled noise

### Object behavior
- [x] Switch to Particles — particle cloud reacts more dramatically to bass than the sphere

### Performance and errors
- [x] FPS stays above 50 with audio active
- [x] No red console errors during audio session

### Phase 15 notes
- audio access is denied message showing up with no pop up for approval
- not able to test in this state

Iteration 2 of Phase 15
- color button works now
- clicking empty space between color and shape selector opens shape selector
- error when trying to start audio reactivity

Iteration 3 of Phase 15
- tested audio with the song skyfall by adele and when the piano starts, the object seems to be reacting extremely violently instead of a smooth reaction
- the particles and shape textures seem to be having seizures and hurt my eyes

Iteration 4 of Phase 15
- reaction still way too strong, no distinction betweeen various instruments or vocals

Iteration 5 of Phase 15
- reactions are still too strong
- needs to be smoother, mild stuttering during some parts of songs

Iteration 6 of Phase 15
- vocals are too reactive
- piano reaction is perfect
- can't tell what happens when the drums and other instruments are added

Iteration 7 of Phase 15
- color selector bottom gets cutoff while audio reactivity is enabled so might be a good idea to move the color selector somewhere else, minimize the modifier menu while color picker is open and expand when color picker is closed
- piano can maybe be slightly more reactive on objects that are not the plane, tested with song how cruel by sarah lola
- audio reactivity will sharply cutoff instead of fading out smoothly when vocals or other instruments get too quiet
- vocals once they hit a certain range will start being too reactive again
- vocals on particles are too reactive
- freakin out by dexter and the moon rocks, once the drums guitar and vocals all come in together, it doesn't seem to be reacting much on the particles

Iteration 8 of Phase 15
- switching audio outputs on the device messes up the auido reactivity and the site can no longer detect the system audio with the same settings as before
- need to make the arrows on the axis a bit thicker due to some times not being able to stretch the axis
- axis should not be interactable when hidden
- if possible, make all instruments more unique in how the object reacts

Iteration 9 of Phase 15
- in the attempt to make the instrument reactions more unique, it messed up what was good about the previous version
- revert only the audio reactive changes but keep the device change fixes and axis changes

Iteration 10 of Phase 15
- reworked entire audio reactive system: fft-to-vertical displacement
- reactivity works linearly which makes it so one side of the plane doesn't move unless the song has lots of energy in the highs
- 3d objects get straight up broken

Iteration 11 of Phase 15
- changed to radial fft mapping
- reactivity looks way better but the high hats arent really being visualized even using songs with heavy cymbal use, tested with I'm content by underoath

Iteration 12 of Phase 15
- inverted radial mapping and boosted highs for cymbals to be more visible
- cymbals still not very visible
- no noticable shimmer created by cymbals
- vocals and drums need to be boosted and should be most prominent, cymbals should be next most prominent, guitar and bass should still be very prominent
- deformations actions no longer work simultaneously
- sphere still breaks while audio reactive
- looks weird on torus and torus knot
- torus knot looks like a blob and loses its initial shape

Iteration 13 of Phase 15
- now the particles have a weird disconnect
- need to undo the changes to balance of all of the instruments
- gestures and deformations work again
- torus sides are split like a bagel
- torus knot still looks like a ball
- revert to previous audio reactive logic but keep deformation and gestures enabled
- still no shimmer

Iteration 14 of Phase 15
- audio reactivity not fully reverted
- now edit mode with gestures are capped, object can only be deformed so far, limit is new
- as the object scales up, the audio reactivity becomes harder to see so it needs to progressively scale up as the object scales up

Iteration 15 of Phase 15
- cannot change objects once audio reactivity is enabled
- guitar and vocals need to be more visible, tested with gwen - riffed by wilt
- removing the limit for how far an object can be deformed as messed with the way deformation strength is applied, too strong now despite values being unchanged from before
- the reactivity increasing with scale looks good but the scale also needs to be applied specifically to deformations

Iteration 16 of Phase 15
- sulpting limit is back
- deformation strength issue is fixed
- lower frequency guitars are not distinct and visible
- deformations made in sculpt mode still do not have reactivity
- vocals are still not distinct and visible

Iteration 17 of Phase 16
- pianos are not being visualized, tested with how cruel by sarah lola
- deformations made on the object are still not reacting to the audio
- there is a limit to how large/expanded deformations can become which needs to be removed

Iteration 18 of Phase 15
- piano still not visible
- deformations still not audio reactive
- deformation limit removed but deformation strength now too strong again with the same default values
- soft guitars not visible, tested with 6 by porchlight
- scale modifier for reactivity needs to be a bit smaller
- softer vocals not being picked up

Iteration 19 of Phase 15
- deformations still not audio reactive, could be caused because the range of instruments its supposed to react to are not prominent in the song, could be a good idea to uninvert or map various instruments to different depths of the object

Iteration 20 of Phase 15
- instrument mapping got changes but now all reacts together which I do not like, need to undo only the instrument mapping redesign

Iteration 21 of Phase 15
- mapping fixed
- now need to amplify the frequency range associated with the outer most parts of the object in order to see if it fixes deformations not being audio reactive

Iteration 22 of Phase 15
- made everything except the outermost part of the mesh that gets deformed way too reactive. the reactivity needs to be dialed back 25%

Iteration 23 of Phase 15
- outer edge needs to boosted a little bit more and the rest needs to be scaled down

Iteration 24 of Phase 15
- outer edge needs to boosted a little bit more and the rest needs to be scaled down
- piano not visible again

Iteration 25 of Phase 15
- need outer edge to be more reactive by 50% more
- piano in lower frequencies not visible still

Iteration 26 of Phase 15
- overall reactivity needs to be turned down
- frequency range of piano needs to be boosted by 15%
- outer edge still not reacting properly

Iteration 27 of Phase 15
- piano still not visible, boost range that instrument lives in
- boost all reactions by 5%

Iteration 28 of Phase 15
- piano not visible still, tested with how cruel by sarah lola

Iteration 29 of Phase 15
- piano not visible still, tested with how cruel by sarah lola

Iteration 30 of Phase 15
- piano not visible still, tested with how cruel by sarah lola

Iteration 31 of Phase 15
- piano not visible still, tested with how cruel by sarah lola

Iteration 32 of Phase 15
- need to move on but will come back to tune instruments

Approval message: "Phase 15 approved. Begin Phase 16."

---

## Phase 16 Human Review — High frequency shimmer

Have music with cymbals, hi-hats, or high-frequency content ready.

### Shimmer behavior
- [x] With audio off: no shimmer visible — surface looks identical to Phase 15
- [x] Start audio with high-frequency music: fine rapid ripple visible on surface
- [x] Shimmer feels like a texture layer — subtle, not dominating the surface
- [x] Shimmer looks especially good on the sphere and torus knot

### Particles
- [x] Switch to Particles with high-frequency audio — particle shimmer is more intense than on sphere

### Shimmer stops cleanly
- [x] Stop audio — shimmer disappears immediately
- [x] Toggle Audio Reactive off — shimmer disappears

### Performance
- [x] FPS stays above 50 with shimmer active
- [x] No console errors

### Phase 16 notes
- no shimmer
- console error

Iteration 2 of Phase 16
- no shimmer still

Iteration 3 of Phase 16
- shimmer still not visible so maybe its because the cymbal frequency range needs to be boosted

Iteration 4 of Phase 16
- shimmer is supposed to be slightly more variation on cymbal hits so it seems to work

Approval message: "Phase 16 approved. Begin Phase 17."

---

## Phase 17 Human Review — Gradient editor and color reactivity

### Gradient editor panel
- [x] With Audio Reactive off: no Color Reactive toggle visible
- [x] Enable Audio Reactive: Color Reactive toggle appears
- [x] Enable Color Reactive: gradient editor panel appears below lil-gui
- [x] Default gradient is full rainbow: red → orange → yellow → green → cyan → blue → violet
- [x] Gradient bar looks correct — smooth transitions between colors
- [x] Small square stop handles visible below the bar

### Stop interaction
- [x] Click a stop handle — color picker opens showing that stop's color
- [x] Change stop color — gradient bar redraws immediately
- [x] Drag a stop left or right — stop repositions, gradient redraws
- [x] Click empty area of gradient bar — new stop added at that position
- [x] Drag stop below bar — stop deleted, gradient redraws
- [x] Try to delete with only 2 stops — deletion prevented

### Midpoints
- [x] Diamond handles visible between each pair of stops
- [x] Drag a midpoint toward one stop — gradient easing shifts toward that stop

### Color reactivity
- [x] With music playing, surface color shifts through the gradient colors
- [x] Quiet audio = color near start of gradient (red)
- [x] Loud audio = color near end of gradient (violet)
- [x] Color transitions are smooth — no jarring frame jumps
- [x] Disable Color Reactive — surface returns to single swatch color

### Combined systems
- [x] Sculpting works with color reactive on
- [x] Shimmer works alongside color reactive
- [x] FPS stays above 50 with all audio features active
- [x] No console errors during 2-minute audio session

### Overall feel
- [x] The gradient editor feels intuitive — Photoshop-like behavior
- [x] Color reactivity adds a visual dimension that matches the music energy
- [x] The shimmer and color changes together feel cohesive

### Phase 17 notes
- full gradient bar not visible when fully expanded
- might be a good idea to move normal color picker to the left when opened and do the same with the gradient picker

Iteration 2 of Phase 17
- word gradient is covered by the interactable parts of the feature
- color selector covers the gradient picker and vice versa depending on the order they are opened

Iteration 3 of Phase 17
- color selector covers the gradient picker and vice versa depending on the order they are opened
- modification menu gets minimized when color selector is opened even though its not underneath anymore so it doesn't need to be minimized
- only one color selector should be open at a time, either gradient or color picker

Iteration 4 of Phase 17
- not all colors in the gradient are visible for all songs, songs havee to hit very specific ranges for instruments for all colors to appear, come up with strategies for making all visible
- new stop doesn't get added to the gradient when clicking the gradient bar
- sculpting doesn't work with audio reactive on
- 3 console warnings

Iteration 5 of Phase 17
- red and violet on default gradient are not visible still on the extreme ends of the gradient

Iteration 6 of Phase 17
- everything looks good and functional
- need to clean up, remove the dead code/unused code, and update the readme to include all the new features as a section called Phases 14-17 

Approval message: "Phase 17 approved. Audio reactivity feature complete."
