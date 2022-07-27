import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **FieldDoc**
 *
 * @author JabDoesThings
 */
export class FieldDoc extends BaseDoc {
  constructor(json?: FieldDocJson) {
    super();
    if (json) this.load(json);
  }

  save(): FieldDocJson {
    return super.save() as FieldDocJson;
  }
}

export type FieldDocJson = BaseDocJson & {};
