import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';

/**
 * **FunctionDoc**
 *
 * @author JabDoesThings
 */
export class FunctionDoc extends AuthoredDoc {
  annotations: { [annotation: string]: any } = {};

  constructor(json?: FunctionDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: FunctionDocJson) {
    super.load(json);
    if(json.annotations) this.annotations = json.annotations;
  }

  save(): FunctionDocJson {
    const json = super.save() as FunctionDocJson;
    json.annotations = this.annotations;
    return json;
  }

  clear() {
    super.clear();
    for (const key of Object.keys(this.annotations)) delete this.annotations[key]; 
  }
}

export type FunctionDocJson = AuthoredDocJson & {
  annotations: { [annotation: string]: any };
};
