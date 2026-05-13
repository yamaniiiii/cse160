import Cube from "./Cube";

export const MAP_SIZE = 32;

const MAP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0],
  [0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,3,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export let map = MAP.map(row => [...row]);

export default class World {
  constructor() {
    this.ground = null;
    this.skybox = null;
    this.walls  = [];
  }

  init() {
    this._buildGround();
    this._buildSkybox();
    this._buildWalls();
    this._buildTrees();
  }

  _buildGround() {
    const g = new Cube();
    g.position.elements.set([MAP_SIZE / 2, -0.5, MAP_SIZE / 2]);
    g.scale.elements.set([MAP_SIZE * 10, 0.02, MAP_SIZE * 10]);
    g.texWeight    = 1.0;
    g.whichTexture = 2; // grass
    this.ground = g;
  }

  _buildSkybox() {
    const s = new Cube();
    s.position.elements.set([MAP_SIZE / 2, MAP_SIZE / 2, MAP_SIZE / 2]);
    s.scale.elements.set([1000, 1000, 1000]);
    s.texWeight = 0.0;
    s.baseColor = [0.53, 0.81, 0.98, 1.0]; // sky blue
    this.skybox = s;
  }

  _buildWalls() {
    this.walls = [];
    for (let z = 0; z < MAP_SIZE; z++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const height = map[z][x];
        if (height === 0) continue;

        for (let y = 0; y < height; y++) {
          const w = new Cube();
          w.position.elements.set([x + 0.5, y + 0.5, z + 0.5]);
          w.texWeight = 1.0;

          if (height >= 4) {
            w.whichTexture = y === height - 1 ? 2 : 1;
          } else if (height === 3) {
            w.whichTexture = 1;
          } else {
            w.whichTexture = 0;
          }

          this.walls.push(w);
        }
      }
    }
  }

 _buildTrees() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };

  for (let i = 0; i < 60; i++) {
    // Spread across a much wider area than the map itself
    const x = Math.floor(rand() * 80) - 10; // -10 to 70
    const z = Math.floor(rand() * 80) - 10; // -10 to 70

    // Skip if it lands on a wall cell within the map bounds
    if (x >= 0 && x < MAP_SIZE && z >= 0 && z < MAP_SIZE && map[z][x] > 0) continue;

    const trunk = new Cube();
    trunk.position.elements.set([x + 0.5, 0.75, z + 0.5]);
    trunk.scale.elements.set([0.3, 1.5, 0.3]);
    trunk.texWeight = 0.0;
    trunk.baseColor = [0.38, 0.24, 0.13, 1.0];

    const leaves = new Cube();
    leaves.position.elements.set([x + 0.5, 1.9, z + 0.5]);
    leaves.scale.elements.set([1.1, 1.0, 1.1]);
    leaves.texWeight = 0.0;
    leaves.baseColor = [0.13, 0.55, 0.13, 1.0];

    this.walls.push(trunk);
    this.walls.push(leaves);
  }
}

  _cellInFront(camera) {
    const fx = camera.at.elements[0] - camera.eye.elements[0];
    const fz = camera.at.elements[2] - camera.eye.elements[2];
    const len = Math.sqrt(fx * fx + fz * fz) || 1;
    const tx = camera.eye.elements[0] + (fx / len) * 1.5;
    const tz = camera.eye.elements[2] + (fz / len) * 1.5;
    const cx = Math.floor(tx);
    const cz = Math.floor(tz);
    if (cx < 0 || cx >= MAP_SIZE || cz < 0 || cz >= MAP_SIZE) return null;
    return { x: cx, z: cz };
  }

  addBlock(camera) {
    const cell = this._cellInFront(camera);
    if (!cell) return;
    if (map[cell.z][cell.x] < 4) {
      map[cell.z][cell.x]++;
      this._buildWalls();
    }
  }

  deleteBlock(camera) {
    const cell = this._cellInFront(camera);
    if (!cell) return;
    if (map[cell.z][cell.x] > 0) {
      map[cell.z][cell.x]--;
      this._buildWalls();
    }
  }

  render(gl, camera) {
    this.skybox.render(gl, camera);
    this.ground.render(gl, camera);
    for (const w of this.walls) {
      w.render(gl, camera);
    }
  }
}