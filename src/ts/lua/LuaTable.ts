import * as prettier from 'prettier';
import { LuaContainer } from './LuaContainer';
import { LuaFile } from './LuaFile';
import { FieldModel } from './model/FieldModel';
import { MethodModel } from './model/MethodModel';
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
    const model = new TableModel(this.name);

    const fieldNames = Object.keys(this.fields);
    fieldNames.sort((o1, o2) => o1.localeCompare(o2));
    for(const fieldName of fieldNames) {
      model.fields[fieldName] = new FieldModel(fieldName, this.fields[fieldName]);
    }

    const methodNames = Object.keys(this.methods);
    methodNames.sort((o1, o2) => o1.localeCompare(o2));
    for(const methodName of methodNames) {
      model.methods[methodName] = new MethodModel(methodName, this.methods[methodName]);
    }

    return model;
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
    
    const { staticFields, nonStaticFields } = this.sortFields();
    const { staticMethods, nonStaticMethods } = this.sortMethods();
    const newPrefix = prefix + '  ';

    // Make sure that no one can try to use Lua tables as a class, even though we're using
    // the class type for tables. This is to keep things clean. We *could* go with an interface,
    // however values cannot be assigned to them in TypeScript like tables can in Lua.
    s += `${prefix}declare class ${this.name} {\n\n${newPrefix}private constructor();\n\n`;

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
    s += `${prefix}}`;

    return prettier.format(s, {
      singleQuote: true, 
      bracketSpacing: true, 
      parser: 'typescript',
      printWidth: 120
    });
  }

  generateDoc(prefix: string, model: TableModel): string {
    return model ? model.generateDoc(prefix, this) : '';
  }
}
