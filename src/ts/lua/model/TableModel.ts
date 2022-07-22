import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { TableDoc, TableDocJson } from './doc/TableDoc';
import { LuaTable } from '../LuaTable';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';

/**
 * **TableModel**
 *
 * @author JabDoesThings
 */
export class TableModel {
  fields: { [id: string]: FieldModel } = {};
  methods: { [id: string]: MethodModel } = {};
  doc: TableDoc;
  readonly name: string;

  constructor(name: string, json?: TableModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  testSignature(table: LuaTable): boolean {
    return table.name === this.name;
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

  load(json: TableModelJson) {
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

    this.doc = new TableDoc(json.doc);
  }

  save(): TableModelJson {
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
    const doc = this.doc.save();
    return { fields, methods, doc };
  }
}

/**
 * **TableJson**
 *
 * @author JabDoesThings
 */
export type TableModelJson = {
  doc: TableDocJson;
  fields: { [id: string]: FieldModelJson };
  methods: { [id: string]: MethodModelJson };
};
