import { Matrix4, Vector3 } from "../lib/cuon-matrix-cse160";

export default class Camera {
  constructor(position = [16, 1.6, 16], target = [16, 1.6, 15]) {
    this.fov = 60;
    this.eye = new Vector3(position);
    this.at  = new Vector3(target);
    this.up  = new Vector3([0, 1, 0]);

    this.speed     = 0.15;  // movement units per keypress
    this.panSpeed  = 3.0;   // degrees per keypress (Q/E)
    this.mouseSens = 0.2;   // degrees per pixel (mouse look)

    this.viewMatrix       = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this._updateProjection();
    this._updateView();

    window.addEventListener("resize", () => {
      this._updateProjection();
    });
  }

  // ─── internal helpers ─────────────────────────────────────────────────────

  _updateView() {
    this.viewMatrix.setLookAt(
      this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
      this.at.elements[0],  this.at.elements[1],  this.at.elements[2],
      this.up.elements[0],  this.up.elements[1],  this.up.elements[2]
    );
  }

  _updateProjection() {
    const aspect = window.innerWidth / window.innerHeight;
    this.projectionMatrix.setPerspective(this.fov, aspect, 0.1, 1000);
  }

  // Returns normalised forward vector (at - eye)
  _forward() {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);
    f.normalize();
    return f;
  }

  // Returns normalised right vector (forward x up)
  _right() {
    let f = this._forward();
    let r = new Vector3([
      f.elements[1] * this.up.elements[2] - f.elements[2] * this.up.elements[1],
      f.elements[2] * this.up.elements[0] - f.elements[0] * this.up.elements[2],
      f.elements[0] * this.up.elements[1] - f.elements[1] * this.up.elements[0],
    ]);
    r.normalize();
    return r;
  }

  // ─── movement ─────────────────────────────────────────────────────────────

  moveForward() {
    let f = this._forward();
    f.mul(this.speed);
    this.eye.elements[0] += f.elements[0];
    this.eye.elements[2] += f.elements[2]; // no Y so we stay grounded
    this.at.elements[0]  += f.elements[0];
    this.at.elements[2]  += f.elements[2];
    this._updateView();
  }

  moveBackward() {
    let f = this._forward();
    f.mul(this.speed);
    this.eye.elements[0] -= f.elements[0];
    this.eye.elements[2] -= f.elements[2];
    this.at.elements[0]  -= f.elements[0];
    this.at.elements[2]  -= f.elements[2];
    this._updateView();
  }

  moveLeft() {
    let r = this._right();
    r.mul(this.speed);
    this.eye.elements[0] -= r.elements[0];
    this.eye.elements[2] -= r.elements[2];
    this.at.elements[0]  -= r.elements[0];
    this.at.elements[2]  -= r.elements[2];
    this._updateView();
  }

  moveRight() {
    let r = this._right();
    r.mul(this.speed);
    this.eye.elements[0] += r.elements[0];
    this.eye.elements[2] += r.elements[2];
    this.at.elements[0]  += r.elements[0];
    this.at.elements[2]  += r.elements[2];
    this._updateView();
  }

  // ─── rotation ─────────────────────────────────────────────────────────────

  panLeft(deg) {
    this._pan(deg ?? this.panSpeed);
  }

  panRight(deg) {
    this._pan(-(deg ?? this.panSpeed));
  }

  // Positive alpha = pan left, negative = pan right
  _pan(alpha) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye); // forward vector (not normalised, magnitude preserved)

    const rot = new Matrix4();
    rot.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    const rotated = rot.multiplyVector3(f);

    this.at.elements[0] = this.eye.elements[0] + rotated.elements[0];
    this.at.elements[1] = this.eye.elements[1] + rotated.elements[1];
    this.at.elements[2] = this.eye.elements[2] + rotated.elements[2];

    this._updateView();
  }

  // Pitch up/down (for mouse look vertical axis)
  _pitch(alpha) {
    let f = new Vector3();
    f.set(this.at);
    f.sub(this.eye);

    const r = this._right();
    const rot = new Matrix4();
    rot.setRotate(alpha, r.elements[0], r.elements[1], r.elements[2]);
    const rotated = rot.multiplyVector3(f);

    // Clamp: don't let camera flip over (keep forward.y between -0.99 and 0.99)
    const len = Math.sqrt(
      rotated.elements[0] ** 2 + rotated.elements[1] ** 2 + rotated.elements[2] ** 2
    );
    const newForwardY = rotated.elements[1] / len;
    if (Math.abs(newForwardY) > 0.99) return;

    this.at.elements[0] = this.eye.elements[0] + rotated.elements[0];
    this.at.elements[1] = this.eye.elements[1] + rotated.elements[1];
    this.at.elements[2] = this.eye.elements[2] + rotated.elements[2];

    this._updateView();
  }

  // Called by mouse move handler with pixel deltas
  look(dx, dy) {
    this._pan(-dx * this.mouseSens);
    this._pitch(dy * this.mouseSens);
  }
}
