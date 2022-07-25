import { LuaFile } from './LuaFile';
import { LuaConstructor } from './LuaConstructor';
import { LuaContainer } from './LuaContainer';
import { LuaMethod } from './LuaMethod';
import { LuaField } from './LuaField';
import { fixParameters } from './LuaUtils';
import { ClassModel } from './model/ClassModel';
import { DocBuilder } from '../DocBuilder';

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

  protected onCompile(prefix: string): string {
    const { library } = this.file;

    let doc: string;

    const model = library.getClassModel(this as any);
    doc = this.generateDoc(prefix, model);

    // Render empty classes on one line.
    if (!Object.keys(this.fields).length && !Object.keys(this.methods).length && !this._constructor_) {
      let s = `${doc}\n${prefix}declare class ${this.name}`;
      if (this.superClass) s += ` extends ${this.superClass.name}`;
      return `${s} {}`;
    }

    const newPrefix = prefix + '  ';
    const staticFields: LuaField[] = [];
    const nonStaticFields: LuaField[] = [];
    const staticMethods: LuaMethod[] = [];
    const nonStaticMethods: LuaMethod[] = [];

    const sortFields = () => {
      // Sort fields by name alphanumerically.
      const fieldNames = Object.keys(this.fields);
      fieldNames.sort((o1, o2): number => o1.localeCompare(o2));
      for (const fieldName of fieldNames) {
        const field = this.fields[fieldName];
        if (field.isStatic) staticFields.push(field);
        else nonStaticFields.push(field);
      }
    };

    const sortMethods = () => {
      // Sort methods by name alphanumerically.
      const methodNames = Object.keys(this.methods);
      methodNames.sort((o1, o2): number => o1.localeCompare(o2));
      for (const methodName of methodNames) {
        const method = this.methods[methodName];
        if (method.isStatic) staticMethods.push(method);
        else nonStaticMethods.push(method);
      }
    };

    sortFields();
    sortMethods();

    // Class Declaration line.
    let s = '';

    if (doc && doc.length) s += `${doc}\n`;

    s += `${prefix}declare class ${this.name}`;
    if (this.superClass) s += ` extends ${this.superClass.name}`;
    s += ' {\n\n';

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
    return `${s}${prefix}}`;
  }

  generateDoc(prefix: string, model: ClassModel): string {
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

  scanMethods() {
    this._constructor_?.scan();
    for(const method of Object.values(this.methods)) {
        method.scanFields();
    }
  }

  /**
   * @returns True if a super-class is assigned and linked successfully.
   */
  hasSuperClass(): boolean {
    return this.superClass != null;
  }
}
