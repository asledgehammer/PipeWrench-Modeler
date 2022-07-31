import { LuaNamedObject } from './LuaNamedObject';
import { LuaField } from './LuaField';
import { LuaFile } from './LuaFile';
import { LuaMethod } from './LuaMethod';

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
export abstract class LuaContainer extends LuaNamedObject {
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
  constructor(file: LuaFile, name: string, type: LuaContainerType) {
    super(name);
    this.file = file;
    this.type = type;
  }

  protected sortFields(): { staticFields: LuaField[]; nonStaticFields: LuaField[] } {
    const staticFields: LuaField[] = [];
    const nonStaticFields: LuaField[] = [];
    // Sort fields by name alphanumerically.
    const fieldNames = Object.keys(this.fields);
    fieldNames.sort((o1, o2): number => o1.localeCompare(o2));
    for (const fieldName of fieldNames) {
      const field = this.fields[fieldName];
      if (field.isStatic) staticFields.push(field);
      else nonStaticFields.push(field);
    }
    return { staticFields, nonStaticFields };
  }

  protected sortMethods(): { staticMethods: LuaMethod[]; nonStaticMethods: LuaMethod[] } {
    const staticMethods: LuaMethod[] = [];
    const nonStaticMethods: LuaMethod[] = [];
    // Sort methods by name alphanumerically.
    const methodNames = Object.keys(this.methods);
    methodNames.sort((o1, o2): number => o1.localeCompare(o2));
    for (const methodName of methodNames) {
      const method = this.methods[methodName];
      if (method.isStatic) staticMethods.push(method);
      else nonStaticMethods.push(method);
    }
    return { staticMethods, nonStaticMethods };
  }

  audit() {
    // Remove any field duplicates of methods.
    for (const methodName of Object.keys(this.methods)) {
      if (this.fields[methodName]) delete this.fields[methodName];
    }
  }
}
