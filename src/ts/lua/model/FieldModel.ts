import { LuaField } from '../LuaField';
import { FieldDoc, FieldDocJson } from './doc/FieldDoc';

/**
 * **FieldModel**
 *
 * @author JabDoesThings
 */
export class FieldModel {
  doc: FieldDoc;
  types: string[] = [];
  applyUnknownType: boolean = true;
  readonly name: string;

  constructor(name: string, json?: FieldModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  testSignature(field: LuaField): boolean {
    return field.name === this.name;
  }

  load(json: FieldModelJson) {
    this.doc = new FieldDoc(json.doc);
    this.types = json.types;
    this.applyUnknownType = json.applyUnknownType;
  }

  save(): FieldModelJson {
    const doc = this.doc.save();
    const types = this.types;
    const applyUnknownType = this.applyUnknownType;
    return { doc, types, applyUnknownType };
  }
}

/**
 * **FieldModelJson**
 * 
 * @author JabDoesThings
 */
export type FieldModelJson = {
  doc: FieldDocJson;
  types: string[];
  applyUnknownType: boolean;
};
