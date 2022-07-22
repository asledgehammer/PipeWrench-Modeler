import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';

/**
 * **TableDoc**
 *
 * @author JabDoesThings
 */
export class TableDoc extends AuthoredDoc {
  annotations: { [annotation: string]: any } = {};

  constructor(json?: TableDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: TableDocJson) {
    super.load(json);
    if(json.annotations) this.annotations = json.annotations;
  }

  save(): TableDocJson {
    const json = super.save() as TableDocJson;
    json.annotations = this.annotations;
    return json;
  }
}

export type TableDocJson = AuthoredDocJson & {
  annotations: { [annotation: string]: any };
};
