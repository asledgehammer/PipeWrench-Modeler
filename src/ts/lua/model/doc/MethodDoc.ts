/**
 * **MethodDoc**
 * 
 * @author JabDoesThings
 */
export class MethodDoc {
  annotations: { [annotation: string]: any } = {};
  lines: string[] = [];

  constructor(json?: MethodDocJson) {
    if (json) this.load(json);
  }

  load(json: MethodDocJson) {
    this.annotations = json.annotations;
    this.lines = json.lines;
  }

  save(): MethodDocJson {
    return { annotations: this.annotations, lines: this.lines };
  }
}

export type MethodDocJson = {
  annotations: { [annotation: string]: any };
  lines: string[];
};
