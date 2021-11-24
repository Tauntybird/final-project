import {vec3, mat4} from 'gl-matrix';

function center(botLeft: number[], topRight: number[]) : number[] {
    return [Math.round((botLeft[0] + topRight[0]) / 2.), Math.round((botLeft[1] + topRight[1]) / 2.)];
}

function pollRandomPoint(botLeft: number[], topRight: number[]) : number[] {
    return [botLeft[0] + Math.floor(Math.random() * (topRight[0] - botLeft[0])), botLeft[1] + Math.floor(Math.random() * (topRight[1] - botLeft[1]))];
}

// class Room {
//   topLeftCoord: number[] = [0, 0];
//   botRightCoord: number[] = [0, 0];
// }

class BSPNode {
  leaf: boolean = false;
//   room: boolean = false;
  botLeftCoord: number[] = [0, 0];
  topRightCoord: number[] = [0, 0];
  width: number = 0;
  height: number = 0;
  botLeftCoordRoom: number[] = [0, 0];
  topRightCoordRoom: number[] = [0, 0];
  widthRoom: number = 0;
  heightRoom: number = 0;
  children: BSPNode[] = [];
//   childHasRoom: boolean = false;

  constructor(botLeftCd: number[], topRightCd: number[], maxRoomWidth: number,  maxRoomHeight: number) {
      this.botLeftCoord = botLeftCd;
      this.topRightCoord = topRightCd;
      this.width = topRightCd[0] - botLeftCd[0];
      this.height = topRightCd[1] - botLeftCd[1];
      
    //   if (this.width <= maxRoomWidth || this.height <= maxRoomHeight || Math.random() < .1) {
      if (this.width <= maxRoomWidth || this.height <= maxRoomHeight) {
        //   let showRoom : number = Math.random();
        //   if (showRoom >= .25) { //hide some rooms so there is empty space
            //   this.room = true;
        //   }
          this.leaf = true;
          this.widthRoom = Math.floor(Math.random() * this.width / 2. + this.width / 2.);
          this.heightRoom = Math.floor(Math.random() * this.height / 2. + this.height / 2.);
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

//   drawRoom() {
//       return this.room;
//   }

  addChild(child : BSPNode) {
      this.children.push(child);
  }

}

export default class BSP {
  mapWidth: number = 1;
  mapHeight: number = 1;
  maxRoomWidth: number = 1;
  maxRoomHeight: number = 1;
  botLeftCoord: number[] = [0, 0];
  topRightCoord: number[] = [0, 0];
  root: BSPNode;

  //0 = wall, 1 = ground
  map: number[][] = [];

  constructor(mapW: number, mapH: number, maxRoomW: number, maxRoomH: number) {
    this.mapWidth = mapW;
    this.mapHeight = mapH;
    this.maxRoomWidth = maxRoomW;
    this.maxRoomHeight = maxRoomH;
    this.topRightCoord = [this.mapWidth, this.mapHeight];
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
    this.root = new BSPNode([this.botLeftCoord[0] + 1, this.botLeftCoord[1] + 1], [this.topRightCoord[0] - 1, this.topRightCoord[1] - 1], this.maxRoomWidth - 2, this.maxRoomHeight - 2);
    this.generateHelper(this.root); 
  }

  generateHelper(currentNode : BSPNode) {
    if (currentNode.isLeaf()) {
        // if (currentNode.drawRoom()) {
            this.drawRoom(currentNode.botLeftCoordRoom, currentNode.topRightCoordRoom);
        // }
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
    let node1 : BSPNode = new BSPNode(botLeftCoord1, topRightCoord1, this.maxRoomWidth, this.maxRoomHeight);
    let node2 : BSPNode = new BSPNode(botLeftCoord2, topRightCoord2, this.maxRoomWidth, this.maxRoomHeight);
    currentNode.addChild(node1);
    currentNode.addChild(node2);
    this.generateHelper(node1);
    this.generateHelper(node2);
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

}