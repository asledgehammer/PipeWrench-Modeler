import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { TableDoc, TableDocJson } from './doc/TableDoc';
import { LuaTable } from '../LuaTable';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';
import { DocBuilder } from '../../DocBuilder';
import { Model } from './Model';

/**
 * **TableModel**
 *
 * @author JabDoesThings
 */
export class TableModel extends Model<TableModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly doc: TableDoc = new TableDoc();
  readonly fields: { [id: string]: FieldModel } = {};
  readonly methods: { [id: string]: MethodModel } = {};
  readonly name: string;

  constructor(name: string, json?: TableModelJson) {
    super();
    this.name = name;
    if (json) this.load(json);
    this.dom = this.generateDom();
  }

  load(json: TableModelJson) {
    this.clear();

    if (json.fields) {
      for (const name of Object.keys(json.fields)) {
        this.fields[name] = new FieldModel(name, json.fields[name]);
      }
    }

    if (json.methods) {
      for (const name of Object.keys(json.methods)) {
        this.methods[name] = new MethodModel(name, json.methods[name]);
      }
    }

    if (json.doc) this.doc.load(json.doc);
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

  clear() {
    for (const key of Object.keys(this.fields)) delete this.fields[key];
    for (const key of Object.keys(this.methods)) delete this.methods[key];
    this.doc.clear();
  }

  generateDoc(prefix: string, table: LuaTable): string {
    const doc = new DocBuilder();
    const { doc: tableDoc } = this;
    if (tableDoc) {
      const { annotations, authors, lines } = tableDoc;

      // Process annotations. (If defined)
      const annoKeys = Object.keys(annotations);
      if (annoKeys && annoKeys.length) {
        for (const key of annoKeys) doc.appendAnnotation(key, annotations[key]);
      }

      // Process authors. (If defined)
      if (authors && authors.length) {
        let s = '[';
        for (const author of authors) s += `${author}, `;
        s = `${s.substring(0, s.length - 2)}]`;
        doc.appendAnnotation('author', s);
      }

      doc.appendLine();

      // Process lines. (If defined)
      if (lines && lines.length) {
        for (const line of lines) doc.appendLine(line);
      }
    }

    return doc.build(prefix);
  }

  generateDom(): string {
    return '';
  }

  testSignature(table: LuaTable): boolean {
    return table.name === this.name;
  }

  getField(field: LuaField): FieldModel {
    const model = this.fields[field.name];
    if (model && model.testSignature(field)) return model;
    return null;
  }

  getMethod(method: LuaMethod): MethodModel {
    const model = this.methods[method.name];
    if (model && model.testSignature(method)) return model;
    return null;
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
