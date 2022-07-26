import { Model } from './Model';
import { ClassDoc, ClassDocJson } from './doc/ClassDoc';
import { ConstructorModel, ConstructorModelJson } from './ConstructorModel';
import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { LuaClass } from '../LuaClass';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';
import { DocBuilder } from '../../DocBuilder';

import { sanitizeMethodName, unsanitizeMethodName } from './ModelUtils';

/**
 * **ClassModel**
 *
 * @author JabDoesThings
 */
export class ClassModel extends Model<ClassModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly fields: { [id: string]: FieldModel } = {};
  readonly methods: { [id: string]: MethodModel } = {};
  readonly _constructor_: ConstructorModel;
  readonly doc = new ClassDoc();
  readonly clazz: LuaClass;
  readonly name: string;
  dom: string = '';

  constructor(clazz: LuaClass, name: string, src?: ClassModelJson) {
    super();
    this.clazz = clazz;
    this.name = name;
    this.doc = new ClassDoc();
    this._constructor_ = new ConstructorModel(this);

    this.create(clazz);
    if (src) this.load(src);
    this.dom = this.generateDom();
  }

  create(clazz: LuaClass) {
    // TODO: Implement.
  }

  load(json: ClassModelJson) {
    this.clear();

    if (json.fields) {
      for (const name of Object.keys(json.fields)) {
        this.fields[name] = new FieldModel(name, json.fields[name]);
      }
    }

    if (json.methods) {
      for (const name of Object.keys(json.methods)) {
        this.methods[sanitizeMethodName(name)] = new MethodModel(name, json.methods[name]);
      }
    }

    if (json._constructor_) this._constructor_.load(json._constructor_);
    if (json.doc) this.doc.load(json.doc);

    this.dom = this.generateDom();
  }

  save(): ClassModelJson {
    const fields: { [id: string]: FieldModelJson } = {};
    const methods: { [id: string]: MethodModelJson } = {};

    for (const fieldName in Object.keys(this.fields)) {
      const fieldModel = this.fields[fieldName];
      fields[fieldName] = fieldModel.save();
    }

    for (const name in Object.keys(this.methods)) {
      const methodModel = this.methods[name];
      methods[unsanitizeMethodName(name)] = methodModel.save();
    }

    const _constructor_ = this._constructor_.save();
    const doc = this.doc.save();

    return { fields, methods, _constructor_, doc };
  }

  clear() {
    for (const key of Object.keys(this.fields)) delete this.fields[key];
    for (const key of Object.keys(this.methods)) delete this.methods[key];
    this._constructor_.clear();
    this.doc.clear();
  }

  generateDoc(prefix: string, clazz: LuaClass): string {
    const doc = new DocBuilder();
    doc.appendAnnotation('customConstructor', `${clazz.name}:new`);

    const { doc: classDoc } = this;
    if (classDoc) {
      const { annotations, authors, lines } = classDoc;

      // Process annotations. (If defined)
      const annoKeys = Object.keys(annotations);
      if (annoKeys && annoKeys.length) {
        for (const key of annoKeys) doc.appendAnnotation(key, annotations[key]);
      } else {
        if (!authors || !authors.length || !authors[0].length) {
          // The 'customConstructor' annotation is multi-line. Adding `@` terminates it.
          doc.appendLine('@');
        }
      }

      // Process authors. (If defined)
      if (authors && authors.length) {
        let s = '';
        for (let author of authors) {
          author = author.trim();
          if (author.length) {
            if (!s.length) s += '[';
            s += `${author}, `;
          }
        }
        if (s.length) {
          s = `${s.substring(0, s.length - 2)}]`;
          doc.appendAnnotation('author', s);
        }
      }

      // Process lines. (If defined)
      if (lines && lines.length) {
        let foundLine = false;

        for (let line of lines) {
          line = line.trim();
          if (line.length) {
            if (!foundLine) {
              if (!doc.isEmpty()) doc.appendLine();
              foundLine = true;
            }
            doc.appendLine(line);
          }
        }
      }
    }

    return doc.build(prefix);
  }

  generateDom(): string {
    let dom = ClassModel.HTML_TEMPLATE;

    const replaceAll = (from: string, to: string) => {
      const fromS = '${' + from + '}';
      while (dom.indexOf(fromS) !== -1) dom = dom.replace(fromS, to);
    };

    let authorsS = '';
    let linesS = '';

    const { doc } = this;
    if (doc) {
      const { authors, lines } = doc;
      if (authors.length) {
        if (authors) for (const author of authors) authorsS += `${author}\n`;
        authorsS = authorsS.substring(0, authorsS.length - 1);
      }
      if (lines.length) {
        for (const line of lines) linesS += `${line}\n`;
        linesS = linesS.substring(0, linesS.length - 1);
      }
    }

    replaceAll('CLASS_NAME', this.name);
    if (authorsS.length) replaceAll('AUTHORS', authorsS);
    if (linesS.length) replaceAll('LINES', linesS);

    return dom;
  }

  testSignature(clazz: LuaClass): boolean {
    return clazz.name === this.name;
  }

  getField(field: LuaField): FieldModel {
    const model = this.fields[field.name];
    if (model && model.testSignature(field)) return model;
    return null;
  }

  getMethod(method: LuaMethod): MethodModel {
    const name = sanitizeMethodName(method.name);
    const model = this.methods[name];
    if (model && model.testSignature(method)) return model;
    return null;
  }

  getConstructor(_constructor_: LuaMethod): ConstructorModel {
    const model = this._constructor_;
    if (model && model.testSignature(_constructor_)) return model;
    return null;
  }
}

/**
 * **ClassJson**
 *
 * @author JabDoesThings
 */
export type ClassModelJson = {
  doc: ClassDocJson;
  _constructor_: ConstructorModelJson;
  fields: { [id: string]: FieldModelJson };
  methods: { [id: string]: MethodModelJson };
};
