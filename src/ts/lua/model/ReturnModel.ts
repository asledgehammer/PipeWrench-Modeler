import { Model } from './Model';

/**
 * **ReturnModel**
 *
 * @author JabDoesThings
 */
export class ReturnModel extends Model<ReturnModelJson> {
  readonly types: string[] = [];
  applyUnknownType: boolean = true;

  constructor(json?: ReturnModelJson) {
    super();
    if (json) this.load(json);
  }

  load(json: ReturnModelJson) {
    if (json.applyUnknownType != null) this.applyUnknownType = json.applyUnknownType;
    if (json.types) for (const type of json.types) this.types.push(type);
  }

  save(): ReturnModelJson {
    let applyUnknownType = this.applyUnknownType ? undefined : false;

    let types: string[] = undefined;
    if (this.types.length) types = ([] as string[]).concat(this.types);

    return { types, applyUnknownType };
  }

  clear() {
    this.types.length = 0;
    this.applyUnknownType = true;
  }

  generateDom(): string {
    return '';
  }

  isDefault(): boolean {
    if (!this.applyUnknownType) return false;
    if (this.types.length) return false;
    return true;
  }
}

export type ReturnModelJson = {
  applyUnknownType: boolean;
  types: string[];
};
