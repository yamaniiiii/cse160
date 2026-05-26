import Cube from "./Cube";
import Sphere from "./Sphere";
import Model from "./model";
import trumpetObj from "./trumpet.obj";
import sodaMachineObj from "./SodaMachine.obj";
import cupObj from "./cup_OBJ.obj";

export const MAP_SIZE = 32;

const MAP = Array(32).fill(null).map(() => Array(32).fill(0));

/*
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
*/
export let map = MAP.map(row => [...row]);

export default class World {
  constructor() {
    this.ground      = null;
    this.skybox      = null;
    this.walls       = [];
    this.spheres     = [];
    this.lightMarker = null;
    this.trumpet     = null;
    this.vending = null;
    this.water = null;
   // this.cup = null;
  }

  init() {
    this._buildGround();
    this._buildSkybox();
    this._buildWalls();
    this._buildPool();
    this._buildSpheres();
    this._buildLightMarker();
    this._buildTrumpet();
    this._buildVending();
    //this._buildCup();
    
  }

  _buildGround() {
  const POOL_X1 = 10, POOL_X2 = 22;
  const POOL_Z1 = 11, POOL_Z2 = 21;

  this.ground = []; // now an array instead of single cube

  for (let x = 0; x < MAP_SIZE; x++) {
    for (let z = 0; z < MAP_SIZE; z++) {
      // skip pool area
      if (x >= POOL_X1 && x <= POOL_X2 && z >= POOL_Z1 && z <= POOL_Z2) continue;

      const g = new Cube();
      g.position.elements.set([x + 0.5, -0.5, z + 0.5]);
      g.texWeight    = 1.0;
      g.whichTexture = 2; // grass
      this.ground.push(g);
    }
  }
}

async _buildVending() {
  this.vending = new Model();
  const res = await fetch(sodaMachineObj);
  const text = await res.text();
  this.vending.loadText(text);
  this.vending.texWeight    = 1.0;
  this.vending.whichTexture = 3;
  this.vending.position.elements.set([5, 0, 10]);
  this.vending.scale.elements.set([1, 1, 1]);
  this.vending.rotation.elements.set([0, 90, 0]); // rotate 90 degrees
}
/*
async _buildCup() {
  this.cup = new Model();
  const res = await fetch(cupObj);
  const text = await res.text();
  this.cup.loadText(text);
  console.log("cup vertCount:", this.cup.vertCount);
  this.cup.texWeight    = 1.0;
  this.cup.whichTexture = 4;
  this.cup.position.elements.set([28, 3.4, 8]);
  this.cup.scale.elements.set([.4, .4, .4]);
}
*/
  _buildSkybox() {
    const s = new Cube();
    s.position.elements.set([MAP_SIZE / 2, MAP_SIZE / 2, MAP_SIZE / 2]);
    s.scale.elements.set([1000, 1000, 1000]);
    s.texWeight = 0.0;
    s.baseColor = [0.65, 0.88, 1.0, 1.0];// sky blue
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

_buildPool() {
  const water = new Cube();
  water.position.elements.set([16, -0.6, 16]);
  water.scale.elements.set([14, 0.1, 12]);
  water.isWater = true;
  this.water = water; // store separately, not in walls
}
async _buildTrumpet() {
  this.trumpet = new Model();
  const res = await fetch(trumpetObj);
  const text = await res.text();
  this.trumpet.loadText(text);
  console.log("trumpet vertCount:", this.trumpet.vertCount);
  this.trumpet.position.elements.set([27, 1, 16]);
  this.trumpet.scale.elements.set([0.2, 0.2, 0.2]);
}

  _buildSpheres() {
    this.spheres = [];

    const s1 = new Sphere();
    s1.position.elements.set([21, 2, 19]);
    s1.scale.elements.set([1.5, 1.5, 1.5]);
    s1.baseColor = [1.3, 0.1, .60, 1.0]; // red
    //[0.9, 0.2, 0.45, 1.0];

    const s2 = new Sphere();
    s2.position.elements.set([18, 6, 13]);
    s2.scale.elements.set([1.5, 1.5, 1.5]);
    s2.baseColor = [1.0, 1.0, 1.0, 1.0]; 

    const s3 = new Sphere();
    s3.position.elements.set([16, 0.5, 16]); // center of pool
    s3.scale.elements.set([1.5, 1.5, 1.5]);
    s3.baseColor = [1.0, 1.0, 1.0, 1.0]; // white
    s3.texWeight    = 1.0;
s3.whichTexture = 5;
s3.baseColor    = [1.0, 1.0, 1.0, 1.0];

    this.spheres.push(s1, s2, s3);
  }

  _buildLightMarker() {
    // Small white cube rendered at light position each frame
    this.lightMarker = new Cube();
    this.lightMarker.texWeight = 0.0;
    this.lightMarker.baseColor = [1.0, 1.0, 0.2, 1.0]; // yellow
    this.lightMarker.scale.elements.set([0.3, 0.3, 0.3]);
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

  render(gl, camera, lightPos) {
  this.skybox.render(gl, camera);
  for (const g of this.ground) g.render(gl, camera); // changed
  for (const w of this.walls) w.render(gl, camera);
  for (const s of this.spheres) s.render(gl, camera);
  if (lightPos) {
    this.lightMarker.position.elements.set(lightPos);
    this.lightMarker.render(gl, camera);
  }
  if (this.trumpet) this.trumpet.render(gl, camera);
  if (this.vending) this.vending.render(gl, camera);
  if (this.water) this.water.render(gl, camera);
  //if (this.cup) this.cup.render(gl, camera);
}
}