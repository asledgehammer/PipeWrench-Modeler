import { DocumentationBuilder } from '../../DocumentationBuilder';

import { LuaConstructor } from '../LuaConstructor';
import { LuaMethod } from '../LuaMethod';

import { Model } from './Model';
import { ModelDocumentation, ModelDocumentationJson } from './doc/ModelDocumentation';
import { ClassModel } from './ClassModel';
import { ParameterModel, ParameterModelJson } from './ParamModel';
import { replaceAll } from '../../Utils';

/** @author JabDoesThings */
export class ConstructorModel extends Model<ConstructorModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly parameters: ParameterModel[] = [];
  readonly documentation = new ModelDocumentation();
  readonly _class_: ClassModel;

  constructor(_class_: ClassModel, json?: ConstructorModelJson) {
    super();
    if (!_class_._class_) throw new Error(`LuaClass is null: ${_class_.name}`);
    this._class_ = _class_;
    if (_class_) this.create();
    if (json) this.load(json);
  }

  create() {
    if (this._class_._class_) {
      const { _constructor_ } = this._class_._class_;
      if (_constructor_) {
        for (const parameter of _constructor_.parameters) {
          this.parameters.push(new ParameterModel('constructor', parameter));
        }
      }
    }
  }

  load(json: ConstructorModelJson) {
    this.clear();
    if (json.documentation) this.documentation.load(json.documentation);
    if (json.parameters && this._class_._constructor_ && this._class_._class_) {
      const { _constructor_ } = this._class_._class_;
      if (json.parameters.length === _constructor_.parameters.length) {
        for (const parameter of json.parameters) {
          this.parameters.push(new ParameterModel('constructor', parameter));
        }
      } else {
        for (const parameter of _constructor_.parameters) {
          this.parameters.push(new ParameterModel(parameter));
        }
      }
    }
  }

  save(): ConstructorModelJson {
    let parameters: ParameterModelJson[] = undefined;
    let oneParameterChanged = false;
    for (const parameters of this.parameters) {
      if (!parameters.isDefault()) {
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
    let documentation: ModelDocumentationJson = undefined;
    if (!this.documentation.isDefault()) {
      documentation = this.documentation.save();
    }
    return { documentation, parameters };
  }

  clear() {
    this.documentation.clear();
    this.parameters.length = 0;
  }

  generateDoc(prefix: string, _constructor_: LuaConstructor): string {
    if (!_constructor_ || !this.testSignature(_constructor_)) return '';

    const documentation = new DocumentationBuilder();
    const { documentation: constructorDocumentation, parameters } = this;
    if (constructorDocumentation) {
      const { description: constructorDescription } = constructorDocumentation;

      // Process lines. (If defined)
      if (constructorDescription && constructorDescription.length) {
        for (const line of constructorDescription) documentation.appendLine(line);
        documentation.appendLine();
      }

      // Process parameter(s). (If defined)
      if (parameters) {
        for (const parameter of parameters) {
          const { name, documentation: parameterDocumentation } = parameter;

          if (!documentation) {
            documentation.appendParam(name);
            continue;
          } else {
            const { description: parameterDescription } = parameterDocumentation;

            // No lines. Print basic @param <name>
            if (!parameterDescription.length) {
              // documentation.appendParam(name);
              continue;
            }

            documentation.appendParam(name, parameterDescription[0]);

            // Check if multi-line.
            if (parameterDescription.length === 1) continue;
            for (let index = 1; index < parameterDescription.length; index++) {
              documentation.appendLine(parameterDescription[index]);
            }
          }
        }
      }
    }
    return documentation.isEmpty() ? '' : documentation.build(prefix);
  }

  generateDom(): string {
    const { documentation, _class_, parameters } = this;

    let parametersString = '';
    if (this.parameters.length) {
      for (const parameter of this.parameters) {
        parametersString += parameter.generateDom();
      }
    }

    let dom = ConstructorModel.HTML_TEMPLATE;
    dom = replaceAll(dom, '${CLASS_NAME}', _class_.name);
    dom = replaceAll(dom, '${DESCRIPTION}', documentation.description.join('\n'));
    dom = replaceAll(dom, '${HAS_PARAMETERS}', parameters.length ? 'inline-block' : 'none');
    dom = replaceAll(dom, '${PARAMETERS}', parametersString);
    return dom;
  }

  testSignature(_constructor_: LuaMethod): boolean {
    if (_constructor_.parameters.length !== this.parameters.length) return false;
    if (this.parameters.length) {
      for (let index = 0; index < this.parameters.length; index++) {
        if (!this.parameters[index].testSignature(_constructor_.parameters[index])) return false;
      }
    }
    return true;
  }

  getParameterModel(id: string) {
    for (const parameter of this.parameters) if (parameter.id === id) return parameter;
    return null;
  }

  isDefault(): boolean {
    for (const parameter of Object.values(this.parameters)) {
      if (!parameter.isDefault()) return false;
    }
    return this.documentation.isDefault();
  }
}

export type ConstructorModelJson = {
  parameters: ParameterModelJson[];
  documentation: ModelDocumentationJson;
};
