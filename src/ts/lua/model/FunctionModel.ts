import { DocumentationBuilder } from '../../DocumentationBuilder';

import { LuaFunction } from '../LuaFunction';

import { Model } from './Model';
import { ModelDocumentation, ModelDocumentationJson } from './doc/ModelDocumentation';
import { ParameterModel, ParameterModelJson } from './ParamModel';
import { ReturnModel, ReturnModelJson } from './ReturnModel';
import { replaceAll } from '../../Utils';

/** @author JabDoesThings */
export class FunctionModel extends Model<FunctionModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly documentation = new ModelDocumentation();
  readonly parameters: ParameterModel[] = [];
  readonly _return_ = new ReturnModel();
  readonly name: string;

  constructor(name: string, json?: FunctionModelJson) {
    super();
    this.name = name;
    if (json) this.load(json);
  }

  load(json: FunctionModelJson) {
    this.clear();
    if (json.documentation) this.documentation.load(json.documentation);
    if (json.parameters) {
      for (const parameter of json.parameters) {
        this.parameters.push(new ParameterModel(this.name, parameter));
      }
    }
    if (json._return_) this._return_.load(json._return_);
  }

  save(): FunctionModelJson {
    let documentation: ModelDocumentationJson = undefined;
    if (this.documentation && !this.documentation.isDefault()) {
      documentation = this.documentation.save();
    }
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
      for (const parameter of this.parameters) {
        parameters.push(parameter.save());
      }
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

  generateDocumentation(prefix: string, _function_: LuaFunction): string {
    if (!this.testSignature(_function_)) return '';
    const { documentation: functionDocumentation, parameters } = this;

    const documentationBuilder = new DocumentationBuilder();
    documentationBuilder.appendAnnotation('noSelf');

    if (functionDocumentation) {
      const { description: functionDescription } = functionDocumentation;

      // Process lines. (If defined)
      if (functionDescription.length) {
        for (const line of functionDescription) documentationBuilder.appendLine(line);
        documentationBuilder.appendLine();
      }

      // Process parameter(s). (If defined)
      if (parameters) {
        for (const parameter of parameters) {
          const { name: parameterName, documentation: parameterDocumentation } = parameter;
          const { description: parameterDescription } = parameterDocumentation;
          // No lines. Print basic @param <name>
          if (!parameterDescription.length) {
            // documentationBuilder.appendParam(parameterName);
            continue;
          }
          documentationBuilder.appendParam(parameterName, parameterDescription[0]);
          // Check if multi-line.
          if (parameterDescription.length === 1) continue;
          for (let index = 1; index < parameterDescription.length; index++) {
            documentationBuilder.appendLine(parameterDescription[index]);
          }
        }
      }
    }
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

    let dom = FunctionModel.HTML_TEMPLATE;
    dom = replaceAll(dom, '${METHOD_NAME}', name);
    dom = replaceAll(dom, '${DESCRIPTION}', documentation.description.join('\n'));
    dom = replaceAll(dom, '${HAS_PARAMETERS}', parameters.length ? 'inline-block' : 'none');
    dom = replaceAll(dom, '${PARAMETERS}', parametersDom);
    dom = replaceAll(dom, '${RETURN_TYPES}', _return_.types.join('\n'));
    dom = replaceAll(dom, '${RETURN_DESCRIPTION}', _return_.description.join('\n'));
    dom = replaceAll(dom, '${WRAP_WILDCARD_TYPE}', _return_.wrapWildcardType ? 'checked' : '');
    return dom;
  }

  testSignature(_function_: LuaFunction): boolean {
    if (_function_.name !== this.name) return false;
    if (_function_.parameters.length !== this.parameters.length) return false;
    if (this.parameters.length) {
      for (let index = 0; index < this.parameters.length; index++) {
        if (!this.parameters[index].testSignature(_function_.parameters[index])) return false;
      }
    }
    return true;
  }

  getParamModel(id: string) {
    for (const parameter of this.parameters) if (parameter.id === id) return parameter;
    return null;
  }

  isDefault(): boolean {
    for (const parameter of this.parameters) if (!parameter.isDefault()) return false;
    if (!this._return_.isDefault()) return false;
    return this.documentation.isDefault();
  }
}

export type FunctionModelJson = {
  parameters: ParameterModelJson[];
  _return_: ReturnModelJson;
  documentation: ModelDocumentationJson;
};
