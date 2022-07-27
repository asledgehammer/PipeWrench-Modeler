import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';

/**
 * **FunctionDoc**
 *
 * @author JabDoesThings
 */
export class FunctionDoc extends AuthoredDoc {
  constructor(json?: FunctionDocJson) {
    super();
    if (json) this.load(json);
  }

  save(): FunctionDocJson {
    return super.save() as FunctionDocJson;
  }
}

export type FunctionDocJson = AuthoredDocJson & {};
