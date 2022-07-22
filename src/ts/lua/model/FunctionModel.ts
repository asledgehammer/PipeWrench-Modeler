import { FunctionDoc, FunctionDocJson } from './doc/FunctionDoc';
import { ParamModel, ParamModelJson } from './ParamModel';

/**
 * **FunctionModel**
 * 
 * @author JabDoesThings
 */
export class FunctionModel {
  doc: FunctionDoc;
  params: ParamModel[] = [];
  returns: { applyUnknownType: boolean; types: string[] } = { applyUnknownType: true, types: [] };

  constructor(json?: FunctionModelJson) {
    if (json) this.load(json);
  }

  load(json: FunctionModelJson) {
    this.doc = new FunctionDoc(json.doc);
    this.params = [];
    for(const param of json.params) {
      this.params.push(new ParamModel(param));
    }
    this.returns = json.returns;
  }

  save(): FunctionModelJson {
    const doc = this.doc.save();
    const params: ParamModelJson[] = [];
    for(const param of this.params) {
      params.push(param.save());
    }
    const returns = this.returns;
    return {doc, params, returns};
  }
}

export type FunctionModelJson = {
  doc: FunctionDocJson;
  params: ParamModelJson[];
  returns: {
    applyUnknownType: boolean;
    types: string[];
  };
};
