import { LuaField } from '../LuaField';

import { Model } from './Model';
import { ModelDocumentation, ModelDocumentationJson } from './doc/ModelDocumentation';
import { ReturnModel, ReturnModelJson } from './ReturnModel';
import { replaceAll } from '../../Utils';

/** @author JabDoesThings */
export class FieldModel extends Model<FieldModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly documentation = new ModelDocumentation();
  readonly _return_ = new ReturnModel();
  readonly name: string;

  constructor(name: string, src?: FieldModelJson) {
    super();
    this.name = name;
    if (src) this.load(src);
  }

  generateDom(): string {
    const { name, documentation, _return_ } = this;

    let dom = FieldModel.HTML_TEMPLATE;
    dom = replaceAll(dom, '${FIELD_NAME}', name);
    dom = replaceAll(dom, '${DESCRIPTION}', documentation.description.join('\n'));
    dom = replaceAll(dom, '${RETURN_TYPES}', _return_.types.join('\n'));
    dom = replaceAll(dom, '${RETURN_DESCRIPTION}', _return_.description.join('\n'));
    return dom;
  }

  testSignature(field: LuaField): boolean {
    return field.name === this.name;
  }

  load(json: FieldModelJson) {
    this.clear();
    if (json._return_) this._return_.load(json._return_);
    if (json.documentation) this.documentation.load(json.documentation);
  }

  save(): FieldModelJson {
    let documentation: ModelDocumentationJson = undefined;
    if (!this.documentation.isDefault()) documentation = this.documentation.save();
    let _return_: ReturnModelJson = undefined;
    if (!this._return_.isDefault()) _return_ = this._return_.save();
    return { documentation, _return_ };
  }

  clear() {
    this.documentation.clear();
    this._return_.clear();
  }

  isDefault(): boolean {
    return this.documentation.isDefault() && this._return_.isDefault();
  }
}

export type FieldModelJson = {
  _return_: ReturnModelJson;
  documentation: ModelDocumentationJson;
};
