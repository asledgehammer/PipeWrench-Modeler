import { LuaClass } from './LuaClass';
import { LuaElement } from './LuaElement';

/**
 * **LuaField** stores calls to constants or variables.
 *
 * LuaFields are treated as fields for classes and treated as properties for tables and global.
 *
 * @author JabDoesThings
 */
export class LuaField extends LuaElement {
  /** (Optional) The class the field is assigned to. */
  readonly clazz: LuaClass | null;
  /** (Optional) If assigned to a class, this tells the generator if the field should be accessed statically or accessed only from a class instance. */
  readonly isStatic: boolean;

  /**
   * @param clazz (Optional) The class the field is assigned to.
   * @param name The name of the element. (If stored globally, identifies as such)
   * @param isStatic (Optional) If assigned to a class, this tells the generator if the field should be accessed statically or accessed only from a class instance.
   */
  constructor(clazz: LuaClass | null, name: string, isStatic: boolean = true) {
    super(name);
    this.clazz = clazz;
    this.isStatic = isStatic;
  }
}
