import { Model } from './Model';
import {
  ModelDocumentation as ModelDocumentation,
  ModelDocumentationJson,
} from './doc/ModelDocumentation';
import { replaceAll } from '../../Utils';

/** @author JabDoesThings */
export class ParameterModel extends Model<ParameterModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly documentation = new ModelDocumentation();
  readonly types: string[] = [];
  readonly methodName: string;
  id = '';
  rename = '';

  constructor(methodName: string, src?: ParameterModelJson | string) {
    super();
    this.methodName = methodName;
    if (src) {
      if (typeof src === 'string') {
        this.id = src;
      } else {
        this.load(src);
      }
    }
  }

  load(json: ParameterModelJson) {
    this.clear();
    if (json.documentation) this.documentation.load(json.documentation);
    if (json.id) this.id = json.id;
    else throw new Error('Parameter without ID.');
    if (json.rename) this.rename = json.rename;
    if (json.types) {
      this.types.length = 0;
      for (const type of json.types) this.types.push(type);
    }
  }

  save(): ParameterModelJson {
    const { id } = this;
    
    let documentation: ModelDocumentationJson = undefined;
    if (!this.documentation.isDefault()) documentation = this.documentation.save();
    
    let rename: string = undefined;
    if (this.rename.length) rename = this.rename;
    
    let types: string[] = undefined;
    if (this.types.length) types = ([] as string[]).concat(this.types);

    return { documentation: documentation, id, rename, types };
  }

  clear() {
    this.documentation.clear();
    this.types.length = 0;
    this.rename = '';
  }

  generateDom(): string {
    const { methodName, rename, types, documentation, id} = this;
    
    let dom = ParameterModel.HTML_TEMPLATE;
    dom = replaceAll(dom, '${RENAME}', rename);
    dom = replaceAll(dom, '${PARAMETER_TYPES}', types.join('\n'));
    dom = replaceAll(dom, '${PARAMETER_DESCRIPTION}', documentation.description.join('\n'));
    dom = replaceAll(dom, '${METHOD_NAME}', methodName);
    dom = replaceAll(dom, '${PARAMETER_NAME}', id);
    return dom;
  }

  testSignature(paramName: string): boolean {
    return paramName === this.id;
  }

  isDefault(): boolean {
    if (this.rename.length) return false;
    if (this.types.length) return false;
    return this.documentation.isDefault();
  }

  get name(): string {
    return this.rename && this.rename.length ? this.rename : this.id;
  }
}

export type ParameterModelJson = {
  types: string[];
  id: string;
  rename: string;
  documentation: ModelDocumentationJson;
};
