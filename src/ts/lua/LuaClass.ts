import { LuaFile } from './LuaFile';
import { LuaConstructor } from './LuaConstructor';
import { LuaContainer } from './LuaContainer';
import { ClassModel } from './model/ClassModel';
import { WILDCARD_TYPE } from '../Generator';
import { sanitizeName } from './model/ModelUtils';

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
    model.populate();
    return model;
  }

  protected onCompile(prefix: string): string {
    const { library } = this.file;
    const { name, model } = this;
    let doc: string;

    if(!model) library.getClassModel(this as any);
    doc = this.generateDoc(prefix, model);

    // Render empty classes on one line.
    if (!Object.keys(this.fields).length && !Object.keys(this.methods).length && !this._constructor_) {
      let s = `${prefix}${doc}\n${prefix}export class ${sanitizeName(name)}`;
      if (this.superClass) s += ` extends ${this.superClass.fullPath}`;
      return `${s} { [id: string]: ${WILDCARD_TYPE}; static [id: string]: ${WILDCARD_TYPE}; }`;
    }

    const { staticFields, nonStaticFields } = this.sortFields();
    const { staticMethods, nonStaticMethods } = this.sortMethods();
    const newPrefix = prefix + '  ';

    // Class Declaration line.
    let s = '';

    if (doc && doc.length) s += `${prefix}${doc}\n`;

    s += `${prefix}export class ${sanitizeName(name)}`;
    if (this.superClass) s += ` extends ${this.superClass.fullPath}`;
    s += ' {\n\n';

    // Wildcard.
    s += `${newPrefix}[id: string]: ${WILDCARD_TYPE};\n${newPrefix}static [id: string]: ${WILDCARD_TYPE};\n\n`;

    // Render static field(s). (If any)
    if (staticFields.length) {
      for (const field of staticFields) {
        if(this.superHasField(field.name)) continue;
        s += `${field.compile(newPrefix)}\n\n`;
      }
    }

    // Render static field(s). (If any)
    if (nonStaticFields.length) {
      for (const field of nonStaticFields) {
        if(this.superHasField(field.name)) continue;
        s += `${field.compile(newPrefix)}\n\n`;
      }
    }

    // Render the constructor. (If defined)
    if (this._constructor_) s += `${this._constructor_.compile(newPrefix)}\n\n`;

    // Render static method(s). (If any)
    if (nonStaticMethods.length) {
      for (const method of nonStaticMethods) {
        if(this.superHasMethod(method.name)) continue;
        s += `${method.compile(newPrefix)}\n\n`;
      }
    }

    // Render static method(s). (If any)
    if (staticMethods.length) {
      for (const method of staticMethods) {
        if (this.superHasMethod(method.name)) continue;
        s += `${method.compile(newPrefix)}\n\n`;
      }
    }

    // End of Class Declaration line.
    return `${s}${prefix}}`;
  }

  superHasField(fieldName: string): boolean {
    if(!this.superClass) return false;
    return this.superClass.fields[fieldName] != null;
  }

  superHasMethod(methodName: string): boolean {
    if(!this.superClass) return false;
    return this.superClass.methods[methodName] != null;
  }

  generateDoc(prefix: string, model: ClassModel): string {
    return model ? model.generateDoc(prefix, this) : `/** @customConstructor ${this.name}:new */`;
  }

  generateAPI(prefix: string): string {
    const { library } = this.file;
    let { name, model } = this;

    // Render the class documentation. (If present)
    if (!model) model = library.getClassModel(this as any);
    const doc = this.generateDoc(prefix, model);

    // Render empty classes on one line.
    return `${prefix}${doc ? `${doc}\n` : ''}${prefix}export class ${sanitizeName(name)} extends ${this.fullPath} {}`;
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

  generateLua(prefix: string = ''): string {
    const { name } = this;
    return `${prefix}Exports.${sanitizeName(name)} = loadstring("return _G['${name}']")()\n`;
  }

  get namespace() {
    return this.name === 'ISBaseObject' ? 'lua.shared.ISBaseObject' : this.file.classTableNamespace;
  }

  get fullPath() {
    const { name } = this;
    return `${this.namespace}.${sanitizeName(name)}`;
  }
}
