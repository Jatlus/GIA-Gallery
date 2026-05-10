import GUI from 'lil-gui';

import {
  DECAY_MAX,
  DECAY_MIN,
  DEFORM_STRENGTH_MAX,
  DEFORM_STRENGTH_MIN,
  GUI_FALLOFF_RADIUS_MAX,
  GUI_FALLOFF_RADIUS_MIN,
  GUI_STEP,
  GUI_Z_INDEX,
  NOISE_SCALE_MAX,
  NOISE_SCALE_MIN,
  NOISE_SPEED_MAX,
  NOISE_SPEED_MIN,
  OBJECT_SCALE_MAX,
  OBJECT_SCALE_MIN,
  OBJECT_SCALE_STEP,
} from './constants.js';
import {
  isAudioActive,
  startAudio,
  stopAudio,
  subscribeAudioInterruption,
  subscribeAudioState,
} from './audioreactivity.js';
import { closeColorPicker, openColorPicker } from './colorpicker.js';
import {
  closeGradientEditor,
  createGradientEditor,
  getCurrentSingleColor,
  setCurrentSingleColor,
  setGradientVisible,
} from './gradienteditor.js';

let currentColor = getCurrentSingleColor();

function updateSwatchDisplay(button, color) {
  button.style.background = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

function attachSwatchToObjectRow(objectControl, colorSwatch) {
  const row = objectControl.domElement;
  const select = objectControl.domElement.querySelector('select');
  const widget = select?.parentElement;

  if (!widget) {
    return;
  }

  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.pointerEvents = 'none';

  widget.style.display = 'flex';
  widget.style.alignItems = 'center';
  widget.style.gap = '6px';
  widget.style.width = '100%';
  widget.style.pointerEvents = 'none';

  if (select) {
    select.style.flex = '1 1 auto';
    select.style.minWidth = '0';
    select.style.pointerEvents = 'auto';
  }

  colorSwatch.style.pointerEvents = 'auto';
  widget.appendChild(colorSwatch);
}

export function initUI(surfaceUniforms, deformUniforms, params, options = {}) {
  const {
    objectOptions = [],
    onAxisToggle,
    onObjectChange,
    onObjectScaleChange,
  } = options;
  const gui = new GUI();
  const controls = [];
  let axisControl = null;
  let objectControl = null;
  let scaleControl = null;
  let hideAudioErrorTimeoutId = 0;
  let audioWarningMessage = '';
  let audioErrorMessage = '';
  let openPanel = null;

  gui.domElement.style.zIndex = String(GUI_Z_INDEX);
  gui.domElement.setAttribute('role', 'presentation');
  const noiseScaleControl = gui.add(params, 'noiseScale', NOISE_SCALE_MIN, NOISE_SCALE_MAX, GUI_STEP)
    .name('Noise Scale')
    .onChange(v => surfaceUniforms.u_noiseScale.value = v);
  controls.push(noiseScaleControl);
  const noiseSpeedControl = gui.add(params, 'noiseSpeed', NOISE_SPEED_MIN, NOISE_SPEED_MAX, GUI_STEP)
    .name('Noise Speed')
    .onChange(v => surfaceUniforms.u_noiseSpeed.value = v);
  controls.push(noiseSpeedControl);
  controls.push(
    gui.add(params, 'deformStrength', DEFORM_STRENGTH_MIN, DEFORM_STRENGTH_MAX, GUI_STEP)
      .name('Deformation Strength')
      .onChange(v => deformUniforms.u_deformStrength.value = v),
  );
  controls.push(
    gui.add(params, 'falloffRadius', GUI_FALLOFF_RADIUS_MIN, GUI_FALLOFF_RADIUS_MAX, GUI_STEP)
      .name('Falloff Radius')
      .onChange(v => deformUniforms.u_falloffRadius.value = v),
  );
  controls.push(
    gui.add(params, 'decay', DECAY_MIN, DECAY_MAX, GUI_STEP)
      .name('Decay')
      .onChange(v => deformUniforms.u_decay.value = v),
  );

  const colorSwatch = document.createElement('button');

  colorSwatch.type = 'button';
  colorSwatch.id = 'gia-color-swatch';
  colorSwatch.name = 'gia-color-swatch';
  colorSwatch.ariaLabel = 'Open color picker';
  colorSwatch.style.cssText = [
    'width:var(--slider-input-min-width)',
    'min-width:var(--slider-input-min-width)',
    'height:var(--widget-height)',
    'box-sizing:border-box',
    'margin-left:auto',
    'flex-shrink:0',
    'padding:0',
    'border:0',
    'border-radius:var(--widget-border-radius)',
    'cursor:pointer',
    'box-shadow:inset 0 0 0 1px rgba(255, 255, 255, 0.14)',
    'appearance:none',
    'position:relative',
    'z-index:10',
  ].join(';');

  function applySingleColorToSurface(color = currentColor) {
    surfaceUniforms.u_color.value.setRGB(color.r, color.g, color.b);
  }

  function setCurrentColor(color) {
    currentColor = { ...color };
    setCurrentSingleColor(color);

    if (!params.colorReactive) {
      applySingleColorToSurface(color);
    }

    updateSwatchDisplay(colorSwatch, color);
  }

  function closeAllPanels() {
    closeColorPicker();
    closeGradientEditor();
    openPanel = null;
  }

  function closeGradientEditorPanel() {
    closeGradientEditor();

    if (openPanel === 'gradient' || openPanel === 'stop-color') {
      openPanel = null;
    }
  }

  function openSingleColorPanel() {
    closeAllPanels();
    openPanel = 'single-color';
    openColorPicker(
      colorSwatch,
      currentColor,
      newColor => {
        setCurrentColor(newColor);
      },
      {
        onClose: () => {
          if (openPanel === 'single-color') {
            openPanel = null;
          }
        },
      },
    );
  }

  function openGradientEditorPanel() {
    closeAllPanels();
    setGradientVisible(true);
    openPanel = 'gradient';
  }

  setCurrentColor(currentColor);

  colorSwatch.addEventListener('pointerdown', event => {
    event.stopPropagation();
  });

  colorSwatch.addEventListener('click', event => {
    event.stopPropagation();
    event.preventDefault();

    if (openPanel === 'single-color') {
      closeAllPanels();
      return;
    }

    openSingleColorPanel();
  });

  if (objectOptions.length > 0 && typeof onObjectChange === 'function') {
    objectControl = gui.add(params, 'object', objectOptions)
      .name('Object')
      .onChange(onObjectChange);
    controls.push(objectControl);
    attachSwatchToObjectRow(objectControl, colorSwatch);
  }

  const audioInstructionsEl = document.createElement('div');
  const audioStatusEl = document.createElement('div');
  createGradientEditor(gui.domElement, () => {}, {
    onEditorClose: () => {
      if (openPanel === 'gradient' || openPanel === 'stop-color') {
        openPanel = null;
      }
    },
    onEditorOpen: () => {
      if (openPanel !== 'stop-color') {
        openPanel = 'gradient';
      }
    },
    onStopColorPickerClose: () => {
      if (params.colorReactive) {
        openPanel = 'gradient';
        return;
      }

      if (openPanel === 'stop-color') {
        openPanel = null;
      }
    },
    onStopColorPickerOpen: () => {
      openPanel = 'stop-color';
    },
  });

  closeGradientEditor();

  audioInstructionsEl.style.cssText = [
    'font-size:10px',
    'color:#aaa',
    'padding:4px 8px',
    'display:none',
    'max-width:200px',
    'line-height:1.4',
  ].join(';');
  audioInstructionsEl.textContent = 'Select "Entire Screen" in the dialog and check "Share system audio"';

  audioStatusEl.style.cssText = [
    'font-size:10px',
    'padding:2px 8px 6px',
    'display:none',
    'max-width:200px',
    'line-height:1.4',
  ].join(';');

  function renderAudioStatus() {
    const message = audioErrorMessage || audioWarningMessage;

    audioStatusEl.textContent = message;
    audioStatusEl.style.display = message ? '' : 'none';
    audioStatusEl.style.color = audioErrorMessage ? '#ff8f8f' : '#f2c572';
  }

  function clearAudioStatus() {
    window.clearTimeout(hideAudioErrorTimeoutId);
    audioWarningMessage = '';
    audioErrorMessage = '';
    renderAudioStatus();
  }

  function showAudioError(message) {
    audioErrorMessage = message;
    renderAudioStatus();
    window.clearTimeout(hideAudioErrorTimeoutId);
    hideAudioErrorTimeoutId = window.setTimeout(() => {
      audioErrorMessage = '';
      renderAudioStatus();
    }, 4000);
  }

  function setAudioSignalWarning(message = '') {
    audioWarningMessage = message;
    renderAudioStatus();
  }

  function syncAudioOverrideLabels() {
    startAudioController?.name(isAudioActive() ? 'Stop Audio' : 'Start Audio');

    if (!isAudioActive()) {
      setAudioSignalWarning('');
    }
  }

  const audioReactiveControl = gui.add(params, 'audioReactive')
    .name('Audio Reactive')
    .onChange(value => {
      if (!value) {
        stopAudio();
        params.colorReactive = false;
        colorReactiveController.updateDisplay();
        colorReactiveController.hide();
        closeGradientEditorPanel();
        applySingleColorToSurface();
        reactivityController.hide();
        startAudioController.hide();
        audioInstructionsEl.style.display = 'none';
        clearAudioStatus();
      } else {
        colorReactiveController.show();
        reactivityController.show();
        startAudioController.show();
        audioInstructionsEl.style.display = '';
      }

      syncAudioOverrideLabels();
    });
  controls.push(audioReactiveControl);

  const reactivityController = gui
    .add(params, 'audioSensitivity', 0, 3, 0.05)
    .name('Reactivity');
  controls.push(reactivityController);
  reactivityController.hide();
  const colorReactiveController = gui
    .add(params, 'colorReactive')
    .name('Color Reactive')
    .onChange(value => {
      if (!value) {
        closeGradientEditorPanel();
        applySingleColorToSurface();
        return;
      }

      openGradientEditorPanel();
    });
  controls.push(colorReactiveController);
  colorReactiveController.hide();

  async function handleStartStopAudioClick() {
    if (isAudioActive()) {
      stopAudio();
      return;
    }

    clearAudioStatus();
    const result = await startAudio();

    if (result.success) {
      return;
    }

    if (result.reason === 'no_audio_track') {
      showAudioError('No audio track found. Select "Entire Screen" and check "Share system audio".');
      return;
    }

    if (result.reason === 'denied') {
      showAudioError('Audio access denied.');
      return;
    }

    showAudioError(result.message || 'Audio capture failed.');
  }

  params.startStopAudio = () => {};

  const startAudioController = gui.add(params, 'startStopAudio').name('Start Audio');
  controls.push(startAudioController);
  startAudioController.hide();
  const startAudioButton = startAudioController.domElement.querySelector('button');

  if (startAudioButton) {
    startAudioButton.type = 'button';
    startAudioButton.id = 'gia-control-start-audio';
    startAudioButton.name = 'gia-control-start-audio';
    startAudioButton.addEventListener('click', event => {
      event.preventDefault();
      void handleStartStopAudioClick();
    });
  }

  gui.domElement.appendChild(audioInstructionsEl);
  gui.domElement.appendChild(audioStatusEl);
  subscribeAudioInterruption(({ message }) => {
    showAudioError(message);
  });
  subscribeAudioState(() => {
    syncAudioOverrideLabels();
  });
  syncAudioOverrideLabels();

  if (typeof onObjectScaleChange === 'function') {
    scaleControl = gui.add(params, 'objectScale', OBJECT_SCALE_MIN, OBJECT_SCALE_MAX, OBJECT_SCALE_STEP)
      .name('Scale')
      .onChange(onObjectScaleChange);
    controls.push(scaleControl);
  }

  if (typeof onAxisToggle === 'function') {
    axisControl = gui.add(params, 'showAxis')
      .name('Axis Lines')
      .onChange(onAxisToggle);
    controls.push(axisControl);
  }

  controls.forEach((control, index) => {
    const input = control.domElement.querySelector('input, select');

    if (!input) {
      return;
    }

    input.id = `gia-control-${index}`;
    input.name = input.id;
  });

  return {
    axisControl,
    gui,
    scaleControl,
    setAudioSignalWarning,
  };
}
