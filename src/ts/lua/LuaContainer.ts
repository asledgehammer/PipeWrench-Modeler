import { LuaClass } from './LuaClass';
import { LuaElement } from './LuaElement';
import { LuaField } from './LuaField';
import { LuaFile } from './LuaFile';
import { LuaMethod } from './LuaMethod';
import { fixParameters } from './LuaUtils';
import { DocBuilder } from '../DocBuilder';
import { ClassModel } from './model/ClassModel';
import { TableModel } from './model/TableModel';

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

  audit() {
    for (const methodName of Object.keys(this.methods)) {
      if (this.fields[methodName]) delete this.fields[methodName];
    }
  }

  generateClassDocumentation(prefix: string, model: ClassModel): string {
    const doc = new DocBuilder();
    doc.appendAnnotation('customConstructor', `${this.name}:new`);

    // No further documentation available for the class.
    if (!model) return doc.build(prefix);

    const classDoc = model.doc;
    if (classDoc) {
      const { annotations, authors, lines } = classDoc;

      // Process annotations. (If defined)
      const annoKeys = Object.keys(annotations);
      if (annoKeys && annoKeys.length) {
        for (const key of annoKeys) doc.appendAnnotation(key, annotations[key]);
      } else {
        if (!authors || !authors.length) {
          // The 'customConstructor' annotation is multi-line. Adding `@` terminates it.
          doc.appendLine('@');
        }
      }

      // Process authors. (If defined)
      if (authors && authors.length) {
        let s = '[';
        for (const author of authors) s += `${author}, `;
        s = `${s.substring(0, s.length - 2)}]`;
        doc.appendAnnotation('author', s);
      }

      // Process lines. (If defined)
      if (lines && lines.length) {
        if (!doc.isEmpty()) doc.appendLine();
        for (const line of lines) doc.appendLine(line);
      }
    }

    return doc.build(prefix);
  }

  generateTableDocumentation(prefix: string, model: TableModel): string {
    const doc = new DocBuilder();

    // No further documentation available for the class.
    if (!model) return doc.build(prefix);

    const tableDoc = model.doc;
    if (tableDoc) {
      const { annotations, authors, lines } = tableDoc;

      // Process annotations. (If defined)
      const annoKeys = Object.keys(annotations);
      if (annoKeys && annoKeys.length) {
        for (const key of annoKeys) doc.appendAnnotation(key, annotations[key]);
      }

      // Process authors. (If defined)
      if (authors && authors.length) {
        let s = '[';
        for (const author of authors) s += `${author}, `;
        s = `${s.substring(0, s.length - 2)}]`;
        doc.appendAnnotation('author', s);
      }

      doc.appendLine();

      // Process lines. (If defined)
      if (lines && lines.length) {
        for (const line of lines) doc.appendLine(line);
      }
    }

    return doc.build(prefix);
  }

  compile(prefix: string = ''): string {
    const { library } = this.file;

    let doc: string;

    // Render empty classes & tables on one line.
    if (this instanceof LuaClass) {
      const model = library.getClassModel(this as any);
      doc = this.generateClassDocumentation(prefix, model);

      if (!Object.keys(this.fields).length && !Object.keys(this.methods).length && !this._constructor_) {
        let s = `${doc}\n`;
        s += `${prefix}declare class ${this.name}`;
        if (this instanceof LuaClass && this.superClass) {
          s += ` extends ${this.superClass.name}`;
        }
        return ' {}';
      }
    } else {
      const model = library.getTableModel(this as any);
      doc = this.generateTableDocumentation(prefix, model);

      let s = `${doc}\n`;
      if (!Object.keys(this.fields).length && !Object.keys(this.methods).length) {
        return `${s}\n${prefix}declare class ${this.name} {}`;
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

      const { library } = this.file;
      const classModel = library.getClassModel(clazz);

      let s = '';
      if (classModel) {
        const { _constructor_ } = classModel;

        if (_constructor_ && _constructor_.testSignature(clazz._constructor_)) {
          const doc = new DocBuilder();
          const { doc: constructorDoc, params } = _constructor_;
          if (constructorDoc) {
            const { annotations, lines } = constructorDoc;
            if (annotations) {
              // Process annotations. (If defined)
              const annoKeys = Object.keys(annotations);
              if (annoKeys && annoKeys.length) {
                for (const key of annoKeys) doc.appendAnnotation(key, annotations[key]);
                doc.appendLine();
              }
            }
            // Process lines. (If defined)
            if (lines && lines.length) {
              for (const line of lines) doc.appendLine(line);
              doc.appendLine();
            }

            // Process params. (If defined)
            if (params) {
              for (const param of params) {
                const { name, doc: paramDoc } = param;

                if (!doc) {
                  doc.appendParam(name);
                  continue;
                } else {
                  const { lines } = paramDoc;

                  if (!lines || !lines.length) {
                    doc.appendParam(name);
                    continue;
                  }

                  doc.appendParam(name, lines[0]);
                  if (lines.length === 1) continue;
                  for (let index = 1; index < lines.length; index++) {
                    doc.appendLine(lines[index]);
                  }
                }
              }
            }
          }
          s = doc.build(newPrefix);
        }
      }

      // Compile parameter(s). (If any)
      let paramS = '';
      const params = fixParameters(_constructor_.params);
      if (params.length) {
        for (const param of params) paramS += `${param}: unknown, `;
        paramS = paramS.substring(0, paramS.length - 2);
      }

      return `${s.length ? `${s}\n` : ''}${newPrefix}constructor(${paramS});`;
    };

    sortFields();
    sortMethods();

    // Class Declaration line.
    let s = '';

    console.log(doc);

    if (doc && doc.length) s += `${doc}\n`;

    s += `${prefix}declare class ${this.name}`;
    if (this instanceof LuaClass && this.superClass) {
      s += ` extends ${this.superClass.name}`;
    }
    s += ' {\n';

    // Make sure that no one can try to use Lua tables as a class, even though we're using
    // the class type for tables. This is to keep things clean. We *could* go with an interface,
    // however values cannot be assigned to them in TypeScript like tables can in Lua.
    if (this.type === 'table') {
      s += `${newPrefix}private constructor();\n`;
    }

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
      s += `${compileConstructor(this)}\n`;
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
    return `${s}${prefix}}`;
  }
}
