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
    if(json.lines) for(const line of json.lines) this.lines.push(line);
  }

  /**
   * @returns The documentation as JSON data.
   */
  save(): BaseDocJson {
    const { lines } = this;
    return { lines };
  }

  clear() {
    this.lines.length = 0;
  }
}

export type BaseDocJson = {
  /** Descriptor lines in the documentation. */
  lines: string[];
};
