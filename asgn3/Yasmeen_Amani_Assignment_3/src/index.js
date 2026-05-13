import "./styles.css";
import { initShaders } from "../lib/cuon-utils";
import getContext from "./Context";
import Camera from "./Camera";
import World from "./World";

// ─── Shaders ─────────────────────────────────────────────────────────────────

const VSHADER_SOURCE = `
  attribute vec3 aPosition;
  attribute vec2 uv;

  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(aPosition, 1.0);
    vWorldPos = worldPos.xyz;
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

  uniform float uTexWeight;
  uniform vec4  uBaseColor;
  uniform int   uWhichTexture;
  uniform float uIsWater;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vec4 texColor;
    if      (uWhichTexture == 0) texColor = texture2D(uTexture0, vUv);
    else if (uWhichTexture == 1) texColor = texture2D(uTexture1, vUv);
    else                         texColor = texture2D(uTexture2, vUv);

    vec4 baseResult = mix(uBaseColor, texColor, uTexWeight);

    if (uIsWater > 0.5) {
      vec2 islandCenter = vec2(24.0, 23.0);
      vec2 diff = vWorldPos.xz - islandCenter;
      float dist = length(diff);
      float t = clamp((dist - 4.0) / 18.0, 0.0, 1.0);
      vec4 shallow = vec4(0.18, 0.62, 0.78, 1.0);
      vec4 deep    = vec4(0.02, 0.18, 0.45, 1.0);
      gl_FragColor = mix(shallow, deep, t);
    } else {
      gl_FragColor = baseResult;
    }
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
  modelMatrix:      gl.getUniformLocation(gl.program, "modelMatrix"),
  viewMatrix:       gl.getUniformLocation(gl.program, "viewMatrix"),
  projectionMatrix: gl.getUniformLocation(gl.program, "projectionMatrix"),
  uTexture0:        gl.getUniformLocation(gl.program, "uTexture0"),
  uTexture1:        gl.getUniformLocation(gl.program, "uTexture1"),
  uTexture2:        gl.getUniformLocation(gl.program, "uTexture2"),
  texWeight:        gl.getUniformLocation(gl.program, "uTexWeight"),
  baseColor:        gl.getUniformLocation(gl.program, "uBaseColor"),
  whichTexture:     gl.getUniformLocation(gl.program, "uWhichTexture"),
  isWater:          gl.getUniformLocation(gl.program, "uIsWater"),
};

// ─── Texture loading ──────────────────────────────────────────────────────────

let texturesLoaded = 0;
const TOTAL_TEXTURES = 3;

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

// ─── App start ────────────────────────────────────────────────────────────────

function startApp() {
  const camera = new Camera([24, 1.6, 36], [24, 1.6, 35]);
  //const camera = new Camera([24, 1.6, 24], [24, 1.6, 23]);
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
  function tick() {
    if (keys["w"]) camera.moveForward();
    if (keys["s"]) camera.moveBackward();
    if (keys["a"]) camera.moveLeft();
    if (keys["d"]) camera.moveRight();
    if (keys["q"]) camera.panLeft();
    if (keys["e"]) camera.panRight();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    world.render(gl, camera);

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