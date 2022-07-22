import { LuaMethod } from '../LuaMethod';
import { MethodDoc, MethodDocJson } from './doc/MethodDoc';
import { ParamModel, ParamModelJson } from './ParamModel';

/**
 * **MethodModel**
 *
 * @author JabDoesThings
 */
export class MethodModel {
  doc: MethodDoc;
  params: ParamModel[] = [];
  returns: { applyUnknownType: boolean; types: string[] } = { applyUnknownType: true, types: [] };
  readonly name: string;

  constructor(name: string, json?: MethodModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  testSignature(func: LuaMethod): boolean {
    if(func.name !== this.name) return false;
    if(func.params.length !== this.params.length) return false;
    if(this.params.length) {
      for(let index = 0; index < this.params.length; index++) {
        if(!this.params[index].testSignature(func.params[index])) return false;
      }
    }
    return true;
  }

  load(json: MethodModelJson) {
    this.doc = new MethodDoc(json.doc);
    this.params = [];
    for (const param of json.params) {
      this.params.push(new ParamModel(param));
    }
    this.returns = json.returns;
  }

  save(): MethodModelJson {
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
 * **MethodModelJson**
 * 
 * @author JabDoesThings
 */
export type MethodModelJson = {
  doc: MethodDocJson;
  params: ParamModelJson[];
  returns: {
    applyUnknownType: boolean;
    types: string[];
  };
};
