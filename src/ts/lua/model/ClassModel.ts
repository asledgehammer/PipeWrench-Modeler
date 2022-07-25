import { ClassDoc, ClassDocJson } from './doc/ClassDoc';
import { ConstructorModel, ConstructorModelJson } from './ConstructorModel';
import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { LuaClass } from '../LuaClass';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';
import { DocBuilder } from '../../DocBuilder';

/**
 * **ClassModel**
 *
 * @author JabDoesThings
 */
export class ClassModel {

  static HTML_TEMPLATE: string = ''; 

  readonly fields: { [id: string]: FieldModel } = {};
  readonly methods: { [id: string]: MethodModel } = {};
  readonly _constructor_: ConstructorModel;
  readonly doc: ClassDoc = new ClassDoc();
  readonly name: string;

  constructor(name: string, json?: ClassModelJson) {
    this.name = name;
    this.doc = new ClassDoc();
    this._constructor_ = new ConstructorModel(this);
    if (json) this.load(json);
  }

  createHTML() {

    let html = ClassModel.HTML_TEMPLATE;

    const replaceAll = (from: string, to: string) => {
      const fromS = `${from}`;
      while (html.indexOf(fromS) !== -1) html = html.replace(fromS, this.name);
    };

    let authors = '';
    let linees = '';

    replaceAll('CLASS_NAME', this.name);
    replaceAll('AUTHORS', authors);
  }

  testSignature(clazz: LuaClass): boolean {
    return clazz.name === this.name;
  }

  getField(field: LuaField): FieldModel {
    const model = this.fields[field.name];
    if (model && model.testSignature(field)) return model;
    return null;
  }

  sanitizeMethodName(name: string) {
    if(name === 'toString') {
      return `_${name}`;
    }
    return name;
  }

  unsanitizeMethodName(name: string) {
    if(name === '_toString') {
      return name.substring(1);
    }
    return name;
  }

  getMethod(method: LuaMethod): MethodModel {
    const name = this.sanitizeMethodName(method.name);
    const model = this.methods[name];
    if (model && model.testSignature(method)) return model;
    return null;
  }

  getConstructor(_constructor_: LuaMethod): ConstructorModel {
    const model = this._constructor_;
    if (model && model.testSignature(_constructor_)) return model;
    return null;
  }

  clear() {
    for(const key of Object.keys(this.fields)) delete this.fields[key];
    for(const key of Object.keys(this.methods)) delete this.methods[key];
    this._constructor_.clear();
    this.doc.clear();
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
        this.methods[this.sanitizeMethodName(name)] = new MethodModel(name, json.methods[name]);
      }
    }

    if (json._constructor_) this._constructor_.load(json._constructor_);
    if (json.doc) this.doc.load(json.doc);
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
      methods[this.unsanitizeMethodName(name)] = methodModel.save();
    }

    const _constructor_ = this._constructor_.save();
    const doc = this.doc.save();

    return { fields, methods, _constructor_, doc };
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
