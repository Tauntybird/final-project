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
};

// let square: Square;
let wall: Square;
let ground: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let bsp: BSP;

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

function loadScene(gl: WebGL2RenderingContext) {
  const texture = loadTexture(gl, 'src/tilemaps/pokemon-tilemap-amp-plains.png');

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.enable(gl.LINEAR);

  // // Tell the shader we bound the texture to texture unit 0
  // gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  // let uvCoords = convertToUvCoords(23, 6);
  let uvCoordsWall = convertToUvCoords(1, 1); //wall
  let uvCoordsGround = convertToUvCoords(1, 4); //ground
  
  wall = new Square();
  wall.createWithUVs(uvCoordsWall);
  ground = new Square();
  ground.createWithUVs(uvCoordsGround);
  screenQuad = new ScreenQuad();
  screenQuad.create();

  bsp = new BSP(100, 75, 25, 25);
  bsp.generate();

  let [offsetsArrayGround, numGround, offsetsArrayWall, numWall] = bsp.getTiles();
  let offsetsGround: Float32Array = new Float32Array(offsetsArrayGround);
  let offsetsWall: Float32Array = new Float32Array(offsetsArrayWall);

  ground.setInstanceVBOs(offsetsGround);
  ground.setNumInstances(numGround);
  wall.setInstanceVBOs(offsetsWall);
  wall.setNumInstances(numWall);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene(gl);

  let center : number[] = bsp.getCenterCoords();

  // const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));
  const camera = new Camera(vec3.fromValues(center[0], center[1], 10), vec3.fromValues(center[0], center[1], 0));

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
    renderer.render(camera, instancedShader, [
      // square,
      wall,
      ground
    ]);
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
