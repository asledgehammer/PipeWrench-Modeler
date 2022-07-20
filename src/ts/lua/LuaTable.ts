import { LuaContainer } from './LuaContainer';
import { LuaFile } from './LuaFile';

/**
 * **LuaTable** represents tables that are not pseudo-classes.
 * 
 * All functions that are assigned with ':' indexers are interpreted as methods. Functions that 
 * are assigned with '.' are considered as static functions.
 * 
 * All 'self.<property>' calls are interpreted as fields in the pseudo-class. All 
 * '<class>.<property>' calls are interpreted as static fields.
 * 
 * @author JabDoesThings
 */
export class LuaTable extends LuaContainer {

  /**
   * @param file The file containing the table declaration.
   * @param name The name of the table. (In global)
   */
  constructor(file: LuaFile, name: string) {
    super(file, name, 'table');
    this.file = file;
  }
}
