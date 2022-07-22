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

      const docs = classModel ? classModel.generateConstructorDoc(newPrefix, clazz) : '';
      const constructorModel = classModel ? classModel._constructor_ : null;

      const compileTypes = (types: string[]): string => {
        let returnS = '';
        if (types && types.length) {
          for (const type of types) {
            if (returnS.length) returnS += ' | ';
            returnS += type;
          }
        }
        return returnS;
      };

      // Compile parameter(s). (If any)
      let paramS = '';
      let params: string[] = [];

      // If the model is present, set param names from it as some params may be renamed.
      if (constructorModel && constructorModel.testSignature(_constructor_)) {
        for (const param of constructorModel.params) {
          const types = param.types ? compileTypes(param.types) : 'unknown';
          params.push(`${param.name}: ${types}`);
        }
      } else {
        params = fixParameters(params).map((param) => `${param}: unknown`);
      }
      if (params.length) {
        for (const param of params) paramS += `${param}, `;
        paramS = paramS.substring(0, paramS.length - 2);
      }

      return `${docs.length ? `${docs}\n` : ''}${newPrefix}constructor(${paramS});`;
    };

    sortFields();
    sortMethods();

    // Class Declaration line.
    let s = '';

    if (doc && doc.length) s += `${doc}\n`;

    s += `${prefix}declare class ${this.name}`;
    if (this instanceof LuaClass && this.superClass) {
      s += ` extends ${this.superClass.name}`;
    }
    s += ' {\n\n';

    // Make sure that no one can try to use Lua tables as a class, even though we're using
    // the class type for tables. This is to keep things clean. We *could* go with an interface,
    // however values cannot be assigned to them in TypeScript like tables can in Lua.
    if (this.type === 'table') {
      s += `${newPrefix}private constructor();\n`;
    }

    // Render static field(s). (If any)
    if (staticFields.length) {
      for (const field of staticFields) {
        s += `${field.compile(newPrefix)}\n\n`;
      }
    }

    // Render static field(s). (If any)
    if (nonStaticFields.length) {
      for (const field of nonStaticFields) {
        s += `${field.compile(newPrefix)}\n\n`;
      }
    }

    if (this instanceof LuaClass) {
      s += `${compileConstructor(this)}\n\n`;
    }

    // Render static method(s). (If any)
    if (nonStaticMethods.length) {
      for (const method of nonStaticMethods) s += `${method.compile(newPrefix)}\n\n`;
    }

    // Render static method(s). (If any)
    if (staticMethods.length) {
      for (const method of staticMethods) s += `${method.compile(newPrefix)}\n\n`;
    }

    // End of Class Declaration line.
    return `${s}${prefix}}`;
  }
}
