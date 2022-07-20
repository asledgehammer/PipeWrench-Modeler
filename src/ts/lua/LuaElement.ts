/**
 * **LuaElement** is the base class for all compiled Lua elements in the generator.
 * 
 * @author JabDoesThings
 */
export class LuaElement {
  /** The name of the element. (If stored globally, identifies as such) */
  readonly name: string;

  /**
   * @param name The name of the element. (If stored globally, identifies as such)
   */
  constructor(name: string) {
    this.name = name;
  }
}
