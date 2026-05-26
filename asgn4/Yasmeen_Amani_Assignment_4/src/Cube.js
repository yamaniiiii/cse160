import { Matrix4, Vector3 } from "../lib/cuon-matrix-cse160";

export default class Cube {
  constructor() {
    this.vertices     = null;
    this.uvs          = null;
    this.normals      = null;
    this.vertexBuffer = null;
    this.uvBuffer     = null;
    this.normalBuffer = null;
    this.isWater      = false;

    // Textures stored on the class, not per-instance, so we load once globally.
    // See World.js for how textures are loaded into gl.texture0 / gl.texture1 etc.

    this.position = new Vector3([0, 0, 0]);
    this.rotation = new Vector3([0, 0, 0]);
    this.scale    = new Vector3([1, 1, 1]);
    this.modelMatrix = new Matrix4();

    // Rendering style
    // texWeight = 0 → pure baseColor, texWeight = 1 → pure texture
    this.texWeight   = 1.0;
    this.baseColor   = [1.0, 1.0, 1.0, 1.0]; // RGBA
    this.whichTexture = 0; // index into the global texture array

    this.setVertices();
    this.setUvs();
    this.setNormals();
  }

  setVertices() {
    // prettier-ignore
    this.vertices = new Float32Array([
      // FRONT
      -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,
      -0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
      // LEFT
      -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,
      -0.5, 0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
      // RIGHT
       0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,
       0.5, 0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
      // TOP
      -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
      -0.5, 0.5,-0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,
      // BACK
       0.5, 0.5,-0.5,   0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,
      -0.5, 0.5,-0.5,   0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,
      // BOTTOM
      -0.5,-0.5, 0.5,  -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,
      -0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
    ]);
  }

  setUvs() {
    // prettier-ignore
    this.uvs = new Float32Array([
      // FRONT
      0,1, 0,0, 1,0,  0,1, 1,0, 1,1,
      // LEFT
      0,1, 0,0, 1,0,  0,1, 1,0, 1,1,
      // RIGHT
      0,1, 0,0, 1,0,  0,1, 1,0, 1,1,
      // TOP
      1,0, 1,1, 0,1,  1,0, 0,1, 0,0,
      // BACK
      0,1, 0,0, 1,1,  1,1, 0,0, 1,0,
      // BOTTOM
      0,1, 0,0, 1,0,  0,1, 1,0, 1,1,
    ]);
  }

  setNormals() {
    // prettier-ignore
    // Each face: same normal repeated 6 times (2 tris × 3 verts)
    // Order matches setVertices(): FRONT, LEFT, RIGHT, TOP, BACK, BOTTOM
    const n = (x, y, z) => [x,y,z, x,y,z, x,y,z, x,y,z, x,y,z, x,y,z];
    this.normals = new Float32Array([
      ...n( 0, 0, 1),  // FRONT  +Z
      ...n(-1, 0, 0),  // LEFT   -X
      ...n( 1, 0, 0),  // RIGHT  +X
      ...n( 0, 1, 0),  // TOP    +Y
      ...n( 0, 0,-1),  // BACK   -Z
      ...n( 0,-1, 0),  // BOTTOM -Y
    ]);
  }

  calculateMatrix() {
    const [x, y, z]    = this.position.elements;
    const [rx, ry, rz] = this.rotation.elements;
    const [sx, sy, sz] = this.scale.elements;

    this.modelMatrix
      .setTranslate(x, y, z)
      .rotate(rx, 1, 0, 0)
      .rotate(ry, 0, 1, 0)
      .rotate(rz, 0, 0, 1)
      .scale(sx, sy, sz);
  }

  // gl.locs must be pre-cached by the caller (see index.js initLocations())
  render(gl, camera) {
    this.calculateMatrix();

    const locs = gl.locs;

    gl.uniformMatrix4fv(locs.modelMatrix,      false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(locs.viewMatrix,       false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(locs.projectionMatrix, false, camera.projectionMatrix.elements);
    gl.uniform1f(locs.texWeight,  this.texWeight);
    gl.uniform4fv(locs.baseColor, this.baseColor);
    gl.uniform1i(locs.whichTexture, this.whichTexture);

    // Upload vertex positions
    if (!this.vertexBuffer) {
      this.vertexBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.aPosition);

    // Upload UVs
    if (!this.uvBuffer) {
      this.uvBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.uv);

    // Upload normals
    if (!this.normalBuffer) {
      this.normalBuffer = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.aNormal);

    gl.uniform1f(locs.isWater, this.isWater ? 1.0 : 0.0);
    
    gl.drawArrays(gl.TRIANGLES, 0, 36); // 6 faces × 2 triangles × 3 verts
  }
}