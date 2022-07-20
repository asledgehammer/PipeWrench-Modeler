/**
 * **ParamDoc**
 * 
 * @author JabDoesThings
 */
export class ParamDoc {
  lines: string[] = [];

  constructor(json?: ParamDocJson) {
    if (json) this.load(json);
  }

  load(json: ParamDocJson) {
    this.lines = json.lines;
  }

  save(): ParamDocJson {
    return { lines: this.lines };
  }
}

export type ParamDocJson = {
  lines: string[];
};
