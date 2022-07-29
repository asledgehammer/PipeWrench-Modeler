import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { TableDoc, TableDocJson } from './doc/TableDoc';
import { LuaTable } from '../LuaTable';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';
import { DocBuilder } from '../../DocBuilder';
import { Model } from './Model';
import { unsanitizeName } from './ModelUtils';

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
  readonly table: LuaTable;

  constructor(table: LuaTable, name: string, json?: TableModelJson) {
    super();
    this.table = table;
    this.name = name;
    if (json) this.load(json);
  }

  populate() {
    const { fields, methods} = this.table;
    const fieldNames = Object.keys(fields);
    fieldNames.sort((o1, o2) => o1.localeCompare(o2));
    for(const fieldName of fieldNames) {
      if(!this.fields[fieldName]) {
        this.fields[fieldName] = new FieldModel(fieldName, fields[fieldName]);
      }
    }

    const methodNames = Object.keys(methods);
    methodNames.sort((o1, o2) => o1.localeCompare(o2));
    for(const methodName of methodNames) {
      if(!this.methods[methodName]) {
        this.methods[methodName] = new MethodModel(methodName, methods[methodName]);
      }
    }
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

    let doc: TableDocJson = undefined;
    if (this.doc && !this.doc.isDefault()) doc = this.doc.save();

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
      const { authors, lines } = tableDoc;

      // Process authors. (If defined)
      if (authors && authors.length) {
        let s = '[';
        for (const author of authors) s += `${author}, `;
        s = `${s.substring(0, s.length - 2)}]`;
        doc.appendAnnotation('author', s);
      }
      
      // Process lines. (If defined)
      if (lines && lines.length) {
        if(authors && authors.length) doc.appendLine();
        for (const line of lines) doc.appendLine(line);
      }
    }

    return doc.isEmpty() ? '' : doc.build(prefix);
  }

  generateDom(): string {
    let dom = TableModel.HTML_TEMPLATE;

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

    replaceAll('TABLE_NAME', this.name);
    replaceAll('AUTHORS', authorsS);
    replaceAll('LINES', linesS);

    return dom;
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

  isDefault(): boolean {
    // Check fields.
    for (const field of Object.values(this.fields)) if (!field.isDefault()) return false;
    // Check methods.
    for (const method of Object.values(this.methods)) if (!method.isDefault()) return false;
    // Check doc.
    if (this.doc && !this.doc.isDefault()) return false;
    return true;
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
