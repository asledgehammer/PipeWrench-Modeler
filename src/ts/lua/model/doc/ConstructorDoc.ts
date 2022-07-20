/**
 * **ConstructorDoc**
 * 
 * @author JabDoesThings
 */
export class ConstructorDoc {
  annotations: { [annotation: string]: any } = {};
  lines: string[] = [];

  constructor(json?: ConstructorDocJson) {
    if (json) this.load(json);
  }

  load(json: ConstructorDocJson) {
    this.annotations = json.annotations;
    this.lines = json.lines;
  }

  save(): ConstructorDocJson {
    return { annotations: this.annotations, lines: this.lines };
  }
}

export type ConstructorDocJson = {
  annotations: { [annotation: string]: any };
  lines: string[];
};
