import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **MethodDoc**
 *
 * @author JabDoesThings
 */
export class MethodDoc extends BaseDoc {
  constructor(json?: MethodDocJson) {
    super();
    if (json) this.load(json);
  }

  save(): MethodDocJson {
    return super.save() as MethodDocJson;
  }
}

export type MethodDocJson = BaseDocJson & {};
