import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **FieldDoc**
 *
 * @author JabDoesThings
 */
export class FieldDoc extends BaseDoc {
  annotations: { [annotation: string]: any } = {};

  constructor(json?: FieldDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: FieldDocJson) {
    super.load(json);
    this.annotations = json.annotations;
  }

  save(): FieldDocJson {
    const json = super.save() as FieldDocJson;
    json.annotations = this.annotations;
    return json;
  }
}

/**
 * **FieldDocJson**
 *
 * @author JabDoesThings
 */
export type FieldDocJson = BaseDocJson & {
  annotations: { [annotation: string]: any };
};
