# GIA Gallery

GIA Gallery is a browser-based 3D sculpting playground built with Three.js and MediaPipe Hands. It combines animated shader-driven surfaces, persistent vertex displacement, object switching, mouse camera controls, and webcam gestures into a single interactive gallery.

## Setup

1. Run `npm install`.
2. Start the development server with `npm run dev`.
3. Open `http://localhost:5173` in Google Chrome.

To verify the production build, run `npm run build`.

## Browser Notes

- Chrome is recommended for the expected MediaPipe and WebGL behavior.
- Run the app from `localhost` so camera access and MediaPipe assets work correctly.
- Webcam access is optional because the app starts in `Mouse` mode.
- The final build uses the landmark canvas as the webcam-position guide; the old translucent webcam overlay is intentionally removed.

## What The App Includes

- A continuously animated generative surface that stays alive behind the splash screen.
- Persistent sculpting deformation powered by a per-vertex displacement texture.
- Seven sculptable objects you can switch between at runtime.
- A stylized XYZ axis gizmo at the origin, visible by default and toggleable.
- Shared deformation behavior across mouse and webcam interaction paths.
- Camera controls for orbiting and zooming in both mouse and webcam workflows.

## Objects

The object switcher lets you sculpt these seven shapes:

1. `Plane`
2. `Sphere`
3. `Cube`
4. `Torus`
5. `Torus Knot`
6. `Icosahedron`
7. `Particles`

Switching objects clears the current sculpt, rebuilds the displacement data for the new geometry, and fades the new object in.

## Proposal

I am going to build GIA Gallery, a browser based generative digital art gallery where each piece is created in real time using Three.js instead of pre made images or AI outputs. The main feature is an interactive surface that moves and changes over time using math and shaders, and users can adjust simple parameters like color, speed, and distortion to change how it looks. I will also use MediaPipe Hands so users can interact with the artwork using their webcam by pinching with their fingers to grab and pull on the surface. The webcam will appear as a low opacity overlay so users can clearly see where their hands line up with the art. I also plan to support two hand interaction so users can shape multiple areas at once or stretch the surface between their hands, and the changes they make will stay over time instead of resetting.

To build this, I will use an agentic loop where the agent writes code, runs the project, and improves it step by step based on feedback. The work will be broken into smaller goals like getting hand tracking working, lining up the webcam overlay, and making the surface react smoothly. The feedback will focus on things like whether the app runs smoothly, whether the hand tracking feels stable, whether the hand position matches what the user sees on screen, and whether the interaction feels natural. I will also have the agent test different cases like using two hands at once or moving quickly to make sure everything still works well. This process will help make sure the final project is both functional and easy to use.

## Week 13

1. What’s working so far on your project? What are your concrete plans for the next week?

Most of the core functionality is working well at this point. The 3D sculpting system is fully integrated with both mouse and webcam input, and the deformation pipeline feels consistent across both interaction modes since everything routes through the same shared state. Object switching between all seven geometries is stable, and the displacement reset and rebuild logic works correctly when changing shapes. Camera controls are also in a good place, including orbit and zoom for mouse and gesture based camera mode for webcam. The UI is complete with the control panel, splash screen, and interaction hints, and the animated surface and shader effects are running smoothly in the background. The main thing that is not working right now is the stretch functionality on 3D objects. Sculpting itself works, but stretching along axes or between pinch points is inconsistent or broken depending on the object.

For the next week, my plan is to fix the stretch behavior across all geometries and make sure it works consistently in both mouse and webcam modes. I then want to add an audio reactivity functionality so whatever music you are listening to on your device will be visualized as noise on the object. I think that this would be a cool addition because your mood would dictate what kind of music you would want to listen to and the program would not only let you visualize the music, but to be able to play with the visualization of your mood in real time.

2. What are the smartest and dumbest thing your agent loop did this week? What did you change to stop the agent from doing that dumb thing again?

The smartest thing the agent loop did was correctly implement the gesture based camera controls for webcam mode. It handled a fairly complex interaction design with multiple states, like entering camera mode with open palms, orbiting with hand movement, and zooming with pinch gestures, and got all of that working in a way that integrated cleanly with the rest of the system. That saved a lot of time because that logic is pretty tedious to get right manually.

The dumbest thing it did was when I asked it to modify the zoom gesture behavior. Instead of making a small targeted change, it ended up breaking parts of the existing camera control system that were already working. Even worse, it did not preserve a clean previous version of the code, so there was no easy way to revert. That meant I had to go back and manually reconstruct functionality that was already correct. 

To prevent that from happening again, I started being much more explicit about constraints in my prompts, especially telling the agent to only modify specific functions and not touch unrelated logic. I also made sure to checkpoint working versions more frequently so I can roll back if something breaks. In general, I am treating the agent more like a tool that needs strict boundaries instead of assuming it will make safe incremental changes on its own.

## Week 14

[![GIA Gallery Demo](https://img.youtube.com/vi/Jbt-fzIgZ3Q/maxresdefault.jpg)](https://www.youtube.com/watch?v=Jbt-fzIgZ3Q)

The original proposal was a browser-based generative art surface where users could tweak things like color, speed, and distortion, use MediaPipe hand tracking to interact with it, and sculpt the surface with one or two hands in a way that persists over time. The final version does all of that, and then goes quite a bit further. The core idea is fully there. The animated shader surface works; all the parameters are exposed in the control panel, and hand tracking supports pinch-to-sculpt and two-hand stretching that sticks until you reset it. I originally planned to include a webcam overlay, but I removed it because it was hurting performance. I replaced it with a landmark dot canvas, which ended up being cleaner and easier to use anyway. 

The biggest difference from the proposal is the extent to which the scope grew. What started as a flat plane turned into a full 3D sculpting environment. There are now seven different objects: a stylized axis indicator, controls for stretching along each axis, and a spherical camera system with both mouse orbit and gesture-based controls. None of that was part of the original plan. It came from building the plane first and then pushing it into something more interesting. Audio reactivity was planned later in the semester and was implemented in the final stretch. It uses the Web Audio API to run an FFT each frame and map 128 frequency bins onto the surface based on distance from the center. Low frequencies move the center, and higher ones affect the outer parts, so the object behaves like a 3D frequency spectrum. I also built a custom gradient editor so color responds to the energy in the music in real time.

## Phases 1-7

### Entering The Gallery

A splash page appears on load while the animated surface continues moving behind it.
Click Enter Gallery or press Escape to dismiss the splash.
Use the ? button in the top-left corner, or press the ? key, to re-open the instructions at any time.

### Mode Toggle

The bottom-center toggle switches between Mouse and Webcam interaction.
Mouse is the default mode, so the app loads without prompting for camera access.
Switching back and forth preserves all existing deformation in the surface.
If camera access is denied, the toggle automatically returns to Mouse mode and shows a small inline error.

### Mouse Mode

Click and drag to sculpt the surface.
Hold right-click while dragging to simulate the second pinch point and stretch the sculpt wider.
The canvas shows a crosshair cursor at rest, switches to a grabbing cursor while sculpting, and displays a small indicator circle that follows the pointer.

### Webcam Mode

Switch to Webcam mode, then pinch your thumb and index finger together to sculpt.
Pinch with both hands and pull apart to stretch the deformation radius.
The landmark-dot canvas is the only on-screen hand-position indicator in the final build; the webcam video overlay remains intentionally removed for performance, per the approved Phase 6 decision.

### Control Panel

The lil-gui panel in the top-right exposes these six controls:

1. Noise Scale - changes how dense and detailed the animated surface noise looks.
2. Noise Speed - changes how fast the base surface animation moves.
3. Deformation Strength - changes how strongly each sculpting gesture writes into the deformation buffer.
4. Falloff Radius - changes how wide each sculpting gesture spreads across the mesh.
5. Decay - controls how quickly sculpted deformation fades back toward flat.
6. Color Hue - shifts the surface color through the hue spectrum.

### Notes

Sculpted marks persist until you refresh the page or raise the Decay slider.
Mouse mode and webcam mode both write through the same handState and deformation-uniform path, so sculpting should feel consistent between both inputs.

## Phases 8-13

- `3D Environment` - The scene now includes a 3D XYZ axis gizmo at the world origin. Press `A` or use the `Axis Lines` toggle to show or hide it.
- `Object Switcher` - Use the `Object` dropdown in the control panel to swap between `Plane`, `Sphere`, `Cube`, `Torus`, `Torus Knot`, `Icosahedron`, and `Particles`. Each switch clears the current deformation and rebuilds the sculpt data for the new mesh.
- `Scale And Stretch` - Use the `Scale` slider to resize the current object uniformly. Drag an axis tube in `Mouse` mode to stretch along that axis, or pinch an axis tube in `Webcam` mode and drag to stretch the object the same way.
- `Mouse Camera Controls` - Hold `Ctrl` and scroll to zoom. Right-click and drag on empty space to orbit the camera around the current object.
- `Webcam Camera Mode` - Hold both open palms still for 2 seconds to enter camera mode (`CAM` indicator visible). In camera mode, move both open palms in the same direction to orbit, pinch both hands and move them apart or together to zoom, and hold both fists for 2 seconds to exit.
- `Control Panel Additions` - The original sculpt controls are still present, and the panel now also includes `Object`, `Scale`, and `Axis Lines` controls for the Phase 8-13 workflow.

### Mouse Mode

- Click and drag on the current object to sculpt.
- Right-click on the object and drag to stretch the deformation between two points.
- Right-click on empty space and drag to orbit the camera around the scene.
- Hold `Ctrl` while using the mouse wheel to zoom in and out.
- Drag the X, Y, or Z axis gizmo handles to stretch the current object along that axis.

### Webcam Mode

- Pinch with one hand to sculpt.
- Pinch with both hands on the object to widen and stretch the deformation.
- Hold two open palms still to enter gesture camera mode.
- In gesture camera mode, pinch both hands and move them apart or together to zoom the camera.
- In gesture camera mode, move both open palms in the same direction to orbit the camera.
- Hold two fists for the exit hold to leave gesture camera mode.
- Gesture camera controls are webcam-only and do not activate in `Mouse` mode.

The landmark canvas remains visible so you can line your hands up with the current object even without a webcam video overlay.

### Splash And Shortcuts

- The splash appears on load while the scene keeps animating in the background.
- Click `Enter Gallery` to dismiss the splash.
- Press `?` to reopen the instructions.
- Press `Escape` to close the splash.
- Press `A` to toggle the axis gizmo.

### GUI Controls

The top-right control panel exposes these live controls:

1. `Noise Scale` - changes how dense the base surface motion looks.
2. `Noise Speed` - changes how fast the procedural motion animates.
3. `Deformation Strength` - changes how strongly each sculpting input writes displacement.
4. `Falloff Radius` - changes how wide each sculpting input spreads.
5. `Decay` - fades existing deformation back toward rest over time.
6. `Color Hue` - shifts the object color through the hue range.
7. `Object` - switches between the seven available shapes.
8. `Scale` - changes the object's uniform scale.
9. `Axis Lines` - shows or hides the XYZ gizmo.

### Performance Notes

- Chrome is the target browser.
- Webcam mode is optional and only starts when selected.
- The particle object and high-detail meshes are more demanding than the plane, but the app is tuned to stay interactive.
- Deformation persists until you switch objects, refresh the page, or increase `Decay`.

## Phases 14-17

### Color System

- The `Color Hue` slider has been replaced by a color swatch button in the `Object` row of the control panel.
- Click the swatch to open the floating color picker and set the base color for the current object.
- The picker includes a saturation/brightness field, a hue bar, RGB and CMYK input modes, a hex input, and current/new preview swatches.

### Audio Reactivity

- Enable `Audio Reactive` in the control panel to make the current object respond to music playing on your computer.
- Click `Start Audio`, choose `Entire Screen`, and make sure `Share system audio` is checked before confirming the capture dialog.
- The `Reactivity` slider controls how strongly the object responds to the incoming audio.
- Bass frequencies affect the center of the object more strongly, while higher frequencies push the outer regions harder.
- The shimmer effect adds fine, fast surface detail during cymbal and hi-hat heavy moments.
- `Particles` react more dramatically to audio than the solid meshes.
- Sculpting still works while audio reactivity is active, so you can combine manual edits with music-driven motion.

### Color Reactivity

- Enable `Color Reactive` after `Audio Reactive` is on to map live music energy through a customizable gradient.
- A floating gradient editor opens beside the control panel with a rainbow gradient by default.
- Click any color stop to edit it with the color picker.
- Drag stops left or right to reposition them.
- Click anywhere on the gradient bar to add a new stop.
- Drag a stop downward away from the bar to delete it.
- Drag the diamond midpoint handles to adjust the easing between adjacent stops.
- Disable `Color Reactive` to return to the single static swatch color.

### Control Panel Additions

- `Audio Reactive` toggle
- `Reactivity` slider, shown only while `Audio Reactive` is enabled
- `Start Audio` / `Stop Audio` button, shown only while `Audio Reactive` is enabled
- `Color Reactive` toggle, shown only while `Audio Reactive` is enabled
