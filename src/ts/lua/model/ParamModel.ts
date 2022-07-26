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
  readonly types: string[] = ['unknown'];
  readonly methodName: string;
  id = '';
  rename = '';

  constructor(methodName: string, src?: ParamModelJson | string) {
    super();
    this.methodName = methodName;
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
    if(json.rename) this.rename = json.rename;
    if(json.types) for(const type of json.types) this.types.push(type);
  }

  save(): ParamModelJson {
    const { id, rename, types } = this;
    const doc = this.doc.save();
    return { doc, id, rename, types };
  }

  clear() {
    this.doc.clear();
    this.types.length = 0;
    this.rename = '';
  }

  generateDom(): string {
    let dom = ParamModel.HTML_TEMPLATE;

    const replaceAll = (from: string, to: string) => {
      const fromS = '${' + from + "}";
      while (dom.indexOf(fromS) !== -1) dom = dom.replace(fromS, to);
    };

    replaceAll('METHOD_NAME', this.methodName);
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
  rename: string;
  types: string[];
};
