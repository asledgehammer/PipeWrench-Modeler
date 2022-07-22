import { ClassDoc, ClassDocJson } from './doc/ClassDoc';
import { ConstructorModel, ConstructorModelJson } from './ConstructorModel';
import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { LuaClass } from '../LuaClass';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';

/**
 * **ClassModel**
 *
 * @author JabDoesThings
 */
export class ClassModel {
  fields: { [id: string]: FieldModel } = {};
  methods: { [id: string]: MethodModel } = {};
  _constructor_: ConstructorModel;
  doc: ClassDoc;
  readonly name: string;

  constructor(name: string, json?: ClassModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  testSignature(clazz: LuaClass): boolean {
    return clazz.name === this.name;
  }

  getField(field: LuaField): FieldModel {
    const model = this.fields[field.name];
    if(model && model.testSignature(field)) return model;
    return null;
  }

  getMethod(method: LuaMethod): MethodModel {
    const model = this.methods[method.name];
    if(model && model.testSignature(method)) return model;
    return null;
  }

  getConstructor(_constructor_: LuaMethod): ConstructorModel {
    const model = this._constructor_;
    if(model && model.testSignature(_constructor_)) return model;
    return null;
  }

  load(json: ClassModelJson) {

    this.fields = {};

    if (json.fields) {
      for (const name of Object.keys(json.fields)) {
        this.fields[name] = new FieldModel(name, json.fields[name]);
      }
    }

    if (json.methods) {
      this.methods = {};
      for (const name of Object.keys(json.methods)) {
        this.methods[name] = new MethodModel(name, json.methods[name]);
      }
    }

    if (json._constructor_) {
      this._constructor_ = new ConstructorModel(this, json._constructor_);
    }

    this.doc = new ClassDoc(json.doc);
  }

  save(): ClassModelJson {
    const fields: { [id: string]: FieldModelJson } = {};
    const methods: { [id: string]: MethodModelJson } = {};

    for (const fieldName in Object.keys(this.fields)) {
      const fieldModel = this.fields[fieldName];
      fields[fieldName] = fieldModel.save();
    }

    for (const methodName in Object.keys(this.methods)) {
      const methodModel = this.methods[methodName];
      methods[methodName] = methodModel.save();
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
