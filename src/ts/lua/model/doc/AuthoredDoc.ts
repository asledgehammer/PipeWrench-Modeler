import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **AuthoredDoc**
 *
 * @author JabDoesThings
 */
export abstract class AuthoredDoc extends BaseDoc {
  /** Authors of the documentation. */
  authors: string[] = [];

  protected constructor() {
    super();
  }

  /**
   * @param json The JSON data to load.
   */
  load(json: AuthoredDocJson) {
    super.load(json);
    this.authors = ([] as string[]).concat(json.authors);
  }

  /**
   * @returns The documentation as JSON data.
   */
  save(): AuthoredDocJson {
    const { lines, authors } = this;
    return { lines, authors };
  }

  clear() {
    super.clear();
    this.authors.length = 0;
  }
}

export type AuthoredDocJson = BaseDocJson & {
  /** Authors of the documentation. */
  authors: string[];
};
