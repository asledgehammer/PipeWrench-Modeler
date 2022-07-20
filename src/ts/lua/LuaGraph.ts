import { LuaFile } from './LuaFile';

class Branch {
  root: LuaGraph | null;
  readonly branches: Branch[] = [];
  readonly file: LuaFile | null;
  
  parent: Branch | null;

  constructor(root: LuaGraph | null, parent: Branch | null, file: LuaFile | null) {
    this.root = root;
    this.parent = parent;
    this.file = file;
  }

  forEach(consumer: (file: LuaFile) => void) {
    consumer(this.file);
    for(const next of this.branches) {
      next.forEach(consumer);
    }
  }

  setParent(parent: Branch | null) {
    if (this.parent) {
      this.parent.branches.splice(this.parent.branches.indexOf(this), 1);
    }
    this.parent = parent;
    if (parent) parent.addChild(this);
  }

  addChild(child: Branch) {
    const index = this.branches.indexOf(child);
    if (index === -1) {
      child.setParent(null);
      this.branches.push(child);
    }
  }

  removeChild(child: Branch) {
    const index = this.branches.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this.branches.splice(this.branches.indexOf(child), 1);
    }
  }

  sort(): number {
    const { file } = this;
    if (file == null) return 0;

    let sorted = 0;

    for (const require of file.requires) {
      const node = this.root.getNode(require);
      if (!node) continue;

      const isAfter = this.root.isAfterNode(this, node);
      console.log(isAfter);
      if (!isAfter) {
        node.addChild(this);
        sorted++;
      }
    }

    for (const next of this.branches) {
      sorted += next.sort();
    }

    return sorted;
  }

  getNode(endPath: string): Branch | null {
    for (const node of this.branches) {
      if (node.file && node.file.id.endsWith(endPath)) {
        return node;
      }
    }
    for (const node of this.branches) {
      const result = node.getNode(endPath);
      if (result) return result;
    }
    return null;
  }

  lookup(node: Branch, path: number[] = []): number {
    if (!this.branches.length) return -1;
    if (this === node) return this.parent ? this.parent.branches.indexOf(this) : 0;
    for (let index = 0; index < this.branches.length; index++) {
      if(this.branches[index] === node) {
        return index;
      } else {
        const result = this.branches[index].lookup(node, path);
        if (result > -1) path.push(index);
        return index;
      }
    }
    return -1;
  }
}

export class LuaGraph extends Branch {

  constructor() {
    super(null, null, null);
    this.root = this;
  }

  addFile(file: LuaFile) {
    const node = new Branch(this.root, this, file);
    this.branches.push(node);
  }

  forEach(consumer: (file: LuaFile) => void) {
    for(const next of this.branches) {
      next.forEach(consumer);
    }
  }

  sort(): number {
    console.log(this.branches);
    let countTotal = 0;
    let countCycle = 0;
    let cycle = 0;
    do {
      countCycle = 0;
      for(const next of this.branches) {
        countCycle += next.sort();
      }
      countTotal += countCycle;
      console.log(`cycle ${cycle++}: ${countCycle}`);
    } while(countCycle !== 0);

    console.log(`Total cycles: ${cycle}. Total sorts: ${countTotal}.`);
      return countTotal;
  }

  lookupNode(node: Branch): number[] {
    const path: number[] = [];
    for (let index = 0; index < this.branches.length; index++) {
      if(this.branches[index] === node) {
        path.push(index);
        return path;
      } 
    }
    for (let index = 0; index < this.branches.length; index++) {
      const result = this.branches[index].lookup(node, path);
      if (result > -1) path.push(index);
      return path.reverse();
    }
    console.log(node);
    throw new Error("branch does not exist on tree.");
  }

  isAfterNode(node: Branch, target: Branch): boolean {
    if (node === target) throw new Error('Both the node and the target are the same node.');

    const pathNode = this.lookupNode(node);
    const pathTarget = this.lookupNode(target);

    console.log(pathNode, pathTarget);

    // if(!pathNode.length && !pathTarget.length) return false;

    const minLength = Math.min(pathNode.length, pathTarget.length);

    // Check each link in the chain.
    //  - If the next link of the node is greater, then it is after.
    //  - If the next link of the node is lesser, then it is before.
    for (let index = 0; index < minLength; index++) {
      if (pathNode[index] > pathTarget[index]) return true;
      else if (pathNode[index] < pathTarget[index]) return false;
    }

    // Sanity check.
    if (
      pathNode.length === pathTarget.length) {
      console.log(node, target);
      throw new Error('Identical node positions for compared nodes. This should never happen.');
    }

    // All paths are identical. If the path to the node is longer, it's after the target.
    return pathNode.length > pathTarget.length;
  }
}
