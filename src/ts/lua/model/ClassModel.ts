import { replaceAll } from '../../Utils';
import { sanitizeName, unsanitizeName } from './ModelUtils';
import { DocumentationBuilder } from '../../DocumentationBuilder';

import { LuaClass } from '../LuaClass';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';

import { Model } from './Model';
import { ConstructorModel, ConstructorModelJson } from './ConstructorModel';
import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';

import {
  AuthoredModelDocumentation,
  AuthoredModelDocumentationJson,
} from './doc/AuthoredModelDocumentation';

/** @author JabDoesThings */
export class ClassModel extends Model<ClassModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly fields: { [id: string]: FieldModel } = {};
  readonly methods: { [id: string]: MethodModel } = {};
  readonly _constructor_: ConstructorModel;
  readonly documentation = new AuthoredModelDocumentation();
  readonly _class_: LuaClass;
  readonly name: string;

  constructor(_class_: LuaClass, name: string, src?: ClassModelJson) {
    super();
    this._class_ = _class_;
    this.name = name;
    
    // Initialize only after assigning this._class_, since the loading code is in the
    // constructor.
    this._constructor_ = new ConstructorModel(this);

    if (src) this.load(src);
  }

  /**
   * Populates any fields, methods, and a constructor if they are not present.
   */
  populate() {
    const { fields, methods, _constructor_ } = this._class_;
    const fieldNames = Object.keys(fields);
    fieldNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const fieldName of fieldNames) {
      if (!this.fields[fieldName]) this.fields[fieldName] = new FieldModel(fieldName);
    }

    const methodNames = Object.keys(methods);
    methodNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const methodName of methodNames) {
      if (!this.methods[methodName]) {
        this.methods[methodName] = new MethodModel(methodName, methods[methodName]);
      }
    }
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
        this.methods[sanitizeName(name)] = new MethodModel(name, json.methods[name]);
      }
    }
    if (json._constructor_) this._constructor_.load(json._constructor_);
    if (json.documentation) this.documentation.load(json.documentation);
  }

  save(): ClassModelJson {
    let fields: { [id: string]: FieldModelJson } = undefined;
    let methods: { [id: string]: MethodModelJson } = undefined;

    let oneFieldDifferent = false;
    for (const field of Object.values(this.fields)) {
      if (!field.isDefault()) {
        oneFieldDifferent = true;
        break;
      }
    }
    if (oneFieldDifferent) {
      fields = {};
      for (const fieldName of Object.keys(this.fields)) {
        const fieldModel = this.fields[fieldName];
        if (!fieldModel.isDefault()) fields[fieldName] = fieldModel.save();
      }
    }

    let oneMethodDifferent = false;
    for (const method of Object.values(this.methods)) {
      if (!method.isDefault()) {
        oneMethodDifferent = true;
        break;
      }
    }
    if (oneMethodDifferent) {
      methods = {};
      for (const name of Object.keys(this.methods)) {
        const methodModel = this.methods[name];
        if (!methodModel.isDefault()) methods[unsanitizeName(name)] = methodModel.save();
      }
    }

    let _constructor_: ConstructorModelJson = undefined;
    if (this._constructor_ && !this._constructor_.isDefault())
      _constructor_ = this._constructor_.save();

    let documentation: AuthoredModelDocumentationJson = undefined;
    if (this.documentation && !this.documentation.isDefault()) {
      documentation = this.documentation.save();
    }

    return { fields, methods, _constructor_, documentation };
  }

  clear() {
    for (const key of Object.keys(this.fields)) delete this.fields[key];
    for (const key of Object.keys(this.methods)) delete this.methods[key];
    this._constructor_.clear();
    this.documentation.clear();
  }

  generateDoc(prefix: string, _class_: LuaClass): string {
    const doc = new DocumentationBuilder();
    doc.appendAnnotation('customConstructor', `${_class_.name}:new`);

    const { documentation: classDoc } = this;
    if (classDoc) {
      const { authors, description } = classDoc;

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
          doc.appendAnnotation('docAuthors', s);
        }
      }

      // Process lines. (If defined)
      if (description && description.length) {
        let foundLine = false;

        for (let line of description) {
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
    const { name, documentation } = this;
    const { authors, description } = documentation;

    let dom = ClassModel.HTML_TEMPLATE;
    dom = replaceAll(dom, '${CLASS_NAME}', name);
    dom = replaceAll(dom, '${DOC_AUTHORS}', authors.join('\n'));
    dom = replaceAll(dom, '${DESCRIPTION}', description.join('\n'));
    return dom;
  }

  isDefault(): boolean {
    for (const field of Object.values(this.fields)) if (!field.isDefault()) return false;
    for (const method of Object.values(this.methods)) if (!method.isDefault()) return false;
    if (this._constructor_ && !this._constructor_.isDefault()) return false;
    if (!this.documentation.isDefault()) return false;
    return true;
  }

  testSignature(_class_: LuaClass): boolean {
    return _class_.name === this.name;
  }

  getFieldModel(field: LuaField): FieldModel {
    const model = this.fields[field.name];
    if (model && model.testSignature(field)) return model;
    return null;
  }

  getMethodModel(method: LuaMethod): MethodModel {
    const name = sanitizeName(method.name);
    const model = this.methods[name];
    if (model && model.testSignature(method)) return model;
    return null;
  }

  getConstructorModel(_constructor_: LuaMethod): ConstructorModel {
    const model = this._constructor_;
    if (model && model.testSignature(_constructor_)) return model;
    return null;
  }
}

export type ClassModelJson = {
  fields: { [id: string]: FieldModelJson };
  methods: { [id: string]: MethodModelJson };
  _constructor_: ConstructorModelJson;
  documentation: AuthoredModelDocumentationJson;
};
