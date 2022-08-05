import * as ast from '../luaparser/ast';

import { WILDCARD_TYPE } from '../ZomboidGenerator';
import { fixParameters } from './LuaUtils';
import { sanitizeName } from './model/ModelUtils';

import { LuaFile } from './LuaFile';
import { LuaNamedObject } from './LuaNamedObject';

/** @author JabDoesThings */
export class LuaFunction extends LuaNamedObject {
  readonly file: LuaFile;
  readonly name: string;
  readonly parameters: string[];
  readonly isLocal: boolean;
  readonly parsed: ast.FunctionDeclaration | ast.AssignmentStatement;

  constructor(
    file: LuaFile,
    parsed: ast.FunctionDeclaration | ast.AssignmentStatement,
    name: string,
    parameters: string[],
    isLocal: boolean
  ) {
    super(name);
    this.parsed = parsed;
    this.file = file;
    this.parameters = fixParameters(parameters);
    this.isLocal = isLocal;
  }

  generateDocumentation(prefix: string): string {
    const library = this.file.library;
    const model = library.getGlobalFunctionModel(this);
    return model ? model.generateDocumentation(prefix, this) : `${prefix}/** @noSelf */`;
  }

  protected onCompile(prefix: string): string {
    const library = this.file.library;
    let { name } = this;
    const model = library.getGlobalFunctionModel(this);
    let documentationString = this.generateDocumentation(prefix);

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
    if (model) {
      for (const parameter of model.parameters) {
        const types = parameter.types && parameter.types.length ? compileTypes(parameter.types) : WILDCARD_TYPE;
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

    if (model) {
      const { _return_: returns } = model;
      if (returns) {
        wrapWildcardType = returns.wrapWildcardType;
        if (returns.types && returns.types.length) {
          for (const type of returns.types) {
            // Prevent duplicate return types.
            if (returnTypes.indexOf(type) === -1) returnTypes.push(type);
          }
        }
      }
    }

    if (returnTypes.length) {
      returnString = '';
      for (const type of returnTypes) {
        if (returnString.length) returnString += ' | ';
        returnString += sanitizeName(type);
      }
    } else {
      // Default return type.
      returnString = WILDCARD_TYPE;
    }

    let s = '';
    if (documentationString.length) s += `${documentationString}\n`;

    let compiled = `${s}${prefix}export const ${sanitizeName(name)}: `;
    if (wrapWildcardType) compiled += '(';
    compiled += `(${parametersString}) => ${returnString}`;
    if (wrapWildcardType) compiled += `)`;
    
    compiled += ';';

    return compiled;
  }

  generateAPI(prefix: string): string {
    
    // This is the only way I know how to have this not error out. -Jab
    return this.onCompile(prefix);

    // const { name, fullPath } = this;
    // const documentation = this.generateDocumentation(prefix);
    // return `${prefix}${
    //   documentation ? `${documentation}\n` : ''
    // }${prefix}export const ${sanitizeName(name)} = ${fullPath};`;
  }

  generateLuaInterface(prefix: string = ''): string {
    // Compile parameter(s)..
    let parametersString = '(';
    const { name, parameters } = this;
    if (parameters.length) {
      for (let index = 0; index < parameters.length; index++) parametersString += `arg${index},`;
      parametersString = parametersString.substring(0, parametersString.length - 1);
    }
    parametersString += ')';
    // Functions are assigned differently.
    return `${prefix} function Exports.${sanitizeName(
      name
    )}${parametersString} return ${name}${parametersString} end\n`;
  }

  get namespace() {
    return this.file.propertyNamespace;
  }

  get fullPath() {
    const { name } = this;
    return `${this.namespace}.${sanitizeName(name)}`;
  }
}
