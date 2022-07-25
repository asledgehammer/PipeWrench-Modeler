import { LuaField } from '../LuaField';
import { FieldDoc, FieldDocJson } from './doc/FieldDoc';

/**
 * **FieldModel**
 *
 * @author JabDoesThings
 */
export class FieldModel {
  readonly doc = new FieldDoc();
  readonly types: string[] = [];
  readonly name: string;
  applyUnknownType: boolean = true;

  constructor(name: string, json?: FieldModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  testSignature(field: LuaField): boolean {
    return field.name === this.name;
  }

  load(json: FieldModelJson) {
    if(json.doc) this.doc.load(json.doc);
    for(const type of json.types) this.types.push(type);
    this.applyUnknownType = json.applyUnknownType;
  }

  save(): FieldModelJson {
    const doc = this.doc.save();
    const { types, applyUnknownType} = this;
    return { doc, types, applyUnknownType };
  }

  clear() {
    this.doc.clear();
    this.types.length = 0;
    this.applyUnknownType = true;
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
