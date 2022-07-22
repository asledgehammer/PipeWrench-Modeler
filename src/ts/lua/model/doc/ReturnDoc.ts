import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **ReturnDoc**
 *
 * @author JabDoesThings
 */
export class ReturnDoc extends BaseDoc {
  returnTypes: string[] = [];

  constructor(json?: ReturnDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: ReturnDocJson) {
    super.load(json);
    this.returnTypes = ([] as string[]).concat(json.returnTypes);
  }

  save(): ReturnDocJson {
    const json = super.save() as ReturnDocJson;
    json.returnTypes = this.returnTypes;
    return json;
  }
}

/**
 * **ReturnDocJson**
 *
 * @author JabDoesThings
 */
export type ReturnDocJson = BaseDocJson & {
  returnTypes: string[];
};
