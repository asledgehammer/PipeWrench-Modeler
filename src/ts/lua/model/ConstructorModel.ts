import { LuaClass } from '../LuaClass';
import { LuaMethod } from '../LuaMethod';
import { ClassModel } from './ClassModel';
import { ConstructorDoc, ConstructorDocJson } from './doc/ConstructorDoc';
import { ParamModel, ParamModelJson } from './ParamModel';

/**
 * **ConstructorModel**
 *
 * @author JabDoesThings
 */
export class ConstructorModel {
  doc: ConstructorDoc;
  params: ParamModel[] = [];
  readonly clazz: ClassModel;

  constructor(clazz: ClassModel, json?: ConstructorModelJson) {
    this.clazz = clazz;
    if (json) this.load(json);
  }

  testSignature(_constructor_: LuaMethod): boolean {
    if (_constructor_.params.length !== this.params.length) return false;
    if (this.params.length) {
      for (let index = 0; index < this.params.length; index++) {
        if (!this.params[index].testSignature(_constructor_.params[index])) return false;
      }
    }
    return true;
  }

  load(json: ConstructorModelJson) {
    this.doc = new ConstructorDoc(json.doc);
    this.params = [];
    for (const param of json.params) {
      this.params.push(new ParamModel(param));
    }
  }

  save(): ConstructorModelJson {
    const params: ParamModelJson[] = [];
    const doc: ConstructorDocJson = this.doc.save();
    return { doc, params };
  }
}

/**
 * **ConstructorModelJson**
 *
 * @author JabDoesThings
 */
export type ConstructorModelJson = {
  doc: ConstructorDocJson;
  params: ParamModelJson[];
};
