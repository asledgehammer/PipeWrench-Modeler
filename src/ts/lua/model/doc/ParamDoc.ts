import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **ParamDoc**
 *
 * @author JabDoesThings
 */
export class ParamDoc extends BaseDoc {
  constructor(json?: ParamDocJson) {
    super();
    if (json) this.load(json);
  }

  clear() {
    super.clear();
  }
}

export type ParamDocJson = BaseDocJson;
