import {
  ERROR_FADE_MS,
  FLOATING_UI_OFFSET,
  FLOATING_UI_Z_INDEX,
  INLINE_ERROR_OFFSET,
  MODE_TOGGLE_GAP,
} from './constants.js';

export const MODE = {
  MOUSE: 'mouse',
  WEBCAM: 'webcam',
};

function styleSegment(button, active) {
  button.style.background = active ? 'linear-gradient(135deg, #f4efe5 0%, #f0d7a1 100%)' : 'transparent';
  button.style.color = active ? '#151515' : 'rgba(245, 242, 235, 0.82)';
  button.style.boxShadow = active ? '0 10px 24px rgba(0, 0, 0, 0.28)' : 'none';
}

export function initModeToggle({
  canvas,
  attachMouseListeners,
  detachMouseListeners,
  resetAllHandState,
  initWebcam,
  initMediaPipe,
  stopWebcam,
  setHands,
  setWebcamActive,
}) {
  let currentMode = MODE.MOUSE;
  let switchInProgress = false;
  let fadeTimeoutId = 0;
  let removeTimeoutId = 0;

  const root = document.createElement('div');
  const label = document.createElement('div');
  const control = document.createElement('div');
  const mouseButton = document.createElement('button');
  const webcamButton = document.createElement('button');
  const error = document.createElement('div');

  root.id = 'gia-mode-toggle';
  Object.assign(root.style, {
    position: 'fixed',
    bottom: `${FLOATING_UI_OFFSET}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: String(FLOATING_UI_Z_INDEX),
    display: 'grid',
    gap: `${MODE_TOGGLE_GAP}px`,
    justifyItems: 'center',
    fontFamily: 'Avenir Next, Segoe UI, sans-serif',
  });

  Object.assign(label.style, {
    fontSize: '11px',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'rgba(244, 239, 229, 0.7)',
  });
  label.textContent = 'Interaction Mode';

  Object.assign(control.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(108px, 1fr))',
    gap: `${MODE_TOGGLE_GAP}px`,
    padding: '6px',
    borderRadius: '999px',
    background: 'rgba(9, 14, 24, 0.78)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(18px)',
  });

  [mouseButton, webcamButton].forEach(button => {
    button.type = 'button';
    Object.assign(button.style, {
      minWidth: '108px',
      padding: '12px 18px',
      borderRadius: '999px',
      border: 'none',
      fontSize: '14px',
      fontWeight: '700',
      letterSpacing: '0.04em',
      cursor: 'pointer',
      transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
    });
  });
  mouseButton.textContent = 'Mouse';
  webcamButton.textContent = 'Webcam';

  Object.assign(error.style, {
    position: 'fixed',
    bottom: `${INLINE_ERROR_OFFSET}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    color: 'rgba(255, 140, 140, 1)',
    fontFamily: 'Avenir Next, Segoe UI, sans-serif',
    fontSize: '12px',
    letterSpacing: '0.02em',
    zIndex: String(FLOATING_UI_Z_INDEX),
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 0.5s ease',
  });

  control.append(mouseButton, webcamButton);
  root.append(label, control);
  document.body.append(root, error);

  function updateToggleVisual(mode) {
    styleSegment(mouseButton, mode === MODE.MOUSE);
    styleSegment(webcamButton, mode === MODE.WEBCAM);
    mouseButton.setAttribute('aria-pressed', String(mode === MODE.MOUSE));
    webcamButton.setAttribute('aria-pressed', String(mode === MODE.WEBCAM));
  }

  function setSwitchEnabled(enabled) {
    mouseButton.disabled = !enabled;
    webcamButton.disabled = !enabled;
    mouseButton.style.opacity = enabled ? '1' : '0.6';
    webcamButton.style.opacity = enabled ? '1' : '0.6';
  }

  function hideInlineError() {
    window.clearTimeout(fadeTimeoutId);
    window.clearTimeout(removeTimeoutId);
    error.textContent = '';
    error.style.opacity = '0';
  }

  function showInlineError(message) {
    hideInlineError();
    error.textContent = message;
    error.style.opacity = '1';
    fadeTimeoutId = window.setTimeout(() => {
      error.style.opacity = '0';
    }, ERROR_FADE_MS - 500);
    removeTimeoutId = window.setTimeout(() => {
      error.textContent = '';
    }, ERROR_FADE_MS);
  }

  function forceMouseMode(message = '') {
    resetAllHandState();
    setWebcamActive(false);
    stopWebcam();
    attachMouseListeners(canvas);
    currentMode = MODE.MOUSE;
    switchInProgress = false;
    setSwitchEnabled(true);
    updateToggleVisual(currentMode);
    if (message) {
      showInlineError(message);
    } else {
      hideInlineError();
    }
  }

  async function switchMode(nextMode) {
    if (switchInProgress || nextMode === currentMode) {
      return;
    }

    switchInProgress = true;
    setSwitchEnabled(false);
    resetAllHandState();

    if (nextMode === MODE.WEBCAM) {
      try {
        const webcamReady = await initWebcam();

        if (!webcamReady) {
          forceMouseMode('Camera access denied. Using mouse mode.');
          return;
        }

        const hands = initMediaPipe();

        setHands(hands);
        setWebcamActive(true);
        detachMouseListeners(canvas);
        currentMode = MODE.WEBCAM;
        hideInlineError();
      } catch (error) {
        console.error('Webcam mode activation failed:', error);
        forceMouseMode('Camera access denied. Using mouse mode.');
        return;
      }
    } else {
      setWebcamActive(false);
      stopWebcam();
      attachMouseListeners(canvas);
      currentMode = MODE.MOUSE;
      hideInlineError();
    }

    switchInProgress = false;
    setSwitchEnabled(true);
    updateToggleVisual(currentMode);
  }

  mouseButton.addEventListener('click', () => {
    void switchMode(MODE.MOUSE);
  });
  webcamButton.addEventListener('click', () => {
    void switchMode(MODE.WEBCAM);
  });

  updateToggleVisual(currentMode);

  return {
    forceMouseMode,
    getCurrentMode: () => currentMode,
  };
}
