import { DocumentationBuilder } from '../../DocumentationBuilder';
import { Model } from './Model';

/** @author JabDoesThings */
export class ReturnModel extends Model<ReturnModelJson> {
  readonly types: string[] = [];
  readonly description: string[] = [];
  wrapWildcardType: boolean = true;

  constructor(json?: ReturnModelJson) {
    super();
    if (json) this.load(json);
  }

  load(json: ReturnModelJson) {
    this.clear();
    if (json.types != null) for (const type of json.types) this.types.push(type);
    if (json.description) for (const line of json.description) this.description.push(line);
    if (json.wrapWildcardType != null) this.wrapWildcardType = json.wrapWildcardType;
  }

  save(): ReturnModelJson {
    let wrapWildcardType = this.wrapWildcardType ? undefined : false;

    let description: string[] = undefined;
    if (this.description.length) description = ([] as string[]).concat(this.description);

    let types: string[] = undefined;
    if (this.types.length) types = ([] as string[]).concat(this.types);

    return { description, types, wrapWildcardType };
  }

  clear() {
    this.description.length = 0;
    this.types.length = 0;
    this.wrapWildcardType = true;
  }

  generateDocumentation(documentationBuilder: DocumentationBuilder) {
    const { description } = this;
    if (description.length && description[0].length) {
      if(!documentationBuilder.isEmpty()) documentationBuilder.appendLine();
      if (description.length >= 1) {
        documentationBuilder.appendReturn(description[0]);
      }
      if (description.length > 1) {
        for (let index = 1; index < description.length; index++) {
          documentationBuilder.appendLine(description[index]);
        }
      }
    }
  }

  generateDom(): string {
    return '';
  }

  isDefault(): boolean {
    if (!this.wrapWildcardType) return false;
    if (this.description.length) return false;
    return !this.types.length;
  }
}

export type ReturnModelJson = {
  description: string[];
  types: string[];
  wrapWildcardType: boolean;
};
