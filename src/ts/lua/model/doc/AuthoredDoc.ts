import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **AuthoredDoc**
 *
 * @author JabDoesThings
 */
export abstract class AuthoredDoc extends BaseDoc {
  /** Authors of the documentation. */
  readonly authors: string[] = [];

  protected constructor() {
    super();
  }

  /**
   * @param json The JSON data to load.
   */
  load(json: AuthoredDocJson) {
    super.load(json);
    if(json.authors) for(const author of json.authors) this.authors.push(author);
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
