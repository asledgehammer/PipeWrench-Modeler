import { Model } from "./Model";

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
    if(json) this.load(json);
  }

  load(json: ReturnModelJson) {
    if (json.applyUnknownType != null) this.applyUnknownType = json.applyUnknownType;
    if(json.types) for(const type of json.types) this.types.push(type);
  }

  save(): ReturnModelJson {
    const { types, applyUnknownType} = this;
    return { types, applyUnknownType };
  }

  clear() {
    this.types.length = 0;
    this.applyUnknownType = true;
  }

  generateDom(): string {
    return '';
  }
}

export type ReturnModelJson = {
  applyUnknownType: boolean;
  types: string[];
};
