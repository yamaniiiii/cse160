import { Matrix4, Vector3 } from "../lib/cuon-matrix-cse160";

export default class Model {
  constructor() {
    this.vertices     = [];
    this.normals      = [];
    this.uvs          = [];

    this.vertexBuffer = null;
    this.normalBuffer = null;
    this.uvBuffer     = null;
    this.vertCount    = 0;

    this.position    = new Vector3([0, 0, 0]);
    this.scale       = new Vector3([1, 1, 1]);
    this.rotation    = new Vector3([0, 0, 0]);
    this.modelMatrix = new Matrix4();

    this.baseColor    = [1.0, 0.84, 0.0, 1.0]; // gold
    this.texWeight    = 0.0;
    this.whichTexture = 0;
  }

  async load(path) {
    const res  = await fetch(path);
    const text = await res.text();
    this._parse(text);
    
  }

  loadText(text) {
  this._parse(text);
}

  _parse(text) {
    const posArr  = [];
    const normArr = [];
    const uvArr   = [];

    const verts   = [];
    const norms   = [];
    const uvs     = [];

    for (const line of text.split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts[0] === "v") {
        posArr.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (parts[0] === "vn") {
        normArr.push([parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3])]);
      } else if (parts[0] === "vt") {
        uvArr.push([parseFloat(parts[1]), parseFloat(parts[2])]);
      } else if (parts[0] === "f") {
        const face = parts.slice(1).map(p => {
          const [vi, ti, ni] = p.split("/").map(x => parseInt(x) - 1);
          return { vi, ti, ni };
        });
        // triangulate (fan from first vertex)
        for (let i = 1; i < face.length - 1; i++) {
          for (const idx of [face[0], face[i], face[i + 1]]) {
            const p = posArr[idx.vi];
            verts.push(p[0], p[1], p[2]);
            if (idx.ni >= 0 && normArr[idx.ni]) {
              const n = normArr[idx.ni];
              norms.push(n[0], n[1], n[2]);
            } else {
              norms.push(0, 1, 0);
            }
            if (idx.ti >= 0 && uvArr[idx.ti]) {
              const uv = uvArr[idx.ti];
              uvs.push(uv[0], 1.0 - uv[1]);
            } else {
              uvs.push(0, 0);
            }
          }
        }
      }
    }

    this.vertices  = new Float32Array(verts);
    this.normals   = new Float32Array(norms);
    this.uvs       = new Float32Array(uvs);
    this.vertCount = verts.length / 3;
  }

  _calcMatrix() {
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

  render(gl, camera) {
    if (this.vertCount === 0) return;
    this._calcMatrix();
    const locs = gl.locs;

    gl.uniformMatrix4fv(locs.modelMatrix,      false, this.modelMatrix.elements);
    gl.uniformMatrix4fv(locs.viewMatrix,       false, camera.viewMatrix.elements);
    gl.uniformMatrix4fv(locs.projectionMatrix, false, camera.projectionMatrix.elements);
    gl.uniform1f(locs.texWeight,    this.texWeight);
    gl.uniform4fv(locs.baseColor,   this.baseColor);
    gl.uniform1i(locs.whichTexture, this.whichTexture);
    gl.uniform1f(locs.isWater,      0.0);

    if (!this.vertexBuffer) this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.aPosition);

    if (!this.normalBuffer) this.normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.aNormal);

    if (!this.uvBuffer) this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
    gl.vertexAttribPointer(locs.uv, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(locs.uv);

    gl.drawArrays(gl.TRIANGLES, 0, this.vertCount);
  }
}