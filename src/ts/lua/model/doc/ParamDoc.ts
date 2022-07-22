import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **ParamDoc**
 *
 * @author JabDoesThings
 */
export class ParamDoc extends BaseDoc {

  types: string[];

  constructor(json?: ParamDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: ParamDocJson) {
    super.load(json);
    this.types = json.types;
  }

  save(): ParamDocJson {
    const json = super.save() as ParamDocJson;
    json.types = this.types;
    return json;
  }
}

/**
 * **ParamDocJson**
 *
 * @author JabDoesThings
 */
export type ParamDocJson = BaseDocJson & {
  types: string[];
};
