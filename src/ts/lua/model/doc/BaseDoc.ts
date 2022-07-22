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
    this.lines = ([] as string[]).concat(json.lines);
  }

  /**
   * @returns The documentation as JSON data.
   */
  save(): BaseDocJson {
    const { lines } = this;
    return { lines };
  }
}

/**
 * **BaseDocJson**
 *
 * @author JabDoesThings
 */
export type BaseDocJson = {
  /** Descriptor lines in the documentation. */
  lines: string[];
};
