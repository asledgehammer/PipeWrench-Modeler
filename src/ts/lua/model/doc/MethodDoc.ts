import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **MethodDoc**
 *
 * @author JabDoesThings
 */
export class MethodDoc extends BaseDoc {
  annotations: { [annotation: string]: any } = {};

  constructor(json?: MethodDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: MethodDocJson) {
    super.load(json);
    this.annotations = json.annotations;
  }

  save(): MethodDocJson {
    const json = super.save() as MethodDocJson;
    json.annotations = this.annotations;
    return json;
  }
}

export type MethodDocJson = BaseDocJson & {
  annotations: { [annotation: string]: any };
};
