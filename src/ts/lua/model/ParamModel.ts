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

  constructor(src?: ParamModelJson | string) {
    super();
    if (src) {
      if(typeof src === 'string') {
        this.create(src);
      } else {      
        this.load(src);
      }
    }
    this.dom = this.generateDom();
  }

  create(id: string) {
    this.id = id;
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
    let dom = ParamModel.HTML_TEMPLATE;

    const replaceAll = (from: string, to: string) => {
      const fromS = '${' + from + "}";
      while (dom.indexOf(fromS) !== -1) dom = dom.replace(fromS, to);
    };

    replaceAll('PARAM_NAME', this.id);
    return dom;
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
