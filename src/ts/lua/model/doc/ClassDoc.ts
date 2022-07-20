/**
 * **ClassDoc**
 * 
 * @author JabDoesThings
 */
export class ClassDoc {
  annotations: { [annotation: string]: any } = {};
  lines: string[] = [];

  constructor(json?: ClassDocJson) {
    if (json) this.load(json);
  }

  load(json: ClassDocJson) {
    this.annotations = json.annotations;
    this.lines = json.lines;
  }

  save(): ClassDocJson {
    return { annotations: this.annotations, lines: this.lines };
  }
}

export type ClassDocJson = {
  annotations: { [annotation: string]: any };
  lines: string[];
};
