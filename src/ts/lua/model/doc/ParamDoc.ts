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

  save(): ParamDocJson {
    return super.save() as ParamDocJson;
  }
}

export type ParamDocJson = BaseDocJson;
