import { DocBuilder } from '../DocBuilder';
import { LuaContainer } from './LuaContainer';
import { LuaField } from './LuaField';
import { LuaFile } from './LuaFile';
import { LuaMethod } from './LuaMethod';
import { fixParameters } from './LuaUtils';
import { TableModel } from './model/TableModel';

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

  protected onCompile(prefix: string): string {
    const { library } = this.file;

    const model = library.getTableModel(this as any);
    let doc = this.generateDoc(prefix, model);
    let s = doc.length ? `${doc}\n` : '';
    
    // Render empty tables on one line.
    if (!Object.keys(this.fields).length && !Object.keys(this.methods).length) {
      return `${s}\n${prefix}declare class ${this.name} {}`;
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

    sortFields();
    sortMethods();

    // Make sure that no one can try to use Lua tables as a class, even though we're using
    // the class type for tables. This is to keep things clean. We *could* go with an interface,
    // however values cannot be assigned to them in TypeScript like tables can in Lua.
    s += `${prefix}declare class ${this.name} {\n\n${newPrefix}private constructor();\n`;

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

  generateDoc(prefix: string, model: TableModel): string {
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
}
