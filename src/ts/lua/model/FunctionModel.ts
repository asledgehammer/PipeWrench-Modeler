import { LuaFunction } from '../LuaFunction';
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
  readonly name: string;

  constructor(name: string, json?: FunctionModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  testSignature(func: LuaFunction): boolean {
    if(func.name !== this.name) return false;
    if(func.params.length !== this.params.length) return false;
    if(this.params.length) {
      for(let index = 0; index < this.params.length; index++) {
        if(!this.params[index].testSignature(func.params[index])) return false;
      }
    }
    return true;
  }

  load(json: FunctionModelJson) {
    this.doc = new FunctionDoc(json.doc);
    this.params = [];
    for (const param of json.params) {
      this.params.push(new ParamModel(param));
    }
    this.returns = json.returns;
  }

  save(): FunctionModelJson {
    const doc = this.doc.save();
    const params: ParamModelJson[] = [];
    for (const param of this.params) {
      params.push(param.save());
    }
    const returns = this.returns;
    return { doc, params, returns };
  }
}

/**
 * **FunctionModelJson**
 * 
 * @author JabDoesThings
 */
export type FunctionModelJson = {
  doc: FunctionDocJson;
  params: ParamModelJson[];
  returns: {
    applyUnknownType: boolean;
    types: string[];
  };
};
