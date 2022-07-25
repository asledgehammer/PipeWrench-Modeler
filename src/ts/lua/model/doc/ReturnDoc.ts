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

  clear() {
    super.clear();
  }
}

export type ReturnDocJson = BaseDocJson;
