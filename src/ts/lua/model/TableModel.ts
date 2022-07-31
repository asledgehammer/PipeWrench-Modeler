import { unsanitizeName } from './ModelUtils';
import { DocumentationBuilder } from '../../DocumentationBuilder';

import { LuaTable } from '../LuaTable';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';

import { Model } from './Model';
import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';

import {
  AuthoredModelDocumentation,
  AuthoredModelDocumentationJson,
} from './doc/AuthoredModelDocumentation';
import { replaceAll } from '../../Utils';

/** @author JabDoesThings */
export class TableModel extends Model<TableModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly fields: { [id: string]: FieldModel } = {};
  readonly methods: { [id: string]: MethodModel } = {};
  readonly documentation = new AuthoredModelDocumentation();
  readonly name: string;
  readonly table: LuaTable;

  constructor(table: LuaTable, name: string, json?: TableModelJson) {
    super();
    this.table = table;
    this.name = name;
    if (json) this.load(json);
  }

  populate() {
    const { fields, methods } = this.table;
    const fieldNames = Object.keys(fields);

    fieldNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const fieldName of fieldNames) {
      if (!this.fields[fieldName]) {
        this.fields[fieldName] = new FieldModel(fieldName);
      }
    }

    const methodNames = Object.keys(methods);
    methodNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const methodName of methodNames) {
      if (!this.methods[methodName]) {
        this.methods[methodName] = new MethodModel(methodName, methods[methodName]);
      }
    }
  }

  load(json: TableModelJson) {
    this.clear();

    if (json.fields) {
      for (const fieldName of Object.keys(json.fields)) {
        this.fields[fieldName] = new FieldModel(fieldName, json.fields[fieldName]);
      }
    }

    if (json.methods) {
      for (const methodName of Object.keys(json.methods)) {
        this.methods[methodName] = new MethodModel(methodName, json.methods[methodName]);
      }
    }

    if (json.documentation) this.documentation.load(json.documentation);
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
      for (const methodName of Object.keys(this.methods)) {
        const methodModel = this.methods[methodName];
        if (!methodModel.isDefault()) methods[unsanitizeName(methodName)] = methodModel.save();
      }
    }

    let documentation: AuthoredModelDocumentationJson = undefined;
    if (!this.documentation.isDefault()) documentation = this.documentation.save();

    return { fields, methods, documentation };
  }

  clear() {
    for (const key of Object.keys(this.fields)) delete this.fields[key];
    for (const key of Object.keys(this.methods)) delete this.methods[key];
    this.documentation.clear();
  }

  generateDocumentation(prefix: string): string {
    const documentationBuilder = new DocumentationBuilder();
    const { documentation: tableDoc } = this;
    if (tableDoc) {
      const { authors, description: tableDescription } = tableDoc;

      // Process authors. (If defined)
      if (authors && authors.length) {
        let s = '[';
        for (const author of authors) s += `${author}, `;
        s = `${s.substring(0, s.length - 2)}]`;
        documentationBuilder.appendAnnotation('docAuthors', s);
      }

      // Process lines. (If defined)
      if (tableDescription && tableDescription.length) {
        if (authors && authors.length) documentationBuilder.appendLine();
        for (const line of tableDescription) documentationBuilder.appendLine(line);
      }
    }

    return documentationBuilder.isEmpty() ? '' : documentationBuilder.build(prefix);
  }

  generateDom(): string {
    const { name, documentation } = this;
    const { authors, description } = documentation;

    let dom = TableModel.HTML_TEMPLATE;
    dom = replaceAll(dom, '${TABLE_NAME}', name);
    dom = replaceAll(dom, '${DOC_AUTHORS}', authors.join('\n'));
    dom = replaceAll(dom, '${DESCRIPTION}', description.join('\n'));
    return dom;
  }

  testSignature(table: LuaTable): boolean {
    return table.name === this.name;
  }

  getFieldModel(field: LuaField): FieldModel {
    const model = this.fields[field.name];
    if (model && model.testSignature(field)) return model;
    return null;
  }

  getMethodModel(method: LuaMethod): MethodModel {
    const model = this.methods[method.name];
    if (model && model.testSignature(method)) return model;
    return null;
  }

  isDefault(): boolean {
    for (const field of Object.values(this.fields)) if (!field.isDefault()) return false;
    for (const method of Object.values(this.methods)) if (!method.isDefault()) return false;
    return this.documentation.isDefault();
  }
}

export type TableModelJson = {
  fields: { [id: string]: FieldModelJson };
  methods: { [id: string]: MethodModelJson };
  documentation: AuthoredModelDocumentationJson;
};
