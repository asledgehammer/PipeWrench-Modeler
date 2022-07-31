import { LuaObject } from './LuaObject';

/**
 * **LuaElement** is the base class for all compiled Lua elements in the generator.
 *
 * @author JabDoesThings
 */
export abstract class LuaNamedObject extends LuaObject {
  /** The name of the element. (If stored globally, identifies as such) */
  readonly name: string;

  /**
   * @param name The name of the element. (If stored globally, identifies as such)
   */
  constructor(name: string) {
    super();
    this.name = name;
  }
}
