import {vec3, mat4} from 'gl-matrix';

function center(botLeft: number[], topRight: number[]) : number[] {
    return [Math.round((botLeft[0] + topRight[0]) / 2.), Math.round((botLeft[1] + topRight[1]) / 2.)];
}

function pollRandomPoint(botLeft: number[], topRight: number[]) : number[] {
    return [botLeft[0] + Math.floor(Math.random() * (topRight[0] - botLeft[0])), botLeft[1] + Math.floor(Math.random() * (topRight[1] - botLeft[1]))];
}

class BSPNode {
  leaf: boolean = false;
  room: boolean = false;
  botLeftCoord: number[] = [0, 0];
  topRightCoord: number[] = [0, 0];
  width: number = 0;
  height: number = 0;
  botLeftCoordRoom: number[] = [0, 0];
  topRightCoordRoom: number[] = [0, 0];
  widthRoom: number = 0;
  heightRoom: number = 0;
  children: BSPNode[] = [];
  density: number = 0;

  constructor(botLeftCd: number[], topRightCd: number[], maxRoomWidth: number,  maxRoomHeight: number, density: number) {
      this.botLeftCoord = botLeftCd;
      this.topRightCoord = topRightCd;
      this.width = topRightCd[0] - botLeftCd[0];
      this.height = topRightCd[1] - botLeftCd[1];
      this.density = density;

      if (maxRoomWidth <= 0 && maxRoomHeight <= 0) {
        this.room = true;
        this.botLeftCoordRoom = this.botLeftCoord;
        this.topRightCoordRoom = this.topRightCoord;
          return;
      }
      
      if (this.width <= maxRoomWidth || this.height <= maxRoomHeight) {
          this.leaf = true;
          this.room = true;
          this.widthRoom = Math.floor(Math.random() * this.width * (1. - density) + this.width * density);
          this.heightRoom = Math.floor(Math.random() * this.height * (1. - density) + this.height * density);
        //    this.widthRoom = this.width - 2.;
        //   this.heightRoom = this.height - 2.;
          let widthLeftover : number = this.width - this.widthRoom;
          let heightLeftover : number = this.height - this.heightRoom;
          this.botLeftCoordRoom = [Math.floor(Math.random() * widthLeftover) + this.botLeftCoord[0], Math.floor(Math.random() * heightLeftover) + this.botLeftCoord[1]];
          this.topRightCoordRoom = [this.botLeftCoordRoom[0] + this.widthRoom, this.botLeftCoordRoom[1] + this.heightRoom];
      }
  }

  isLeaf() {
      return this.leaf;
  }

  isRoom() {
      return this.room;
  }

  addChild(child : BSPNode) {
      this.children.push(child);
  }

  makePaths() : [BSPNode, BSPNode] {
    let leftChildren: BSPNode[] = [];
    let rightChildren: BSPNode[] = [];
    for (let i = 0; i < this.children.length; i++) {
        let child = this.children[i];
        if (i == 0 && child.isRoom()) leftChildren.push(child);
        else if (child.isRoom()) rightChildren.push(child);
        for (let j = 0; j < child.children.length; j++) {
            if (i == 0) leftChildren.push(child.children[j]);
            else rightChildren.push(child.children[j]);
        }
    }
    let randomLeftChild: BSPNode = leftChildren[Math.floor(Math.random() * leftChildren.length)];
    let randomRightChild: BSPNode = rightChildren[Math.floor(Math.random() * rightChildren.length)];

    let randomLeftPoint: number[] = pollRandomPoint(randomLeftChild.botLeftCoordRoom, randomLeftChild.topRightCoordRoom);
    let randomRightPoint: number[] = pollRandomPoint(randomRightChild.botLeftCoordRoom, randomRightChild.topRightCoordRoom);

    let horizontalFirst: boolean = Math.random() > .5;
    if (horizontalFirst && randomLeftPoint[0] > randomRightPoint[0] || !horizontalFirst && randomLeftPoint[1] > randomRightPoint[1]) {
        let temp: number[] = randomLeftPoint;
        randomLeftPoint = randomRightPoint;
        randomRightPoint = temp;
    }
    let leftPastRight: boolean = randomLeftPoint[1] >= randomRightPoint[1]; //leftAboveRight
    if (!horizontalFirst) leftPastRight = randomLeftPoint[0] >= randomRightPoint[0]; //leftRightofRight
    
    let path1botLeftCd: number[] = randomLeftPoint;
    let path1topRightCd: number[] = [];
    let path2botLeftCd: number[] = [];  
    let path2topRightCd: number[] = [];
    if (horizontalFirst) {
        path1topRightCd = [randomRightPoint[0] + 1, randomLeftPoint[1] + 1];
        if (leftPastRight) {
            path2botLeftCd = randomRightPoint;
            path2topRightCd = [randomRightPoint[0] + 1, randomLeftPoint[1] + 1];
        }
        else {
            path2botLeftCd = [path1topRightCd[0] - 1, path1topRightCd[1] - 1];
            path2topRightCd = [randomRightPoint[0] + 1, randomRightPoint[1] + 1];
        }
    }
    else {
        path1topRightCd = [randomLeftPoint[0] + 1, randomRightPoint[1] + 1];
        if (leftPastRight) {
            path2botLeftCd = randomRightPoint;
            path2topRightCd = [randomLeftPoint[0] + 1, randomRightPoint[1] + 1];
        }
        else {
            path2botLeftCd = [path1topRightCd[0] - 1, path1topRightCd[1] - 1];
            path2topRightCd = [randomRightPoint[0] + 1, randomRightPoint[1] + 1];
        }
    }
    let path1 : BSPNode = new BSPNode(path1botLeftCd, path1topRightCd, -1, -1, this.density);
    let path2 : BSPNode = new BSPNode(path2botLeftCd, path2topRightCd, -1, -1, this.density);
    this.children = [];
    for (let i = 0; i < leftChildren.length; i++) {
        this.children.push(leftChildren[i]);
    }
    for (let i = 0; i < rightChildren.length; i++) {
        this.children.push(rightChildren[i]);
    }
    this.children.push(path1);
    this.children.push(path2);
    return [path1, path2];
  }

}

export default class BSP {
  mapWidth: number = 1;
  mapHeight: number = 1;
  maxRoomWidth: number = 1;
  maxRoomHeight: number = 1;
  density: number = 2;
  botLeftCoord: number[] = [0, 0];
  topRightCoord: number[] = [0, 0];
  root: BSPNode;

  //0 = wall, 1 = ground
  map: number[][] = [];

  constructor(mapW: number, mapH: number, maxRoomW: number, maxRoomH: number, density: number) {
    this.mapWidth = mapW;
    this.mapHeight = mapH;
    this.maxRoomWidth = maxRoomW;
    this.maxRoomHeight = maxRoomH;
    this.topRightCoord = [this.mapWidth, this.mapHeight];
    this.density = density;
    this.resetMap();
  }

  resetMap() {
    this.map = [];
    for (let i = 0; i < this.mapWidth; i++) {
        let row = [];
        for (let j = 0; j < this.mapHeight; j++) {
            row.push(0);
        }
        this.map.push(row);
    }
  }

  drawRoom(botLeftCoord: number[], topRightCoord: number[]) {
    for(let i = botLeftCoord[0]; i < topRightCoord[0]; i++) {
        for(let j = botLeftCoord[1]; j < topRightCoord[1]; j++) {
            this.map[i][j] = 1;
        }
    }
  }

  generate() {
    this.root = new BSPNode([this.botLeftCoord[0] + 1, this.botLeftCoord[1] + 1], [this.topRightCoord[0] - 1, this.topRightCoord[1] - 1], this.maxRoomWidth - 2, this.maxRoomHeight - 2, this.density);
    this.generateHelper(this.root); 
  }

  generateHelper(currentNode : BSPNode) {
    if (currentNode.isLeaf()) {
        this.drawRoom(currentNode.botLeftCoordRoom, currentNode.topRightCoordRoom);
        return;
    }
    let splitWidth : boolean = currentNode.width >= currentNode.height;
    let centerCoord : number[] = center(currentNode.botLeftCoord, currentNode.topRightCoord);
    
    let botLeftCoord1 = [...currentNode.botLeftCoord];
    let topRightCoord1 = [...currentNode.topRightCoord];

    let botLeftCoord2 = [...currentNode.botLeftCoord];
    let topRightCoord2 = [...currentNode.topRightCoord];
    if (splitWidth) {
        let offset : number = Math.floor((currentNode.width / 2. - Math.random() * currentNode.width) / 3.);
        topRightCoord1[0] = centerCoord[0] + offset;
        botLeftCoord2[0] = centerCoord[0] + offset;
    }
    else {
        let offset : number = Math.floor((currentNode.height / 2. - Math.random() * currentNode.height) / 3.);
        topRightCoord1[1] = centerCoord[1] + offset;
        botLeftCoord2[1] = centerCoord[1] + offset;
    }
    let node1 : BSPNode = new BSPNode(botLeftCoord1, topRightCoord1, this.maxRoomWidth, this.maxRoomHeight, this.density);
    let node2 : BSPNode = new BSPNode(botLeftCoord2, topRightCoord2, this.maxRoomWidth, this.maxRoomHeight, this.density);
    currentNode.addChild(node1);
    currentNode.addChild(node2);
    this.generateHelper(node1);
    this.generateHelper(node2);
    let [path1, path2] = currentNode.makePaths();
    this.drawRoom(path1.botLeftCoordRoom, path1.topRightCoordRoom);
    this.drawRoom(path2.botLeftCoordRoom, path2.topRightCoordRoom);
  }

  getCenterCoords() : number[] {
      return center(this.botLeftCoord, this.topRightCoord);
  }

  getTiles() : [number[], number, number[], number] {
    let offsetsArrayGround : number[] = [];
    let numGround : number = 0;
    let offsetsArrayWall : number[] = [];
    let numWall : number = 0;
  
    for(let i = 0; i < this.mapWidth; i++) {
        for(let j = 0; j < this.mapHeight; j++) {
            if (this.map[i][j] == 0) {
                offsetsArrayWall.push(i);
                offsetsArrayWall.push(j);
                offsetsArrayWall.push(0);
                numWall++;
            }
            else if (this.map[i][j] == 1) {
                offsetsArrayGround.push(i);
                offsetsArrayGround.push(j);
                offsetsArrayGround.push(0);
                numGround++;
            }
        }
    }
  
    return [offsetsArrayGround, numGround, offsetsArrayWall, numWall];
  }

  getMap() : number[][] {
      return this.map;
  }

}