import { AuthoredDoc, AuthoredDocJson } from './AuthoredDoc';
import { BaseDoc, BaseDocJson } from './BaseDoc';
import { FieldDoc, FieldDocJson } from './FieldDoc';
import { MethodDoc, MethodDocJson } from './MethodDoc';

/**
 * **TableDoc**
 *
 * @author JabDoesThings
 */
export class TableDoc extends AuthoredDoc {
  annotations: { [annotation: string]: any } = {};
  fields: FieldDoc[] = [];
  methods: MethodDoc[] = [];

  constructor(json?: TableDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: TableDocJson) {
    super.load(json);
    this.annotations = json.annotations;
    this.fields = [];
    this.methods = [];
    for (const next of json.fields) this.fields.push(new FieldDoc(next));
    for (const next of json.methods) this.methods.push(new MethodDoc(next));
  }

  save(): TableDocJson {
    const json = super.save() as TableDocJson;
    json.annotations = this.annotations;
    json.fields = this.fields.map((next) => next.save());
    json.methods = this.methods.map((next) => next.save());
    return json;
  }
}

/**
 * **TableDocJson**
 *
 * @author JabDoesThings
 */
export type TableDocJson = AuthoredDocJson & {
  annotations: { [annotation: string]: any };
  fields: FieldDocJson[];
  methods: MethodDocJson[];
};
