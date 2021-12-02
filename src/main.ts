import {mat4, vec3} from 'gl-matrix';
// import * as Stats from 'stats-js';
const Stats = require('stats-js');
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import BSP from './BSP';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  totalDungeonWidth: 100,
  totalDungeonHeight: 75,
  maxRoomWidth: 25,
  maxRoomHeight: 25,
  maxCorridorWidth: 10,
  maxCorridorHeight: 10,
  density: .5,
  tilemapTheme: 'src/tilemaps/pokemon-tilemap-amp-plains.png',
  generate: loadScene
};

// let square: Square;
let wall: Square;
let ground: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let bsp: BSP;

//map from tile 3x3 string to tile Number
let layoutToNumber: Map<string, number>;
//map from tile Number to tile UVCoords
let numberToCoords: Map<number, [number, number]>;
//map from tile UVCoords to tile Square
let coordsToSquare: Map<[number, number], Square>;
//map tilemap Name to tilemap Filepath
//TODO? or in controls
let usedSquares: Square[];
let priorityTiles: number[] = [ 2, 4, 6, 8, //edges
                                1, 3, 7, 9, //corners
                                10, 11, 12, 13, 14, 15, 16, //thin walls
                                17, 18, 19, 20, 21,]; //thin walls

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl: WebGL2RenderingContext, url: string) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn off mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value: number) {
  return (value & (value - 1)) == 0;
}

function convertToUvCoords(row: number, col: number) {
  let widthPixelUnit = 1. / 226.;
  let heightPixelUnit = 1. / 601.;
  let widthTileUnit = widthPixelUnit * 24;
  let heightTileUnit = heightPixelUnit * 24;
  let widthTileUnitWithBound = widthPixelUnit * 25;
  let heightTileUnitWithBound = heightPixelUnit * 25;

  //bottom left
  //bottom right
  //top right
  //top left

  let uvCoords = new Float32Array([widthPixelUnit + col * widthTileUnitWithBound, (row + 1) * heightTileUnitWithBound,
                                  (col + 1) * widthTileUnitWithBound, (row + 1) * heightTileUnitWithBound,
                                  (col + 1) * widthTileUnitWithBound, heightPixelUnit + row * heightTileUnitWithBound,
                                  widthPixelUnit + col * widthTileUnitWithBound, heightPixelUnit + row * heightTileUnitWithBound]);

  // let uvCoords = new Float32Array([widthTileUnit + 0.0,  1.0 / 24.,
  //                                   1.0 / 9.,  1.0 / 24.,
  //                                   1.0 / 9.,  heightTileUnit + 0.0,
  //                                   widthTileUnit + 0.0,  heightTileUnit + 0.0]);
  return uvCoords;
}

function invertLayout(str: string) : string {
  let result : string = "";
  for (let i = 0; i < str.length; i++) {
    if(str[i] == '0') result += '1';
    else result += '0';
  }
  return result;
}

function loadTileBasicMaps() {
  //map from tile 3x3 string to tile Number
  layoutToNumber = new Map<string, number>([
    ["111100100", 1],
    ["111000000", 2],
    ["111001001", 3],
    ["100100100", 4],
    ["000000000", 5],
    ["001001001", 6],
    ["100100111", 7],
    ["000000111", 8],
    ["001001111", 9],
    ["111100101", 10],
    ["111000111", 11],
    ["111001101", 12],
    ["101101101", 13],
    ["111101111", 14],
    ["101100111", 15],
    ["101001111", 16],
    ["111101101", 17],
    ["111100111", 18],
    ["101000101", 19],
    ["111001111", 20],
    ["101101111", 21],
    ["111000101", 22],
    ["101100101", 23],
    ["101001101", 24],
    ["101000111", 25],
    ["000000101", 26],
    ["001000001", 27],
    ["100000100", 28],
    ["101000000", 29],
    ["000000001", 30],
    ["000000100", 31],
    ["001000000", 32],
    ["100000000", 33],
    ["100100101", 34],
    ["001001101", 35],
    ["101100100", 36],
    ["101001001", 37],
    ["111000001", 38],
    ["111000100", 39],
    ["001000111", 40],
    ["100000111", 41],
    ["101000100", 42],
    ["101000001", 43],
    ["100000101", 44],
    ["001000101", 45],
    ["100000001", 46],
    ["001000100", 47],
    //extra cases
    ["100000110", 8],
    ["110000100", 2],
    ["001000011", 8],
    ["011000001", 2],
    ["000100101", 4],
    ["000001101", 6],
    ["101100000", 4],
    ["101001000", 6],

    ["010000000", 2],
    ["000100000", 4],
    ["000001000", 6],
    ["000000010", 8],

    ["110000110", 11],
    ["000101101", 13],
    ["001000011", 11],
    ["101101000", 13],

    ["011000000", 2],
    ["110000000", 2],
    ["100100000", 4],
    ["000100100", 4],
    ["001001000", 6],
    ["000001001", 6],
    ["000000011", 8],
    ["000000110", 8],

    ["110100100", 1],
    ["111100000", 1],
    ["011001001", 3],
    ["111001000", 3],
    ["100100110", 7],
    ["000100111", 7],
    ["001001011", 9],
    ["000001111", 9],
  ]);
  for (let key of layoutToNumber.keys()) {
    let invertedKey : string = invertLayout(key); //(' ' + key).slice(1)
    if (layoutToNumber.has(invertedKey)) continue;
    layoutToNumber.set(invertedKey, Number(layoutToNumber.get(key) + 47));
  }
  //map from tile Number to tile UVCoords
  numberToCoords = new Map<number, [number, number]>([
    [1, [0, 0]],
    [2, [0, 1]],
    [3, [0, 2]],
    [4, [1, 0]],
    [5, [1, 1]],
    [6, [1, 2]],
    [7, [2, 0]],
    [8, [2, 1]],
    [9, [2, 2]],
    [10, [3, 0]],
    [11, [3, 1]],
    [12, [3, 2]],
    [13, [4, 0]],
    [14, [4, 1]],
    [15, [5, 0]],
    [16, [5, 2]],
    [17, [6, 1]],
    [18, [7, 0]],
    [19, [7, 1]],
    [20, [7, 2]],
    [21, [8, 1]],
    [22, [9, 1]],
    [23, [10, 0]],
    [24, [10, 2]],
    [25, [11, 1]],
    [26, [12, 1]],
    [27, [13, 0]],
    [28, [13, 2]],
    [29, [14, 1]],
    [30, [15, 0]],
    [31, [15, 1]],
    [32, [16, 0]],
    [33, [16, 1]],
    [34, [17, 0]],
    [35, [17, 1]],
    [36, [18, 0]],
    [37, [18, 1]],
    [38, [19, 0]],
    [39, [19, 1]],
    [40, [20, 0]],
    [41, [20, 1]],
    [42, [21, 0]],
    [43, [21, 1]],
    [44, [22, 0]],
    [45, [22, 1]],
    [46, [23, 0]],
    [47, [23, 1]],
  ]);
  for (let i = 1; i <= 47; i++) {
    let oldCoords : [number, number] = numberToCoords.get(i);
    let newCoords : [number, number] = [oldCoords[0], oldCoords[1] + 3];
    numberToCoords.set(i + 47, newCoords);
  }
}

function updateTileMap() {
  //map from tile UVCoords to tile Square
  coordsToSquare = new Map<[number, number], Square>();
  for (let key of numberToCoords.keys()) {
    let origCoords : [number, number] = numberToCoords.get(key);
    let UVCoords : Float32Array = convertToUvCoords(origCoords[0], origCoords[1]);
    let newSquare : Square = new Square();
    newSquare.createWithUVs(UVCoords);
    coordsToSquare.set(origCoords, newSquare);
  }
}

function findLayoutDifference(layout1 : string, layout2: string) : number {
  let count : number = 0;
  for (let i = 0; i < layout1.length; i++) {
    if (layout1[i] != layout2[i]) count++;
  }
  return count;
}

function findClosestTile(layout : string) : number {
  // let curInd : number = priorityTiles.indexOf(layoutToNumber.get(layout));
  let lowDiff : number = 10;
  let tileNumber : number = -1;
  let curInd : number = -2;
  for (let key of layoutToNumber.keys()) {
    let keyInd : number = priorityTiles.indexOf(layoutToNumber.get(key));
    if (key[4] != layout[4]) continue;
    let diff : number = findLayoutDifference(key, layout);
    if (diff == lowDiff) {
      if (keyInd > curInd) {
        lowDiff = diff;
        tileNumber = layoutToNumber.get(key);
        curInd = keyInd;
      }
    }
    else if (diff < lowDiff) {
      lowDiff = diff;
      tileNumber = layoutToNumber.get(key);
      curInd = keyInd;
    }
  }
  return tileNumber;
}

function loadScene(gl: WebGL2RenderingContext, makeNewScene: boolean) {
  const texture = loadTexture(gl, controls.tilemapTheme); //'src/tilemaps/pokemon-tilemap-amp-plains.png');
  updateTileMap();

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // gl.enable(gl.LINEAR); //dont think this works

  // // Tell the shader we bound the texture to texture unit 0
  // gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  // let uvCoords = convertToUvCoords(23, 6);

  //START PREV VERS
  // let uvCoordsWall = convertToUvCoords(1, 1); //wall
  // let uvCoordsGround = convertToUvCoords(1, 4); //ground
  
  // wall = new Square();
  // wall.createWithUVs(uvCoordsWall);
  // ground = new Square();
  // ground.createWithUVs(uvCoordsGround);
  screenQuad = new ScreenQuad();
  screenQuad.create();

  bsp = new BSP(controls.totalDungeonWidth, controls.totalDungeonHeight, controls.maxRoomWidth, controls.maxRoomHeight, controls.density);
  bsp.generate();

  // let [offsetsArrayGround, numGround, offsetsArrayWall, numWall] = bsp.getTiles();
  // let offsetsGround: Float32Array = new Float32Array(offsetsArrayGround);
  // let offsetsWall: Float32Array = new Float32Array(offsetsArrayWall);

  // ground.setInstanceVBOs(offsetsGround);
  // ground.setNumInstances(numGround);
  // wall.setInstanceVBOs(offsetsWall);
  // wall.setNumInstances(numWall);
  //END PREV VERS


  let numberToOffsets: Map<number, number[]> = new Map<number, number[]>();
  let numberToCount: Map<number, number> = new Map<number, number>();
  let bspmap : number[][] = bsp.getMap();
  for (let i = 0; i < bspmap.length; i++) {
    for (let j = 0; j < bspmap[0].length; j++) {
      let layout : string = "";
      for (let lj = j + 1; lj >= j - 1; lj--) {
        for (let li = i - 1; li <= i + 1; li++) {
          if (li < 0 || lj < 0 || li >= bspmap.length || lj >= bspmap[i].length) layout += '0';
          else layout += bspmap[li][lj];
        }
      }
      let numTile : number = layoutToNumber.get(layout);
      // if (layout == '111000000')
      // {
      //   console.log(numTile);
      // }
      if (numTile == undefined) {
        // console.log(numTile + " " + layout);
        let closestTileNumber : number = findClosestTile(layout);
        // layoutToNumber.set(layout, closestTileNumber);
        numTile = closestTileNumber;
      }
      // if (numTile > 94) {
        // console.log(numTile + " " + layout);
        // console.log(layout);
      // }
      if (!numberToOffsets.has(numTile)) numberToOffsets.set(numTile, []);
      let offsetsArray : number[] = numberToOffsets.get(numTile);
      offsetsArray.push(i);
      offsetsArray.push(j);
      offsetsArray.push(0);
      if (!numberToCount.has(numTile)) numberToCount.set(numTile, 0);
      numberToCount.set(numTile, numberToCount.get(numTile) + 1);
    }
  }

  usedSquares = [];

  for (let key of numberToOffsets.keys()) {
    if (key == undefined) continue;
    // console.log(key);
    // console.log(numberToOffsets.get(key))
    let sq : Square = coordsToSquare.get(numberToCoords.get(key));
    usedSquares.push(sq);
    sq.setInstanceVBOs(new Float32Array(numberToOffsets.get(key)));
    sq.setNumInstances(numberToCount.get(key));
  }
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'totalDungeonWidth', 0, 200).step(1).name('Dungeon Max Width');
  gui.add(controls, 'totalDungeonHeight', 0, 200).step(1).name('Dungeon Max Height');
  gui.add(controls, 'maxRoomWidth', 0, 200).step(1).name('Room Max Width');
  gui.add(controls, 'maxRoomHeight', 0, 200).step(1).name('Room Max Height');
  gui.add(controls, 'maxCorridorWidth', 0, 200).step(1).name('Corridor Max Width');
  gui.add(controls, 'maxCorridorHeight', 0, 200).step(1).name('Corridor Max Height');
  gui.add(controls, 'density', 0, 1).step(.05).name('Room Capacity');
  gui.add(controls, 'tilemapTheme', { Amp_Plains: 'src/tilemaps/pokemon-tilemap-amp-plains.png',
                                      Apple_Woods: 'Apple',
                                      Beach_Cave: 'Beach' }).name('Tile Theme');
  // gui.add(controls, 'generate').name('Generate!');
  gui.add({generate : controls.generate.bind(this, gl, true)}, 'generate').name('Generate!');

  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  //Initial call to set up basic tile map info
  loadTileBasicMaps();

  // Initial call to load scene
  loadScene(gl, true); //TODO: let tilemaps be changed without changing the current scene

  let center : number[] = bsp.getCenterCoords();

  // const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));
  const camera = new Camera(vec3.fromValues(center[0], center[1], 10), vec3.fromValues(center[0], center[1], 0));
  // const camera = new Camera(vec3.fromValues(center[0], center[1], 70), vec3.fromValues(center[0], center[1], 60));
  // const camera = new Camera(vec3.fromValues(center[0], center[1], 50), vec3.fromValues(center[0], center[1], 40));


  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  // gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  instancedShader.setSampler();
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    
    renderer.render(camera, flat, [screenQuad]);
//     let renderedStuff = [
//       // square,
// //      wall,
//   //    ground,
//     ];
//     for (let i = 0; i < usedSquares.length; i++) {
//       renderedStuff.push(usedSquares[i]);
//     }
    renderer.render(camera, instancedShader, usedSquares); //renderedStuff);

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
