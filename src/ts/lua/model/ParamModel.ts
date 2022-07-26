import { ParamDoc, ParamDocJson } from './doc/ParamDoc';
import { Model } from './Model';

/**
 * **ParamModel**
 *
 * @author JabDoesThings
 */
export class ParamModel extends Model<ParamModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly doc = new ParamDoc();
  readonly types: string[] = [];
  id = '';
  rename = '';
  applyUnknownType: boolean = true;

  constructor(json?: ParamModelJson) {
    super();
    if (json) this.load(json);
    this.dom = this.generateDom();
  }

  load(json: ParamModelJson) {
    this.clear();
    if(json.doc) this.doc.load(json.doc);
    if(json.id) this.id = json.id;
    else throw new Error('Param without ID.');
    if(json.applyUnknownType != null) this.applyUnknownType = json.applyUnknownType;
    if(json.rename) this.rename = json.rename;
    if(json.types) for(const type of json.types) this.types.push(type);
  }

  save(): ParamModelJson {
    const { id, applyUnknownType, rename, types } = this;
    const doc = this.doc.save();
    return { doc, id, applyUnknownType, rename, types };
  }

  clear() {
    this.doc.clear();
    this.types.length = 0;
    this.applyUnknownType = true;
    this.rename = '';
  }

  generateDom(): string {
    return '';
  }

  testSignature(paramName: string): boolean {
    return paramName === this.id;
  }

  get name(): string {
    return this.rename && this.rename.length ? this.rename : this.id;
  }
}

/**
 * **ParamModelJson**
 *
 * @author JabDoesThings
 */
export type ParamModelJson = {
  doc: ParamDocJson;
  id: string;
  applyUnknownType: boolean;
  rename: string;
  types: string[];
};
