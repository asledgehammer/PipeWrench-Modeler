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

  constructor(json?: ConstructorModelJson) {
    if (json) this.load(json);
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
