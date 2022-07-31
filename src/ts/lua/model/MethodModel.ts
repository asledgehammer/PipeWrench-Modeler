import { DocumentationBuilder } from '../../DocumentationBuilder';

import { LuaMethod } from '../LuaMethod';

import { Model } from './Model';
import { ModelDocumentation, ModelDocumentationJson } from './doc/ModelDocumentation';
import { ParameterModel, ParameterModelJson } from './ParamModel';
import { ReturnModel, ReturnModelJson } from './ReturnModel';
import { replaceAll } from '../../Utils';
import { generateParameterDocumentation } from './ModelUtils';

/** @author JabDoesThings */
export class MethodModel extends Model<MethodModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly documentation = new ModelDocumentation();
  readonly parameters: ParameterModel[] = [];
  readonly _return_ = new ReturnModel();
  readonly name: string;

  constructor(name: string, src?: MethodModelJson | LuaMethod) {
    super();
    this.name = name;
    if (src) {
      if (src instanceof LuaMethod) {
        for (const parameter of src.parameters) {
          this.parameters.push(new ParameterModel(this.name, parameter));
        }
      } else {
        this.load(src);
      }
    }
  }

  load(json: MethodModelJson) {
    this.clear();
    if (json.documentation) this.documentation.load(json.documentation);
    if (json.parameters) {
      for (const parameter of json.parameters) {
        this.parameters.push(new ParameterModel(this.name, parameter));
      }
    }
    if (json._return_) this._return_.load(json._return_);
  }

  save(): MethodModelJson {
    let documentation: ModelDocumentationJson = undefined;
    if (!this.documentation.isDefault()) documentation = this.documentation.save();
    let parameters: ParameterModelJson[] = undefined;
    let oneParameterChanged = false;
    for (const parameter of this.parameters) {
      if (!parameter.isDefault()) {
        oneParameterChanged = true;
        break;
      }
    }
    if (oneParameterChanged) {
      parameters = [];
      for (const parameter of this.parameters) parameters.push(parameter.save());
    }
    let _return_: ReturnModelJson = undefined;
    if (!this._return_.isDefault()) _return_ = this._return_.save();
    return { documentation, parameters, _return_ };
  }

  clear() {
    this.documentation.clear();
    this.parameters.length = 0;
    this._return_.clear();
  }

  generateDocumentation(prefix: string, method: LuaMethod): string {
    if (!this.testSignature(method)) return '';
    const { documentation, parameters, _return_ } = this;
    const { description } = documentation;
    
    const documentationBuilder = new DocumentationBuilder();
     
    if(method.isStatic) documentationBuilder.appendAnnotation('noSelf');
    if (description.length) {
      if (!documentationBuilder.isEmpty()) documentationBuilder.appendLine();
      for (const line of description) documentationBuilder.appendLine(line);
    }
    
    generateParameterDocumentation(documentationBuilder, parameters);
    _return_.generateDocumentation(documentationBuilder);
    return documentationBuilder.isEmpty() ? '' : documentationBuilder.build(prefix);
  }

  generateDom(): string {
    const { name, documentation, parameters, _return_ } = this;

    let parametersDom = '';
    if (this.parameters.length) {
      for (const parameter of this.parameters) {
        parametersDom += parameter.generateDom();
      }
    }

    let dom = MethodModel.HTML_TEMPLATE;
    dom = replaceAll(dom, '${METHOD_NAME}', name);
    dom = replaceAll(dom, '${DESCRIPTION}', documentation.description.join('\n'));
    dom = replaceAll(dom, '${HAS_PARAMETERS}', parameters.length ? 'inline-block' : 'none');
    dom = replaceAll(dom, '${PARAMETERS}', parametersDom);
    dom = replaceAll(dom, '${RETURN_TYPES}', _return_.types.join('\n'));
    dom = replaceAll(dom, '${RETURN_DESCRIPTION}', _return_.description.join('\n'));
    dom = replaceAll(dom, '${WRAP_WILDCARD_TYPE}', _return_.wrapWildcardType ? 'checked' : '');
    return dom;
  }

  testSignature(method: LuaMethod): boolean {
    if (method.name !== this.name) return false;
    if (method.parameters.length !== this.parameters.length) return false;
    if (this.parameters.length) {
      for (let index = 0; index < this.parameters.length; index++) {
        if (!this.parameters[index].testSignature(method.parameters[index])) {
          return false;
        }
      }
    }
    return true;
  }

  getParameterModel(id: string) {
    for (const parameter of this.parameters) {
      if (parameter.id === id) return parameter;
    }
    return null;
  }

  isDefault(): boolean {
    for (const parameter of this.parameters) if (!parameter.isDefault) return false;
    if (!this._return_.isDefault()) return false;
    return this.documentation.isDefault();
  }
}

export type MethodModelJson = {
  parameters: ParameterModelJson[];
  _return_: ReturnModelJson;
  documentation: ModelDocumentationJson;
};
