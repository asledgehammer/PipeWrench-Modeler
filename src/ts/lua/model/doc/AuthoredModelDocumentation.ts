import { ModelDocumentation, ModelDocumentationJson } from './ModelDocumentation';

/** @author JabDoesThings */
export class AuthoredModelDocumentation extends ModelDocumentation {
  /** Authors of the documentation. */
  readonly authors: string[] = [];

  /**
   * @param json The JSON data to load.
   */
  load(json: AuthoredModelDocumentationJson) {
    super.load(json);
    if (json.authors) for (const author of json.authors) this.authors.push(author);
  }

  /**
   * @returns The documentation as JSON data.
   */
  save(): AuthoredModelDocumentationJson {
    let description: string[] = undefined;
    if (this.description.length) description = ([] as string[]).concat(this.description);
    let authors: string[] = undefined;
    if (this.authors.length) authors = ([] as string[]).concat(this.authors);
    return { description, authors };
  }

  clear() {
    super.clear();
    this.authors.length = 0;
  }

  isDefault(): boolean {
    return super.isDefault() && !this.authors.length;
  }
}

export type AuthoredModelDocumentationJson = ModelDocumentationJson & {
  authors: string[];
};
