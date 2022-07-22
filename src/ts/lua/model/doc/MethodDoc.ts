import { BaseDoc, BaseDocJson } from './BaseDoc';
import { ParamDoc, ParamDocJson } from './ParamDoc';
import { ReturnDoc, ReturnDocJson } from './ReturnDoc';

/**
 * **MethodDoc**
 *
 * @author JabDoesThings
 */
export class MethodDoc extends BaseDoc {
  annotations: { [annotation: string]: any } = {};
  params: ParamDoc[] = [];
  readonly returns: ReturnDoc = new ReturnDoc();

  constructor(json?: MethodDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: MethodDocJson) {
    super.load(json);
    this.annotations = json.annotations;
    this.params = [];
    for (const next of json.params) this.params.push(new ParamDoc(next));
    this.returns.load(json.returns);
  }

  save(): MethodDocJson {
    const json = super.save() as MethodDocJson;
    json.annotations = this.annotations;
    json.params = this.params.map((param) => param.save());
    json.returns = this.returns.save();
    return json;
  }
}

/**
 * **MethodDocJson**
 *
 * @author JabDoesThings
 */
export type MethodDocJson = BaseDocJson & {
  annotations: { [annotation: string]: any };
  params: ParamDocJson[];
  returns: ReturnDocJson;
};
