# GIA Gallery — Agentic Build Instructions
# Runtime: Amp infinite loop — this file is re-read at the start of every session

---

## SECTION 1 — MANDATORY FIRST STEPS (every session, no exceptions)

Before writing a single line of code or running any command:

1. Read this entire file (PROMPT.md) from top to bottom
2. Read PROGRESS.md — identify current phase, last known state, any BLOCKED or UNCERTAIN items
3. Read CHECKLIST.md — identify which items are PENDING for the current phase
4. Read TESTS.md — load the full test list for the current phase
5. Read HUMAN_REVIEW.md — understand what the human will verify after agent tests pass
6. Write your session opening statement (required every session — see format below)

### Session opening statement — required format

Write this at the start of every session response, filling in the real values:

```
SESSION START
Phase: [N] — [Phase Name]
Status from PROGRESS.md: [NOT STARTED | IN PROGRESS | AWAITING HUMAN APPROVAL | BLOCKED | COMPLETE]
First PENDING checklist item: [item ID and description, or NONE if awaiting approval]
Uncertainties requiring human input before proceeding: [list any, or NONE]
```

Do not begin any work until this statement is written.

If status is AWAITING HUMAN APPROVAL: write the session opening statement, then halt. Do not touch code.
If status is BLOCKED: write the session opening statement, describe the block, halt. Do not work around it.
If status is NOT STARTED: begin Phase 1 after writing the opening statement.

---

## SECTION 2 — HONESTY AND ANTI-FAKING RULES

These rules exist because this prompt runs in an infinite Amp loop. A single faked result poisons every subsequent session.

### The core honesty rule

**Never report a test as PASS unless you have concrete evidence it passed.**

Concrete evidence means one of:
- You ran the code and observed the specific expected output described in the test
- You read the source file and confirmed the exact pattern described in the code verification test
- You ran a command and got the exact output the test specifies

Concrete evidence does NOT mean:
- "The code looks correct so it should work"
- "I implemented it correctly so the test must pass"
- "This is how it's supposed to work"
- "I believe this is passing based on my implementation"

### What to do when you cannot run the browser

Amp runs in a terminal environment. Many tests in TESTS.md require observing a running browser. You cannot observe the browser directly.

For every behavioral test (any test that says "Action: observe..." or "Expected: visually..."):
- Do NOT mark it PASS
- Do NOT mark it PASS based on code inspection
- Mark it: `[NEEDS HUMAN VERIFICATION]` with a note explaining what you implemented and what the human should observe
- Write a summary in PROGRESS.md under "Tests requiring human verification" listing every such test and what to look for

For code verification tests (any test that says "Code verification" in the expected result):
- These CAN be verified by reading source files
- Mark them PASS only after actually reading the file and confirming the pattern

### What to do when a test fails

Report it honestly. Do not:
- Adjust the test threshold to make it pass
- Rephrase what "passing" means
- Mark it PASS and add a note that it "mostly works"
- Skip it and come back later
- Mark it as a "known limitation" without human approval

Do:
- Report the exact failure: test ID, what you expected, what actually happened
- Enter the debug loop (Section 7)
- Fix the root cause (Section 3)
- Re-run the test after fixing
- If still failing after 3 debug attempts: mark BLOCKED and halt

### The test count rule

Every session that runs tests must report EXACT counts in PROGRESS.md:
- Tests run: [exact number]
- Tests PASS (verified): [exact number]
- Tests NEEDS HUMAN VERIFICATION: [exact number]
- Tests FAIL: [exact number]
- Tests BLOCKED: [exact number]

These numbers must add up to the total test count for the phase. If they don't add up, something was skipped. Find it.

### Self-check before reporting phase complete

Before writing STATUS: AWAITING HUMAN APPROVAL, run this check:

```
1. Can I point to concrete evidence for every test I marked PASS?
2. Did I run the actual code for every non-code-verification test?
3. Are there any tests I skipped, deferred, or marked PASS without evidence?
4. Did I report every NEEDS HUMAN VERIFICATION test explicitly?
5. Did I report every deviation from PROMPT.md in PROGRESS.md?
```

If the answer to question 3 is yes for any test: go back and either verify it properly or mark it honestly.

---

## SECTION 3 — ROOT CAUSE DEBUGGING RULES

These rules prevent the most common failure pattern in agentic loops: patching symptoms instead of fixing causes, which creates compounding problems across sessions.

### The root cause rule

**Fix the actual problem. Never patch around it.**

A patch is any change that makes a test pass without fixing the underlying issue. Patches are forbidden because:
- They create hidden bugs that surface later
- They make the codebase harder to understand
- They break other things when the system evolves
- They leave the real problem unfixed, guaranteeing it will reappear

### How to identify a patch vs a real fix

Ask yourself: "If I remove this change, does the problem come back?"
- Yes → you fixed a symptom, not the cause. Keep digging.
- No → you changed something unrelated. Revert and start over.

Ask yourself: "Does this change address why the problem occurred?"
- No → it's a patch. Find the why.

### Examples of patches that are forbidden

```
FORBIDDEN: Adding a conditional to hide a visual artifact instead of fixing the shader math
FORBIDDEN: Catching an error and returning a default value instead of fixing why the error occurs  
FORBIDDEN: Increasing a timeout to avoid a race condition instead of fixing the race condition
FORBIDDEN: Lowering a test threshold so the performance test passes instead of fixing the perf issue
FORBIDDEN: Adding a !isNaN() guard instead of fixing why NaN is being produced
FORBIDDEN: Using try/catch to silently swallow errors from the render loop
FORBIDDEN: Hardcoding a value to make one specific test pass
FORBIDDEN: Disabling a test because it's hard to pass
```

### The five whys — required for every failing test

Before making any change to fix a failing test, answer these questions in your response:

```
WHY 1: What is the observable symptom? (exact)
WHY 2: What code is responsible for producing that symptom?
WHY 3: Why is that code producing the wrong result?
WHY 4: Why does that wrong result cause the symptom?
WHY 5: What is the actual root cause — the thing that, if fixed, makes the symptom impossible?
```

The fix must address WHY 5. If your proposed fix addresses WHY 1, WHY 2, WHY 3, or WHY 4 but not WHY 5, it is a patch and must not be applied.

### Compounding problem detection

At the start of debugging any test, check: "Is this problem caused by a fix I applied to a previous test?"

If yes: the previous fix was itself a patch. You must:
1. Revert the previous fix
2. Re-run the test it was supposed to fix
3. Find the real root cause for that original problem
4. Fix the root cause
5. Verify both tests pass with the real fix

Do not build on top of patches. Every layer of patches makes the real problem harder to find.

### Architecture decisions vs bugs

If fixing a bug requires changing the architecture (restructuring how modules communicate, changing the render loop order, changing how state is passed between systems), that is not a patch — that is a real fix. Do it.

If you are unsure whether a change is a real fix or a patch, this falls under the decision gate (Section 4). Ask the human before applying it.

---

## SECTION 4 — DECISION GATE (ask before acting)

This section defines when the agent must stop and ask the human before making a change. This prevents the agent from making consequential decisions unilaterally in an infinite loop where mistakes compound across sessions.

### When to stop and ask — mandatory

You MUST stop, write your question to PROGRESS.md under "QUESTION FOR HUMAN", and halt (do not make the change) in any of these situations:

**Architecture questions:**
- You want to change the structure of any existing module (merge files, split files, change what a module is responsible for)
- You want to change the render loop order
- You want to change how two modules communicate (change what data is passed, change who owns the state)
- You want to add a new dependency not in the stack specification
- You want to change a pinned package version for any reason

**Spec ambiguity:**
- The spec describes what to build but two reasonable implementations would produce different visible behavior
- You are unsure which of two approaches better matches the intended user experience
- The spec says to do X but doing X causes a problem with Y that the spec doesn't address
- You cannot tell from the spec whether something should be implemented one way or another

**Trade-off decisions:**
- Fixing a bug requires accepting a trade-off (e.g. fixing one visual issue causes a minor performance cost)
- Two requirements in the spec appear to conflict with each other
- The correct fix would change behavior the human may have intentionally specified

**Uncertainty about user intent:**
- You are unsure what the intended visual result should look like
- You are unsure whether a behavior is a bug or a feature
- You are about to make a change to feel/polish/aesthetics that is subjective

### How to write a question for the human

In PROGRESS.md, under "QUESTION FOR HUMAN", write:

```
QUESTION FOR HUMAN — [date/session]

Situation: [1-2 sentences describing what you are trying to do]

The decision: [exactly what you need to decide]

Option A: [describe the first approach and its trade-offs]
Option B: [describe the second approach and its trade-offs]

My lean: [which option you think is better and why — be honest, not neutral]

Blocked on: [what you cannot do until this is answered]
```

Then halt. Do not implement either option. Do not implement Option A "temporarily" while waiting. Do not guess.

### When you do NOT need to ask

You do not need to ask for decisions that are:
- Fully specified in PROMPT.md with an exact implementation
- Pure bug fixes where the correct behavior is obvious from the spec
- Code organization within a single module that doesn't change any API
- Choosing between two implementations that produce identical observable results

If you are unsure whether something requires asking: ask. The cost of asking unnecessarily is low. The cost of making the wrong architectural decision unilaterally in an infinite loop is high.

### After asking — what happens

The human will answer with a specific instruction. Read it carefully. If the answer is still ambiguous, ask a follow-up. Do not interpret a partial answer as permission to proceed with your interpretation.

When you receive a clear answer: update PROGRESS.md to mark the question as ANSWERED with the decision, then proceed.

---

## SECTION 5 — PROJECT SPECIFICATION

### Overview

Build a browser-based interactive generative art system called "GIA Gallery" using Three.js and MediaPipe Hands.

The app has two interaction modes:
- Mouse Mode (default): click and drag to sculpt the surface; hold right-click simultaneously to stretch
- Webcam Mode (opt-in): pinch one hand to sculpt; pinch both hands and pull apart to stretch

On first load, a full-screen animated splash page explains both modes. The surface is already animating behind it. The user dismisses it to enter the gallery.

Deformations persist over time using a GPU ping-pong framebuffer. The webcam appears as a semi-transparent overlay in Webcam Mode.

### Stack — do not deviate without flagging in PROGRESS.md

- Vite (vanilla JS, no framework) — scaffold: `npm create vite@latest gia-gallery -- --template vanilla`
- Three.js r165 — install: `npm install three@0.165.0`
- MediaPipe Hands — CDN in index.html only, never via npm
- lil-gui — install: `npm install lil-gui`
- glsl-noise — install: `npm install glsl-noise`
- No TypeScript, no React, no webpack, no extra Vite plugins
- No vite.config.js changes unless BLOCKED and logged

Pinned versions are pinned for a reason. Do not silently upgrade or downgrade. Version conflict → BLOCKED → halt.

### File structure

```
gia-gallery/
  src/
    constants.js     — all numeric constants, exported, imported everywhere
    main.js          — entry point and render loop only
    scene.js         — Three.js scene, camera, renderer, resize handler
    surface.js       — plane geometry + ShaderMaterial + uniform management
    pingpong.js      — WebGLRenderTarget ping-pong system + deformation pass
    hands.js         — MediaPipe Hands setup, smoothing, pinch detection, handState export
    overlay.js       — webcam video element, permission handling, show/hide
    ui.js            — lil-gui panel and all 7 control bindings
    splash.js        — splash page DOM, fade in/out, dismiss, re-open
    interaction.js   — unified input layer: writes to handState[] from mouse or webcam
    modeToggle.js    — toggle button UI, mode state, webcam start/stop on switch
    shaders/
      surface.vert   — vertex shader: simplex noise + deformation texture sample
      surface.frag   — fragment shader: color from hue uniform
      deform.vert    — fullscreen quad passthrough vertex shader
      deform.frag    — deformation accumulation: ping-pong read + write
  index.html         — canvas element + MediaPipe CDN script tag only
  package.json       — Vite scaffold output
  vite.config.js     — untouched unless BLOCKED
  PROMPT.md / PROGRESS.md / CHECKLIST.md / TESTS.md / HUMAN_REVIEW.md
  README.md          — written in Phase 7
```

Do not create files not listed above without writing a QUESTION FOR HUMAN first.

### Constants file — create before any other source file

```javascript
// src/constants.js
export const PINCH_OPEN           = 0.07;
export const PINCH_CLOSED         = 0.03;
export const LERP_FACTOR          = 0.25;
export const PLANE_SEGMENTS       = 128;
export const DEFORM_TEXTURE_SIZE  = 512;
export const BASE_FALLOFF_RADIUS  = 0.15;
export const STRETCH_MULTIPLIER   = 1.5;
export const MAX_FALLOFF_RADIUS   = 0.6;
export const MIN_FALLOFF_RADIUS   = 0.05;
export const MIN_FPS_SUSTAINED    = 58;
export const MIN_FPS_INTERACTION  = 55;
export const MIN_FPS_STRESS       = 50;
export const MAX_MEMORY_GROWTH_MB = 10;
export const MAX_TRACKING_LAG_MS  = 100;
export const SPLASH_FADE_MS       = 400;
export const ERROR_FADE_MS        = 4000;
```

No magic numbers anywhere. If a number affects behavior, it is a constant. Change constants only here.

---

## SECTION 6 — BUILD PHASES

Execute phases in strict order. One phase at a time. Never combine phases.

---

### Phase 1 — Vite scaffold + Three.js surface

Goals:
- Vite dev server at localhost:5173, zero console errors
- Full-screen Three.js canvas, PlaneGeometry (128×128 segments)
- Custom ShaderMaterial with simplex noise vertex displacement
- Continuous animation via u_time uniform
- lil-gui: noise scale, noise speed, color hue
- 60fps sustained

Implementation notes:

Canvas and body:
- body: `margin:0; overflow:hidden`
- canvas: `position:fixed; top:0; left:0; width:100vw; height:100vh; display:block; z-index:0`
- Renderer: `setSize(window.innerWidth, window.innerHeight)` and `setPixelRatio(window.devicePixelRatio)`
- Resize listener in scene.js: update renderer size, update camera aspect, call `camera.updateProjectionMatrix()`

Geometry and camera:
- `new THREE.PlaneGeometry(10, 10, PLANE_SEGMENTS, PLANE_SEGMENTS)`
- `mesh.rotation.x = -Math.PI / 2` — horizontal, facing up
- `new THREE.PerspectiveCamera(60, aspect, 0.1, 100)` at `(0, 3, 0)` looking at `(0, 0, 0)`

Shaders — these exact patterns:
- `import vertSrc from './shaders/surface.vert?raw'`
- `import noiseGlsl from 'glsl-noise/simplex/3d.glsl?raw'`
- `const fullVert = noiseGlsl + '\n' + vertSrc`
- Every frame: `uniforms.u_time.value = clock.getElapsedTime()`
- Displacement: `vec3 displaced = position + normal * snoise(vec3(position.xz * u_noiseScale + u_time * u_noiseSpeed, 0.0)) * 0.3;`

lil-gui:
- `import GUI from 'lil-gui'`
- Init in ui.js, export `initUI(uniforms, params)`
- onChange directly mutates uniform: `.onChange(v => uniforms.u_noiseScale.value = v)`

Phase 1 completion:
1. Run all Phase 1 tests from TESTS.md — report each result honestly per Section 2
2. Write Phase 1 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL
4. Halt — do not touch code until human sends "Phase 1 approved. Begin Phase 2."

---

### Phase 2 — Ping-pong deformation buffer

Goals:
- Two WebGLRenderTargets swapped every frame
- Fullscreen quad deformation pass
- Main vertex shader reads deformation texture
- Mouse-click test input (removed before Phase 3)
- Decay control
- Zero CPU vertex reads

RenderTarget — use exactly this, no substitutions:
```javascript
const makeRT = () => new THREE.WebGLRenderTarget(DEFORM_TEXTURE_SIZE, DEFORM_TEXTURE_SIZE, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,   // NOT UnsignedByteType — values must exceed 0-1 range
  depthBuffer: false,
  stencilBuffer: false
});
let RTa = makeRT();  // write target
let RTb = makeRT();  // read target (previous frame)
```

Ping-pong rules (order is critical):
1. Set `deformUniforms.u_prevDeformation.value = RTb.texture` (before render)
2. `renderer.setRenderTarget(RTa); renderer.render(deformScene, deformCamera)`
3. `[RTa, RTb] = [RTb, RTa]` (immediately after render, not before)
4. `surfaceUniforms.u_deformationTexture.value = RTb.texture` (after swap, RTb is now the written frame)

Fullscreen quad:
- `deformScene = new THREE.Scene()`
- `deformCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)`
- Quad: `new THREE.PlaneGeometry(2, 2)` — must be 2×2, covers full clip space

Mouse test input (temporary — verify removed before Phase 3):
- mousedown → compute UV: `{x: e.clientX/window.innerWidth, y: 1-(e.clientY/window.innerHeight)}`
- Set `u_pinchPositions[0]` = UV, `u_pinchStrengths[0]` = 1.0
- mouseup → `u_pinchStrengths[0]` = 0.0
- Before Phase 3: search for `mousedown` and `mouseup` listeners, confirm they are deleted

Deform.frag core formula:
```glsl
float prev    = texture(u_prevDeformation, vUv).r;
float decayed = prev * (1.0 - u_decay);
float d       = distance(vUv, u_pinchPositions[0]);
float falloff = exp(-d * d / (u_falloffRadius * u_falloffRadius));
float impulse = falloff * u_pinchStrengths[0] * u_deformStrength;
gl_FragColor  = vec4(clamp(decayed + impulse, 0.0, 1.0), 0.0, 0.0, 1.0);
```

Phase 2 completion: run all Phase 2 tests → write summary → STATUS: AWAITING HUMAN APPROVAL → halt.

---

### Phase 3 — Webcam overlay + MediaPipe bootstrap

Goals:
- getUserMedia with graceful denial handling
- Video overlay: full-screen, 0.18 opacity, mirrored, pointer-events none
- MediaPipe tracking visible on debug canvas
- Surface animates regardless of webcam state
- Debug canvas is temporary — removed in Phase 6

MediaPipe CDN — add to index.html `<head>` BEFORE any other script:
```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
```
Never install @mediapipe/hands via npm.

Webcam init — export from overlay.js, returns boolean:
```javascript
export async function initWebcam() {
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' }
    });
    video.srcObject = stream;
    await video.play();
    return true;
  } catch (e) {
    if (stream) stream.getTracks().forEach(t => t.stop()); // release any partial stream
    if (e instanceof DOMException) {
      showPermissionError();
      return false;
    }
    throw e; // unexpected errors bubble up — do not swallow
  }
}
```

Permission error — a visible DOM element, not console.log:
```javascript
function showPermissionError() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'color:white;font-family:sans-serif;font-size:18px;text-align:center;z-index:10;' +
    'background:rgba(0,0,0,0.75);padding:24px;border-radius:8px;';
  el.textContent = 'Camera access required. Allow camera in browser settings and reload.';
  document.body.appendChild(el);
}
```

Video CSS — applied in JavaScript:
```javascript
Object.assign(video.style, {
  position: 'fixed', top: '0', left: '0',
  width: '100vw', height: '100vh',
  opacity: '0.18', transform: 'scaleX(-1)',
  pointerEvents: 'none', zIndex: '1', objectFit: 'cover'
});
```

MediaPipe init:
```javascript
const hands = new Hands({
  locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({ maxNumHands:2, modelComplexity:1, minDetectionConfidence:0.7, minTrackingConfidence:0.5 });
hands.onResults(onHandResults); // register BEFORE first send call
```

Frame feeding — fire and forget, gated on readyState:
```javascript
// inside render loop — NOT awaited
if (video.readyState >= 2) {
  hands.send({ image: video }).catch(e => console.error('MediaPipe error:', e));
}
```

Debug canvas:
```javascript
const debugCanvas = document.createElement('canvas');
Object.assign(debugCanvas.style, {
  position:'fixed', top:'0', left:'0',
  width:'100vw', height:'100vh',
  pointerEvents:'none', zIndex:'2', transform:'scaleX(-1)'
});
document.body.appendChild(debugCanvas);
```

Phase 3 completion: run all Phase 3 tests → write summary → STATUS: AWAITING HUMAN APPROVAL → halt.

---

### Phase 4 — Single-hand pinch + raycasting

Goals:
- Thumb tip (lm4) and index tip (lm8) per hand
- Analog pinch strength via smoothstep
- Lerp smoothing before raycasting
- UV from raycast hit → deform shader
- Sphere indicator: gray open, bright pinching

handState — export from hands.js:
```javascript
export const handState = [0, 1].map(() => ({
  active:        false,
  rawNDC:        new THREE.Vector2(),
  smoothedNDC:   new THREE.Vector2(),
  pinchStrength: 0,
  uv:            new THREE.Vector2(),
  hitPoint:      new THREE.Vector3()
}));
```

onHandResults — reset BOTH hands at the TOP of EVERY call:
```javascript
export function onHandResults(results) {
  // Reset first — this is what prevents ghost hands
  handState[0].active = false; handState[0].pinchStrength = 0;
  handState[1].active = false; handState[1].pinchStrength = 0;

  if (!results.multiHandLandmarks) return;

  results.multiHandLandmarks.forEach((landmarks, i) => {
    if (i >= 2) return;
    const lm4 = landmarks[4], lm8 = landmarks[8];
    const dist = Math.hypot(lm4.x - lm8.x, lm4.y - lm8.y);
    // Lower bound first: at PINCH_CLOSED → strength 1; at PINCH_OPEN → strength 0
    const strength = 1.0 - THREE.MathUtils.smoothstep(dist, PINCH_CLOSED, PINCH_OPEN);
    handState[i].rawNDC.set(
      1.0 - (lm8.x * 2.0),   // X flip: front camera is mirrored
      -(lm8.y * 2.0 - 1.0)   // Y flip: webcam top=0, NDC top=+1
    );
    handState[i].pinchStrength = strength;
    handState[i].active = true;
  });
}
```

Per-frame in render loop (webcam mode):
```javascript
handState.forEach((hand, i) => {
  if (!hand.active) {
    deformUniforms.u_pinchStrengths.value[i] = 0; // ALWAYS zero inactive hands
    spheres[i].visible = false;
    return;
  }
  hand.smoothedNDC.lerp(hand.rawNDC, LERP_FACTOR);
  raycaster.setFromCamera(hand.smoothedNDC, camera);
  const hits = raycaster.intersectObject(planeMesh);
  if (hits.length > 0) {
    hand.uv.copy(hits[0].uv);          // 0..1 UV for deform shader
    hand.hitPoint.copy(hits[0].point); // world space for sphere
    deformUniforms.u_pinchPositions.value[i].copy(hand.uv);
    deformUniforms.u_pinchStrengths.value[i] = hand.pinchStrength;
    spheres[i].position.copy(hand.hitPoint);
    spheres[i].visible = true;
    spheres[i].material.color.setHSL(
      hand.pinchStrength > 0.1 ? 0.5 : 0,
      hand.pinchStrength > 0.1 ? 1 : 0,
      hand.pinchStrength > 0.1 ? 1 : 0.5
    );
  } else {
    deformUniforms.u_pinchStrengths.value[i] = 0; // raycast miss — zero it
    spheres[i].visible = false;
  }
});
```

Sphere setup: `new THREE.SphereGeometry(0.05, 16, 16)` with `new THREE.MeshBasicMaterial()`. Add to mainScene. Default `visible = false`.

Phase 4 completion: run all Phase 4 tests → write summary → STATUS: AWAITING HUMAN APPROVAL → halt.

---

### Phase 5 — Two-hand simultaneous interaction

Goals:
- Both hands write deformation in one shader pass
- Stretch effect when both hands pinch
- Two sphere indicators
- All entry/exit edge cases handled

Deform.frag two-hand formula:
```glsl
float prev    = texture(u_prevDeformation, vUv).r;
float decayed = prev * (1.0 - u_decay);
float impulse = 0.0;
for (int i = 0; i < 2; i++) {
  if (u_pinchStrengths[i] > 0.0) {
    float d       = distance(vUv, u_pinchPositions[i]);
    float falloff = exp(-d * d / (u_falloffRadius * u_falloffRadius));
    impulse      += falloff * u_pinchStrengths[i] * u_deformStrength;
  }
}
gl_FragColor = vec4(clamp(decayed + impulse, 0.0, 1.0), 0.0, 0.0, 1.0);
```

Stretch computation — after hand processing, before deform uniforms:
```javascript
const h0 = handState[0].active && handState[0].pinchStrength > 0.1;
const h1 = handState[1].active && handState[1].pinchStrength > 0.1;
if (h0 && h1) {
  const d = handState[0].smoothedNDC.distanceTo(handState[1].smoothedNDC);
  const r = params.falloffRadius * (1.0 + d * STRETCH_MULTIPLIER);
  deformUniforms.u_falloffRadius.value = Math.min(Math.max(r, MIN_FALLOFF_RADIUS), MAX_FALLOFF_RADIUS);
} else {
  deformUniforms.u_falloffRadius.value = params.falloffRadius; // always restore when not stretching
}
```

Phase 5 completion: run all Phase 5 tests → write summary → STATUS: AWAITING HUMAN APPROVAL → halt.

---

### Phase 6 — Polish + performance audit

Goals: debug artifacts removed, 7 final GUI controls, GPU-only audit, stress tests, draft README.

Debug removal — do all before running tests:
- `debugCanvas.remove()` and delete all debugCtx drawing code
- Search src/ for `console.log` — remove every instance
- Search src/ for large commented-out blocks — remove every instance
- Search src/ for `TODO` — resolve or remove every instance

Final lil-gui controls — exactly these 7, in this order:
1. Noise Scale — 0.1 to 3.0, default 1.0, step 0.01
2. Noise Speed — 0.1 to 3.0, default 0.5, step 0.01
3. Deformation Strength — 0.0 to 1.0, default 0.3, step 0.01
4. Falloff Radius — 0.05 to 0.5, default 0.15, step 0.01
5. Decay — 0.0 to 1.0, default 0.0, step 0.01
6. Color Hue — 0.0 to 1.0, default 0.6, step 0.01
7. Webcam Opacity — 0.0 to 0.5, default 0.18, step 0.01

Webcam Opacity onChange: `.onChange(v => { if (video) video.style.opacity = String(v); })`

GPU audit — search for these in render loop. Any match = violation:
- `geometry.attributes.position.getX` / `.getY` / `.getZ`
- `.array[` on geometry buffers
- `position.array`

Phase 6 completion: run all Phase 6 tests → write summary → STATUS: AWAITING HUMAN APPROVAL → halt.

---

### Phase 7 — Splash page, mouse interaction, and webcam toggle

New files this phase: `src/splash.js`, `src/interaction.js`, `src/modeToggle.js`

Goals:
- Animated splash on load, surface animating behind it
- Mode toggle at bottom-center: Mouse (default) ↔ Webcam
- Mouse click-drag sculpts identically to webcam pinch
- Right-click held while dragging = stretch effect
- Mode switch is instant, preserves all deformation
- Help button (?) re-opens splash
- Final README

#### Splash page (src/splash.js)

Start render loop BEFORE creating splash. Surface must be animating when splash appears.

```javascript
export function showSplash(onDismiss) {
  const existing = document.getElementById('gia-splash');
  if (existing) existing.remove(); // prevent stacking — always check first

  const overlay = document.createElement('div');
  overlay.id = 'gia-splash';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:100;background:rgba(0,0,0,0.82);' +
    'display:flex;align-items:center;justify-content:center;' +
    'font-family:sans-serif;color:white;opacity:0;transition:opacity ' + SPLASH_FADE_MS + 'ms ease;';

  // content box — heading, instructions, enter button
  document.body.appendChild(overlay);
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });

  // keyboard listeners
  const onKey = e => {
    if (e.key === 'Escape') dismiss();
  };
  document.addEventListener('keydown', onKey);

  function dismiss() {
    document.removeEventListener('keydown', onKey);
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.remove(); if (onDismiss) onDismiss(); }, SPLASH_FADE_MS);
  }

  overlay.querySelector('#enter-btn').addEventListener('click', dismiss);
  return { dismiss };
}
```

Splash content — use exactly this text:
```
GIA Gallery

A living generative surface you can sculpt in real time.

Mouse Mode
  Click and drag to push and pull the surface.
  Hold right-click while dragging to stretch between two points.

Webcam Mode
  Pinch your index finger and thumb together to sculpt.
  Pinch with both hands and pull apart to stretch.

Adjust noise, color, and deformation in the panel (top-right).
Sculpted shapes persist until you refresh or raise the Decay slider.

[ Enter Gallery ]
```

? key listener — add in main.js after splash dismisses:
```javascript
document.addEventListener('keydown', e => {
  if (e.key === '?' && !document.getElementById('gia-splash')) showSplash();
});
```

#### Mode toggle (src/modeToggle.js)

```javascript
export const MODE = { MOUSE: 'mouse', WEBCAM: 'webcam' };
let currentMode = MODE.MOUSE; // default — app fully functional without webcam
let webcamInitialized = false;
```

Toggle element: `position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:50`

Mode switch — resetAllHandState() is ALWAYS the first action:
```javascript
async function switchMode(newMode, { initWebcam, initMediaPipe }) {
  resetAllHandState(); // first — always — before anything else

  if (newMode === MODE.WEBCAM) {
    if (!webcamInitialized) {
      const ok = await initWebcam();
      if (!ok) {
        updateToggleVisual(MODE.MOUSE); // revert visual immediately
        currentMode = MODE.MOUSE;
        showInlineError('Camera access denied. Using mouse mode.');
        return;
      }
      initMediaPipe();
      webcamInitialized = true;
    }
    video.style.display = 'block';
    webcamActive = true;
    detachMouseListeners(canvas);
    currentMode = MODE.WEBCAM;

  } else {
    webcamActive = false;
    video.style.display = 'none';
    attachMouseListeners(canvas);
    currentMode = MODE.MOUSE;
  }
  updateToggleVisual(currentMode);
}
```

Inline error — appears below toggle, fades after ERROR_FADE_MS:
```javascript
function showInlineError(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);' +
    'color:rgba(255,120,120,1);font-family:sans-serif;font-size:12px;z-index:50;opacity:1;' +
    'transition:opacity 0.5s ease;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; }, ERROR_FADE_MS - 500);
  setTimeout(() => el.remove(), ERROR_FADE_MS);
}
```

#### Mouse interaction (src/interaction.js)

Mouse coordinates — NO X flip. Mouse is not mirrored. This is different from webcam.
```javascript
function mouseToNDC(clientX, clientY) {
  return new THREE.Vector2(
    (clientX / window.innerWidth) * 2.0 - 1.0,    // no 1.0- flip
    -((clientY / window.innerHeight) * 2.0 - 1.0)  // Y inversion only
  );
}
```

Mouse state:
```javascript
let leftDown = false, rightDown = false;
let rawMouseNDC    = new THREE.Vector2();
let rawRightNDC    = new THREE.Vector2();   // fixed at right-click press point
let smoothMouseNDC = new THREE.Vector2();
```

Listeners — named functions, stored for removal on mode switch:
```javascript
function onMouseDown(e) {
  if (e.button === 0) { leftDown = true; rawMouseNDC.copy(mouseToNDC(e.clientX, e.clientY)); }
  if (e.button === 2) { rightDown = true; rawRightNDC.copy(mouseToNDC(e.clientX, e.clientY)); }
  canvas.style.cursor = leftDown ? 'grabbing' : 'crosshair';
}
function onMouseMove(e) {
  if (leftDown) rawMouseNDC.copy(mouseToNDC(e.clientX, e.clientY));
  indicator.style.left = e.clientX + 'px'; indicator.style.top = e.clientY + 'px';
}
function onMouseUp(e) {
  if (e.button === 0) leftDown = false;
  if (e.button === 2) rightDown = false;
  canvas.style.cursor = leftDown ? 'grabbing' : 'crosshair';
}
function onMouseLeave() { leftDown = false; rightDown = false; canvas.style.cursor = 'crosshair'; }
function onContextMenu(e) { e.preventDefault(); }

export function attachMouseListeners(canvas) {
  canvas.addEventListener('mousedown',   onMouseDown);
  canvas.addEventListener('mousemove',   onMouseMove);
  canvas.addEventListener('mouseup',     onMouseUp);
  canvas.addEventListener('mouseleave',  onMouseLeave);
  canvas.addEventListener('contextmenu', onContextMenu);
  canvas.style.cursor = 'crosshair';
}
export function detachMouseListeners(canvas) {
  canvas.removeEventListener('mousedown',   onMouseDown);
  canvas.removeEventListener('mousemove',   onMouseMove);
  canvas.removeEventListener('mouseup',     onMouseUp);
  canvas.removeEventListener('mouseleave',  onMouseLeave);
  canvas.removeEventListener('contextmenu', onContextMenu);
  canvas.style.cursor = 'default';
}
```

Per-frame update — called from render loop in Mouse Mode only:
```javascript
export function updateMouseInput(camera, planeMesh, raycaster) {
  if (!leftDown) { resetAllHandState(); return; }
  smoothMouseNDC.lerp(rawMouseNDC, LERP_FACTOR);
  raycaster.setFromCamera(smoothMouseNDC, camera);
  const hits = raycaster.intersectObject(planeMesh);
  if (hits.length > 0) {
    handState[0].active = true; handState[0].pinchStrength = 1.0;
    handState[0].uv.copy(hits[0].uv); handState[0].hitPoint.copy(hits[0].point);
  } else {
    handState[0].active = false; handState[0].pinchStrength = 0;
  }
  if (rightDown) {
    raycaster.setFromCamera(rawRightNDC, camera); // fixed position — not smoothed, not updated on move
    const rhits = raycaster.intersectObject(planeMesh);
    if (rhits.length > 0) {
      handState[1].active = true; handState[1].pinchStrength = 1.0;
      handState[1].uv.copy(rhits[0].uv); handState[1].hitPoint.copy(rhits[0].point);
    }
  } else {
    handState[1].active = false; handState[1].pinchStrength = 0;
  }
}
```

Mouse indicator circle — DOM element, not Three.js:
```javascript
const indicator = document.createElement('div');
indicator.style.cssText = 'position:fixed;width:20px;height:20px;border-radius:50%;' +
  'border:1.5px solid rgba(255,255,255,0.7);pointer-events:none;z-index:3;' +
  'transform:translate(-50%,-50%);display:none;';
document.body.appendChild(indicator);
canvas.addEventListener('mousemove', () => { indicator.style.display = 'block'; });
canvas.addEventListener('mouseleave', () => { indicator.style.display = 'none'; });
```

#### Final render loop (authoritative — Phase 7 state)

```javascript
function loop() {
  requestAnimationFrame(loop);

  // 1. time
  surfaceUniforms.u_time.value = clock.getElapsedTime();

  // 2. input — exactly one branch runs per frame
  if (currentMode === MODE.WEBCAM && webcamActive && video.readyState >= 2) {
    hands.send({ image: video }).catch(e => console.error('MP:', e)); // fire and forget — NO await
  } else if (currentMode === MODE.MOUSE) {
    updateMouseInput(camera, planeMesh, raycaster); // already smoothed inside
  }

  // 3. webcam: smooth + raycast (mouse: already done in updateMouseInput)
  if (currentMode === MODE.WEBCAM) {
    handState.forEach((hand, i) => {
      if (!hand.active) {
        deformUniforms.u_pinchStrengths.value[i] = 0;
        spheres[i].visible = false;
        return;
      }
      hand.smoothedNDC.lerp(hand.rawNDC, LERP_FACTOR);
      raycaster.setFromCamera(hand.smoothedNDC, camera);
      const hits = raycaster.intersectObject(planeMesh);
      if (hits.length > 0) {
        hand.uv.copy(hits[0].uv);
        hand.hitPoint.copy(hits[0].point);
        deformUniforms.u_pinchPositions.value[i].copy(hand.uv);
        deformUniforms.u_pinchStrengths.value[i] = hand.pinchStrength;
        spheres[i].position.copy(hand.hitPoint);
        spheres[i].visible = true;
      } else {
        deformUniforms.u_pinchStrengths.value[i] = 0;
        spheres[i].visible = false;
      }
    });
  } else {
    // Mouse Mode: update sphere positions from handState[] (already populated by updateMouseInput)
    handState.forEach((hand, i) => {
      if (hand.active && hand.hitPoint) {
        spheres[i].position.copy(hand.hitPoint);
        spheres[i].visible = true;
        deformUniforms.u_pinchPositions.value[i].copy(hand.uv);
        deformUniforms.u_pinchStrengths.value[i] = hand.pinchStrength;
      } else {
        spheres[i].visible = false;
        deformUniforms.u_pinchStrengths.value[i] = 0;
      }
    });
  }

  // 4. stretch
  const h0 = handState[0].active && handState[0].pinchStrength > 0.1;
  const h1 = handState[1].active && handState[1].pinchStrength > 0.1;
  if (h0 && h1) {
    const d = handState[0].smoothedNDC.distanceTo(handState[1].smoothedNDC);
    const r = params.falloffRadius * (1.0 + d * STRETCH_MULTIPLIER);
    deformUniforms.u_falloffRadius.value = Math.min(Math.max(r, MIN_FALLOFF_RADIUS), MAX_FALLOFF_RADIUS);
  } else {
    deformUniforms.u_falloffRadius.value = params.falloffRadius;
  }

  // 5. deform uniforms — set before render
  deformUniforms.u_prevDeformation.value = RTb.texture;

  // 6. deformation pass
  renderer.setRenderTarget(RTa);
  renderer.render(deformScene, deformCamera);
  [RTa, RTb] = [RTb, RTa]; // swap immediately after

  // 7. surface reads written frame
  surfaceUniforms.u_deformationTexture.value = RTb.texture;

  // 8. main render
  renderer.setRenderTarget(null);
  renderer.render(mainScene, mainCamera);
}
```

Phase 7 completion: run all Phase 7 tests → write summary → STATUS: AWAITING HUMAN APPROVAL → halt.
After human approval: project is COMPLETE.

---

## SECTION 7 — COMPLETE SHADER UNIFORM REFERENCE

### surface.vert
```glsl
uniform float     u_time;
uniform float     u_noiseScale;
uniform float     u_noiseSpeed;
uniform sampler2D u_deformationTexture;
```

### surface.frag
```glsl
uniform float u_hue;
```

### deform.vert (passthrough only)
```glsl
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
```

### deform.frag
```glsl
uniform sampler2D u_prevDeformation;
uniform vec2      u_pinchPositions[2];
uniform float     u_pinchStrengths[2];
uniform float     u_falloffRadius;
uniform float     u_decay;
uniform float     u_deformStrength;
varying vec2      vUv;
```

Every JS uniform key must have a matching GLSL `uniform <type> <name>;` declaration. Missing declarations fail silently — no error, no effect.

---

## SECTION 8 — KNOWN FAILURE MODES

Consult this before starting any debug loop. Work through causes in listed order. Do not skip a cause without ruling it out. Apply Section 3 root cause rules to every fix.

### FM-01 — Deformation texture black / no response to input

Causes in order:
1. `type: THREE.FloatType` missing from RenderTarget — values clamp, accumulation silently breaks
2. Ping-pong swap before deformation render instead of immediately after
3. `u_deformationTexture` reads RTa instead of RTb after swap — wrong frame
4. `u_prevDeformation` not updated before deformation pass — reads stale or black texture
5. `u_pinchStrengths` never set to > 0 — log value inside render loop to confirm
6. Fullscreen quad is `PlaneGeometry(1,1)` instead of `(2,2)` — covers only quarter of texture
7. Deformation pass uses perspective camera instead of orthographic deform camera
8. Vertex shader reads deformation texture but does not add result to vertex position

Root cause check: does fixing each item eliminate the symptom entirely, or does a residual symptom remain? If residual symptom remains, keep going down the list.

### FM-02 — Shader compilation error or black static surface

Causes in order:
1. glsl-noise not inlined — GLSL has no import system. Must concatenate in JS before creating ShaderMaterial
2. Shader file imported without `?raw` — Vite treats it as JS, SyntaxError on load
3. Uniform in JS uniforms object but missing `uniform <type> <n>;` declaration in GLSL — silent, no error
4. Uniform type mismatch — `vec3` in GLSL, `float` set from JS
5. GLSL syntax error — read the line number in the console shader error message, fix that line
6. `texture2D()` used in WebGL2 context — use `texture()` instead

### FM-03 — MediaPipe not detecting hands

Causes in order:
1. `hands.send()` called before `video.readyState >= 2`
2. MediaPipe WASM 404 in Network tab — `locateFile` URL is wrong
3. MediaPipe script tag missing from index.html head
4. `hands.onResults()` not registered before first `hands.send()`
5. `video.play()` rejected — wrap in try/catch to confirm it resolves
6. `minDetectionConfidence` too high for current lighting — test at 0.5

### FM-04 — Webcam deformation in wrong screen location

Causes in order:
1. X flip missing: must be `1.0 - (lm8.x * 2.0)` not `(lm8.x * 2.0) - 1.0`
2. Y flip missing: must be `-(lm8.y * 2.0 - 1.0)`
3. UV passed to raycaster (needs NDC) or NDC passed to deform shader (needs UV)
4. Plane is vertical not horizontal — missing `mesh.rotation.x = -Math.PI / 2`
5. Camera off-axis — must be at `(0, 3, 0)` looking at `(0, 0, 0)`

### FM-05 — Mouse deformation in wrong screen location

Causes in order:
1. X flip incorrectly applied to mouse — mouse uses `(clientX/width)*2-1`, NO `1.0-` prefix
2. Canvas not `position:fixed; top:0; left:0` — clientX/Y offset from actual canvas position
3. Mouse lerp applied twice — once in `updateMouseInput`, once again in step 3 of render loop

### FM-06 — Webcam overlay misaligned

Causes in order:
1. Video not `position:fixed`
2. Video `objectFit` not `cover` — letterboxing shifts coordinates
3. Canvas not `position:fixed; top:0; left:0`
4. Z-index: canvas=0, video=1, debug canvas=2, toggle=50, splash=100
5. `devicePixelRatio` applied to normalized landmark coordinates — do not apply

### FM-07 — FPS below threshold

Causes in order:
1. `hands.send()` awaited in render loop — must be fire-and-forget
2. `DEFORM_TEXTURE_SIZE` above 512
3. `PLANE_SEGMENTS` above 128
4. New THREE objects allocated inside render loop — all allocations go in init
5. More than two `renderer.render()` calls per frame

### FM-08 — Pinch does not trigger

Causes in order:
1. smoothstep argument order wrong — lower bound (PINCH_CLOSED=0.03) must come first
   Verify: `THREE.MathUtils.smoothstep(0.03, 0.03, 0.07)` = 1, `smoothstep(0.07, 0.03, 0.07)` = 0
2. `u_pinchStrengths` never set — log value in render loop
3. Raycast misses every frame — log `hits.length`
4. `u_pinchPositions` updated but bound to wrong uniform object (not the deform shader's)

### FM-09 — Ghost hands persist

Both of these must be present. Neither alone is sufficient:
1. Reset at TOP of every `onHandResults` call: `handState[i].active = false; handState[i].pinchStrength = 0;`
2. In render loop for inactive hands: `u_pinchStrengths[i] = 0; spheres[i].visible = false;`

### FM-10 — Stretch artifacts (NaN / Infinity / full-mesh deformation)

Causes in order:
1. Stretch gate missing — must check `h0 && h1` before computing
2. No floor clamp — `Math.max(r, MIN_FALLOFF_RADIUS)`
3. No ceiling clamp — `Math.min(r, MAX_FALLOFF_RADIUS)`
4. `params.falloffRadius` not restored in else branch

### FM-11 — Vite import / module errors

Causes in order:
1. Shader imported without `?raw`
2. MediaPipe installed via npm instead of CDN script tag
3. Three.js import wrong — must be `import * as THREE from 'three'`
4. glsl-noise path wrong — `'glsl-noise/simplex/3d.glsl?raw'`
5. `type="module"` missing from main script tag in index.html

### FM-12 — Splash blocks render loop

Surface static until splash dismissed.
Root cause: render loop started inside the splash dismiss callback.
Fix: `requestAnimationFrame(loop)` in main.js BEFORE `showSplash()`. The splash is pure DOM.

### FM-13 — Mode switch ghost inputs

Spheres or deformation persist from previous mode after switching.
Root cause: `resetAllHandState()` not called on switch.
Fix: `resetAllHandState()` is the FIRST line inside every mode switch handler.

### FM-14 — Right-click context menu appears

Root cause: `contextmenu` listener not attached.
Fix: `canvas.addEventListener('contextmenu', e => e.preventDefault())` added in `attachMouseListeners`.

### FM-15 — Splash stacks

Root cause: `showSplash()` does not check for existing splash.
Fix: First two lines of `showSplash()` must be: `const x = document.getElementById('gia-splash'); if(x) x.remove();`

### FM-16 — Webcam stream in use after denial

Root cause: Stream acquired before exception thrown, not released.
Fix: `let stream = null;` before try block. In catch: `if (stream) stream.getTracks().forEach(t => t.stop());`

---

## SECTION 9 — DEBUG LOOP PROTOCOL

When any test fails, follow this exactly. Do not improvise.

```
STEP 1 — Report the exact failure before touching anything
  Write in your response:
  - Test ID
  - What you expected
  - What actually happened
  - Exact console error if one exists
  - Which FM in Section 8 matches this symptom

STEP 2 — Apply the Five Whys (Section 3)
  Answer WHY 1 through WHY 5 in your response before proposing any fix.
  The fix must address WHY 5.

STEP 3 — Check for prior patches
  Ask: "Could this failure be caused by a fix I applied to a previous test?"
  If yes: revert the prior fix first. Re-run both tests. Find the real root cause.

STEP 4 — Form ONE hypothesis
  "I believe the root cause is X because Y, which means the correct fix is Z."
  Z must address WHY 5.

STEP 5 — Make ONE change
  Change only what addresses the root cause.
  Do not touch anything else. Do not clean up. Do not refactor.

STEP 6 — Re-run the failing test AND any tests affected by the change
  PASS on all → mark PASS, log fix in PROGRESS.md, move to next test
  FAIL (same symptom) → hypothesis was wrong. Write: "H[N] ruled out: [why]". Go to STEP 4.
  FAIL (new symptom) → change broke something. Revert entirely. Log both symptoms. Go to STEP 4.
  Any previously-passing test now FAILS → the fix was a patch. Revert. The root cause is deeper.

STEP 7 — After 3 failed hypotheses: BLOCKED
  Write to PROGRESS.md under "Blocked items":
  - Test ID and exact symptom
  - H1: what you tried, what you observed, why you ruled it out
  - H2: same
  - H3: same
  - Current state of the code
  Write a QUESTION FOR HUMAN if you have a hypothesis that requires human input.
  Halt. Do not proceed. Do not workaround.
```

---

## SECTION 10 — AGENT FAILURE MODE CATALOGUE

These are failure modes specific to agent behavior in an infinite loop — not code bugs.

### AFM-01 — Faking test results

Definition: Marking a test PASS without concrete evidence it passed.
This is the most dangerous failure mode in an infinite loop. A single faked PASS becomes the assumed baseline for all subsequent sessions.

Detection: Before marking any test PASS, ask: "What specific thing did I observe or read that proves this passed?"
If the answer involves "I believe" or "the code looks like" or "it should work" — it is faked.

Prevention: See Section 2 (Honesty and Anti-Faking Rules) in full.

### AFM-02 — Patching symptoms instead of fixing root causes

Definition: Making a change that makes a test pass without fixing the underlying problem.
Detection: Apply the Five Whys. If your fix addresses WHY 1-4 but not WHY 5, it is a patch.
Prevention: See Section 3 (Root Cause Debugging Rules) in full.

### AFM-03 — Making decisions without asking

Definition: Making an architectural, spec-ambiguous, or trade-off decision without writing a QUESTION FOR HUMAN.
Detection: "I wasn't sure which approach to use, so I picked one."
Prevention: See Section 4 (Decision Gate). When uncertain: always ask.

### AFM-04 — Multiple simultaneous changes

Definition: Changing more than one thing per debug iteration.
Prevention: One change per hypothesis. If tempted to change two things at once, it means you have two hypotheses — pick one, test it, then consider the other.

### AFM-05 — Proceeding without human approval

Definition: Beginning the next phase before receiving "Phase N approved. Begin Phase N+1."
STATUS: AWAITING HUMAN APPROVAL = no code changes, no planning, no setup work. Complete stop.

### AFM-06 — Proceeding after a BLOCKED item

Definition: Working around a blocked test, skipping it, deferring it, or continuing to the next test while it is still blocked.
A BLOCKED item stops all forward progress. Write the entry. Halt. Wait.

### AFM-07 — Silently deviating from the spec

Definition: Making any implementation choice that differs from PROMPT.md without writing it under "Deviations from PROMPT.md" in PROGRESS.md.
This includes: different default values, different libraries, extra features, different architecture, renaming things.
If you deviate for a valid reason, log it — the human decides if it's acceptable.

### AFM-08 — Building on top of broken foundations

Definition: Continuing to the next phase when the current phase has unresolved issues the human hasn't approved.
If the human approved a phase despite a noted concern, that concern is inherited into the next phase. Document it. Address it if it causes problems. Do not pretend it does not exist.

---

## SECTION 11 — PROGRESS.md FORMAT (mandatory template)

Every session that does any work must append to PROGRESS.md. Use exactly this format:

```
## Phase N — [Phase Name] — [YYYY-MM-DD] — Session [number]

Status: IN PROGRESS | AWAITING HUMAN APPROVAL | BLOCKED

### Work done this session
- [exact list of what was implemented, changed, or debugged]

### Test results
Tests run:                    [exact number]
Tests PASS (verified):        [exact number]
Tests NEEDS HUMAN VERIFY:     [exact number — these cannot be marked PASS by the agent]
Tests FAIL:                   [exact number]
Tests BLOCKED:                [exact number]
Total accounted for:          [must equal sum of above — must equal phase test count]

### Tests requiring human verification
[List every behavioral test with: test ID, what was implemented, what the human should observe]

### Deviations from PROMPT.md
[Each deviation with reason, or: None]

### Debug log
[TEST-ID]: WHY5=[root cause] | Fix=[what was changed] | Result=[PASS/FAIL/new symptom]
[or: None]

### Blocked items
[TEST-ID]: [symptom] | H1=[tried, observed, ruled out] | H2=[...] | H3=[...]
[or: None]

### Questions for human
[QUESTION-ID]: [Situation, decision, Option A, Option B, my lean, blocked on]
[or: None]

### Concerns for human review
[Anything to watch for in HUMAN_REVIEW.md]
[or: None]
```

After writing this entry: if status is AWAITING HUMAN APPROVAL or BLOCKED, halt and do not touch code.

---

## SECTION 12 — Z-INDEX MAP (reference for all phases)

```
0   — Three.js canvas
1   — webcam video overlay
2   — debug landmark canvas (removed in Phase 6)
3   — mouse indicator circle
50  — mode toggle button
50  — help (?) button
100 — splash overlay
```

Any new DOM element must be placed in this hierarchy. If placement is ambiguous, write a QUESTION FOR HUMAN.
---

## SECTION 13 — PHASES 8–13 OVERVIEW

The project is expanding with six new phases. Phases 1–7 are COMPLETE and must not be touched. All new phases build on top of the working Phase 7 codebase. Each phase has a single focused concern. Do not combine phases. Do not begin a later phase while an earlier one is awaiting human approval.

Updated phase map:
- Phase 1–7: COMPLETE
- Phase 8: 3D environment foundation — axis gizmo, camera repositioned
- Phase 9: Deformation architecture migration — vertex displacement replaces ping-pong UV
- Phase 10: Object spawner — 7 spawnable sculptable meshes
- Phase 11: Mouse camera controls — orbit and zoom in Mouse Mode
- Phase 12: Gesture camera controls — fist zoom, palm zoom-out, two-hand orbit
- Phase 13: Final polish and preserved behavior audit

New source files across phases 8–13:
```
src/axisgizmo.js        — Phase 8: axis gizmo
src/objectspawner.js    — Phase 10: mesh spawning and switching
src/cameracontrols.js   — Phase 11: spherical camera orbit/zoom
src/gesturecamera.js    — Phase 12: gesture-based camera control
```

Files deleted during phases 8–9 (after migration confirmed):
```
src/pingpong.js          — replaced by vertex displacement in Phase 9
src/shaders/deform.vert  — no longer needed after Phase 9
src/shaders/deform.frag  — no longer needed after Phase 9
```

---

## PHASE 8 — 3D environment foundation

### Goals
- Scene restructured to view a world-space origin from an angled orbiting camera
- Stylized XYZ axis gizmo at world origin, toggleable
- All Phase 1–7 behavior preserved — the flat plane still deforms, all controls work
- No new interaction systems in this phase — camera is fixed at its new position

### What changes from Phase 7
The current app has a fixed camera looking at a flat plane. Phase 8 repositions the camera to use a spherical coordinate system centered on the world origin. The flat plane mesh stays at the origin. Everything else (deformation, hand tracking, sculpting, splash, toggle) continues to work exactly as before.

### 8A — Camera repositioning

Move the camera to a spherical coordinate position. Store camera state as:
```javascript
// src/scene.js — add alongside existing camera setup
export let camTheta  = Math.PI / 5;   // horizontal angle around Y axis
export let camPhi    = Math.PI / 3;   // vertical angle from Y axis
export let camRadius = 5.0;           // distance from origin
```

Compute and apply camera position every frame in main.js:
```javascript
camera.position.set(
  camRadius * Math.sin(camPhi) * Math.sin(camTheta),
  camRadius * Math.cos(camPhi),
  camRadius * Math.sin(camPhi) * Math.cos(camTheta)
);
camera.lookAt(0, 0, 0);
```

Remove any hard-coded camera position that was set in scene.js init. The position is now computed every frame from the spherical coordinates.

Default starting position gives a clear angled view of the plane showing both depth and the 3D axes. The flat plane mesh stays at y=0, rotation.x = -Math.PI/2, centered at origin.

Camera constants — add to constants.js:
```javascript
export const CAM_THETA_DEFAULT  = Math.PI / 5;
export const CAM_PHI_DEFAULT    = Math.PI / 3;
export const CAM_RADIUS_DEFAULT = 5.0;
export const CAM_RADIUS_MIN     = 1.5;
export const CAM_RADIUS_MAX     = 20.0;
export const CAM_ORBIT_SPEED    = 0.005;
export const CAM_ZOOM_SPEED     = 0.5;
```

### 8B — Stylized XYZ axis gizmo

Create src/axisgizmo.js

Visual design:
- Three tube axes extending ±3 units from origin along each world axis
- Use CylinderGeometry tubes (radius 0.02) — NOT THREE.Line (linewidth>1 unreliable in WebGL)
- Colors: X = 0xFF6B6B (warm coral), Y = 0x4ECDC4 (soft teal), Z = 0x9B8EC4 (muted purple)
- Each positive end has a cone arrowhead: ConeGeometry(0.06, 0.15, 8)
- Each axis has a second wider tube (radius 0.04, opacity 0.12, same color) for a soft glow halo
- Billboarded text label (Sprite with canvas texture) at positive end tip: "X", "Y", "Z"
  - Labels always face the camera regardless of orbit angle
  - Label canvas: 64×64 white text on transparent background, font size 32px sans-serif
- All axis geometry grouped into a single Object3D named "axisGizmo"
- axisGizmo added to mainScene, NOT to the deform scene

Toggle:
```javascript
export function createAxisGizmo(scene) { ... returns axisGizmo }
export function setAxisVisible(axisGizmo, visible) {
  axisGizmo.visible = visible;
}
```

Keyboard toggle: press 'a' (lowercase) to toggle. Add listener in main.js:
```javascript
document.addEventListener('keydown', e => {
  if (e.key === 'a' && !document.getElementById('gia-splash')) {
    axisVisible = !axisVisible;
    setAxisVisible(axisGizmo, axisVisible);
    // sync GUI toggle
  }
});
```

GUI toggle: add to lil-gui panel in ui.js as a boolean:
```javascript
gui.add(params, 'showAxis').name('Axis Lines').onChange(v => {
  setAxisVisible(axisGizmo, v);
  axisVisible = v;
});
```

Default: visible on load.

Raycasting must IGNORE axis geometry. When computing mesh intersections for deformation, use raycaster.intersectObject(currentMesh) only — not intersectObjects on the full scene.

### 8C — Preserved behavior verification

After Phase 8, ALL of the following must work exactly as in Phase 7:
- Flat plane visible at origin, simplex noise animation running
- Mouse Mode: click-drag sculpts the flat plane
- Webcam Mode: pinch sculpts the flat plane
- Two-hand stretch works
- Decay, Deformation Strength, Falloff Radius sliders work
- Noise Scale, Noise Speed, Color Hue sliders work
- Splash page appears on load, can be re-opened with ?
- Mode toggle (Mouse/Webcam) works
- Hand tracking landmarks visible

### Phase 8 failure modes

FM-P8-01 — Sculpting stops working after camera repositioning
Symptom: Click or pinch produces no deformation after Phase 8 camera change.
Cause: Raycaster camera reference not updated. The raycaster must use the same camera
object that is used for rendering. If scene.js exports a camera that gets repositioned
in main.js, verify raycaster.setFromCamera() uses that same camera reference.

FM-P8-02 — Axis tubes visible in deformation pass
Symptom: Axis geometry appears in the deformation texture or causes visual artifacts.
Cause: Axis Object3D added to both mainScene and deformScene.
Fix: Axis geometry is added to mainScene ONLY. deformScene contains only the fullscreen quad.

FM-P8-03 — Axis labels don't face camera after orbit
Symptom: Label sprites appear as thin lines when viewed from the side.
Cause: Sprite objects automatically billboard in Three.js — if labels are not Sprites
but canvas meshes, they won't auto-rotate.
Fix: Use THREE.Sprite for labels, not PlaneGeometry with a canvas texture.

Phase 8 completion sequence:
1. Run all Phase 8 tests from TESTS.md
2. All tests PASS → write Phase 8 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 8 approved. Begin Phase 9."

---

## PHASE 9 — Deformation architecture migration

### Goals
- Replace the UV ping-pong WebGLRenderTarget deformation system with a vertex displacement DataTexture system
- Deformation must work identically on the flat plane as in Phase 7
- All non-deformation behavior preserved unchanged
- pingpong.js and deform.vert/deform.frag deleted after migration confirmed

### Why this phase exists
The ping-pong UV texture system only works on the flat plane because it maps deformation using UV coordinates (0..1 space of the texture). When applied to a sphere or cube, the UV mapping creates distorted, non-intuitive deformation. The vertex displacement system works in 3D world space and applies identically to any mesh geometry.

### 9A — DataTexture displacement system

The new system maintains a Float32Array of displacement values — one float per vertex. Each frame, active pinch impulses are accumulated per vertex in JavaScript. The result is uploaded to a DataTexture and sampled in the vertex shader.

DataTexture setup in a new export from surface.js (or objectspawner.js in Phase 10):
```javascript
export function createDisplacementSystem(geometry) {
  const vertCount = geometry.attributes.position.count;
  // Size texture to next power-of-2 side length that fits all vertices
  const side = Math.pow(2, Math.ceil(Math.log2(Math.sqrt(vertCount))));
  const data = new Float32Array(side * side); // initialized to 0
  const tex = new THREE.DataTexture(data, side, side, THREE.RedFormat, THREE.FloatType);
  tex.needsUpdate = true;
  return { data, tex, side, vertCount };
}
```

Impulse accumulation — called each frame for each active pinch:
```javascript
export function applyImpulse(hitPoint, strength, deformStrength, falloffRadius, geometry, dispSystem) {
  const pos = geometry.attributes.position;
  const { data, tex } = dispSystem;
  for (let i = 0; i < dispSystem.vertCount; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    // Transform vertex to world space using mesh matrixWorld
    // hitPoint is already in world space from raycaster
    const dx = vx - hitPoint.x, dy = vy - hitPoint.y, dz = vz - hitPoint.z;
    const d2 = dx*dx + dy*dy + dz*dz;
    const r2 = falloffRadius * falloffRadius;
    const falloff = Math.exp(-d2 / r2);
    data[i] += falloff * strength * deformStrength;
  }
  tex.needsUpdate = true;
}
```

IMPORTANT: vertex positions from geometry.attributes.position are in LOCAL mesh space. The hitPoint from the raycaster is in WORLD space. Before computing distance, transform each vertex to world space:
```javascript
const worldPos = new THREE.Vector3(vx, vy, vz).applyMatrix4(mesh.matrixWorld);
const dx = worldPos.x - hitPoint.x;
// etc.
```

Decay — applied each frame in the render loop:
```javascript
export function applyDecay(dispSystem, decayStep, decayAmount) {
  if (decayAmount === 0) return;
  const { data, tex, vertCount } = dispSystem;
  const factor = 1.0 - (decayAmount * decayStep);
  for (let i = 0; i < vertCount; i++) {
    data[i] *= factor;
    if (data[i] < 0.0005) data[i] = 0.0; // snap to zero
  }
  tex.needsUpdate = true;
}
```

Vertex shader update in surface.vert — replace the deformation texture read:
```glsl
uniform sampler2D u_displacementTex;
uniform float u_texSide;

// In main():
float vertIdx = float(gl_VertexID);
float u = (mod(vertIdx, u_texSide) + 0.5) / u_texSide;
float v = (floor(vertIdx / u_texSide) + 0.5) / u_texSide;
float disp = texture(u_displacementTex, vec2(u, v)).r;
vec3 displaced = position + normal * disp * 3.0;  // scale factor for visible displacement
```

The +0.5 offset centers the sample within each texel, avoiding edge interpolation artifacts.

### 9B — Migration steps

Execute in this exact order:
1. Add createDisplacementSystem(), applyImpulse(), applyDecay() to surface.js
2. In main.js, create a dispSystem for the current flat plane mesh
3. Replace all calls to deform shader uniforms (u_pinchPositions, u_pinchStrengths, u_falloffRadius, u_decay, u_deformStrength) with calls to applyImpulse() and applyDecay()
4. Update surface.vert to read from u_displacementTex instead of u_deformationTexture
5. Remove the deformation render target pass from the render loop (the renderer.setRenderTarget(RTa) block)
6. Verify flat plane deforms correctly — this is the regression test before deleting anything
7. Only after verification: delete src/pingpong.js, src/shaders/deform.vert, src/shaders/deform.frag
8. Remove all imports and references to pingpong.js
9. Run npm run build — must succeed with zero errors

### 9C — Performance note

The vertex loop in applyImpulse() runs on the CPU each frame per active pinch. For the flat plane (128×128 = 16384 vertices), this is acceptable at 60fps. For the Icosahedron in Phase 10 (~10000 vertices at subdivision 6), it is also acceptable. For high-density meshes above 50000 vertices, performance may degrade — this is expected and will be addressed in Phase 13 if needed.

### Phase 9 failure modes

FM-P9-01 — Deformation appears offset from cursor/pinch position
Symptom: Deformation appears but not under the cursor — systematically offset.
Cause: Vertex positions not transformed to world space before distance computation.
Fix: Apply mesh.matrixWorld to each vertex position before computing distance to hitPoint.

FM-P9-02 — Surface.vert samples wrong texel — displacement is scrambled
Symptom: Random vertices displaced instead of a smooth bump.
Cause: UV computation for DataTexture sample is wrong — off-by-one or missing +0.5 offset.
Fix: Use (mod(vertIdx, side) + 0.5) / side and (floor(vertIdx / side) + 0.5) / side.

FM-P9-03 — npm run build fails after deleting pingpong.js
Cause: Remaining import of pingpong.js in main.js or another file.
Fix: Search entire src/ for 'pingpong' — remove every import and reference.

FM-P9-04 — Decay not working after migration
Cause: applyDecay() not called in render loop, or u_decay uniform no longer connected.
Fix: Confirm applyDecay(dispSystem, deltaSeconds, params.decay) called every frame.
The decay amount comes from params.decay (the GUI slider value), not a uniform.

Phase 9 completion sequence:
1. Run all Phase 9 tests from TESTS.md
2. All tests PASS → write Phase 9 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 9 approved. Begin Phase 10."

---

## PHASE 10 — Object spawner

### Goals
- 7 spawnable sculptable objects selectable from lil-gui
- All objects deform using the Phase 9 vertex displacement system
- Switching objects clears deformation and rebuilds the displacement system
- Flat plane remains as default and behaves identically to Phase 7/9

### New file: src/objectspawner.js

Object definitions:
```javascript
export const OBJECTS = {
  PLANE:       'Plane',
  SPHERE:      'Sphere',
  CUBE:        'Cube',
  TORUS:       'Torus',
  TORUSKNOT:   'Torus Knot',
  ICOSAHEDRON: 'Icosahedron',
  PARTICLES:   'Particles',
};
```

Geometry specs — all high-subdivision for smooth deformation:
```javascript
case OBJECTS.PLANE:
  geo = new THREE.PlaneGeometry(4, 4, 128, 128);
  mesh.rotation.x = -Math.PI / 2;
  // stays at y=0, identical to existing flat plane
  break;
case OBJECTS.SPHERE:
  geo = new THREE.SphereGeometry(1.5, 96, 48);
  break;
case OBJECTS.CUBE:
  geo = new THREE.BoxGeometry(2.5, 2.5, 2.5, 40, 40, 40);
  break;
case OBJECTS.TORUS:
  geo = new THREE.TorusGeometry(1.2, 0.45, 48, 120);
  break;
case OBJECTS.TORUSKNOT:
  geo = new THREE.TorusKnotGeometry(1.0, 0.3, 180, 32);
  break;
case OBJECTS.ICOSAHEDRON:
  geo = new THREE.IcosahedronGeometry(1.5, 5);
  break;
case OBJECTS.PARTICLES:
  // handled separately — see particle notes below
  break;
```

All non-plane objects sit at origin (0,0,0) with no rotation.

Object switching:
```javascript
export function spawnObject(type, scene, currentMesh, dispSystem, shaderMaterial) {
  // 1. Remove old mesh from scene
  if (currentMesh) {
    scene.remove(currentMesh);
    currentMesh.geometry.dispose();
  }
  // 2. Create new geometry per spec above
  // 3. Create new mesh with existing shaderMaterial (same uniforms, same noise animation)
  // 4. Add to scene
  // 5. Rebuild displacement system for new vertex count
  dispSystem = createDisplacementSystem(newMesh.geometry);
  // 6. Reset data to all zeros (deformation cleared on switch)
  dispSystem.data.fill(0);
  // 7. Fade in: set mesh opacity 0, animate to 1 over 300ms
  return { mesh: newMesh, dispSystem };
}
```

Fade transition: use MeshBasicMaterial opacity or ShaderMaterial uniform u_opacity:
- Add u_opacity uniform to surface.frag, multiply final color alpha by u_opacity
- On spawn: set u_opacity to 0, lerp to 1 over 300ms in render loop
- After 300ms: remove the lerp, lock u_opacity at 1

Particle object:
- 8000 points in a sphere of radius 1.5 using BufferGeometry with random positions
- Use THREE.Points with PointsMaterial (size 0.03, color matches current hue)
- Deformation on particles: instead of displacing along normal (particles have no normals),
  displace along the radial direction from origin to particle position
- In applyImpulse for particles: direction = normalize(vertexPosition - origin)
  then data[i] += falloff * strength * deformStrength (same formula)
- In vertex shader: displaced = position + normalize(position) * disp * 2.0
- Simplex noise animation on particles: add noise-driven offset to each particle position
  in the vertex shader using position as the noise input (same as plane, different result)

Raycasting on particles:
- THREE.Points objects are not raycast-able by default — add THREE.Raycaster params:
  raycaster.params.Points = { threshold: 0.1 };
- On hit, use hits[0].point as the impulse center

GUI addition in ui.js:
```javascript
gui.add(params, 'object', Object.values(OBJECTS))
   .name('Object')
   .onChange(type => {
     const result = spawnObject(type, mainScene, currentMesh, dispSystem, surfaceMaterial);
     currentMesh = result.mesh;
     dispSystem = result.dispSystem;
   });
```

### Phase 10 failure modes

FM-P10-01 — Deformation on non-plane objects appears in wrong location
Cause: Vertex world space transform missing. See FM-P9-01.
Fix: Apply mesh.matrixWorld to vertex positions before distance computation.

FM-P10-02 — Switching objects causes WebGL error or black screen
Cause: geometry.dispose() called but material still references disposed geometry.
Fix: Dispose geometry only. Do not dispose the shared ShaderMaterial.

FM-P10-03 — Particle deformation has no visible effect
Cause: Particles using normalized(position) direction but position is (0,0,0) for some particles.
Fix: If a particle is at or near origin, skip displacement for that particle.

FM-P10-04 — Object switching loses GUI slider values
Cause: New mesh created with default uniform values instead of current params values.
Fix: After spawning new mesh, push all current params values into the new material uniforms.

Phase 10 completion sequence:
1. Run all Phase 10 tests from TESTS.md
2. All tests PASS → write Phase 10 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 10 approved. Begin Phase 11."

---

## PHASE 11 — Mouse camera controls

### Goals
- Right-click drag on EMPTY SPACE orbits the camera around the origin
- Right-click drag ON THE MESH still activates stretch (existing Phase 7 behavior)
- Ctrl + scroll wheel zooms in and out
- Camera always looks at origin
- All existing Mouse Mode sculpting behavior preserved

### Implementation in src/cameracontrols.js

Camera state (shared with scene.js, exported):
```javascript
// These are already initialized in Phase 8
// cameracontrols.js imports and mutates them
import { camTheta, camPhi, camRadius } from './scene.js';
// BUT — export setters so mutation works across module boundaries:
export function setCamTheta(v) { camTheta = v; }
export function setCamPhi(v)   { camPhi   = v; }
export function setCamRadius(v){ camRadius = v; }
```

Orbit state machine:
```javascript
let orbitActive = false;
let orbitStartX = 0, orbitStartY = 0;

function onMouseDown(e) {
  if (e.button !== 2) return;
  e.preventDefault();
  // Check if right-click landed on the mesh
  raycaster.setFromCamera(mouseToNDC(e.clientX, e.clientY), camera);
  const hits = raycaster.intersectObject(currentMesh);
  if (hits.length > 0) {
    // Hit the mesh — activate stretch (existing behavior, do nothing new here)
    return;
  }
  // Missed the mesh — activate orbit
  orbitActive = true;
  orbitStartX = e.clientX;
  orbitStartY = e.clientY;
}

function onMouseMove(e) {
  if (!orbitActive) return;
  const dx = e.clientX - orbitStartX;
  const dy = e.clientY - orbitStartY;
  orbitStartX = e.clientX;
  orbitStartY = e.clientY;
  camTheta -= dx * CAM_ORBIT_SPEED;
  // Clamp phi to prevent flipping over the poles
  camPhi = Math.max(0.1, Math.min(Math.PI - 0.1, camPhi + dy * CAM_ORBIT_SPEED));
}

function onMouseUp(e) {
  if (e.button === 2) orbitActive = false;
}

function onMouseLeave() {
  orbitActive = false;
}

function onWheel(e) {
  if (!e.ctrlKey) return; // only zoom when Ctrl is held
  e.preventDefault();
  const delta = e.deltaY > 0 ? CAM_ZOOM_SPEED : -CAM_ZOOM_SPEED;
  camRadius = Math.max(CAM_RADIUS_MIN, Math.min(CAM_RADIUS_MAX, camRadius + delta));
}
```

Attaching listeners:
- mousedown, mousemove, mouseup, mouseleave attach to the canvas element
- wheel attaches to the canvas element with { passive: false } so preventDefault() works
- These listeners are always active in Mouse Mode — they do not conflict with sculpt listeners
  because orbit only activates on right-click miss, and sculpt only activates on left-click

Interaction.js update — the right-click stretch logic must check whether orbit is active:
```javascript
function onMouseDown(e) {
  if (e.button === 2) {
    // Only activate stretch if right-click hit the mesh
    // If orbit activated in cameracontrols.js (missed mesh), do not activate stretch
    if (!orbitActive) {
      rightDown = true;
      rawRightNDC.copy(mouseToNDC(e.clientX, e.clientY));
    }
  }
}
```

Export orbitActive from cameracontrols.js so interaction.js can check it.

Camera update — in main.js render loop, step 1 becomes:
```javascript
// Update camera position from spherical coordinates
camera.position.set(
  camRadius * Math.sin(camPhi) * Math.sin(camTheta),
  camRadius * Math.cos(camPhi),
  camRadius * Math.sin(camPhi) * Math.cos(camTheta)
);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();
```

### Phase 11 failure modes

FM-P11-01 — Orbit and stretch activate simultaneously on right-click on mesh
Cause: Both systems listening to mousedown without coordinating.
Fix: The right-click hit test runs in cameracontrols.js first. If hit, set a flag
that interaction.js checks before activating stretch. Use a single exported boolean.

FM-P11-02 — Ctrl+scroll zooms browser instead of scene
Cause: wheel event not using preventDefault() or not attached with passive:false.
Fix: canvas.addEventListener('wheel', onWheel, { passive: false }) and e.preventDefault().

FM-P11-03 — Camera flips upside down when phi crosses 0 or PI
Cause: camPhi allowed to go below 0 or above PI.
Fix: camPhi = Math.max(0.1, Math.min(Math.PI - 0.1, camPhi + dy * speed))

FM-P11-04 — Sculpting works on plane but deformation appears at wrong angle after orbit
Cause: Raycaster using stale camera matrix. camera.updateProjectionMatrix() not called
after moving the camera each frame.
Fix: Call camera.updateProjectionMatrix() after updating camera.position and lookAt each frame.

Phase 11 completion sequence:
1. Run all Phase 11 tests from TESTS.md
2. All tests PASS → write Phase 11 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 11 approved. Begin Phase 12."

---

## PHASE 12 — Gesture camera controls

### Goals
- Closed fist = zoom in (continuous while held)
- Fist expanding to open palm = zoom out (one-shot, not continuous)
- Both open palms moving in the same direction = orbit camera
- All new gestures yield to pinch sculpting — if either hand is pinching, no camera gesture activates
- Webcam Mode only — these gestures do nothing in Mouse Mode

### New file: src/gesturecamera.js

Gesture detection helpers — add to src/hands.js and export:
```javascript
export function detectFist(landmarks) {
  // All four fingertips (8,12,16,20) close to wrist (0)
  const wrist = landmarks[0];
  return [8, 12, 16, 20].every(i => {
    const tip = landmarks[i];
    return Math.hypot(tip.x - wrist.x, tip.y - wrist.y) < 0.15;
  });
}

export function detectOpenPalm(landmarks) {
  // All four fingertips far from wrist
  const wrist = landmarks[0];
  return [8, 12, 16, 20].every(i => {
    const tip = landmarks[i];
    return Math.hypot(tip.x - wrist.x, tip.y - wrist.y) > 0.20;
  });
}
```

Export gesture state alongside handState in hands.js:
```javascript
export const gestureState = [0, 1].map(() => ({
  fist:      false,
  openPalm:  false,
  palmNDC:   new THREE.Vector2(),
  prevPalmNDC: new THREE.Vector2(),  // for velocity computation
  openPalmFrames: 0,                  // consecutive open-palm frame counter
  wasFist:   false,                   // for fist→palm transition detection
}));
```

Update gestureState in onHandResults (after existing handState update):
```javascript
results.multiHandLandmarks.forEach((landmarks, i) => {
  if (i >= 2) return;
  gestureState[i].wasFist    = gestureState[i].fist;
  gestureState[i].fist       = detectFist(landmarks);
  gestureState[i].openPalm   = detectOpenPalm(landmarks);
  gestureState[i].prevPalmNDC.copy(gestureState[i].palmNDC);
  // landmark 9 = middle of palm
  gestureState[i].palmNDC.set(
    1.0 - (landmarks[9].x * 2.0),
    -(landmarks[9].y * 2.0 - 1.0)
  );
  gestureState[i].openPalmFrames = gestureState[i].openPalm
    ? gestureState[i].openPalmFrames + 1
    : 0;
});
// Reset gesture state for inactive hands
if (results.multiHandLandmarks.length <= 1) {
  gestureState[1].fist = false;
  gestureState[1].openPalm = false;
  gestureState[1].openPalmFrames = 0;
}
if (results.multiHandLandmarks.length === 0) {
  gestureState[0].fist = false;
  gestureState[0].openPalm = false;
  gestureState[0].openPalmFrames = 0;
}
```

Gesture camera logic in src/gesturecamera.js — called from render loop in Webcam Mode:
```javascript
export function updateGestureCamera(gestureState, handState, deltaSeconds) {
  // Priority gate: if any hand is pinching, no camera gesture activates
  const anyPinching = handState[0].pinchStrength > 0.1 || handState[1].pinchStrength > 0.1;
  if (anyPinching) return;

  // Fist zoom in (continuous)
  const h0fist = gestureState[0].fist && gestureState[0].active;
  const h1fist = gestureState[1].fist && gestureState[1].active;
  if (h0fist || h1fist) {
    camRadius = Math.max(CAM_RADIUS_MIN, camRadius - CAM_ZOOM_SPEED * deltaSeconds * 30);
    return; // fist zoom takes priority over orbit
  }

  // Fist-to-palm zoom out (one-shot transition)
  const h0transition = gestureState[0].wasFist && gestureState[0].openPalm;
  const h1transition = gestureState[1].wasFist && gestureState[1].openPalm;
  if (h0transition || h1transition) {
    camRadius = Math.min(CAM_RADIUS_MAX, camRadius + CAM_ZOOM_SPEED * 3.0);
    // wasFist is already updated in onHandResults so this fires once per transition
    return;
  }

  // Two-hand orbit: both hands open palm, 5-frame gate, same-direction movement
  const h0palm = gestureState[0].openPalm && gestureState[0].openPalmFrames >= 5;
  const h1palm = gestureState[1].openPalm && gestureState[1].openPalmFrames >= 5;
  if (h0palm && h1palm) {
    const vel0x = gestureState[0].palmNDC.x - gestureState[0].prevPalmNDC.x;
    const vel0y = gestureState[0].palmNDC.y - gestureState[0].prevPalmNDC.y;
    const vel1x = gestureState[1].palmNDC.x - gestureState[1].prevPalmNDC.x;
    const vel1y = gestureState[1].palmNDC.y - gestureState[1].prevPalmNDC.y;
    // Dot product of velocity vectors — positive = same direction
    const dot = vel0x * vel1x + vel0y * vel1y;
    if (dot > 0.0) {
      const avgVelX = (vel0x + vel1x) * 0.5;
      const avgVelY = (vel0y + vel1y) * 0.5;
      camTheta -= avgVelX * CAM_ORBIT_SPEED * 80;
      camPhi = Math.max(0.1, Math.min(Math.PI - 0.1, camPhi + avgVelY * CAM_ORBIT_SPEED * 80));
    }
  }
}
```

Visual feedback on landmark canvas:
- Fist detected: draw filled circle at palmNDC position, color #FF6B6B, radius 14px
- Open palm detected: draw ring (arc, not filled) at palmNDC position, color #4ECDC4, radius 14px, lineWidth 2
- Zoom in active: draw "+" in top-right of canvas, white, font 20px, for the duration of the fist
- Zoom out triggered: draw "−" in top-right of canvas, white, for 500ms after the transition
- Two-hand orbit active: draw a dashed arc between the two palmNDC positions
  Use canvas.arc() from midpoint — approximate with bezier if arc math is complex

### Phase 12 failure modes

FM-P12-01 — Fist gesture triggers while pinching
Cause: Priority gate not applied. anyPinching check missing or checking wrong field.
Fix: Check handState[i].pinchStrength > 0.1 (not gestureState[i].fist) for the pinch gate.

FM-P12-02 — Zoom in is jittery — jumps in large increments
Cause: Zoom applied as a fixed step per frame without deltaSeconds scaling.
Fix: Multiply zoom step by deltaSeconds * 30 so it is frame-rate independent.

FM-P12-03 — Fist-to-palm zoom out fires repeatedly
Cause: wasFist not properly updated — fires every frame the palm is open after a fist.
Fix: wasFist is set to gestureState[i].fist at the START of onHandResults (before updating fist).
After the frame where fist→palm transition occurs, wasFist will be false next frame, so the
trigger only fires once.

FM-P12-04 — Two-hand orbit fires during normal two-hand sculpting
Cause: openPalmFrames gate not working — counter not resetting when palm closes.
Fix: openPalmFrames = gestureState[i].openPalm ? counter + 1 : 0 — reset to 0 when not open palm.

Phase 12 completion sequence:
1. Run all Phase 12 tests from TESTS.md
2. All tests PASS → write Phase 12 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 12 approved. Begin Phase 13."

---

## PHASE 13 — Final polish and preserved behavior audit

### Goals
- Verify every Phase 1–12 feature works together end-to-end
- Update splash page with new controls (camera, gestures, axis, object switcher)
- Update README.md with complete documentation
- Performance audit with all new systems active
- Clean up any console.log, commented code, debug artifacts introduced in phases 8–12

### 13A — Full preserved behavior audit

Run through this checklist in the browser before running Phase 13 tests:
- Splash appears on load, ? reopens it, Escape closes it
- Mouse Mode: click-drag sculpts current object correctly
- Mouse Mode: Ctrl+scroll zooms
- Mouse Mode: right-click drag on empty space orbits
- Mouse Mode: right-click on mesh stretches
- Webcam Mode: pinch sculpts
- Webcam Mode: two-hand stretch works
- Webcam Mode: fist zooms in, fist-to-palm zooms out, two-open-palms orbit
- All 7 objects spawn and deform
- All GUI sliders respond correctly
- Axis gizmo toggles with A key and GUI checkbox
- Mode toggle (Mouse/Webcam) works

### 13B — Splash page update

Update src/splash.js content to:
```
GIA Gallery

A living generative surface you can sculpt in real time.

─── Mouse Mode ───────────────────────────────
Click and drag on the object to sculpt.
Right-click drag on empty space to orbit the camera.
Hold right-click on the object while dragging to stretch.
Ctrl + scroll wheel to zoom in and out.

─── Webcam Mode ──────────────────────────────
Pinch to sculpt. Pinch both hands and pull apart to stretch.
Make a fist to zoom in. Open your fist to zoom out.
Move both open palms in the same direction to orbit.

─── Controls ─────────────────────────────────
Press A to toggle axis lines.
Use the panel (top-right) to switch objects, adjust noise,
color, deformation behavior, and decay.

Your sculpted shapes persist until you switch objects,
refresh, or raise the Decay slider.

                    [ Enter Gallery ]
```

### 13C — README update

Update README.md to include:
- All 6 GUI controls with descriptions (Webcam Opacity removed in Phase 6)
- Mouse Mode controls: click-drag, right-click drag orbit, right-click on mesh stretch, Ctrl+scroll zoom
- Webcam Mode controls: pinch, two-hand stretch, fist zoom in/out, two-palm orbit
- Keyboard shortcuts: A = toggle axis, ? = open instructions, Escape = close instructions
- All 7 spawnable objects listed
- Performance notes: Chrome recommended, webcam optional

### 13D — Code cleanup

Search all Phase 8–12 source files for:
- console.log — remove all
- TODO comments — resolve or remove
- Commented-out code blocks — remove
- Any debug-only overlays or test indicators not part of the final UX

### Phase 13 failure modes

FM-P13-01 — A feature that passed in an earlier phase now fails
This is a regression. Use the Five Whys (Section 3) to find the root cause.
Do not patch. Find what Phase 8–12 code broke the earlier feature.
Common causes: shared state mutation (camRadius, handState), module import cycles,
event listener double-registration after object switching.

FM-P13-02 — Performance below 50fps with all systems active
Check in this order:
1. applyImpulse() vertex loop — is it running every frame even when no pinch is active?
   Fix: gate the loop behind handState[i].pinchStrength > 0.01
2. DataTexture tex.needsUpdate = true — is it set every frame even without changes?
   Fix: only set needsUpdate = true when data actually changed
3. Both webcam and gesture processing active simultaneously — MediaPipe sends throttled?
   Fix: confirm single-in-flight guard still in place from Phase 3

Phase 13 completion sequence:
1. Run all Phase 13 tests from TESTS.md
2. All tests PASS → write Phase 13 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. After human approval: project is complete.

---

## SECTION 14 — PHASES 14–17 OVERVIEW

Four new phases adding audio reactivity and a custom color system. Phases 1–13 are COMPLETE and must not be touched. Each phase has a single focused concern and must be fully approved before the next begins.

Updated phase map:
- Phase 1–13: COMPLETE
- Phase 14: Color system overhaul — replace hue slider with custom color picker
- Phase 15: Audio capture and band analysis — noise driven by music
- Phase 16: High frequency shimmer — shader addition for treble response
- Phase 17: Gradient editor and color reactivity — colors driven by music

New source files across phases 14–17:
```
src/colorpicker.js     — Phase 14: custom RGB/CMYK color picker panel
src/gradienteditor.js  — Phase 17: gradient bar, stops, midpoint diamonds
src/audioreactivity.js — Phase 15: Web Audio API, getDisplayMedia, FFT bands
```

Z-index additions (append to Section 12):
```
200 — color picker panel
201 — gradient editor panel
```

---

## PHASE 14 — Color system overhaul

### Goals
- Replace the `u_hue` float uniform and hue slider with a `u_color` vec3 RGB uniform
- Build a custom floating color picker panel attached below lil-gui
- Single color mode only — no gradient yet
- All Phase 1–13 color behavior preserved (surface has a color, it responds to the color control)
- Zero audio code in this phase

### 14A — Shader uniform change

In `src/shaders/surface.frag`:
- Remove `uniform float u_hue;`
- Add `uniform vec3 u_color;` (RGB, each component 0.0–1.0)
- Remove all hue-to-RGB conversion math (the hsv2rgb or hue rotation function)
- Use `u_color` directly as the surface base color

In `src/surface.js` (or wherever the ShaderMaterial uniforms are defined):
- Remove `u_hue: { value: HUE_DEFAULT }` 
- Add `u_color: { value: new THREE.Color(0x4488ff) }` — default blue matching existing aesthetic

In `src/constants.js`:
- Remove `HUE_DEFAULT` if it exists
- Add `COLOR_DEFAULT_R = 0.267`, `COLOR_DEFAULT_G = 0.533`, `COLOR_DEFAULT_B = 1.0` (the default blue)

### 14B — Custom color picker: src/colorpicker.js

The color picker is a floating DOM panel. It is NOT part of lil-gui internals — it is a separate `<div>` appended to `document.body` and positioned absolutely to appear below the lil-gui panel.

Panel layout (top to bottom):
```
┌─────────────────────────────────────┐
│  [Saturation/Brightness Canvas]  [H]│  <- 240x240 sat/bright + 20px hue bar
│                                  [u]│
│                                  [e]│
│                                  [ ]│
│  [Current] [New]   ○ RGB  ○ CMYK   │  <- 40x40 previews + mode toggle
│  R: [___]  G: [___]  B: [___]      │  <- numeric inputs (RGB mode)
│  #[______hex______]                 │  <- hex input always visible
└─────────────────────────────────────┘
```

Saturation/brightness canvas (240×240px):
- Background: CSS gradient, hue-colored top-right corner fading to white at left and black at bottom
- Redrawn whenever hue changes
- Circle cursor (12px diameter) showing current S/B position
- Click or drag anywhere to pick saturation (X) and brightness (Y)

Hue bar (20px wide × 240px tall):
- Vertical rainbow gradient: red → yellow → green → cyan → blue → magenta → red
- Triangle cursor on left edge showing current hue
- Click or drag to pick hue

Preview boxes (40×40px each):
- Left box = "current" color (color when picker was opened, never changes while picker is open)
- Right box = "new" color (updates live as user adjusts)

Mode toggle:
- Two radio-style buttons: "RGB" and "CMYK"
- RGB mode: R (0–255), G (0–255), B (0–255) inputs
- CMYK mode: C (0–100), M (0–100), Y (0–100), K (0–100) inputs
- Switching modes recalculates and updates inputs without changing the color
- All inputs accept direct typing, update picker on change

Hex input:
- Always visible, 6-character hex value (no # prefix in input, display # as label)
- Updates live as color changes, can be typed into directly

Panel positioning:
- Positioned `fixed`, `right: 0`, below the lil-gui panel
- `z-index: 200`
- Opens when the color swatch button is clicked
- Closes when clicking outside the panel AND outside the swatch button
- Does not close when clicking inside the panel

Exports:
```javascript
export function openColorPicker(anchorElement, currentColor, onChange) { ... }
// anchorElement: the swatch button DOM element (for positioning)
// currentColor: { r, g, b } each 0..1
// onChange: callback({ r, g, b }) called every time color changes

export function closeColorPicker() { ... }
export function isColorPickerOpen() { ... }
```

### 14C — GUI changes: src/ui.js

Remove:
- The `Color Hue` slider (`gui.add(params, 'hue', ...)`)
- Any reference to `params.hue`

Add:
- A color swatch button control. lil-gui does not have a native button-with-swatch, so create it as a custom DOM element injected after the gui is built:
```javascript
// After gui is constructed, inject color swatch
const colorRow = document.createElement('div');
colorRow.className = 'gia-color-row';
colorRow.innerHTML = `
  <span class="gia-color-label">Color</span>
  <button id="gia-color-swatch" style="
    width: 40px; height: 20px;
    border: 1px solid #555;
    background: rgb(68, 136, 255);
    cursor: pointer;
    vertical-align: middle;
  "></button>
`;
gui.domElement.appendChild(colorRow);

document.getElementById('gia-color-swatch').addEventListener('click', () => {
  if (isColorPickerOpen()) {
    closeColorPicker();
  } else {
    openColorPicker(
      document.getElementById('gia-color-swatch'),
      currentColor,
      (newColor) => {
        currentColor = newColor;
        surfaceUniforms.u_color.value.setRGB(newColor.r, newColor.g, newColor.b);
        updateSwatchDisplay(newColor);
      }
    );
  }
});
```

`updateSwatchDisplay(color)` sets the button background to `rgb(r*255, g*255, b*255)`.

`currentColor` is a module-level variable in ui.js initialized to `{ r: COLOR_DEFAULT_R, g: COLOR_DEFAULT_G, b: COLOR_DEFAULT_B }`.

### 14D — Preserved behavior

After Phase 14:
- Surface still has a color that can be changed
- All other GUI controls unchanged
- All sculpting, camera, gesture, object switching still works
- No audio controls yet — those come in Phase 15
- `npm run build` succeeds

### Phase 14 failure modes

FM-P14-01 — Surface renders black or white after u_hue removal
Cause: surface.frag still references u_hue or the hue-to-RGB function after removal,
causing a shader compile error that falls back to default (black).
Fix: search surface.frag for every reference to hue and remove them all.
Confirm u_color is declared and used in the fragment shader output.

FM-P14-02 — Color picker opens in wrong position or off-screen
Cause: fixed positioning calculation not accounting for lil-gui panel height.
Fix: use `gui.domElement.getBoundingClientRect()` to get the panel bottom edge
and position the picker below it. Add `max-height: 80vh; overflow-y: auto` to
the picker panel so it never extends below the viewport.

FM-P14-03 — Color picker onChange fires but surface color does not update
Cause: surfaceUniforms.u_color reference not accessible from ui.js.
Fix: pass surfaceUniforms into the ui.js init function, or export a
`setColor(r, g, b)` function from surface.js that ui.js can call.

Phase 14 completion sequence:
1. Run all Phase 14 tests from TESTS.md
2. All tests PASS → write Phase 14 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 14 approved. Begin Phase 15."

---

## PHASE 15 — Audio capture and band analysis

### Goals
- Capture system audio via `getDisplayMedia({ audio: true, video: false })`
- Analyze frequency spectrum with Web Audio API AnalyserNode
- Map bass/mids/highs bands to `u_noiseScale` and `u_noiseSpeed` uniforms
- Add Audio Reactive toggle, Reactivity slider, Start/Stop Audio button to GUI
- When audio disabled: noise uniforms driven by sliders exactly as before
- No color reactivity yet, no shimmer yet — those are Phase 16 and 17

### 15A — src/audioreactivity.js

```javascript
import { AUDIO_FFT_SIZE, AUDIO_BASS_BINS, AUDIO_MID_BINS, AUDIO_HIGH_BINS } from './constants.js';

let audioContext = null;
let analyser = null;
let dataArray = null;
let sourceNode = null;
let stream = null;
let _active = false;

export async function startAudio() {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: false,
    });
  } catch (err) {
    // User cancelled or denied
    return { success: false, reason: 'denied' };
  }

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach(t => t.stop());
    return { success: false, reason: 'no_audio_track' };
  }

  audioContext = new AudioContext();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = AUDIO_FFT_SIZE;
  analyser.smoothingTimeConstant = 0.8;
  dataArray = new Uint8Array(analyser.frequencyBinCount);

  sourceNode = audioContext.createMediaStreamSource(stream);
  sourceNode.connect(analyser);
  // Do NOT connect to audioContext.destination — we do not want to hear output
  _active = true;

  // Stop when stream ends (user clicks "Stop sharing")
  stream.getAudioTracks()[0].addEventListener('ended', () => {
    stopAudio();
  });

  return { success: true };
}

export function stopAudio() {
  if (sourceNode)    { sourceNode.disconnect(); sourceNode = null; }
  if (analyser)      { analyser.disconnect();   analyser  = null; }
  if (audioContext)  { audioContext.close();     audioContext = null; }
  if (stream)        { stream.getTracks().forEach(t => t.stop()); stream = null; }
  dataArray = null;
  _active = false;
}

export function isAudioActive() { return _active; }

export function getAudioBands(sensitivity = 1.0) {
  if (!_active || !analyser) return { bass: 0, mids: 0, highs: 0 };
  analyser.getByteFrequencyData(dataArray);

  const avg = (lo, hi) => {
    let sum = 0;
    for (let i = lo; i <= hi; i++) sum += dataArray[i];
    return (sum / (hi - lo + 1)) / 255;
  };

  return {
    bass:  Math.min(1, avg(AUDIO_BASS_BINS[0],  AUDIO_BASS_BINS[1])  * sensitivity),
    mids:  Math.min(1, avg(AUDIO_MID_BINS[0],   AUDIO_MID_BINS[1])   * sensitivity),
    highs: Math.min(1, avg(AUDIO_HIGH_BINS[0],  AUDIO_HIGH_BINS[1])  * sensitivity),
  };
}
```

### 15B — Constants additions

Add to `src/constants.js`:
```javascript
export const AUDIO_FFT_SIZE              = 256;
export const AUDIO_SENSITIVITY_DEFAULT   = 1.0;
export const AUDIO_BASS_BINS             = [0,   8];
export const AUDIO_MID_BINS              = [9,  80];
export const AUDIO_HIGH_BINS             = [81, 120];
export const AUDIO_BASS_SCALE            = 3.0;
export const AUDIO_MID_SCALE             = 2.0;
export const PARTICLE_AUDIO_BOOST        = 2.5;
```

### 15C — main.js audio frame integration

In the render loop, after updating `elapsedTime` and before writing shader uniforms:

```javascript
if (params.audioReactive && isAudioActive()) {
  const { bass, mids, highs } = getAudioBands(params.audioSensitivity);
  const boost = (currentObjectType === OBJECTS.PARTICLES) ? PARTICLE_AUDIO_BOOST : 1.0;
  surfaceUniforms.u_noiseScale.value = bass  * AUDIO_BASS_SCALE * boost + 0.05;
  surfaceUniforms.u_noiseSpeed.value = mids  * AUDIO_MID_SCALE          + 0.02;
  // highs used in Phase 16
} else {
  // Normal slider-driven values — write params values to uniforms as before
  surfaceUniforms.u_noiseScale.value = params.noiseScale;
  surfaceUniforms.u_noiseSpeed.value = params.noiseSpeed;
}
```

Note: when audio is active, the Noise Scale and Noise Speed sliders still exist but their
values are overridden by the audio bands each frame. The sliders do not move — they show
the "fallback" values that will resume when audio is turned off.

### 15D — GUI additions

In `src/ui.js`, add below the color swatch row:

```javascript
// Audio Reactive toggle
gui.add(params, 'audioReactive').name('Audio Reactive').onChange(v => {
  if (!v) {
    stopAudio();
    // Hide audio sub-controls
    reactivityController.hide();
    startAudioController.hide();
    audioInstructionsEl.style.display = 'none';
  } else {
    reactivityController.show();
    startAudioController.show();
    audioInstructionsEl.style.display = '';
  }
});

// Reactivity slider — hidden until audio enabled
const reactivityController = gui
  .add(params, 'audioSensitivity', 0, 3, 0.05)
  .name('Reactivity');
reactivityController.hide();

// Start/Stop Audio button — hidden until audio enabled
params.startStopAudio = async () => {
  if (isAudioActive()) {
    stopAudio();
    params.startStopAudio.name = 'Start Audio';
    startAudioController.name('Start Audio');
  } else {
    const result = await startAudio();
    if (result.success) {
      startAudioController.name('Stop Audio');
    } else if (result.reason === 'no_audio_track') {
      showAudioError('No audio track found. Select "Entire Screen" and check "Share system audio".');
    } else {
      showAudioError('Audio access denied.');
    }
  }
};
const startAudioController = gui.add(params, 'startStopAudio').name('Start Audio');
startAudioController.hide();

// Instructions text element
const audioInstructionsEl = document.createElement('div');
audioInstructionsEl.style.cssText = `
  font-size: 10px; color: #aaa; padding: 4px 8px;
  display: none; max-width: 200px; line-height: 1.4;
`;
audioInstructionsEl.textContent =
  'Select "Entire Screen" in the dialog and check "Share system audio"';
gui.domElement.appendChild(audioInstructionsEl);
```

Add to `params` object:
```javascript
audioReactive:     false,
audioSensitivity:  AUDIO_SENSITIVITY_DEFAULT,
```

### Phase 15 failure modes

FM-P15-01 — getDisplayMedia throws "NotSupportedError: audio-only capture not supported"
This happens in some Chrome versions. Fallback: try with video:true then immediately
mute/stop the video track after getting the audio track.
```javascript
stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
stream.getVideoTracks().forEach(t => t.stop()); // discard video immediately
```

FM-P15-02 — Audio bands always return 0 even with music playing
Cause: User shared a tab without audio, or did not check "Share system audio".
The instructions text should be visible. No code fix needed — this is user error.
Add a visual indicator when bands are all zero for more than 3 seconds while audio
is "active": show a small warning "No audio detected — check sharing settings" near
the Start Audio button.

FM-P15-03 — Noise Scale and Noise Speed sliders feel disconnected while audio is on
This is expected — the audio overrides them. Add a visual indicator: when audio is
active, append "(audio)" to the slider names so users know they are overridden:
  noiseScaleController.name('Noise Scale (audio)');
Restore original names when audio stops.

FM-P15-04 — AudioContext suspended (Chrome autoplay policy)
Chrome may suspend AudioContext until a user gesture. The startAudio() call IS a
user gesture (button click), so the context should resume automatically. If it
does not, call: await audioContext.resume() after createAnalyser().

Phase 15 completion sequence:
1. Run all Phase 15 tests from TESTS.md
2. All tests PASS → write Phase 15 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 15 approved. Begin Phase 16."

---

## PHASE 16 — High frequency shimmer

### Goals
- Add a `u_highFreq` uniform (float, 0..1) to the surface shader
- In `surface.vert`, add a fast small-amplitude noise layer driven by `u_highFreq`
- The shimmer is additive on top of normal noise displacement — it does not replace anything
- When `u_highFreq = 0` (audio off or no highs): zero visible effect
- When `u_highFreq > 0` (highs present): fine ripple visible especially on curved objects
- Particle audio boost applies to highs as well as bass in this phase

### 16A — Shader addition: surface.vert

Add to uniforms section:
```glsl
uniform float u_highFreq;
```

In the displacement computation (after existing noise displacement):
```glsl
// High-frequency shimmer layer — only visible when u_highFreq > 0
float shimmerNoise = snoise(vec3(
  position.x * 8.0 + u_time * 4.0,
  position.y * 8.0 + u_time * 3.7,
  position.z * 8.0 + u_time * 4.3
));
float shimmerAmt = shimmerNoise * u_highFreq * 0.15;
// shimmerAmt is small (max 0.15 at full highs) — subtle but visible
vec3 displaced = position + normal * (existingDisplacement + shimmerAmt);
```

The shimmer uses a higher frequency snoise sample (8.0 vs the usual 1.0–2.0 scale)
and a faster time multiplier (4.0 vs the usual 0.5–1.0) to create fine rapid ripples.

### 16B — main.js addition

In the audio frame block from Phase 15, add highs after the existing band writes:
```javascript
surfaceUniforms.u_highFreq.value = highs * boost;
```

When audio is off or inactive, ensure:
```javascript
surfaceUniforms.u_highFreq.value = 0.0;
```

### 16C — surface.js uniform registration

Add to ShaderMaterial uniforms:
```javascript
u_highFreq: { value: 0.0 },
```

### 16D — Particle shimmer boost

In the particle audio path (when currentObjectType === OBJECTS.PARTICLES):
```javascript
surfaceUniforms.u_highFreq.value = highs * PARTICLE_AUDIO_BOOST;
```
So particle shimmer is 2.5× more dramatic than other objects.

### Phase 16 failure modes

FM-P16-01 — Shimmer appears even when audio is off
Cause: u_highFreq not reset to 0.0 when audio stops or is toggled off.
Fix: in stopAudio() callback and in the else branch of the audio check in main.js,
explicitly set surfaceUniforms.u_highFreq.value = 0.0.

FM-P16-02 — Shimmer too strong, dominates the surface appearance
The shimmerAmt multiplier of 0.15 may be too high on some objects.
If this is reported in human review, reduce to 0.08 and test again.
The shimmer should be a secondary texture effect, not the primary displacement.

FM-P16-03 — FPS drops significantly after shimmer addition
The extra snoise() call adds one simplex noise evaluation per vertex per frame.
If FPS drops below 50: reduce the shimmer noise frequency (8.0 → 4.0) to lower
the mathematical complexity, or gate the shimmer behind a u_highFreq > 0.01 check
in the shader to skip the computation when highs are near zero.

Phase 16 completion sequence:
1. Run all Phase 16 tests from TESTS.md
2. All tests PASS → write Phase 16 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. Do not proceed until human sends "Phase 16 approved. Begin Phase 17."

---

## PHASE 17 — Gradient editor and color reactivity

### Goals
- Build the full gradient editor panel (gradient bar, draggable stops, midpoint diamonds)
- Default rainbow gradient with 7 stops
- Color reactive mode: audio energy drives position along the gradient → surface color
- When audio color off: gradient editor still usable but only first stop color is used
- Single color picker from Phase 14 becomes the collapsed state of the gradient editor

### 17A — src/gradienteditor.js

Data model:
```javascript
// A stop: { id, position: 0..1, color: {r,g,b} each 0..1 }
// A midpoint: { id, position: 0..1 } — sits between two adjacent stops
// Midpoints auto-placed at midpoint between adjacent stops on creation
```

Default rainbow gradient (7 stops):
```javascript
const DEFAULT_STOPS = [
  { position: 0.00, color: { r: 1.00, g: 0.00, b: 0.00 } }, // red
  { position: 0.17, color: { r: 1.00, g: 0.50, b: 0.00 } }, // orange
  { position: 0.33, color: { r: 1.00, g: 1.00, b: 0.00 } }, // yellow
  { position: 0.50, color: { r: 0.00, g: 1.00, b: 0.00 } }, // green
  { position: 0.67, color: { r: 0.00, g: 1.00, b: 1.00 } }, // cyan
  { position: 0.83, color: { r: 0.00, g: 0.00, b: 1.00 } }, // blue
  { position: 1.00, color: { r: 0.60, g: 0.00, b: 1.00 } }, // violet
];
```

Gradient bar canvas (300px × 28px):
- Drawn using a series of linear gradient segments between each adjacent stop pair
- Redrawn on every stop move or color change
- Click on bar (not on a stop): add new stop at that position,
  color sampled from current gradient via getColorAtPosition()

Stop handles (below the bar):
- 12×12px filled squares, color matches stop color
- Positioned by CSS `left` = `position * barWidth - 6`px
- Draggable left/right — update stop.position on drag, redraw bar
- Click = open color picker for that stop
- Drag more than 20px below the bar = delete the stop
  (enforce minimum 2 stops — cannot delete if only 2 remain)
- On delete: remove associated midpoint handles, redraw

Midpoint diamond handles (between stop pairs, above the bar):
- 8×8px CSS-rotated squares (rotate 45deg = diamond shape)
- Positioned at the midpoint.position between each pair of adjacent stops
- Draggable left/right between the two surrounding stops
- Midpoint affects the easing of the gradient interpolation between those two stops
  using a power curve: t_adjusted = t^(midpoint_bias) where midpoint_bias is computed
  from how far the midpoint has been dragged from center

getColorAtPosition(t):
- Finds the two stops surrounding position t
- Computes local t between those two stops, applies midpoint bias
- Linear interpolates R, G, B between the two stop colors
- Returns { r, g, b } each 0..1

Exports:
```javascript
export function createGradientEditor(container, onChange) { ... }
// container: DOM element to append editor into
// onChange: called with getColorAtPosition whenever stops change

export function getColorAtPosition(t) { ... }
export function setGradientVisible(visible) { ... }
export function getCurrentSingleColor() { ... }
// Returns first stop color when in single-color mode
```

### 17B — GUI changes for color reactivity

In `src/ui.js`, add after the audio reactive controls:

```javascript
// Color Reactive toggle — only shown when audio is on AND audio is active
const colorReactiveController = gui
  .add(params, 'colorReactive')
  .name('Color Reactive')
  .onChange(v => {
    setGradientVisible(v); // show/hide gradient editor
    if (!v) {
      // Restore single color from first gradient stop
      const col = getCurrentSingleColor();
      surfaceUniforms.u_color.value.setRGB(col.r, col.g, col.b);
    }
  });
colorReactiveController.hide(); // shown only when audio enabled

// Show colorReactiveController when audio is enabled
// Add to the audioReactive onChange handler:
// if (v) { colorReactiveController.show(); }
// else   { colorReactiveController.hide(); params.colorReactive = false; }
```

Gradient editor DOM:
- The gradient editor panel is appended to `gui.domElement`
- Hidden by default, shown when colorReactive = true
- When visible: full gradient bar + stops + midpoints visible
- When hidden: only the single color swatch button visible (Phase 14 behavior)

### 17C — main.js color reactivity frame update

In the audio frame block, after band reads:
```javascript
if (params.colorReactive && isAudioActive()) {
  // Map overall energy to gradient position
  const energy = Math.min(1,
    getAudioBands(params.audioSensitivity).bass  * 0.6 +
    getAudioBands(params.audioSensitivity).mids  * 0.3 +
    getAudioBands(params.audioSensitivity).highs * 0.1
  );
  const col = getColorAtPosition(energy);
  surfaceUniforms.u_color.value.setRGB(col.r, col.g, col.b);
}
```

Note: getAudioBands() is called twice here — cache the result instead:
```javascript
const bands = getAudioBands(params.audioSensitivity);
// use bands.bass, bands.mids, bands.highs throughout the block
```

### Phase 17 failure modes

FM-P17-01 — Gradient bar renders as solid color or blank
Cause: canvas context not available, or stop positions not sorted before drawing.
Fix: sort stops by position before drawing: stops.sort((a,b) => a.position - b.position)
Stops must always be sorted — also sort on every drag update.

FM-P17-02 — Color picker opens under the gradient editor panel
Cause: z-index conflict between gradient editor (z-index 201) and color picker (z-index 200).
Fix: swap z-index values: color picker at 202, gradient editor at 201.

FM-P17-03 — Color reactive causes jarring color jumps between frames
Cause: audio energy is not smoothed — single loud beat causes instant hue jump.
Fix: smooth the energy value with a lerp each frame:
  smoothedEnergy = smoothedEnergy * 0.85 + energy * 0.15
Use smoothedEnergy for the gradient position instead of raw energy.

FM-P17-04 — Midpoint drag causes stop reordering
Cause: midpoint position update accidentally changing stop positions.
Fix: midpoints and stops are separate arrays. Midpoint drag only updates midpoint.position,
never stop.position. Enforce this with separate drag handlers.

Phase 17 completion sequence:
1. Run all Phase 17 tests from TESTS.md
2. All tests PASS → write Phase 17 summary to PROGRESS.md
3. Set STATUS: AWAITING HUMAN APPROVAL → halt
4. After human approval: audio reactivity feature complete.
