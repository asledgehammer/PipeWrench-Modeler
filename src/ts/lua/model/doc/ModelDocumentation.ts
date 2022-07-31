/** @author JabDoesThings */
export class ModelDocumentation {
  /** Descriptor lines in the documentation. */
  readonly description: string[] = [];

  /**
   * @param json The JSON data to load.
   */
  load(json: ModelDocumentationJson) {
    this.clear();
    if (json.description) for (const line of json.description) this.description.push(line);
  }

  /**
   * @returns The documentation as JSON data.
   */
  save(): ModelDocumentationJson {
    let description: string[] = undefined;
    if (this.description.length) description = ([] as string[]).concat(this.description);
    return { description };
  }

  clear() {
    this.description.length = 0;
  }

  isDefault(): boolean {
    return !this.description.length;
  }
}

export type ModelDocumentationJson = {
  /** Descriptor lines in the documentation. */
  description: string[];
};
