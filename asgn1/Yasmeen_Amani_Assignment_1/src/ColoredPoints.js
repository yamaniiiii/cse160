// ColoredPoints.js - Asgn1 Paint Program

// ---- GLSL Shaders ----
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

// ---- Globals ----
var gl, canvas;
var a_Position, u_FragColor, u_Size;
var g_shapesList = [];
var g_shape    = 'point';  // 'point' | 'triangle' | 'circle'
var g_color    = [1.0, 0.0, 0.0, 1.0];
var g_size     = 10;
var g_segments = 12;

// ---- Classes ----
class Point {
  constructor(x, y, color, size) {
    this.x = x; this.y = y;
    this.color = color.slice();
    this.size = size;
  }
  render() {
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_Size, this.size);
    gl.vertexAttrib3f(a_Position, this.x, this.y, 0.0);
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}

class Triangle {
  constructor(x, y, color, size) {
    this.x = x; this.y = y;
    this.color = color.slice();
    this.size = size;
  }
  render() {
    gl.uniform4f(u_FragColor, ...this.color);
    gl.uniform1f(u_Size, this.size);
    var s = this.size / 200;
    drawTriangle([
      this.x,       this.y + s,
      this.x - s,   this.y - s,
      this.x + s,   this.y - s
    ], this.color);
  }
}

class Circle {
  constructor(x, y, color, size, segments) {
    this.x = x; this.y = y;
    this.color = color.slice();
    this.size = size;
    this.segments = segments;
  }
  render() {
    gl.uniform4f(u_FragColor, ...this.color);
    var r = this.size / 200;
    var n = this.segments;
    for (var i = 0; i < n; i++) {
      var a1 = (i / n) * 2 * Math.PI;
      var a2 = ((i + 1) / n) * 2 * Math.PI;
      drawTriangle([
        this.x, this.y,
        this.x + r * Math.cos(a1), this.y + r * Math.sin(a1),
        this.x + r * Math.cos(a2), this.y + r * Math.sin(a2)
      ], this.color);
    }
  }
}

// ---- Helper: draw a raw triangle from vertex array ----
function drawTriangle(verts, color) {
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// ---- Setup ----
function main() {
  setupWebGL();
  connectVariablesToGLSL();

  canvas.onmousedown = function(ev) { handleClicks(ev); };
  canvas.onmousemove = function(ev) { if (ev.buttons === 1) handleClicks(ev); };

  updateColor();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = getWebGLContext(canvas, { preserveDrawingBuffer: true });
  if (!gl) { console.log('Failed to get WebGL context'); return; }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders'); return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_Size      = gl.getUniformLocation(gl.program, 'u_Size');
}

// ---- Interaction ----
function handleClicks(ev) {
  var rect = canvas.getBoundingClientRect();
  var x = ((ev.clientX - rect.left) - canvas.width  / 2) / (canvas.width  / 2);
  var y = (canvas.height / 2 - (ev.clientY - rect.top))  / (canvas.height / 2);

  var shape;
  if (g_shape === 'point') {
    shape = new Point(x, y, g_color, g_size);
  } else if (g_shape === 'triangle') {
    shape = new Triangle(x, y, g_color, g_size);
  } else {
    shape = new Circle(x, y, g_color, g_size, g_segments);
  }
  g_shapesList.push(shape);
  renderAllShapes();
}

// ---- Render ----
function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (var s of g_shapesList) s.render();
}

// ---- UI helpers ----
function setShape(s) {
  g_shape = s;
  ['point','triangle','circle'].forEach(function(name) {
    var btn = document.getElementById('btn-' + name);
    if (btn) btn.className = (name === s) ? 'active' : '';
  });
}

function updateColor() {
  var r = document.getElementById('r').value / 255;
  var g = document.getElementById('g').value / 255;
  var b = document.getElementById('b').value / 255;
  g_color = [r, g, b, 1.0];
  var hex = '#' +
    (+document.getElementById('r').value).toString(16).padStart(2,'0') +
    (+document.getElementById('g').value).toString(16).padStart(2,'0') +
    (+document.getElementById('b').value).toString(16).padStart(2,'0');
  document.getElementById('color-preview').style.background = hex;
}

function clearCanvas() {
  g_shapesList = [];
  renderAllShapes();
}

// ---- Picture: draws initials "YA" in triangles ----
function drawPicture() {
  // Letter Y
  var yTris = [
    // Left arm of Y
    [-0.55, 0.7,  -0.45, 0.7,  -0.35, 0.3],
    [-0.55, 0.7,  -0.45, 0.7,  -0.45, 0.55],
    // Right arm of Y
    [-0.15, 0.7,  -0.25, 0.7,  -0.35, 0.3],
    [-0.15, 0.7,  -0.25, 0.7,  -0.25, 0.55],
    // Stem of Y
    [-0.42, 0.3,  -0.28, 0.3,  -0.42, -0.1],
    [-0.28, 0.3,  -0.42, -0.1, -0.28, -0.1],
  ];

  // Letter A
  var aTris = [
    // Left side of A
    [0.05, -0.1,  0.15, -0.1,  0.2, 0.7],
    [0.05, -0.1,  0.15, -0.1,  0.1, 0.7],
    // Right side of A
    [0.35, -0.1,  0.45, -0.1,  0.4, 0.7],
    [0.35, -0.1,  0.45, -0.1,  0.3, 0.7],
    // Crossbar of A
    [0.12, 0.25,  0.38, 0.25,  0.12, 0.35],
    [0.38, 0.25,  0.38, 0.35,  0.12, 0.35],
  ];

  // Decorative triangles around letters
  var decorTris = [
    [-0.8,  0.9,  -0.7, 0.75, -0.6, 0.9],
    [ 0.6,  0.9,   0.7, 0.75,  0.8, 0.9],
    [-0.8, -0.5,  -0.7,-0.65, -0.6,-0.5],
    [ 0.6, -0.5,   0.7,-0.65,  0.8,-0.5],
    [-0.1, -0.5,   0.0,-0.65,  0.1,-0.5],
  ];

  var colors = [
    [1.0, 0.4, 0.1, 1.0],  // orange for Y
    [0.2, 0.7, 1.0, 1.0],  // blue for A
    [0.5, 1.0, 0.3, 1.0],  // green for decor
  ];

  function addTriShape(verts, color) {
    var t = { render: function() { drawTriangle(verts, color); } };
    g_shapesList.push(t);
  }

  yTris.forEach(function(v)    { addTriShape(v, colors[0]); });
  aTris.forEach(function(v)    { addTriShape(v, colors[1]); });
  decorTris.forEach(function(v){ addTriShape(v, colors[2]); });

  renderAllShapes();
}