import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **ConstructorDoc**
 *
 * @author JabDoesThings
 */
export class ConstructorDoc extends BaseDoc {
  constructor(json?: ConstructorDocJson) {
    super();
    if (json) this.load(json);
  }

  save(): ConstructorDocJson {
    return super.save() as ConstructorDocJson;
  }
}

export type ConstructorDocJson = BaseDocJson & {};
