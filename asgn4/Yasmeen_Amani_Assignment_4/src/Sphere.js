import { Matrix4, Vector3 } from "../lib/cuon-matrix-cse160";

export default class Sphere {
  constructor(stacks = 12, slices = 24) {
    this.position = new Vector3([0, 0, 0]);
    this.scale    = new Vector3([1, 1, 1]);
    this.modelMatrix = new Matrix4();

    this.baseColor    = [1.0, 1.0, 1.0, 1.0];
    this.texWeight    = 0.0;
    this.whichTexture = 0;

    this.vertexBuffer = null;
    this.normalBuffer = null;
    this.uvBuffer     = null;
    this.vertCount    = 0;

    this._build(stacks, slices);
  }

  _build(stacks, slices) {
    const verts = [];
    const norms = [];
    const uvs   = [];

    for (let i = 0; i < stacks; i++) {
      const phi0 = ( i      / stacks) * Math.PI - Math.PI / 2;
      const phi1 = ((i + 1) / stacks) * Math.PI - Math.PI / 2;

      for (let j = 0; j < slices; j++) {
        const th0 = ( j      / slices) * 2 * Math.PI;
        const th1 = ((j + 1) / slices) * 2 * Math.PI;

        // Four corners of this quad patch
        const p = (phi, th) => [
          Math.cos(phi) * Math.cos(th),
          Math.sin(phi),
          Math.cos(phi) * Math.sin(th),
        ];
        const uv = (phi, th) => [th / (2 * Math.PI), (phi + Math.PI / 2) / Math.PI];

        const v00 = p(phi0, th0), v10 = p(phi1, th0);
        const v01 = p(phi0, th1), v11 = p(phi1, th1);
        const u00 = uv(phi0, th0), u10 = uv(phi1, th0);
        const u01 = uv(phi0, th1), u11 = uv(phi1, th1);

        // Triangle 1: v00, v10, v11
        verts.push(...v00, ...v10, ...v11);
        norms.push(...v00, ...v10, ...v11); // sphere normals = positions (unit sphere)
        uvs.push(...u00, ...u10, ...u11);

        // Triangle 2: v00, v11, v01
        verts.push(...v00, ...v11, ...v01);
        norms.push(...v00, ...v11, ...v01);
        uvs.push(...u00, ...u11, ...u01);
      }
    }

    this._verts = new Float32Array(verts);
    this._norms = new Float32Array(norms);
    this._uvs   = new Float32Array(uvs);
    this.vertCount = verts.length / 3;
  }

  _calcMatrix() {
    const [x, y, z] = this.position.elements;
    const [sx, sy, sz] = this.scale.elements;
    this.modelMatrix.setTranslate(x, y, z).scale(sx, sy, sz);
  }

  render(gl, camera) {
    this._calcMatrix();
    const locs = gl.locs;

    gl.uniformMatrix4fv(locs.modelMatrix,      false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(locs.viewMatrix,       false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(locs.projectionMatrix, false, camera.projectionMatrix.elements);
    gl.uniform1f(locs.texWeight,     this.texWeight);
    gl.uniform4fv(locs.baseColor,    this.baseColor);
    gl.uniform1i(locs.whichTexture,  this.whichTexture);
    gl.uniform1f(locs.isWater,       0.0);

    if (!this.vertexBuffer) this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._verts, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.aPosition);

    if (!this.normalBuffer) this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._norms, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.aNormal);

    if (!this.uvBuffer) this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._uvs, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.uv);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
  }
}