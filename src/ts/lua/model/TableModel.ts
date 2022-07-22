import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { TableDoc, TableDocJson } from './doc/TableDoc';

/**
 * **TableModel**
 * 
 * @author JabDoesThings
 */
export class TableModel {
  fields: { [id: string]: FieldModel } = {};
  methods: { [id: string]: MethodModel } = {};
  doc: TableDoc;

  constructor(json?: TableModelJson) {
    if (json) this.load(json);
  }

  load(json: TableModelJson) {
    this.fields = {};
    for (const fieldName of Object.keys(json.fields)) {
      this.fields[fieldName] = new FieldModel(json.fields[fieldName]);
    }

    this.methods = {};
    for (const methodName of Object.keys(json.methods)) {
      this.methods[methodName] = new MethodModel(json.methods[methodName]);
    }

    this.doc = new TableDoc(json.doc);
  }

  save(): TableModelJson {
    const fields: { [id: string]: FieldModelJson } = {};
    const methods: { [id: string]: MethodModelJson } = {};
    for(const fieldName in Object.keys(this.fields)) {
      const fieldModel = this.fields[fieldName];
      fields[fieldName] = fieldModel.save();
    }
    for(const methodName in Object.keys(this.methods)) {
      const methodModel = this.methods[methodName];
      methods[methodName] = methodModel.save();
    }
    const doc = this.doc.save();
    return {fields, methods, doc};
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
