import { LuaClass } from './LuaClass';
import { LuaElement } from './LuaElement';
import { LuaField } from './LuaField';
import { LuaFile } from './LuaFile';
import { LuaMethod } from './LuaMethod';
import { fixParameters, sanitizeParameter } from './LuaUtils';

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

  compile(prefix: string = ''): string {

    // Render empty classes & tables on one line.
    if (this instanceof LuaClass) {
      if (!Object.keys(this.fields).length && !Object.keys(this.methods).length && !this._constructor_) {
        let s = `${prefix}declare class ${this.name}`;
        if (this instanceof LuaClass && this.superClass) {
          s += ` extends ${this.superClass.name}`;
        }
        return ' {}';
      }
    } else {
      if (!Object.keys(this.fields).length && !Object.keys(this.methods).length) {
        return `${prefix}declare class ${this.name} {}`;
      }
    }

    const newPrefix = prefix + '  ';
    const staticFields: LuaField[] = [];
    const nonStaticFields: LuaField[] = [];
    const staticMethods: LuaMethod[] = [];
    const nonStaticMethods: LuaMethod[] = [];

    const sortFields = () => {
      // Sort fields by name alphanumerically.
      const fieldNames = Object.keys(this.fields);
      fieldNames.sort((o1, o2): number => {
        return o1.localeCompare(o2);
      });
      for (const fieldName of fieldNames) {
        const field = this.fields[fieldName];
        if (field.isStatic) {
          staticFields.push(field);
        } else {
          nonStaticFields.push(field);
        }
      }
    };

    const sortMethods = () => {
      // Sort methods by name alphanumerically.
      const methodNames = Object.keys(this.methods);
      methodNames.sort((o1, o2): number => {
        return o1.localeCompare(o2);
      });
      for (const methodName of methodNames) {
        const method = this.methods[methodName];
        if (method.isStatic) {
          staticMethods.push(method);
        } else {
          nonStaticMethods.push(method);
        }
      }
    };

    const compileConstructor = (clazz: LuaClass): string | null => {
      const { _constructor_ } = clazz;
      if (!_constructor_) return null;

      // Compile parameter(s). (If any)
      let paramS = '';
      const params = fixParameters(_constructor_.params);
      if (params.length) {
        for (const param of params) paramS += `${param}: unknown, `;
        paramS = paramS.substring(0, paramS.length - 2);
      }

      return `constructor(${paramS});`;
    };

    sortFields();
    sortMethods();

    // Class Declaration line.
    let s = `${prefix}declare class ${this.name}`;
    if (this instanceof LuaClass && this.superClass) {
      s += ` extends ${this.superClass.name}`;
    }
    s += ' {\n';

    // Render static field(s). (If any)
    if (staticFields.length) {
      s += `${newPrefix}/* STATIC FIELDS */\n`;
      for (const field of staticFields) {
        s += `${field.compile(newPrefix)}\n`;
      }
    }

    // Render static field(s). (If any)
    if (nonStaticFields.length) {
      s += `${newPrefix}/* FIELDS */\n`;
      for (const field of nonStaticFields) {
        s += `${field.compile(newPrefix)}\n`;
      }
    }

    if (this instanceof LuaClass) {
      s += `\n${newPrefix}${compileConstructor(this)}\n`;
    }

    // Render static method(s). (If any)
    if (nonStaticMethods.length) {
      s += `${newPrefix}/* METHODS */\n`;
      for (const method of nonStaticMethods) s += `${method.compile(newPrefix)}\n`;
    }

    // Render static method(s). (If any)
    if (staticMethods.length) {
      s += `${newPrefix}/* STATIC METHODS */\n`;
      for (const method of staticMethods) s += `${method.compile(newPrefix)}\n`;
    }

    // End of Class Declaration line.
    s += `${prefix}}`;

    return s;
  }
}
