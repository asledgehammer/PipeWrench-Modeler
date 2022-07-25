import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';

/**
 * **ClassDoc**
 *
 * @author JabDoesThings
 */
export class ClassDoc extends AuthoredDoc {
  annotations: { [annotation: string]: any } = {};

  constructor(json?: ClassDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: ClassDocJson) {
    super.load(json);
    if(json.annotations) this.annotations = json.annotations;
  }

  save(): ClassDocJson {
    const json = super.save() as ClassDocJson;
    json.annotations = this.annotations;
    return json;
  }

  clear() {
    super.clear();
    for (const key of Object.keys(this.annotations)) delete this.annotations[key];
  }
}

export type ClassDocJson = AuthoredDocJson & {
  annotations: { [annotation: string]: any };
};
