import {
  AUDIO_ANALYSER_SMOOTHING,
  AUDIO_FFT_SIZE,
} from './constants.js';

let audioContext = null;
let analyser = null;
let dataArray = null;
let sourceNode = null;
let stream = null;
let active = false;

const audioStateListeners = new Set();
const audioInterruptionListeners = new Set();
let mediaDeviceChangeListener = null;

function notifyAudioState() {
  audioStateListeners.forEach(listener => {
    listener(active);
  });
}

function notifyAudioInterruption(interruption) {
  audioInterruptionListeners.forEach(listener => {
    listener(interruption);
  });
}

function detachMediaDeviceListener() {
  if (!mediaDeviceChangeListener || !navigator.mediaDevices?.removeEventListener) {
    return;
  }

  navigator.mediaDevices.removeEventListener('devicechange', mediaDeviceChangeListener);
  mediaDeviceChangeListener = null;
}

function handleMediaDeviceChange() {
  if (!active) {
    return;
  }

  stopAudio();
  notifyAudioInterruption({
    message: 'Audio device changed. Click Start Audio to reconnect.',
    reason: 'devicechange',
  });
}

function attachMediaDeviceListener() {
  if (mediaDeviceChangeListener || !navigator.mediaDevices?.addEventListener) {
    return;
  }

  mediaDeviceChangeListener = () => {
    handleMediaDeviceChange();
  };
  navigator.mediaDevices.addEventListener('devicechange', mediaDeviceChangeListener);
}

function getAudioStartFailureMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

function getAudioStartFailureReason(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError' || error?.name === 'SecurityError') {
    return 'denied';
  }

  return 'error';
}

async function requestDisplayMedia() {
  const captureStream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: {
      height: 1,
      width: 1,
    },
  });

  captureStream.getVideoTracks().forEach(track => {
    track.stop();
  });

  return captureStream;
}

export async function startAudio() {
  stopAudio();

  try {
    stream = await requestDisplayMedia();
  } catch (error) {
    return {
      success: false,
      reason: getAudioStartFailureReason(error),
      message: getAudioStartFailureMessage(error),
    };
  }

  const audioTracks = stream.getAudioTracks();

  if (audioTracks.length === 0) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
    stream = null;
    return { success: false, reason: 'no_audio_track' };
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

  try {
    audioContext = new AudioContextCtor();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = AUDIO_FFT_SIZE;
    analyser.smoothingTimeConstant = AUDIO_ANALYSER_SMOOTHING;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);
    await audioContext.resume();

    active = true;
    attachMediaDeviceListener();
    notifyAudioState();

    audioTracks[0].addEventListener('ended', () => {
      stopAudio();
    }, { once: true });

    return { success: true };
  } catch (error) {
    stopAudio();

    return {
      success: false,
      reason: 'error',
      message: getAudioStartFailureMessage(error),
    };
  }
}

export function stopAudio() {
  const wasActive = active;

  detachMediaDeviceListener();

  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  if (analyser) {
    analyser.disconnect();
    analyser = null;
  }

  if (audioContext) {
    void audioContext.close();
    audioContext = null;
  }

  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
    });
    stream = null;
  }

  dataArray = null;
  active = false;

  if (wasActive) {
    notifyAudioState();
  }
}

export function isAudioActive() {
  return active;
}

export function getAudioFrequencyData() {
  if (!active || !analyser || !dataArray) {
    return null;
  }

  analyser.getByteFrequencyData(dataArray);
  return dataArray;
}

export function getAudioAnalyser() {
  return { dataArray, analyser };
}

export function subscribeAudioState(listener) {
  audioStateListeners.add(listener);

  return () => {
    audioStateListeners.delete(listener);
  };
}

export function subscribeAudioInterruption(listener) {
  audioInterruptionListeners.add(listener);

  return () => {
    audioInterruptionListeners.delete(listener);
  };
}
