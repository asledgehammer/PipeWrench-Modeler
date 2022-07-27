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
    if (json.authors) for (const author of json.authors) this.authors.push(author);
  }

  /**
   * @returns The documentation as JSON data.
   */
  save(): AuthoredDocJson {
    let lines: string[] = undefined;
    if(this.lines.length) lines = ([] as string[]).concat(this.lines);

    let authors: string[] = undefined;
    if(this.authors.length) authors = ([] as string[]).concat(this.authors);

    return { lines, authors };
  }

  clear() {
    super.clear();
    this.authors.length = 0;
  }

  isDefault(): boolean {
    if (this.authors && this.authors.length) return false;
    if (this.lines && this.lines.length) return false;
    return true;
  }
}

export type AuthoredDocJson = BaseDocJson & {
  /** Authors of the documentation. */
  authors: string[];
};
