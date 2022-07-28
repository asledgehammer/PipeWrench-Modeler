import * as prettier from 'prettier';
import { LuaFile } from './LuaFile';
import { LuaConstructor } from './LuaConstructor';
import { LuaContainer } from './LuaContainer';
import { ClassModel } from './model/ClassModel';
import { FieldModel } from './model/FieldModel';
import { MethodModel } from './model/MethodModel';

/**
 * **LuaClass** represents tables that are declared using `ISBaseObject:derive(..)`. This is the
 * signature for all pseudo-classes in the codebase.
 *
 * All pseudo-classes house a constructor-like method as follows:
 *  - `<class>:new(..)`
 *
 * All functions that are assigned with ':' indexers are interpreted as methods. Functions that
 * are assigned with '.' are considered as static functions.
 *
 * All 'self.<property>' calls are interpreted as fields in the pseudo-class. All
 * '<class>.<property>' calls are interpreted as static fields.
 *
 * @author JabDoesThings
 */
export class LuaClass extends LuaContainer {
  /** The name of the superclass. (Used to link the generated LuaClass following discovery) */
  readonly superClassName: string | null;

  /** The class that this class derives. <class> = <superclass>:derive(..) */
  superClass: LuaClass | null;

  /** The function <class>:new(..) in the class table. */
  _constructor_: LuaConstructor | null;

  model: ClassModel;

  /**
   * @param file The file containing the pseudo-class declaration.
   * @param name The name of the pseudo-class table. (In global)
   * @param superClassName (Optional) The name of the super-class.
   */
  constructor(file: LuaFile, name: string, superClassName?: string) {
    super(file, name, 'class');
    this.file = file;
    this.superClassName = superClassName;
  }

  generateModel(): ClassModel {
    const model = new ClassModel(this, this.name);

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

    let doc: string;

    const model = this.model;
    if(!model) library.getClassModel(this as any);
    doc = this.generateDoc(prefix, model);

    // Render empty classes on one line.
    if (!Object.keys(this.fields).length && !Object.keys(this.methods).length && !this._constructor_) {
      let s = `${doc}\n${prefix}declare class ${this.name}`;
      if (this.superClass) s += ` extends ${this.superClass.name}`;
      return `${s} { [id: string]: unknown; }`;
    }

    const { staticFields, nonStaticFields } = this.sortFields();
    const { staticMethods, nonStaticMethods } = this.sortMethods();
    const newPrefix = prefix + '  ';

    // Class Declaration line.
    let s = '';

    if (doc && doc.length) s += `${doc}\n`;

    s += `${prefix}declare class ${this.name}`;
    if (this.superClass) s += ` extends ${this.superClass.name}`;
    s += ' {\n\n';

    // Wildcard.
    s += '[id: string]: unknown;\n\n';

    // Render static field(s). (If any)
    if (staticFields.length) {
      for (const field of staticFields) s += `${field.compile(newPrefix)}\n\n`;
    }

    // Render static field(s). (If any)
    if (nonStaticFields.length) {
      for (const field of nonStaticFields) s += `${field.compile(newPrefix)}\n\n`;
    }

    // Render the constructor. (If defined)
    if (this._constructor_) s += `${this._constructor_.compile(newPrefix)}\n\n`;

    // Render static method(s). (If any)
    if (nonStaticMethods.length) {
      for (const method of nonStaticMethods) s += `${method.compile(newPrefix)}\n\n`;
    }

    // Render static method(s). (If any)
    if (staticMethods.length) {
      for (const method of staticMethods) s += `${method.compile(newPrefix)}\n\n`;
    }

    // End of Class Declaration line.
    s += `${prefix}}`;
    return prettier.format(s, {
      singleQuote: true, 
      bracketSpacing: true, 
      parser: 'typescript',
      printWidth: 120
    });
  }

  generateDoc(prefix: string, model: ClassModel): string {
    return model ? model.generateDoc(prefix, this) : `/** @customConstructor ${this.name}:new */`;
  }

  scanMethods() {
    if (this._constructor_) this._constructor_.scan();
    for (const method of Object.values(this.methods)) method.scanFields();
  }

  /**
   * @returns True if a super-class is assigned and linked successfully.
   */
  hasSuperClass(): boolean {
    return this.superClass != null;
  }
}
