import * as ast from '../luaparser/ast';

import { sanitizeName } from './model/ModelUtils';
import { WILDCARD_TYPE } from '../ZomboidGenerator';
import { fixParameters, scanBodyForFields } from './LuaUtils';
import { LuaNamedObject } from './LuaNamedObject';

import { LuaLibrary } from './LuaLibrary';
import { LuaContainer } from './LuaContainer';
import { LuaClass } from './LuaClass';
import { LuaTable } from './LuaTable';
import { LuaField } from './LuaField';

import { MethodModel } from './model/MethodModel';

/** @author JabDoesThings */
export class LuaMethod extends LuaNamedObject {
  readonly library: LuaLibrary;
  readonly container: LuaContainer;
  readonly parameters: string[];
  readonly isStatic: boolean;
  readonly parsed: ast.FunctionDeclaration | ast.AssignmentStatement;

  constructor(
    library: LuaLibrary,
    container: LuaContainer,
    parsed: ast.FunctionDeclaration | ast.AssignmentStatement,
    name: string,
    parameters: string[],
    isStatic: boolean
  ) {
    super(name);
    this.library = library;
    this.container = container;
    this.parsed = parsed;
    this.parameters = fixParameters(parameters);
    this.isStatic = isStatic;
  }

  protected onCompile(prefix: string): string {
    const { container, library } = this;
    let documentationString = '';
    let methodModel: MethodModel = null;

    if (container instanceof LuaClass) {
      const classModel = library.getClassModel(container);
      methodModel = classModel ? classModel.getMethodModel(this) : null;
      documentationString = methodModel ? methodModel.generateDocumentation(prefix, this) : '';
    } else if (container instanceof LuaTable) {
      const tableModel = library.getTableModel(container);
      methodModel = tableModel ? tableModel.getMethodModel(this) : null;
      documentationString = methodModel ? methodModel.generateDocumentation(prefix, this) : '';
    }

    const compileTypes = (types: string[]): string => {
      let returnString = '';
      if (types && types.length) {
        for (const type of types) {
          if (returnString.length) returnString += ' | ';
          returnString += sanitizeName(type);
        }
      }
      return returnString;
    };

    // Compile parameter(s). (If any)
    let parametersString = '';
    let parameters: string[] = [];

    // If the model is present, set parameter names from it as some parameters may be renamed.
    if (methodModel) {
      for (const parameter of methodModel.parameters) {
        const types =
          parameter.types && parameter.types.length ? compileTypes(parameter.types) : WILDCARD_TYPE;
        parameters.push(`${parameter.name}: ${types}`);
      }
    } else {
      parameters = fixParameters(this.parameters).map((param) => `${param}: ${WILDCARD_TYPE}`);
    }
    if (parameters.length) {
      for (const parameter of parameters) parametersString += `${parameter}, `;
      parametersString = parametersString.substring(0, parametersString.length - 2);
    }

    // Compile return type(s). (If any)
    let returnString = '';
    let returnTypes: string[] = [];
    let wrapWildcardType = true;

    if (methodModel) {
      const { _return_ } = methodModel;
      if (_return_) {
        wrapWildcardType = _return_.wrapWildcardType;
        if (_return_.types && _return_.types.length) {
          for (const type of _return_.types) {
            // Prevent duplicate return types.
            if (returnTypes.indexOf(type) === -1) returnTypes.push(sanitizeName(type));
          }
        }
      }
    }

    if (returnTypes.length) {
      returnString = '';
      for (const type of returnTypes) {
        if (returnString.length) returnString += ' | ';
        returnString += type;
      }
    } else {
      // Default return type.
      returnString = WILDCARD_TYPE;
    }

    let s = '';
    if (documentationString.length) s += `${documentationString}\n`;

    let compiled = `${s}${prefix}${this.isStatic ? 'static ' : ''}${this.name}: `;
    if (wrapWildcardType) compiled += '(';
    compiled += `(${parametersString}) => ${returnString}`;
    if (wrapWildcardType) compiled += `) | ${WILDCARD_TYPE}`;
    compiled += ';';

    return compiled;
  }

  scanFields() {
    const { parsed, container } = this;
    if (!parsed || !container || container.type !== 'class') {
      return;
    }

    if (parsed.type === 'FunctionDeclaration') {
      this.scanFieldsAsFunctionDeclaration(parsed as ast.FunctionDeclaration);
    }
  }

  private scanFieldsAsFunctionDeclaration(declaration: ast.FunctionDeclaration) {
    if (!declaration.body.length) return;

    const fieldReferences = scanBodyForFields(
      declaration.body,
      this.container.name,
      [].concat(this.parameters)
    );

    for (const reference of fieldReferences) {
      const { containerName, fieldName, isStatic } = reference;

      let container: LuaContainer = this.library.classes[containerName];
      if (!container) container = this.library.tables[containerName];
      if (!container) continue;

      const field = new LuaField(this.container, fieldName, isStatic);
      container.fields[fieldName] = field;
    }
  }
}
