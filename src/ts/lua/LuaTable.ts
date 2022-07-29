import { WILDCARD_TYPE } from '../Generator';
import { LuaContainer } from './LuaContainer';
import { LuaFile } from './LuaFile';
import { sanitizeName as sanitizeName } from './model/ModelUtils';
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
    const { name } = this;
    const { library } = this.file;

    const model = library.getTableModel(this as any);
    let doc = this.generateDoc(prefix, model);
    let s = doc.length ? `${prefix}${doc}\n` : '';

    // Render empty tables on one line.
    if (!Object.keys(this.fields).length && !Object.keys(this.methods).length) {
      return `${s}\n${prefix}export class ${sanitizeName(name)} { static [id: string]: ${WILDCARD_TYPE}; }`;
    }

    const { staticFields, nonStaticFields } = this.sortFields();
    const { staticMethods, nonStaticMethods } = this.sortMethods();
    const newPrefix = prefix + '  ';

    // Make sure that no one can try to use Lua tables as a class, even though we're using
    // the class type for tables. This is to keep things clean. We *could* go with an interface,
    // however values cannot be assigned to them in TypeScript like tables can in Lua.
    s += `${prefix}export class ${sanitizeName(name)} {\n\n${newPrefix}private constructor();\n\n`;

    // Wildcard.
    s += `${newPrefix}static [id: string]: ${WILDCARD_TYPE};\n\n`;

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

  generateAPI(prefix: string): string {
    const { library } = this.file;
    let { model } = this;

    // Render the class documentation. (If present)
    if (!model) model = library.getTableModel(this as any);
    const doc = this.generateDoc(prefix, model);

    // Render empty classes on one line.
    return `${prefix}${doc ? `${doc}\n` : ''}${prefix}export class ${sanitizeName(this.name)} {}`;
  }

  generateLua(prefix: string = ''): string {
    const { name } = this;
    return `${prefix}Exports.${sanitizeName(name)} = loadstring("return _G['${name}']")()\n`;
  }
}
