import { ParamDoc, ParamDocJson } from './doc/ParamDoc';

/**
 * **ParamModel**
 *
 * @author JabDoesThings
 */
export class ParamModel {
  doc: ParamDoc;
  id: string;
  rename: string;
  types: string[] = [];
  applyUnknownType: boolean = true;

  constructor(json?: ParamModelJson) {
    if (json) this.load(json);
  }

  testSignature(paramName: string): boolean {
    return paramName === this.id;
  }

  load(json: ParamModelJson) {
    this.doc = new ParamDoc(json.doc);
    this.id = json.id;
    this.applyUnknownType = json.applyUnknownType;
    this.rename = json.rename;
    if(json.types) this.types = json.types;
  }

  save(): ParamModelJson {
    const { id, applyUnknownType, rename, types } = this;
    const doc = this.doc.save();
    return { doc, id, applyUnknownType, rename, types };
  }
}

/**
 * **ParamModelJson**
 *
 * @author JabDoesThings
 */
export type ParamModelJson = {
  doc: ParamDocJson;
  id: string;
  applyUnknownType: boolean;
  rename: string;
  types: string[];
};
