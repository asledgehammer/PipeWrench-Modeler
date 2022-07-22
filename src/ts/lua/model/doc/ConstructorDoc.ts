import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **ConstructorDoc**
 *
 * @author JabDoesThings
 */
export class ConstructorDoc extends BaseDoc {
  annotations: { [annotation: string]: any } = {};

  constructor(json?: ConstructorDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: ConstructorDocJson) {
    super.load(json);
    if(json.annotations) this.annotations = json.annotations;
  }

  save(): ConstructorDocJson {
    const json = super.save() as ConstructorDocJson;
    json.annotations = this.annotations;
    return json;
  }
}

export type ConstructorDocJson = BaseDocJson & {
  annotations: { [annotation: string]: any };
};
