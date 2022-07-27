import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **ReturnDoc**
 *
 * @author JabDoesThings
 */
export class ReturnDoc extends BaseDoc {
  constructor(json?: ReturnDocJson) {
    super();
    if (json) this.load(json);
  }

  save(): ReturnDocJson {
    return super.save() as ReturnDocJson;
  }
}

export type ReturnDocJson = BaseDocJson;
