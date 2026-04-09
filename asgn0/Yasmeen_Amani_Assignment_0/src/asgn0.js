var canvas;
var ctx;

function main() {
  canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return false;
  }

  ctx = canvas.getContext('2d');
  if (!ctx) {
    console.log('Failed to get 2D context');
    return;
  }

  // Draw black background
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw initial vector as required by step 2
  var v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");
}

function drawVector(v, color) {
  let cx = canvas.width / 2;
  let cy = canvas.height / 2;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + v.elements[0] * 20, cy - v.elements[1] * 20); // flip y axis
  ctx.stroke();
}

function handleDrawEvent() {
  // Clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read v1
  let x1 = parseFloat(document.getElementById("v1x").value);
  let y1 = parseFloat(document.getElementById("v1y").value);
  let v1 = new Vector3([x1, y1, 0]);
  drawVector(v1, "red");

  // Read v2
  let x2 = parseFloat(document.getElementById("v2x").value);
  let y2 = parseFloat(document.getElementById("v2y").value);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  // Clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Read inputs
  let x1 = parseFloat(document.getElementById("v1x").value);
  let y1 = parseFloat(document.getElementById("v1y").value);
  let x2 = parseFloat(document.getElementById("v2x").value);
  let y2 = parseFloat(document.getElementById("v2y").value);
  let s  = parseFloat(document.getElementById("scalar").value);
  let op = document.getElementById("op-select").value;

  let v1 = new Vector3([x1, y1, 0]);
  let v2 = new Vector3([x2, y2, 0]);
  drawVector(v1, "red");
  drawVector(v2, "blue");

  if (op === "add") {
    let v3 = new Vector3([x1, y1, 0]).add(new Vector3([x2, y2, 0]));
    drawVector(v3, "green");
  } else if (op === "sub") {
    let v3 = new Vector3([x1, y1, 0]).sub(new Vector3([x2, y2, 0]));
    drawVector(v3, "green");
  } else if (op === "mul") {
    drawVector(new Vector3([x1, y1, 0]).mul(s), "green");
    drawVector(new Vector3([x2, y2, 0]).mul(s), "green");
  } else if (op === "div") {
    drawVector(new Vector3([x1, y1, 0]).div(s), "green");
    drawVector(new Vector3([x2, y2, 0]).div(s), "green");
  } else if (op === "magnitude") {
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());
  } else if (op === "normalize") {
    drawVector(new Vector3([x1, y1, 0]).normalize(), "green");
    drawVector(new Vector3([x2, y2, 0]).normalize(), "green");
  } else if (op === "angle") {
    console.log("Angle between v1 and v2:", angleBetween(v1, v2), "degrees");
  } else if (op === "area") {
    console.log("Area of triangle:", areaTriangle(v1, v2));
  }
}

function angleBetween(v1, v2) {
  let d = Vector3.dot(v1, v2);
  let angle = Math.acos(d / (v1.magnitude() * v2.magnitude()));
  return angle * (180 / Math.PI);
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  return cross.magnitude() / 2;
}