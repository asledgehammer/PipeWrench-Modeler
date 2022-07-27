import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';

/**
 * **ClassDoc**
 *
 * @author JabDoesThings
 */
export class ClassDoc extends AuthoredDoc {
  constructor(json?: ClassDocJson) {
    super();
    if (json) this.load(json);
  }

  save(): ClassDocJson {
    return super.save() as ClassDocJson;
  }
}

export type ClassDocJson = AuthoredDocJson & {};
