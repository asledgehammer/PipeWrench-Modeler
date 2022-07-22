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
    this.annotations = json.annotations;
  }

  save(): FunctionDocJson {
    const json = super.save() as FunctionDocJson;
    json.annotations = this.annotations;
    return json;
  }
}

export type FunctionDocJson = AuthoredDocJson & {
  annotations: { [annotation: string]: any };
};
