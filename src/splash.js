import {
  FLOATING_UI_OFFSET,
  FLOATING_UI_Z_INDEX,
  HELP_BUTTON_SIZE,
  SPLASH_FADE_MS,
  SPLASH_MAX_WIDTH,
  SPLASH_Z_INDEX,
} from './constants.js';

let cleanupActiveSplash = null;

export function showSplash(onDismiss) {
  if (cleanupActiveSplash) {
    cleanupActiveSplash();
  }

  const overlay = document.createElement('div');
  const panel = document.createElement('div');
  const intro = document.createElement('p');
  const heading = document.createElement('h1');
  const subtitle = document.createElement('p');
  const columns = document.createElement('div');
  const mouseColumn = document.createElement('section');
  const webcamColumn = document.createElement('section');
  const controlsNote = document.createElement('p');
  const persistenceNote = document.createElement('p');
  const enterButton = document.createElement('button');
  let dismissing = false;

  overlay.id = 'gia-splash';
  overlay.style.cssText = `position:fixed;inset:0;z-index:${SPLASH_Z_INDEX};background:rgba(4,10,20,0.82);` +
    `display:flex;align-items:center;justify-content:center;padding:32px;opacity:0;` +
    `transition:opacity ${SPLASH_FADE_MS}ms ease;backdrop-filter:blur(12px);`;

  Object.assign(panel.style, {
    width: 'min(100%, 780px)',
    maxWidth: `${SPLASH_MAX_WIDTH}px`,
    padding: '36px',
    borderRadius: '28px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'linear-gradient(180deg, rgba(11,18,31,0.92) 0%, rgba(6,11,20,0.92) 100%)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.38)',
    color: '#f6f1e8',
    display: 'grid',
    gap: '18px',
    fontFamily: 'Avenir Next, Segoe UI, sans-serif',
  });

  Object.assign(intro.style, {
    margin: '0',
    fontSize: '11px',
    letterSpacing: '0.32em',
    textTransform: 'uppercase',
    color: 'rgba(241, 219, 177, 0.86)',
  });
  intro.textContent = 'Interactive generative sculpture';

  Object.assign(heading.style, {
    margin: '0',
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: 'clamp(2.6rem, 6vw, 4.6rem)',
    fontWeight: '700',
    lineHeight: '0.95',
  });
  heading.textContent = 'GIA Gallery';

  Object.assign(subtitle.style, {
    margin: '0',
    fontSize: '1.08rem',
    lineHeight: '1.7',
    color: 'rgba(246, 241, 232, 0.86)',
  });
  subtitle.textContent = 'A living generative surface you can sculpt in real time.';

  Object.assign(columns.style, {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px',
  });

  [mouseColumn, webcamColumn].forEach(column => {
    Object.assign(column.style, {
      padding: '18px 20px',
      borderRadius: '20px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'grid',
      gap: '8px',
    });
  });
  mouseColumn.innerHTML = `
    <h2 style="margin:0;font-size:1rem;letter-spacing:0.08em;text-transform:uppercase;color:#f1dbb1;">Mouse Mode</h2>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">Click and drag on the object to sculpt.</p>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">Right-click drag on empty space to orbit the camera.</p>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">Hold right-click on the object while dragging to stretch.</p>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">Hold Ctrl and use the scroll wheel to zoom.</p>
  `;
  webcamColumn.innerHTML = `
    <h2 style="margin:0;font-size:1rem;letter-spacing:0.08em;text-transform:uppercase;color:#f1dbb1;">Webcam Mode</h2>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">Pinch to sculpt. Pinch both hands on the object to stretch.</p>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">Hold two open palms still to enter camera mode.</p>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">In camera mode, pinch both hands and move them apart or together to zoom.</p>
    <p style="margin:0;line-height:1.65;color:rgba(246,241,232,0.82);">Move both open palms in the same direction to orbit, then hold two fists to exit.</p>
  `;

  Object.assign(controlsNote.style, {
    margin: '0',
    lineHeight: '1.7',
    color: 'rgba(246, 241, 232, 0.82)',
  });
  controlsNote.textContent = 'Press A to toggle axis lines. Use the panel (top-right) to switch objects, scale them, and adjust noise, color, deformation, and decay.';

  Object.assign(persistenceNote.style, {
    margin: '0',
    lineHeight: '1.7',
    color: 'rgba(246, 241, 232, 0.82)',
  });
  persistenceNote.textContent = 'Sculpted shapes persist until you switch objects, refresh, or raise the Decay slider. The landmark canvas is the only webcam-position guide in the final build.';

  enterButton.id = 'enter-btn';
  enterButton.type = 'button';
  enterButton.textContent = 'Enter Gallery';
  Object.assign(enterButton.style, {
    justifySelf: 'start',
    marginTop: '8px',
    padding: '14px 22px',
    borderRadius: '999px',
    border: 'none',
    background: 'linear-gradient(135deg, #f4efe5 0%, #f0d7a1 100%)',
    color: '#151515',
    fontSize: '0.95rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: '0 18px 34px rgba(0,0,0,0.28)',
  });

  columns.append(mouseColumn, webcamColumn);
  panel.append(intro, heading, subtitle, columns, controlsNote, persistenceNote, enterButton);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const onKey = event => {
    if (event.key === 'Escape') {
      dismiss();
    }
  };

  cleanupActiveSplash = () => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    cleanupActiveSplash = null;
  };

  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  function dismiss() {
    if (dismissing) {
      return;
    }

    dismissing = true;
    document.removeEventListener('keydown', onKey);
    overlay.style.opacity = '0';
    window.setTimeout(() => {
      overlay.remove();
      cleanupActiveSplash = null;
      if (onDismiss) {
        onDismiss();
      }
    }, SPLASH_FADE_MS);
  }

  enterButton.addEventListener('click', dismiss);

  return { dismiss };
}

export function createHelpButton(onOpenSplash) {
  const existing = document.getElementById('gia-help-button');

  if (existing) {
    return existing;
  }

  const button = document.createElement('button');

  button.id = 'gia-help-button';
  button.type = 'button';
  button.textContent = '?';
  Object.assign(button.style, {
    position: 'fixed',
    top: `${FLOATING_UI_OFFSET}px`,
    left: `${FLOATING_UI_OFFSET}px`,
    width: `${HELP_BUTTON_SIZE}px`,
    height: `${HELP_BUTTON_SIZE}px`,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(7, 12, 21, 0.76)',
    color: '#f6f1e8',
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: '1.3rem',
    cursor: 'pointer',
    zIndex: String(FLOATING_UI_Z_INDEX),
    boxShadow: '0 16px 32px rgba(0,0,0,0.22)',
    backdropFilter: 'blur(14px)',
  });
  button.addEventListener('click', () => {
    onOpenSplash();
  });
  document.body.appendChild(button);

  return button;
}
