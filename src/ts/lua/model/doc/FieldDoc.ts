export class FieldDoc {
  annotations: { [annotation: string]: any } = {};
  lines: string[] = [];

  constructor(json?: FieldDocJson) {
    if (json) this.load(json);
  }

  load(json: FieldDocJson) {
    this.annotations = json.annotations;
    this.lines = json.lines;
  }

  save(): FieldDocJson {
    return { annotations: this.annotations, lines: this.lines };
  }
}

export type FieldDocJson = {
  annotations: { [annotation: string]: any };
  lines: string[];
};
