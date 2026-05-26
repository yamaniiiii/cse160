import "./styles.css";
import { initShaders } from "../lib/cuon-utils";
import getContext from "./Context";
import Camera from "./Camera";
import World from "./World";
import sodaColorImg from "./SodaColor.png";
import cupTexImg from "./Cocacolatexture.jpg";
import stickerImg from "./Sticker001.png";

// ─── Shaders ─────────────────────────────────────────────────────────────────

const VSHADER_SOURCE = `
  attribute vec3 aPosition;
  attribute vec2 uv;
  attribute vec3 aNormal;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  varying vec2  vUv;
  varying vec3  vWorldPos;
  varying vec3  vNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
    // Normal matrix = transpose(inverse(modelMatrix)) upper-left 3×3
    // For uniform scaling this simplifies to mat3(modelMatrix)
    vNormal = normalize(mat3(modelMatrix) * aNormal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
    vUv = uv;
  }
`;

const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  uniform sampler2D uTexture0;
  uniform sampler2D uTexture1;
  uniform sampler2D uTexture2;
  uniform sampler2D uTexture3;
  uniform sampler2D uTexture4;
  uniform sampler2D uTexture5;

  uniform float uTexWeight;
  uniform vec4  uBaseColor;
  uniform int   uWhichTexture;
  uniform float uIsWater;

  // Lighting
  uniform vec3  uLightPos;
  uniform vec3  uLightColor;
  uniform int   uLightOn;
  uniform int   uNormalVis;

  // Spotlight
  uniform vec3  uSpotPos;
  uniform vec3  uSpotDir;
  uniform float uSpotCutoff;  // cosine of half-angle
  uniform int   uSpotOn;

  // Camera position for specular
  uniform vec3  uEyePos;

  varying vec2  vUv;
  varying vec3  vWorldPos;
  varying vec3  vNormal;

  vec3 phong(vec3 N, vec3 L, vec3 V, vec3 lightCol, vec3 diffCol) {
    float kA = 0.2;
    float kD = 0.8;
    float kS = 0.5;
    float shininess = 32.0;

    vec3 ambient  = kA * lightCol * diffCol;
    float diff    = max(dot(N, L), 0.0);
    vec3 diffuse  = kD * diff * lightCol * diffCol;
    vec3 R        = reflect(-L, N);
    float spec    = pow(max(dot(V, R), 0.0), shininess);
    vec3 specular = kS * spec * lightCol;

    return ambient + diffuse + specular;
  }

  void main() {
    // Base surface color
    vec4 texColor;
    if      (uWhichTexture == 0) texColor = texture2D(uTexture0, vUv);
    else if (uWhichTexture == 1) texColor = texture2D(uTexture1, vUv);
    else if (uWhichTexture == 3) texColor = texture2D(uTexture3, vUv);
    else if (uWhichTexture == 4) texColor = texture2D(uTexture4, vUv);
    else if (uWhichTexture == 5) texColor = texture2D(uTexture5, vUv);
    else                         texColor = texture2D(uTexture2, vUv);

    vec4 surfaceColor;
    if (uIsWater > 0.5) {
      vec2 islandCenter = vec2(24.0, 23.0);
      vec2 diff = vWorldPos.xz - islandCenter;
      float dist = length(diff);
      float t = clamp((dist - 4.0) / 18.0, 0.0, 1.0);
      vec4 shallow = vec4(0.18, 0.62, 0.78, 1.0);
      vec4 deep    = vec4(0.02, 0.18, 0.45, 1.0);
      surfaceColor = mix(shallow, deep, t);
    } else {
      surfaceColor = mix(uBaseColor, texColor, uTexWeight);
    }

    // Normal visualisation mode
    if (uNormalVis == 1) {
      gl_FragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
      return;
    }

    if (uLightOn == 0) {
      gl_FragColor = surfaceColor;
      return;
    }

    vec3 N = normalize(vNormal);
    vec3 V = normalize(uEyePos - vWorldPos);
    vec3 col = vec3(0.0);

    // Point light
    vec3 L1 = normalize(uLightPos - vWorldPos);
    col += phong(N, L1, V, uLightColor, surfaceColor.rgb);

    // Spotlight
    if (uSpotOn == 1) {
      vec3 L2  = normalize(uSpotPos - vWorldPos);
      vec3 SD  = normalize(uSpotDir);
      float cs = dot(-L2, SD);
      if (cs > uSpotCutoff) {
        float edge = clamp((cs - uSpotCutoff) / 0.05, 0.0, 1.0);
        col += edge * phong(N, L2, V, vec3(1.0, 0.95, 0.8), surfaceColor.rgb);
      }
    }

    gl_FragColor = vec4(col, surfaceColor.a);
  }
`;

// ─── GL setup ────────────────────────────────────────────────────────────────

const gl = getContext();

if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  console.error("Failed to initialise shaders.");
}

gl.clearColor(0.53, 0.81, 0.98, 1.0);
gl.enable(gl.DEPTH_TEST);

// Cache all attribute/uniform locations once
gl.locs = {
  aPosition:        gl.getAttribLocation( gl.program, "aPosition"),
  uv:               gl.getAttribLocation( gl.program, "uv"),
  aNormal:          gl.getAttribLocation( gl.program, "aNormal"),
  modelMatrix:      gl.getUniformLocation(gl.program, "modelMatrix"),
  viewMatrix:       gl.getUniformLocation(gl.program, "viewMatrix"),
  projectionMatrix: gl.getUniformLocation(gl.program, "projectionMatrix"),
  uTexture0:        gl.getUniformLocation(gl.program, "uTexture0"),
  uTexture1:        gl.getUniformLocation(gl.program, "uTexture1"),
  uTexture2:        gl.getUniformLocation(gl.program, "uTexture2"),
  uTexture3: gl.getUniformLocation(gl.program, "uTexture3"),
  uTexture4: gl.getUniformLocation(gl.program, "uTexture4"),
  uTexture5: gl.getUniformLocation(gl.program, "uTexture5"),

  texWeight:        gl.getUniformLocation(gl.program, "uTexWeight"),
  baseColor:        gl.getUniformLocation(gl.program, "uBaseColor"),
  whichTexture:     gl.getUniformLocation(gl.program, "uWhichTexture"),
  isWater:          gl.getUniformLocation(gl.program, "uIsWater"),
  // Lighting
  uLightPos:        gl.getUniformLocation(gl.program, "uLightPos"),
  uLightColor:      gl.getUniformLocation(gl.program, "uLightColor"),
  uLightOn:         gl.getUniformLocation(gl.program, "uLightOn"),
  uNormalVis:       gl.getUniformLocation(gl.program, "uNormalVis"),
  uEyePos:          gl.getUniformLocation(gl.program, "uEyePos"),
  // Spotlight
  uSpotPos:         gl.getUniformLocation(gl.program, "uSpotPos"),
  uSpotDir:         gl.getUniformLocation(gl.program, "uSpotDir"),
  uSpotCutoff:      gl.getUniformLocation(gl.program, "uSpotCutoff"),
  uSpotOn:          gl.getUniformLocation(gl.program, "uSpotOn"),
};

// ─── Texture loading ──────────────────────────────────────────────────────────

let texturesLoaded = 0;
const TOTAL_TEXTURES = 5;

function loadTexture(path, unit, uniformLoc) {
  const tex = gl.createTexture();
  const img = new Image();
  img.onload = () => {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.uniform1i(uniformLoc, unit);
    texturesLoaded++;
    if (texturesLoaded === TOTAL_TEXTURES) startApp();
  };
  img.onerror = () => {
    console.warn(`Texture failed to load: ${path}`);
    texturesLoaded++;
    if (texturesLoaded === TOTAL_TEXTURES) startApp();
  };
  img.src = path;
}

import brickImg from "./img/brick.png";
import stoneImg from "./img/stone.png";
import grassImg from "./img/grass.png";

loadTexture(brickImg, 0, gl.locs.uTexture0);
loadTexture(stoneImg, 1, gl.locs.uTexture1);
loadTexture(grassImg, 2, gl.locs.uTexture2);
loadTexture(sodaColorImg, 3, gl.locs.uTexture3);
loadTexture(cupTexImg, 4, gl.locs.uTexture4);
loadTexture(stickerImg, 5, gl.locs.uTexture5);
// ─── Lighting state ───────────────────────────────────────────────────────────

let g_lightOn    = true;
let g_normalVis  = false;
let g_spotOn     = true;
let g_lightAngle = 0;          // radians, animated
let g_lightSlider = 0;         // -1..1 from slider
let g_lightColor = [1, 1, 1];  // RGB 0-1

// Spotlight: fixed above, aimed down-forward
const SPOT_POS = [16, 12, 16];
const SPOT_DIR = [0, -1, 0];
const SPOT_CUTOFF = Math.cos((20 * Math.PI) / 180); // 20° half-angle

// ─── UI ───────────────────────────────────────────────────────────────────────

function buildUI() {
  const panel = document.createElement("div");
  panel.style.cssText = `
    position: fixed; top: 10px; right: 10px;
    background: rgba(0,0,0,0.6); color: white;
    font-family: sans-serif; font-size: 13px;
    padding: 10px 14px; border-radius: 8px;
    display: flex; flex-direction: column; gap: 8px;
    z-index: 20; min-width: 220px;
  `;

  const btn = (label, onClick) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = "padding:4px 8px;cursor:pointer;border-radius:4px;border:none;background:#555;color:white;";
    b.addEventListener("click", onClick);
    return b;
  };

  const row = (...els) => {
    const d = document.createElement("div");
    d.style.cssText = "display:flex;align-items:center;gap:8px;";
    els.forEach(e => d.appendChild(e));
    return d;
  };

  const label = t => { const s = document.createElement("span"); s.textContent = t; return s; };

  // Light on/off
  const lightBtn = btn("Light: ON", () => {
    g_lightOn = !g_lightOn;
    lightBtn.textContent = "Light: " + (g_lightOn ? "ON" : "OFF");
  });

  // Normal vis
  const normBtn = btn("Normals: OFF", () => {
    g_normalVis = !g_normalVis;
    normBtn.textContent = "Normals: " + (g_normalVis ? "ON" : "OFF");
  });

  // Spotlight on/off
  const spotBtn = btn("Spotlight: ON", () => {
    g_spotOn = !g_spotOn;
    spotBtn.textContent = "Spotlight: " + (g_spotOn ? "ON" : "OFF");
  });

  // Light position slider
  const posSlider = document.createElement("input");
  posSlider.type = "range"; posSlider.min = -1; posSlider.max = 1;
  posSlider.step = 0.01; posSlider.value = 0;
  posSlider.style.flex = "1";
  posSlider.addEventListener("input", () => { g_lightSlider = parseFloat(posSlider.value); });

  // Light color sliders (R G B)
  const colorSlider = (ch, idx) => {
    const s = document.createElement("input");
    s.type = "range"; s.min = 0; s.max = 1; s.step = 0.01; s.value = 1;
    s.style.flex = "1";
    s.addEventListener("input", () => { g_lightColor[idx] = parseFloat(s.value); });
    return s;
  };

  panel.appendChild(lightBtn);
  panel.appendChild(normBtn);
  panel.appendChild(spotBtn);
  panel.appendChild(row(label("Light pos:"), posSlider));
  panel.appendChild(row(label("R:"), colorSlider("R", 0)));
  panel.appendChild(row(label("G:"), colorSlider("G", 1)));
  panel.appendChild(row(label("B:"), colorSlider("B", 2)));

  document.body.appendChild(panel);
}

// ─── App start ────────────────────────────────────────────────────────────────

function startApp() {
  buildUI();

  const camera = new Camera([24, 1.6, 36], [24, 1.6, 35]);
  const world  = new World();
  world.init();

  // Keyboard state
  const keys = {};
  document.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true;  });
  document.addEventListener("keyup",   e => { keys[e.key.toLowerCase()] = false; });

  document.addEventListener("keydown", e => {
    switch (e.key.toLowerCase()) {
      case "f": world.addBlock(camera);    break;
      case "r": world.deleteBlock(camera); break;
    }
  });

  // Mouse look via pointer lock
  let pointerLocked = false;

  gl.canvas.addEventListener("click", () => {
    gl.canvas.requestPointerLock();
  });

  document.addEventListener("pointerlockchange", () => {
    pointerLocked = document.pointerLockElement === gl.canvas;
  });

  document.addEventListener("mousemove", e => {
    if (!pointerLocked) return;
    camera.look(e.movementX, e.movementY);
  });

  // Render loop
  function tick(time = 0) {
    if (keys["w"]) camera.moveForward();
    if (keys["s"]) camera.moveBackward();
    if (keys["a"]) camera.moveLeft();
    if (keys["d"]) camera.moveRight();
    if (keys["q"]) camera.panLeft();
    if (keys["e"]) camera.panRight();

    // Animate light: orbit around world centre + slider offset
    g_lightAngle = time * 0.001;
    const radius = 12;
    const cx = 16, cz = 16;
    const lightX = cx + radius * Math.cos(g_lightAngle) + g_lightSlider * 10;
    const lightY = 6;
    const lightZ = cz + radius * Math.sin(g_lightAngle);
    const lightPos = [lightX, lightY, lightZ];

    // Pass lighting uniforms
    const locs = gl.locs;
    gl.uniform3fv(locs.uLightPos,   lightPos);
    gl.uniform3fv(locs.uLightColor, g_lightColor);
    gl.uniform1i(locs.uLightOn,     g_lightOn   ? 1 : 0);
    gl.uniform1i(locs.uNormalVis,   g_normalVis ? 1 : 0);
    gl.uniform3fv(locs.uEyePos,     camera.eye.elements);
    gl.uniform3fv(locs.uSpotPos,    SPOT_POS);
    gl.uniform3fv(locs.uSpotDir,    SPOT_DIR);
    gl.uniform1f(locs.uSpotCutoff,  SPOT_CUTOFF);
    gl.uniform1i(locs.uSpotOn,      g_spotOn ? 1 : 0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    world.render(gl, camera, lightPos);

    requestAnimationFrame(tick);
  }

  tick();
}

// ─── Crosshair ───────────────────────────────────────────────────────────────

const crosshair = document.createElement("div");
crosshair.style.cssText = `
  position: fixed; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 20px; height: 20px;
  pointer-events: none; z-index: 10;
`;
crosshair.innerHTML = `
  <div style="position:absolute;top:50%;left:0;right:0;height:2px;background:rgba(255,255,255,0.8);margin-top:-1px;"></div>
  <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:rgba(255,255,255,0.8);margin-left:-1px;"></div>
`;
document.body.appendChild(crosshair);

// ─── HUD ─────────────────────────────────────────────────────────────────────

const hud = document.createElement("div");
hud.style.cssText = `
  position: fixed; bottom: 20px; left: 50%;
  transform: translateX(-50%);
  color: white; font-family: sans-serif; font-size: 14px;
  background: rgba(0,0,0,0.45); padding: 6px 14px; border-radius: 6px;
  pointer-events: none; z-index: 10;
`;
hud.textContent = "Click to capture mouse | WASD move | Q/E turn | F add block | R delete block";
document.body.appendChild(hud);

document.addEventListener("pointerlockchange", () => {
  hud.style.opacity = document.pointerLockElement ? "0" : "1";
});