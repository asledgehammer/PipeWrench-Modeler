import { ClassDoc, ClassDocJson } from './doc/ClassDoc';
import { ConstructorModel, ConstructorModelJson } from './ConstructorModel';
import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';

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

  constructor(json?: ClassJson) {
    if (json) this.load(json);
  }

  load(json: ClassJson) {
    this.fields = {};
    for (const fieldName in Object.keys(json.fields)) {
      this.fields[fieldName] = new FieldModel(json.fields[fieldName]);
    }

    this.methods = {};
    for (const methodName in Object.keys(json.methods)) {
      this.methods[methodName] = new MethodModel(json.methods[methodName]);
    }

    this._constructor_ = new ConstructorModel(json._constructor_);
    this.doc = new ClassDoc(json.doc);
  }

  save(): ClassJson {
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
export type ClassJson = {
  doc: ClassDocJson;
  _constructor_: ConstructorModelJson;
  fields: { [id: string]: FieldModelJson };
  methods: { [id: string]: MethodModelJson };
};
