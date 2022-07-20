import { LuaContainer } from './LuaContainer';
import { LuaFile } from './LuaFile';

export class LuaTable extends LuaContainer {

  constructor(file: LuaFile, name: string) {
    super(file, name, 'table');
    this.file = file;
  }
}
