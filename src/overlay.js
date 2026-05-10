import { WEBCAM_HEIGHT, WEBCAM_WIDTH } from './constants.js';

let activeStream = null;
let activeTrack = null;
let imageCapture = null;
let webcamInitPromise = null;
let webcamRestartPromise = null;

function resetFrameSource() {
  activeTrack = null;
  imageCapture = null;
}

function createFrameSource(track) {
  if (typeof window.ImageCapture !== 'function') {
    throw new Error('ImageCapture is unavailable in this browser.');
  }

  return new window.ImageCapture(track);
}

function hidePermissionError() {
  const existing = document.getElementById('camera-permission-error');

  if (existing) {
    existing.remove();
  }
}

function showPermissionError() {
  hidePermissionError();

  const el = document.createElement('div');

  el.id = 'camera-permission-error';
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
    'color:white;font-family:sans-serif;font-size:18px;text-align:center;z-index:10;' +
    'background:rgba(0,0,0,0.75);padding:24px;border-radius:8px;';
  el.textContent = 'Camera access required. Allow camera in browser settings and reload.';
  document.body.appendChild(el);
}

function stopStream(stream) {
  stream?.getTracks().forEach(track => track.stop());
}

export function stopWebcamStream() {
  stopStream(activeStream);
  activeStream = null;
  resetFrameSource();
}

export function hasLiveWebcamFrameSource() {
  return Boolean(imageCapture && activeTrack?.readyState === 'live');
}

export async function captureWebcamFrame() {
  if (!hasLiveWebcamFrameSource()) {
    throw new Error('Webcam frame source is unavailable.');
  }

  return imageCapture.grabFrame();
}

export async function initWebcam(options = {}) {
  const { showPermissionError: shouldShowPermissionError = true } = options;

  if (webcamInitPromise) {
    return webcamInitPromise;
  }

  webcamInitPromise = (async () => {
    hidePermissionError();

    let stream = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: WEBCAM_WIDTH, height: WEBCAM_HEIGHT, facingMode: 'user' },
      });

      const [track] = stream.getVideoTracks();

      if (!track) {
        throw new Error('No webcam video track was returned.');
      }

      const nextFrameSource = createFrameSource(track);

      activeStream = stream;
      activeTrack = track;
      imageCapture = nextFrameSource;

      return true;
    } catch (error) {
      if (activeStream === stream) {
        stopWebcamStream();
      } else {
        stopStream(stream);
        resetFrameSource();
      }

      if (error instanceof DOMException) {
        if (shouldShowPermissionError) {
          showPermissionError();
        } else {
          hidePermissionError();
        }
        return false;
      }

      throw error;
    } finally {
      webcamInitPromise = null;
    }
  })();

  return webcamInitPromise;
}

export async function restartWebcam(options = {}) {
  if (webcamRestartPromise) {
    return webcamRestartPromise;
  }

  webcamRestartPromise = (async () => {
    stopWebcamStream();
    return initWebcam(options);
  })().finally(() => {
    webcamRestartPromise = null;
  });

  return webcamRestartPromise;
}
