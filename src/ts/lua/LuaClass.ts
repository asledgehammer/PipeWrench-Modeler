import { LuaFile } from "./LuaFile";
import { LuaContainer } from './LuaContainer';
import { LuaMethod } from "./LuaMethod";

/**
 * **LuaClass** represents tables that are declared using `ISBaseObject:derive(..)`. This is the
 * signature for all pseudo-classes in the codebase.
 * 
 * All pseudo-classes house a constructor-like method as follows:
 *  - `<class>:new(..)`
 * 
 * All functions that are assigned with ':' indexers are interpreted as methods. Functions that 
 * are assigned with '.' are considered as static functions.
 * 
 * All 'self.<property>' calls are interpreted as fields in the pseudo-class. All 
 * '<class>.<property>' calls are interpreted as static fields.
 * 
 * @author JabDoesThings
 */
export class LuaClass extends LuaContainer {
  /** The name of the superclass. (Used to link the generated LuaClass following discovery) */
  readonly superClassName: string | null;

  /** The class that this class derives. <class> = <superclass>:derive(..) */
  superClass: LuaClass | null;

  /** The function <class>:new(..) in the class table. */
  _constructor_: LuaMethod | null;

  /**
   * @param file The file containing the pseudo-class declaration.
   * @param name The name of the pseudo-class table. (In global)
   * @param superClassName (Optional) The name of the super-class.
   */
  constructor(file: LuaFile, name: string, superClassName?: string) {
    super(file, name, 'class');
    this.file = file;
    this.superClassName = superClassName;
  }

  scanMethods() {
    this._constructor_?.scanAsConstructor();
    for(const method of Object.values(this.methods)) {
        method.scanFields();
    }
  }

  /**
   * @returns True if a super-class is assigned and linked successfully.
   */
  hasSuperClass(): boolean {
    return this.superClass != null;
  }
}
