import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';
import { ParamDoc, ParamDocJson } from './ParamDoc';
import { ReturnDoc, ReturnDocJson } from './ReturnDoc';

/**
 * **FunctionDoc**
 *
 * @author JabDoesThings
 */
export class FunctionDoc extends AuthoredDoc {
  annotations: { [annotation: string]: any } = {};
  params: ParamDoc[] = [];
  readonly returns: ReturnDoc = new ReturnDoc();

  constructor(json?: FunctionDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: FunctionDocJson) {
    super.load(json);
    this.annotations = json.annotations;
    this.params = [];
    for (const next of json.params) this.params.push(new ParamDoc(next));
    this.returns.load(json.returns);
  }

  save(): FunctionDocJson {
    const json = super.save() as FunctionDocJson;
    json.annotations = this.annotations;
    json.params = this.params.map((param) => param.save());
    json.returns = this.returns.save();
    return json;
  }
}

/**
 * **FunctionDocJson**
 *
 * @author JabDoesThings
 */
export type FunctionDocJson = AuthoredDocJson & {
  annotations: { [annotation: string]: any };
  params: ParamDocJson[];
  returns: ReturnDocJson;
};
