// Retro Fortune Cookie: loads Three.js, then builds the scene.
// Plain (non-module) script so index.html also works when opened by double-click.
(async () => {
const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");

// ---------- starfield ----------
const starsEl = document.getElementById("stars");
for (let i = 0; i < 90; i++) {
  const s = document.createElement("i");
  s.style.left = Math.random() * 100 + "%";
  s.style.top = Math.random() * 100 + "%";
  s.style.animationDelay = Math.random() * 2.5 + "s";
  if (Math.random() < .15) { s.style.width = s.style.height = "3px"; }
  starsEl.appendChild(s);
}

// ---------- renderer / scene ----------
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0.4, 6.5);

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.position.z = w < 600 ? 8.5 : 6.5;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize); resize();

// ---------- cel-shading ramp (3 hard bands) ----------
const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
ramp.needsUpdate = true;

scene.add(new THREE.AmbientLight(0xffb0d0, 0.9));
const key = new THREE.DirectionalLight(0xfff2d0, 2.4);
key.position.set(3, 4, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0x3df2ff, 1.2);
rim.position.set(-4, 1, -3); scene.add(rim);

const cookieMat = new THREE.MeshToonMaterial({ color: 0xf2a541, gradientMap: ramp, side: THREE.DoubleSide });
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x1a0b2e, side: THREE.BackSide });

// ---------- fortune cookie geometry ----------
// Start with a flattened sphere (thick disc), fold it in half, then bend the crease into a crescent.
function cookieHalf(side) {
  const g = new THREE.SphereGeometry(1, 72, 40, side > 0 ? 0 : Math.PI, Math.PI);
  const p = g.attributes.position;
  const k = 3.0;    // fold tightness
  const b = 2.1;    // crease bend
  for (let i = 0; i < p.count; i++) {
    const u = p.getZ(i);          // along the crease (split axis)
    const v = p.getX(i);          // across, gets folded
    const w = p.getY(i) * 0.085;  // thickness
    // fold
    const phi = v * k, rr = 1 / k - w;
    const Y = Math.sin(phi) * rr;
    const Z = 1 / k - Math.cos(phi) * rr;
    // bend crease
    const RB = 1 / b, a = u * b, d = RB + Z;
    // little bumpy dough wobble for hand-made feel
    const bump = 1 + 0.012 * Math.sin(u * 23 + v * 17);
    p.setXYZ(i, Math.sin(a) * d * bump, Y * bump, Math.cos(a) * d - RB);
  }
  g.computeVertexNormals();

  const mesh = new THREE.Mesh(g, cookieMat);
  // ink outline: inflate along normals, render back faces
  const og = g.clone();
  const op = og.attributes.position, on = og.attributes.normal;
  for (let i = 0; i < op.count; i++) {
    op.setXYZ(i, op.getX(i) + on.getX(i) * 0.035, op.getY(i) + on.getY(i) * 0.035, op.getZ(i) + on.getZ(i) * 0.035);
  }
  mesh.add(new THREE.Mesh(og, outlineMat));
  const pivot = new THREE.Group();
  pivot.add(mesh);
  return pivot;
}

const cookie = new THREE.Group();
const left = cookieHalf(-1), right = cookieHalf(1);
cookie.add(left, right);
cookie.rotation.set(0.5, 0, 0);
cookie.position.y = 0.15;
scene.add(cookie);

// ---------- paper slip ----------
// The saying is drawn straight onto the slip that slides out of the cookie.
const PW = 3.2, PH = 1.0;                      // slip size in world units
const paperCanvas = document.createElement("canvas");
paperCanvas.width = 1280; paperCanvas.height = 400;
const paperTex = new THREE.CanvasTexture(paperCanvas);
paperTex.colorSpace = THREE.SRGBColorSpace;
paperTex.anisotropy = 8;

function wrap(ctx, text, maxW) {
  const words = text.split(" "), lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
function drawPaper(saying, numbers) {
  const c = paperCanvas, x = c.getContext("2d"), W = c.width, H = c.height;
  x.fillStyle = "#fff8e7"; x.fillRect(0, 0, W, H);
  // faint ruled lines + red border like a printed slip
  x.strokeStyle = "rgba(224,36,94,.18)"; x.lineWidth = 3;
  for (let y = 70; y < H - 40; y += 56) { x.beginPath(); x.moveTo(40, y); x.lineTo(W - 40, y); x.stroke(); }
  x.strokeStyle = "#e0245e"; x.lineWidth = 6; x.strokeRect(18, 18, W - 36, H - 36);

  // saying: shrink font until it fits in 3 lines
  x.fillStyle = "#1a0b2e"; x.textAlign = "center"; x.textBaseline = "middle";
  let size = 78, lines;
  do { x.font = `${size}px VT323, monospace`; lines = wrap(x, saying, W - 120); size -= 4; }
  while (lines.length > 3 && size > 40);
  const lh = size * 1.0, top = (H - 80) / 2 - (lines.length - 1) * lh / 2;
  lines.forEach((l, i) => x.fillText(l, W / 2, top + i * lh));

  x.fillStyle = "#e0245e"; x.font = `bold 44px VT323, monospace`;
  x.fillText(`★ LUCKY NUMBERS: ${numbers} ★`, W / 2, H - 58);
  paperTex.needsUpdate = true;
}

const paper = new THREE.Mesh(
  new THREE.PlaneGeometry(PW, PH),
  new THREE.MeshBasicMaterial({ map: paperTex, side: THREE.DoubleSide })
);
const paperLine = new THREE.Mesh(new THREE.PlaneGeometry(PW + 0.08, PH + 0.08), outlineMat.clone());
paperLine.material.side = THREE.DoubleSide;
paperLine.position.z = -0.01;
paper.add(paperLine);
paper.scale.set(0.001, 0.4, 1);
paper.visible = false;
scene.add(paper);  // not parented to the spinning cookie, so it always faces you

// ---------- sparkles (4-point anime stars) ----------
function starTex() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d");
  x.translate(32, 32); x.fillStyle = "#fff";
  x.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 5 : 30, a = i * Math.PI / 4;
    x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath(); x.fill();
  return new THREE.CanvasTexture(c);
}
const N = 60;
const sp = new Float32Array(N * 3), seeds = [];
for (let i = 0; i < N; i++) {
  seeds.push({ r: 1.6 + Math.random() * 1.6, a: Math.random() * Math.PI * 2, y: (Math.random() - .5) * 3, s: .2 + Math.random() * .6 });
}
const spGeo = new THREE.BufferGeometry();
spGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
const sparkles = new THREE.Points(spGeo, new THREE.PointsMaterial({
  map: starTex(), size: 0.22, transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, color: 0xfff3a0
}));
scene.add(sparkles);

// crumbs that fly on crack
const crumbs = [];
const crumbGeo = new THREE.IcosahedronGeometry(0.05, 0);
function spawnCrumbs() {
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(crumbGeo, cookieMat);
    m.add(new THREE.Mesh(crumbGeo, outlineMat)); m.children[0].scale.setScalar(1.35);
    m.position.set((Math.random() - .5) * .3, .2, (Math.random() - .5) * .3);
    m.userData.v = new THREE.Vector3((Math.random() - .5) * 5, Math.random() * 4 + 1, (Math.random() - .5) * 3);
    m.userData.life = 1.4;
    m.scale.setScalar(.5 + Math.random());
    scene.add(m); crumbs.push(m);
  }
}

// ---------- fortunes (English only) ----------
const fortunes = [
  "A bold adventure begins the moment you stop waiting for permission.",
  "Your next big idea is hiding inside a small, boring task.",
  "Someone is quietly cheering for you. Make it worth the noise.",
  "The stars align for those who keep showing up.",
  "Today you will find exactly what you need, though not what you ordered.",
  "Turn up the volume on your life. The neighbors will cope.",
  "A rival becomes a friend. A friend becomes a legend.",
  "Your courage is louder than your doubts. Let it talk.",
  "Fortune favors the one who presses the button.",
  "Great things arrive at sunset, riding on neon light.",
  "Pack snacks. Your journey is longer and better than you think.",
  "The final episode is not yet written. You hold the pen."
];

const hintEl = document.getElementById("hint");
const sfxEl = document.getElementById("sfx");
const flashEl = document.getElementById("flash");

let state = "idle";  // idle | shaking | open
let t0 = 0, split = 0, hover = false;

function crack() {
  state = "shaking"; t0 = performance.now();
  hintEl.style.visibility = "hidden";
}
function burst() {
  state = "open"; t0 = performance.now();
  sfxEl.classList.remove("pop"); void sfxEl.offsetWidth; sfxEl.classList.add("pop");
  flashEl.classList.remove("go"); void flashEl.offsetWidth; flashEl.classList.add("go");
  spawnCrumbs();
  paper.visible = true;
  drawPaper(fortunes[Math.floor(Math.random() * fortunes.length)], lucky());
  setTimeout(() => { hintEl.textContent = "▶ CLICK FOR ANOTHER ◀"; hintEl.style.visibility = "visible"; }, 1200);
}
function reset() {
  state = "idle"; split = 0;
  paper.visible = false; paper.scale.set(0.001, 0.4, 1);
  hintEl.textContent = "▶ CLICK TO CRACK ◀";
}
function lucky() {
  const s = new Set(); while (s.size < 5) s.add(1 + Math.floor(Math.random() * 49));
  return [...s].sort((a, b) => a - b).join(" ");
}

addEventListener("pointerdown", () => {
  if (state === "idle") crack();
  else if (state === "open" && performance.now() - t0 > 900) reset();
});

// hover detection
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(9, 9);
addEventListener("pointermove", e => {
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
});

// ---------- loop ----------
const clock = new THREE.Clock();
function tick() {
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;
  const now = performance.now();

  ray.setFromCamera(mouse, camera);
  hover = ray.intersectObject(cookie, true).length > 0;
  document.body.style.cursor = hover || state === "open" ? "pointer" : "default";

  // float + turntable
  cookie.position.y = 0.15 + Math.sin(t * 1.6) * 0.08;
  cookie.rotation.y += dt * (state === "open" ? 0.15 : 0.5);
  const targetScale = hover && state === "idle" ? 1.08 : 1;
  cookie.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

  if (state === "shaking") {
    const e = (now - t0) / 650;
    const amp = 0.04 + e * 0.12;
    cookie.position.x = Math.sin(now * 0.09) * amp;
    cookie.rotation.z = Math.sin(now * 0.07) * amp;
    if (e >= 1) { cookie.position.x = 0; cookie.rotation.z = 0; burst(); }
  }
  if (state === "open") {
    split += (1 - split) * 0.12;
    const ps = Math.min(1, (now - t0) / 700);
    const ease = 1 - Math.pow(1 - ps, 3);
    // slip pulls out sideways, unfurls to full height, and floats up out of the cookie
    // shrink the slip on narrow screens so the whole saying stays visible
    const dist = camera.position.z - 1.0;
    const visW = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist * camera.aspect;
    const fit = Math.min(1, (visW * 0.92) / PW);
    paper.scale.set(Math.max(0.001, ease * fit), (0.4 + 0.6 * ease) * fit, 1);
    paper.position.set(0, cookie.position.y + 0.15 * ease, 0.6 + 0.4 * ease);
    paper.rotation.set(-0.08, Math.sin(t * 0.9) * 0.12, Math.sin(t * 2) * 0.03);
  } else if (state === "idle") {
    split += (0 - split) * 0.2;
  }
  // halves fly apart & tilt
  right.position.set(split * 1.2, split * 0.1, 0);
  right.rotation.set(0, split * -0.5, split * -0.6);
  left.position.set(-split * 1.2, split * 0.1, 0);
  left.rotation.set(0, split * 0.5, split * 0.6);

  // sparkles orbit
  for (let i = 0; i < N; i++) {
    const s = seeds[i]; s.a += dt * s.s * 0.5;
    sp[i * 3] = Math.cos(s.a) * s.r;
    sp[i * 3 + 1] = s.y + Math.sin(t * s.s * 3 + i) * 0.15;
    sp[i * 3 + 2] = Math.sin(s.a) * s.r - 0.5;
  }
  spGeo.attributes.position.needsUpdate = true;
  sparkles.material.size = 0.18 + Math.sin(t * 6) * 0.05;

  // crumbs physics
  for (let i = crumbs.length - 1; i >= 0; i--) {
    const c = crumbs[i];
    c.userData.v.y -= 9.8 * dt;
    c.position.addScaledVector(c.userData.v, dt);
    c.rotation.x += dt * 8; c.rotation.y += dt * 6;
    c.userData.life -= dt;
    if (c.userData.life <= 0) { scene.remove(c); crumbs.splice(i, 1); }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
})();
