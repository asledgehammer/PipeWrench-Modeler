import { LuaContainer } from './LuaContainer';
import { LuaFile } from './LuaFile';
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

  model: TableModel;

  /**
   * @param file The file containing the table declaration.
   * @param name The name of the table. (In global)
   */
  constructor(file: LuaFile, name: string) {
    super(file, name, 'table');
    this.file = file;
  }

  generateModel(): TableModel {
    const model = new TableModel(this, this.name);
    model.populate();
    return model;
  }

  protected onCompile(prefix: string): string {
    const { library } = this.file;

    const model = library.getTableModel(this as any);
    let doc = this.generateDoc(prefix, model);
    let s = doc.length ? `${prefix}${doc}\n` : '';
    
    // Render empty tables on one line.
    if (!Object.keys(this.fields).length && !Object.keys(this.methods).length) {
      return `${s}\n${prefix}export class ${this.name} { static [id: string]: unknown; }`;
    }
    
    const { staticFields, nonStaticFields } = this.sortFields();
    const { staticMethods, nonStaticMethods } = this.sortMethods();
    const newPrefix = prefix + '  ';

    // Make sure that no one can try to use Lua tables as a class, even though we're using
    // the class type for tables. This is to keep things clean. We *could* go with an interface,
    // however values cannot be assigned to them in TypeScript like tables can in Lua.
    s += `${prefix}export class ${this.name} {\n\n${newPrefix}private constructor();\n\n`;

    // Wildcard.
    s += `${newPrefix}static [id: string]: unknown;\n\n`;

    // Render static field(s). (If any)
    if (staticFields.length) {
      for (const field of staticFields) s += `${field.compile(newPrefix)}\n\n`;
    }

    // Render static field(s). (If any)
    if (nonStaticFields.length) {
      for (const field of nonStaticFields) s += `${field.compile(newPrefix)}\n\n`;
    }

    // Render static method(s). (If any)
    if (nonStaticMethods.length) {
      for (const method of nonStaticMethods) s += `${method.compile(newPrefix)}\n\n`;
    }

    // Render static method(s). (If any)
    if (staticMethods.length) {
      for (const method of staticMethods) s += `${method.compile(newPrefix)}\n\n`;
    }

    // End of Table Declaration line.
    return `${s}${prefix}}`;
  }

  generateDoc(prefix: string, model: TableModel): string {
    return model ? model.generateDoc(prefix, this) : '';
  }
}
