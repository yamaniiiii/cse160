// BlockyAnimal.js - Asgn2 Blocky 3D Animal

// ---- GLSL Shaders ----
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotation;
  void main() {
    gl_Position = u_GlobalRotation * u_ModelMatrix * a_Position;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_Color;
  void main() {
    gl_FragColor = u_Color;
  }
`;

// ---- Globals ----
var gl, canvas;
var a_Position, u_ModelMatrix, u_GlobalRotation, u_Color;

// Global rotation (slider)
var g_globalRotX = 0;
var g_globalRotY = 180;

// Joint angles (sliders)
var g_upperArmAngle  = 0;   // L upper arm (shoulder)
var g_lowerArmAngle  = 0;   // L lower arm (elbow)
var g_handAngle      = 0;   // L hand (wrist) — 3rd level joint
var g_upperLegAngle  = 0;   // L upper leg (hip)
var g_lowerLegAngle  = 0;   // L lower leg (knee)
var g_footAngle      = 0;   // L foot (ankle) — 3rd level joint
var g_tailAngle      = 0;   // tail base
var g_upperArmSwingY = 0;

// Animation
var g_animOn    = false;
var g_pokeOn    = false;
var g_pokeTimer = 0;
var g_time      = 0;
var g_lastTime  = 0;
var g_fps       = 0;
var g_frameCount = 0;
var g_fpsTimer  = 0;

// Mouse drag rotation
var g_isDragging  = false;
var g_lastMouseX  = 0;
var g_lastMouseY  = 0;

// ---- Pre-allocated buffer ----
var g_cubeBuffer   = null;
var g_sphereBuffer = null;
var g_sphereVerts  = null;
var g_sphereCount  = 0;

// ---- Matrix class (column-major, matches WebGL) ----
class Matrix4 {
  constructor() { this.elements = new Float32Array(16); this.setIdentity(); }

  setIdentity() {
    var e = this.elements;
    e[0]=1; e[4]=0; e[8]=0;  e[12]=0;
    e[1]=0; e[5]=1; e[9]=0;  e[13]=0;
    e[2]=0; e[6]=0; e[10]=1; e[14]=0;
    e[3]=0; e[7]=0; e[11]=0; e[15]=1;
    return this;
  }

  set(m) {
    for (var i = 0; i < 16; i++) this.elements[i] = m.elements[i];
    return this;
  }

  multiply(m) {
    var a = this.elements, b = m.elements, r = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var sum = 0;
        for (var k = 0; k < 4; k++) sum += a[i + k*4] * b[k + j*4];
        r[i + j*4] = sum;
      }
    }
    this.elements = r;
    return this;
  }

  translate(x, y, z) {
    var t = new Matrix4();
    t.elements[12] = x; t.elements[13] = y; t.elements[14] = z;
    return this.multiply(t);
  }

  scale(x, y, z) {
    var s = new Matrix4();
    s.elements[0] = x; s.elements[5] = y; s.elements[10] = z;
    return this.multiply(s);
  }

  rotate(angle, x, y, z) {
    var rad = angle * Math.PI / 180;
    var c = Math.cos(rad), s = Math.sin(rad);
    var len = Math.sqrt(x*x + y*y + z*z);
    if (len === 0) return this;
    x /= len; y /= len; z /= len;
    var r = new Matrix4();
    var e = r.elements;
    e[0]  =  c + x*x*(1-c);     e[4]  = x*y*(1-c) - z*s;  e[8]  = x*z*(1-c) + y*s;
    e[1]  = y*x*(1-c) + z*s;   e[5]  =  c + y*y*(1-c);    e[9]  = y*z*(1-c) - x*s;
    e[2]  = z*x*(1-c) - y*s;   e[6]  = z*y*(1-c) + x*s;   e[10] =  c + z*z*(1-c);
    return this.multiply(r);
  }
}

// ---- Cube vertices (36 verts, 2 triangles per face, 6 faces) ----
// Unit cube centered at origin [-0.5, 0.5]
var CUBE_VERTS = new Float32Array([
  // Front
  -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5,
  -0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  // Back
   0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,
   0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5,
  // Left
  -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, -0.5, 0.5, 0.5,
  -0.5,-0.5,-0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5,
  // Right
   0.5,-0.5, 0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5,
   0.5,-0.5, 0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,
  // Top
  -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5,
  -0.5, 0.5, 0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5,
  // Bottom
  -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5,
  -0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5,
]);

// ---- Build sphere vertex array once ----
function buildSphereVerts(stacks, slices) {
  var verts = [];
  for (var i = 0; i < stacks; i++) {
    var phi1 = (i / stacks) * Math.PI - Math.PI / 2;
    var phi2 = ((i + 1) / stacks) * Math.PI - Math.PI / 2;
    for (var j = 0; j < slices; j++) {
      var th1 = (j / slices) * 2 * Math.PI;
      var th2 = ((j + 1) / slices) * 2 * Math.PI;
      // quad as 2 triangles
      var pts = [
        [Math.cos(phi1)*Math.cos(th1), Math.sin(phi1), Math.cos(phi1)*Math.sin(th1)],
        [Math.cos(phi1)*Math.cos(th2), Math.sin(phi1), Math.cos(phi1)*Math.sin(th2)],
        [Math.cos(phi2)*Math.cos(th2), Math.sin(phi2), Math.cos(phi2)*Math.sin(th2)],
        [Math.cos(phi2)*Math.cos(th1), Math.sin(phi2), Math.cos(phi2)*Math.sin(th1)],
      ];
      // tri 1
      verts.push(...pts[0], ...pts[1], ...pts[2]);
      // tri 2
      verts.push(...pts[0], ...pts[2], ...pts[3]);
    }
  }
  return new Float32Array(verts);
}

// ---- Setup ----
function main() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas);
  if (!gl) { console.log('No WebGL'); return; }

  gl.enable(gl.DEPTH_TEST);

  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Shader init failed'); return;
  }

  a_Position      = gl.getAttribLocation(gl.program,  'a_Position');
  u_ModelMatrix   = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotation= gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_Color         = gl.getUniformLocation(gl.program, 'u_Color');

  // Pre-allocate cube buffer
  g_cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, CUBE_VERTS, gl.STATIC_DRAW);

  // Pre-allocate sphere buffer
  g_sphereVerts = buildSphereVerts(12, 16);
  g_sphereCount = g_sphereVerts.length / 3;
  g_sphereBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, g_sphereVerts, gl.STATIC_DRAW);

  // Mouse events for rotation
  canvas.onmousedown = function(ev) {
    if (ev.shiftKey) { triggerPoke(); return; }
    g_isDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  };
  canvas.onmousemove = function(ev) {
    if (!g_isDragging) return;
    var dx = ev.clientX - g_lastMouseX;
    var dy = ev.clientY - g_lastMouseY;
    g_globalRotY += dx * 0.5;
    g_globalRotX += dy * 0.5;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
    renderScene();
  };
  canvas.onmouseup   = function() { g_isDragging = false; };
  canvas.onmouseleave= function() { g_isDragging = false; };

  gl.clearColor(0.12, 0.12, 0.16, 1.0);
  renderScene();
}

// ---- Draw cube with matrix M and color ----
function drawCube(M, color) {
  gl.uniform4f(u_Color, color[0], color[1], color[2], color[3]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

//draw sphere with matrix M and color 
function drawSphere(M, color) {
  gl.uniform4f(u_Color, color[0], color[1], color[2], color[3]);
  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_sphereBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, g_sphereCount);
}

//woooo colors
var C_BODY    = [0.690, 0.871, 1.00, 1.0];  // brown
var C_FACE    = [0.860, 0.502, 0.0344, 1.0];  // tan/face
var C_DARK    = [0.634, 0.842, 0.990, 1.0];  // dark brown limbs
var C_EAR     = [0.690, 0.871, 1.00, 1.0];  // ear
var C_TAIL    = [0.634, 0.842, 0.990, 1.0];  // tail
var C_BLUSH   = [0.8588, 0.2706, 0.5569, 1.0]; // blush
var C_EYE     = [0.00, 0.00, 0.00, 1.0];  // eye

// global rotation matrix
function getGlobalRotation() {
  var G = new Matrix4();
  G.rotate(g_globalRotX, 1, 0, 0);
  G.rotate(g_globalRotY, 0, 1, 0);
  return G;
}

// animation angles (set by updateAnimationAngles) 
var g_anim_upperArm = 0;
var g_anim_lowerArm = 0;
var g_anim_hand     = 0;
var g_anim_upperLeg = 0;
var g_anim_lowerLeg = 0;
var g_anim_foot     = 0;
var g_anim_tail     = 0;
var g_anim_rUpperArm= 0;
var g_anim_rLowerArm= 0;
var g_anim_rUpperLeg= 0;
var g_anim_rLowerLeg= 0;

function updateAnimationAngles() {
  var t = g_time;

  if (g_pokeOn) {
    // Poke: monkey jumps and waves
    var p = Math.min(g_pokeTimer / 60, 1.0);
    g_anim_upperArm  =  80 * Math.sin(p * Math.PI);
    g_anim_lowerArm  = -60 * Math.sin(p * Math.PI);
    g_anim_hand      =  40 * Math.sin(p * Math.PI);
    g_anim_rUpperArm = -80 * Math.sin(p * Math.PI);
    g_anim_rLowerArm =  60 * Math.sin(p * Math.PI);
    g_anim_upperLeg  =  20 * Math.sin(p * Math.PI);
    g_anim_rUpperLeg = -20 * Math.sin(p * Math.PI);
    g_anim_tail      =  60 * Math.sin(p * Math.PI * 2);
    g_pokeTimer++;
    if (g_pokeTimer > 90) { g_pokeOn = false; g_pokeTimer = 0; }
    return;
  }

  // Normal walk/swing animation
  g_anim_upperArm  =  15 * Math.sin(t * 0.05);
  g_upperArmSwingY =  25 * Math.sin(t * 0.04);
  g_anim_lowerArm  =  20 * Math.sin(t * 0.05 + 0.5) - 20;
  g_anim_hand      =  15 * Math.sin(t * 0.07);
  g_anim_rUpperArm = -30 * Math.sin(t * 0.05);
  g_anim_rLowerArm =  20 * Math.sin(t * 0.05 - 0.5) - 20;
  g_anim_upperLeg  =  25 * Math.sin(t * 0.05);
  g_anim_lowerLeg  =  15 * Math.abs(Math.sin(t * 0.05)) ;
  g_anim_foot      =  10 * Math.sin(t * 0.05);
  g_anim_rUpperLeg = -25 * Math.sin(t * 0.05);
  g_anim_rLowerLeg =  15 * Math.abs(Math.sin(t * 0.05 + Math.PI));
  g_anim_tail      =  30 * Math.sin(t * 0.08);
}

// ---- Effective joint angles (anim overrides slider when on) ----
function effUA()  { return g_animOn ? g_anim_upperArm  : g_upperArmAngle; }
function effLA()  { return g_animOn ? g_anim_lowerArm  : g_lowerArmAngle; }
function effHA()  { return g_animOn ? g_anim_hand      : g_handAngle; }
function effUL()  { return g_animOn ? g_anim_upperLeg  : g_upperLegAngle; }
function effLL()  { return g_animOn ? g_anim_lowerLeg  : g_lowerLegAngle; }
function effFT()  { return g_animOn ? g_anim_foot      : g_footAngle; }
function effTail(){ return g_animOn ? g_anim_tail      : g_tailAngle; }
function effRUA() { return g_animOn ? g_anim_rUpperArm : -g_upperArmAngle; }
function effRLA() { return g_animOn ? g_anim_rLowerArm : g_lowerArmAngle; }
function effRUL() { return g_animOn ? g_anim_rUpperLeg : -g_upperLegAngle; }
function effRLL() { return g_animOn ? g_anim_rLowerLeg : g_lowerLegAngle; }

// ---- renderScene ----
function renderScene() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var G = getGlobalRotation();
  gl.uniformMatrix4fv(u_GlobalRotation, false, G.elements);

  // ---- BODY (sphere, non-cube primitive) ----
  var body = new Matrix4();
  body.scale(0.25, 0.20, 0.20);
  drawSphere(body, C_BODY);

  // ---- HEAD ----
  var head = new Matrix4();
  head.translate(0, 0.38, 0.05);
  head.scale(0.31, 0.20, 0.25);
  drawSphere(head, C_BODY);

  // Face patch
  var face = new Matrix4();
  face.translate(0, 0.31, 0.29);
  face.scale(0.25, 0.12, 0.05);
  drawSphere(face, C_FACE);
  
  var face = new Matrix4();
  face.translate(0, 0.41, 0.29);
  face.scale(0.22, 0.12, 0.05);
  drawSphere(face, C_FACE);

  
  // Eyes
  var eyeL = new Matrix4();
  eyeL.translate(-0.13, 0.40, 0.30);
  eyeL.scale(0.04, 0.04, 0.04);
  drawSphere(eyeL, C_EYE);

  var eyeR = new Matrix4();
  eyeR.translate(0.13, 0.40, 0.30);
  eyeR.scale(0.04, 0.04, 0.04);
  drawSphere(eyeR, C_EYE); 


  // blush
  var blushL = new Matrix4();
  blushL.translate(-0.18, 0.35, 0.31);
  blushL.scale(0.07, 0.03, 0.04);
  drawSphere(blushL, C_BLUSH);

  var blushR = new Matrix4();
  blushR.translate(0.18, 0.35, 0.31);
  blushR.scale(0.07, 0.03, 0.05);
  drawSphere(blushR, C_BLUSH); 

  //nose
  var mouth = new Matrix4();
  mouth.translate(0.00, 0.35, 0.33);
  mouth.scale(0.08, 0.009, 0.04);
  drawCube(mouth, C_EYE); 

  var mew = new Matrix4();
  mew.translate(0.00, 0.25, 0.33);
  mew.scale(0.04, 0.03, 0.03);
  drawSphere(mew, C_EYE); 


  /*

  //nose
  var nose = new Matrix4();
  nose.translate(0, 0.31, 0.32);
  nose.scale(0.06, 0.02, 0.04);
  drawSphere(nose, C_BODY);
*/
  // ---- EARS ----
  var earL = new Matrix4();
  earL.translate(-0.36, 0.36, 0.0);
  earL.scale(0.14, 0.12, 0.06);
  drawSphere(earL, C_EAR);

  var earR = new Matrix4();
  earR.translate(0.36, 0.36, 0.0);
  earR.scale(0.14, 0.12, 0.06);
  drawSphere(earR, C_EAR);

  // ---- LEFT ARM ----
  var lShoulderX = -0.15, lShoulderY = 0.11;
  var segLen = 0.09;
  var lBends = [-65, -25, -20, -15, -10, -8, -5, -3];
 
  function lArmChain(n) {
  var m = new Matrix4();
  m.translate(lShoulderX, lShoulderY, 0);
  m.rotate(effUA(), 1, 0, 0);
  m.rotate(lBends[0], 0, 0, 1);
  if (n >= 1) { m.translate(0, -segLen, 0); m.rotate(lBends[1], 0, 0, 1); }
  if (n >= 2) { m.translate(0, -segLen, 0); m.rotate(lBends[2], 0, 0, 1); m.rotate(effLA(), 1, 0, 0); }
  if (n >= 3) { m.translate(0, -segLen, 0); m.rotate(lBends[3], 0, 0, 1); }
  if (n >= 4) { m.translate(0, -segLen, 0); m.rotate(lBends[4], 0, 0, 1); }
  if (n >= 5) { m.translate(0, -segLen, 0); m.rotate(lBends[5], 0, 0, 1); m.rotate(effHA(), 1, 0, 0); }
  if (n >= 6) { m.translate(0, -segLen, 0); m.rotate(lBends[6], 0, 0, 1); }
  if (n >= 7) { m.translate(0, -segLen, 0); m.rotate(lBends[7], 0, 0, 1); }
  return m;
}

for (var i = 0; i < 8; i++) {
  var segM = lArmChain(i);
  segM.translate(0, -segLen/2, 0);
  segM.scale(0.08, segLen, 0.08);
  drawCube(segM, C_DARK);
}

var lHandM = lArmChain(7);
lHandM.translate(0, -segLen, 0);
lHandM.scale(0.09, 0.09, 0.09);
drawSphere(lHandM, C_FACE);

// rigt arm
var rShoulderX = 0.15, rShoulderY = 0.11;
var rBendOut = 60;
var rBendIn  = -10;

function rArmChain(n) {
  var m = new Matrix4();
  m.translate(rShoulderX, rShoulderY, 0);
  m.rotate(effRUA(), 1, 0, 0);
  m.rotate(rBendOut, 0, 0, 1);
  if (n >= 1) { m.translate(0, -segLen, 0); m.rotate(rBendIn, 0, 0, 1); }
  if (n >= 2) { m.translate(0, -segLen, 0); m.rotate(rBendIn, 0, 0, 1); m.rotate(effRLA(), 1, 0, 0); }
  if (n >= 3) { m.translate(0, -segLen, 0); m.rotate(rBendIn, 0, 0, 1); }
  if (n >= 4) { m.translate(0, -segLen, 0); m.rotate(rBendIn, 0, 0, 1); }
  if (n >= 5) { m.translate(0, -segLen, 0); m.rotate(rBendIn, 0, 0, 1); m.rotate(effHA(), 1, 0, 0); }
  if (n >= 6) { m.translate(0, -segLen, 0); m.rotate(rBendIn, 0, 0, 1); }
  if (n >= 7) { m.translate(0, -segLen, 0); m.rotate(rBendIn, 0, 0, 1); }
  return m;
}

for (var i = 0; i < 8; i++) {
  var rSegM = rArmChain(i);
  rSegM.translate(0, -segLen/2, 0);
  rSegM.scale(0.08, segLen, 0.08);
  drawCube(rSegM, C_DARK);
}

var rHandM = rArmChain(7);
rHandM.translate(0, -segLen, 0);
rHandM.scale(0.09, 0.09, 0.09);
drawSphere(rHandM, C_FACE);

/*
// ---- RIGHT ARM (mirrored, same chain depth) ----
var rShoulderX = 0.20, rShoulderY = 0.20;
var rBends = [25, 25, 20, 15, 10, 8, 5, 3];

function rArmChain(n) {
  var m = new Matrix4();
  m.translate(rShoulderX, rShoulderY, 0);
  m.rotate(effRUA(), 1, 0, 0);
  m.rotate(rBends[0], 0, 0, 1);
  if (n >= 1) { m.translate(0, -segLen, 0); m.rotate(rBends[1], 0, 0, 1); }
  if (n >= 2) { m.translate(0, -segLen, 0); m.rotate(rBends[2], 0, 0, 1); m.rotate(effRLA(), 1, 0, 0); }
  if (n >= 3) { m.translate(0, -segLen, 0); m.rotate(rBends[3], 0, 0, 1); }
  if (n >= 4) { m.translate(0, -segLen, 0); m.rotate(rBends[4], 0, 0, 1); }
  if (n >= 5) { m.translate(0, -segLen, 0); m.rotate(rBends[5], 0, 0, 1); m.rotate(effHA(), 1, 0, 0); }
  if (n >= 6) { m.translate(0, -segLen, 0); m.rotate(rBends[6], 0, 0, 1); }
  if (n >= 7) { m.translate(0, -segLen, 0); m.rotate(rBends[7], 0, 0, 1); }
  return m;
}

for (var i = 0; i < 8; i++) {
  var rSegM = rArmChain(i);
  rSegM.translate(0, -segLen/2, 0);
  rSegM.scale(0.08, segLen, 0.08);
  drawCube(rSegM, C_DARK);
}

var rHandM = rArmChain(7);
rHandM.translate(0, -segLen, 0);
rHandM.scale(0.11, 0.09, 0.09);
drawSphere(rHandM, C_FACE);

*/
  // ---- LEFT LEG — 3 level chain ----
  var lHipX = -0.12, lHipY = -0.14;

  var lUpperLeg = new Matrix4();
  lUpperLeg.translate(lHipX, lHipY, 0);
  lUpperLeg.rotate(effUL(), 1, 0, 0);
  lUpperLeg.translate(0, -0.07, 0);
  lUpperLeg.scale(0.11, 0.14, 0.11);
  drawCube(lUpperLeg, C_DARK);

  var lKneeBase = new Matrix4();
  lKneeBase.translate(lHipX, lHipY, 0);
  lKneeBase.rotate(effUL(), 1, 0, 0);
  lKneeBase.translate(0, -0.14, 0);
  lKneeBase.rotate(effLL(), 1, 0, 0);
  lKneeBase.translate(0, -0.07, 0);

  var lLowerLeg = new Matrix4();
  lLowerLeg.set(lKneeBase);
  lLowerLeg.scale(0.10, 0.14, 0.10);
  drawCube(lLowerLeg, C_DARK);

  var lAnkleBase = new Matrix4();
  lAnkleBase.translate(lHipX, lHipY, 0);
  lAnkleBase.rotate(effUL(), 1, 0, 0);
  lAnkleBase.translate(0, -0.14, 0);
  lAnkleBase.rotate(effLL(), 1, 0, 0);
  lAnkleBase.translate(0, -0.14, 0);
  lAnkleBase.rotate(effFT(), 1, 0, 0);
  lAnkleBase.translate(0, -0.04, 0.04);

  var lFoot = new Matrix4();
  lFoot.set(lAnkleBase);
  lFoot.scale(0.11, 0.07, 0.15);
  drawSphere(lFoot, C_FACE);

  

  // ---- RIGHT LEG ----
  var rHipX = 0.12, rHipY = -0.14;

  var rUpperLeg = new Matrix4();
  rUpperLeg.translate(rHipX, rHipY, 0);
  rUpperLeg.rotate(effRUL(), 1, 0, 0);
  rUpperLeg.translate(0, -0.07, 0);
  rUpperLeg.scale(0.11, 0.14, 0.11);
  drawCube(rUpperLeg, C_DARK);

  var rKneeBase = new Matrix4();
  rKneeBase.translate(rHipX, rHipY, 0);
  rKneeBase.rotate(effRUL(), 1, 0, 0);
  rKneeBase.translate(0, -0.14, 0);
  rKneeBase.rotate(effRLL(), 1, 0, 0);
  rKneeBase.translate(0, -0.07, 0);

  var rLowerLeg = new Matrix4();
  rLowerLeg.set(rKneeBase);
  rLowerLeg.scale(0.10, 0.14, 0.10);
  drawCube(rLowerLeg, C_DARK);

  var rAnkleBase = new Matrix4();
  rAnkleBase.translate(rHipX, rHipY, 0);
  rAnkleBase.rotate(effRUL(), 1, 0, 0);
  rAnkleBase.translate(0, -0.14, 0);
  rAnkleBase.rotate(effRLL(), 1, 0, 0);
  rAnkleBase.translate(0, -0.14, 0);
  rAnkleBase.rotate(effFT(), 1, 0, 0);
  rAnkleBase.translate(0, -0.04, 0.04);

  var rFoot = new Matrix4();
  rFoot.set(rAnkleBase);
  rFoot.scale(0.11, 0.07, 0.15);
  drawSphere(rFoot, C_FACE);

  // ---- TAIL (2 segments) ----
  var tailBase = new Matrix4();
  tailBase.translate(0, -0.10, -0.10);
  tailBase.rotate(effTail(), 1, 0, 0);
  tailBase.translate(0, 0, -0.10);
  tailBase.scale(0.07, 0.07, 0.20);
  drawCube(tailBase, C_TAIL);

  var tailTip = new Matrix4();
  tailTip.translate(0, -0.20, -0.14);
  tailTip.rotate(effTail(), 1, 0, 0);
  tailTip.translate(0, 0.04, -0.22);
  tailTip.rotate(-effTail() * 0.5, 1, 0, 0);
  tailTip.translate(0, 0, -0.09);
  tailTip.scale(0.06, 0.06, 0.17);
  drawCube(tailTip, C_TAIL);
}

// ---- Tick / animation loop ----
function tick() {
  var now = performance.now();
  var delta = now - g_lastTime;
  g_lastTime = now;
  g_time += delta / 16.67; // ~60fps units

  // FPS counter
  g_frameCount++;
  g_fpsTimer += delta;
  if (g_fpsTimer >= 500) {
    g_fps = (g_frameCount / (g_fpsTimer / 1000)).toFixed(1);
    document.getElementById('fps').textContent = g_fps + ' fps';
    g_frameCount = 0;
    g_fpsTimer = 0;
  }

  if (g_animOn || g_pokeOn) {
    updateAnimationAngles();
  }
  renderScene();
  requestAnimationFrame(tick);
}

// ---- Animation toggle ----
function toggleAnim() {
  g_animOn = !g_animOn;
  var btn = document.getElementById('animBtn');
  btn.textContent = g_animOn ? 'Stop Animation' : 'Start Animation';
  if (g_animOn && g_lastTime === 0) {
    g_lastTime = performance.now();
    requestAnimationFrame(tick);
  }
}

// ---- Poke ----
function triggerPoke() {
  g_pokeOn    = true;
  g_pokeTimer = 0;
  if (g_lastTime === 0) {
    g_lastTime = performance.now();
    requestAnimationFrame(tick);
  }
}

// ---- Slider helpers ----
function setSlider(id, valId, unit) {
  return function() {
    var v = +document.getElementById(id).value;
    document.getElementById(valId).textContent = v + (unit||'°');
    return v;
  };
}

function onGlobalRotY() {
  g_globalRotY = +document.getElementById('globalRotY').value;
  document.getElementById('globalRotYVal').textContent = g_globalRotY + '°';
  if (!g_animOn) renderScene();
}
function onGlobalRotX() {
  g_globalRotX = +document.getElementById('globalRotX').value;
  document.getElementById('globalRotXVal').textContent = g_globalRotX + '°';
  if (!g_animOn) renderScene();
}
function onUpperArm() {
  g_upperArmAngle = +document.getElementById('upperArm').value;
  document.getElementById('upperArmVal').textContent = g_upperArmAngle + '°';
  if (!g_animOn) renderScene();
}
function onLowerArm() {
  g_lowerArmAngle = +document.getElementById('lowerArm').value;
  document.getElementById('lowerArmVal').textContent = g_lowerArmAngle + '°';
  if (!g_animOn) renderScene();
}
function onHand() {
  g_handAngle = +document.getElementById('hand').value;
  document.getElementById('handVal').textContent = g_handAngle + '°';
  if (!g_animOn) renderScene();
}
function onUpperLeg() {
  g_upperLegAngle = +document.getElementById('upperLeg').value;
  document.getElementById('upperLegVal').textContent = g_upperLegAngle + '°';
  if (!g_animOn) renderScene();
}
function onLowerLeg() {
  g_lowerLegAngle = +document.getElementById('lowerLeg').value;
  document.getElementById('lowerLegVal').textContent = g_lowerLegAngle + '°';
  if (!g_animOn) renderScene();
}
function onFoot() {
  g_footAngle = +document.getElementById('foot').value;
  document.getElementById('footVal').textContent = g_footAngle + '°';
  if (!g_animOn) renderScene();
}
function onTail() {
  g_tailAngle = +document.getElementById('tail').value;
  document.getElementById('tailVal').textContent = g_tailAngle + '°';
  if (!g_animOn) renderScene();
}