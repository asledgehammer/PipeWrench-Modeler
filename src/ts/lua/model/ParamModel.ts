import { ParamDoc, ParamDocJson } from './doc/ParamDoc';

/**
 * **ParamModel**
 *
 * @author JabDoesThings
 */
export class ParamModel {
  doc: ParamDoc;
  id: string;
  applyUnknownType: boolean = true;
  types: string[] = [];

  constructor(json?: ParamModelJson) {
    if (json) this.load(json);
  }

  load(json: ParamModelJson) {
    this.doc = new ParamDoc(json.doc);
    this.id = json.id;
    this.applyUnknownType = json.applyUnknownType;
    this.types = json.types;
  }

  save(): ParamModelJson {
    const doc = this.doc.save();
    const id = this.id;
    const applyUnknownType = this.applyUnknownType;
    const types = this.types;
    return { doc, id, applyUnknownType, types };
  }
}

/**
 * **ParamModelJson**
 *
 * @author JabDoesThings
 */
export type ParamModelJson = {
  id: string;
  applyUnknownType: boolean;
  doc: ParamDocJson;
  types: string[];
};
