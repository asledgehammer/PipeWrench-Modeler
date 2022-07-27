/**
 * **BaseDoc**
 *
 * @author JabDoesThings
 */
export abstract class BaseDoc {
  /** Descriptor lines in the documentation. */
  lines: string[] = [];

  protected constructor() {}

  /**
   * @param json The JSON data to load.
   */
  load(json: BaseDocJson) {
    this.clear();
    if (json.lines) for (const line of json.lines) this.lines.push(line);
  }

  /**
   * @returns The documentation as JSON data.
   */
  save(): BaseDocJson {
    let lines: string[] = undefined;
    if(this.lines.length) lines = ([] as string[]).concat(this.lines);
    return { lines };
  }

  clear() {
    this.lines.length = 0;
  }

  isDefault(): boolean {
    if (this.lines && this.lines.length) return false;
    return true;
  }
}

export type BaseDocJson = {
  /** Descriptor lines in the documentation. */
  lines: string[];
};
