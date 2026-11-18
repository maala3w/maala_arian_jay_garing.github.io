// 3D behaviour: the hero scene turns with the pointer, and cards tilt towards it.
// The look itself lives in css/depth.css; without this file the page is still 3D, just static.

const TILT_CARDS = [
  '.identity-card', '.timeline__card', '.skill-card', '.project-card', '.paper-card', '.exp-card',
  '.lead-card', '.ach-card', '.training-card', '.principle', '.recognition', '.contact__card',
].join(', ');

// The scene faces the viewer straight on, so the floating ID stays centred on every screen.
const HERO_ANGLE = { x: 4, y: 0 }; // Keep in step with --rx / --ry in css/hero-id.css.

function initHeroScene() {
  const scene = document.querySelector('.hero__visual');
  const hero = scene?.closest('.hero');
  if (!scene || !hero || !('IntersectionObserver' in window)) return;

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let frame = 0;

  const tick = (time) => {
    current.x += (target.x - current.x) * 0.07;
    current.y += (target.y - current.y) * 0.07;
    const rotateY = HERO_ANGLE.y + Math.sin(time / 2600) * 5 + current.x * 16;
    const rotateX = HERO_ANGLE.x + Math.cos(time / 3400) * 2.5 - current.y * 11;
    scene.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
    scene.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
    scene.style.setProperty('--sx', `${(rotateY * 0.9).toFixed(1)}px`);
    frame = requestAnimationFrame(tick);
  };

  // Only animate while the hero is on screen.
  new IntersectionObserver(([entry]) => {
    cancelAnimationFrame(frame);
    frame = entry.isIntersecting ? requestAnimationFrame(tick) : 0;
  }).observe(hero);

  hero.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const rect = hero.getBoundingClientRect();
    target.x = (event.clientX - rect.left) / rect.width - 0.5;
    target.y = (event.clientY - rect.top) / rect.height - 0.5;
  });
  hero.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; });
}

// Card motion is a damped spring rather than a fixed-speed transition: cards have some weight,
// lag slightly behind the pointer, and overshoot a little when they swing back.
const SPRING = { stiffness: 190, damping: 17 };
const AT_REST = 0.02;
const LIFT = { hover: 16, pressed: -5 };

function initCardTilt() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const springs = new Map();
  let active = null;
  let frame = 0;
  let lastTime = 0;

  const AXES = ['rx', 'ry', 'lift'];

  function step(state, dt) {
    AXES.forEach((axis) => {
      const force = (state.target[axis] - state[axis]) * SPRING.stiffness - state.velocity[axis] * SPRING.damping;
      state.velocity[axis] += force * dt;
      state[axis] += state.velocity[axis] * dt;
    });
  }

  function isResting(state) {
    return AXES.every((axis) => Math.abs(state[axis]) < AT_REST && Math.abs(state.velocity[axis]) < AT_REST);
  }

  function paint(card, state) {
    card.style.transform = `perspective(1000px) rotateX(${state.rx.toFixed(3)}deg) rotateY(${state.ry.toFixed(3)}deg) translateZ(${state.lift.toFixed(2)}px)`;
    // The cast shadow slides away from the raised edge, and spreads as the card lifts.
    card.style.setProperty('--sx', `${(state.ry * -2.2).toFixed(1)}px`);
    card.style.setProperty('--sy', `${(state.rx * 2.2).toFixed(1)}px`);
    card.style.setProperty('--lift', state.lift.toFixed(2));
    // Contents that can't lift in 3D (clipped cards) shift slightly with the tilt instead.
    card.style.setProperty('--tx', (state.ry / 8).toFixed(3));
    card.style.setProperty('--ty', (state.rx / -8).toFixed(3));
  }

  function settle(card) {
    card.classList.remove('is-sprung');
    ['transform', '--sx', '--sy', '--lift', '--tx', '--ty', '--gx', '--gy'].forEach((name) => card.style.removeProperty(name));
    springs.delete(card);
  }

  function tick(time) {
    // Small fixed steps stay stable even if a frame runs late.
    let remaining = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    while (remaining > 0) {
      const dt = Math.min(remaining, 1 / 120);
      springs.forEach((state) => step(state, dt));
      remaining -= dt;
    }
    springs.forEach((state, card) => {
      if (card !== active && isResting(state)) settle(card);
      else paint(card, state);
    });
    frame = springs.size ? requestAnimationFrame(tick) : 0;
  }

  function wake() {
    if (frame) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function springFor(card) {
    let state = springs.get(card);
    if (!state) {
      // A finished entrance animation would otherwise keep overriding the tilt.
      card.classList.remove('is-entering');
      const rect = card.getBoundingClientRect();
      state = {
        rx: 0, ry: 0, lift: 0,
        velocity: { rx: 0, ry: 0, lift: 0 },
        target: { rx: 0, ry: 0, lift: 0 },
        box: { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height },
      };
      springs.set(card, state);
      card.classList.add('is-sprung');
    }
    return state;
  }

  function release() {
    if (!active) return;
    const state = springs.get(active);
    if (state) state.target = { rx: 0, ry: 0, lift: 0 };
    active.classList.remove('is-tilting', 'is-pressed');
    active = null;
    wake();
  }

  // Delegated, because the project and research filters re-render their cards.
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const card = event.target.closest?.(TILT_CARDS) || null;
    if (card !== active) {
      release();
      if (!card || card.matches('.reveal:not(.is-visible)')) return;
      active = card;
      active.classList.add('is-tilting');
    }
    if (!active) return;
    const state = springFor(active);
    const { box } = state;
    const px = Math.min(Math.max((event.pageX - box.left) / box.width, 0), 1) - 0.5;
    const py = Math.min(Math.max((event.pageY - box.top) / box.height, 0), 1) - 0.5;
    // Wide cards turn less, so their far edge doesn't swing out too far.
    const limit = Math.min(7, 1800 / box.width);
    state.target.ry = px * 2 * limit;
    state.target.rx = py * -2 * limit;
    state.target.lift = active.classList.contains('is-pressed') ? LIFT.pressed : LIFT.hover;
    active.style.setProperty('--gx', `${((px + 0.5) * 100).toFixed(1)}%`);
    active.style.setProperty('--gy', `${((py + 0.5) * 100).toFixed(1)}%`);
    wake();
  });

  // Pressing pushes the card into the page; letting go lets it spring back up.
  document.addEventListener('pointerdown', (event) => {
    if (!active || event.pointerType !== 'mouse' || !active.contains(event.target)) return;
    active.classList.add('is-pressed');
    springFor(active).target.lift = LIFT.pressed;
    wake();
  });
  document.addEventListener('pointerup', () => {
    if (!active) return;
    active.classList.remove('is-pressed');
    springFor(active).target.lift = LIFT.hover;
    wake();
  });

  document.documentElement.addEventListener('pointerleave', release);
}

export function initDepth() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  initHeroScene();
  initCardTilt();
}
