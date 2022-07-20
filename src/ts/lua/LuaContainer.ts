import { LuaElement } from "./LuaElement";
import { LuaField } from "./LuaField";
import { LuaFile } from "./LuaFile";
import { LuaMethod } from "./LuaMethod";

/**
 * All types of LuaContainer instances.
 * 
 * @author JabDoesThings
 */
export type LuaContainerType = 'table' | 'class';

/**
 * **LuaContainer** represents pseudo-classes and tables, packaging information for both.
 * 
 * All functions that are assigned with ':' indexers are interpreted as methods. Functions that 
 * are assigned with '.' are considered as static functions.
 * 
 * All 'self.<property>' calls are interpreted as fields in the container. All 
 * '<class>.<property>' calls are interpreted as static fields.
 * 
 * @author JabDoesThings
 */
export class LuaContainer extends LuaElement {
  /** The type of instanced container. */
  readonly type: LuaContainerType;

  /** All methods and static functions in the container. */
  methods: { [id: string]: LuaMethod } = {};

  /** All fields in the container. */
  fields: { [id: string]: LuaField } = {};

  /** The file containing the table's declaration. */
  file: LuaFile;

  /**
   * @param file The file containing the table's declaration.
   * @param name The name of the table. (In global)
   * @param type The type of container. ('table' or 'class')
   */
  constructor(file: LuaFile, name: string, type: LuaContainerType = 'table') {
    super(name);
    this.file = file;
    this.type = type;
  }
}
