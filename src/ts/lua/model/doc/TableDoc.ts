import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';

/**
 * **TableDoc**
 *
 * @author JabDoesThings
 */
export class TableDoc extends AuthoredDoc {
  constructor(json?: TableDocJson) {
    super();
    if (json) this.load(json);
  }

  save(): TableDocJson {
    return super.save() as TableDocJson;
  }
}

export type TableDocJson = AuthoredDocJson & {};
