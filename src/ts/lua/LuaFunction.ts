import * as ast from '../luaparser/ast';
import { NamedElement } from './NamedElement';
import { LuaFile } from './LuaFile';
import { fixParameters } from './LuaUtils';
import { FunctionModel } from './model/FunctionModel';
import { WILDCARD_TYPE } from '../Generator';
import { sanitizeName } from './model/ModelUtils';

/**
 * **LuaFunction**
 *
 * @author JabDoesThings
 */
export class LuaFunction extends NamedElement {
  readonly file: LuaFile;
  readonly name: string;
  readonly params: string[];
  readonly isLocal: boolean;
  readonly parsed: ast.FunctionDeclaration | ast.AssignmentStatement;
  model: FunctionModel;

  constructor(
    file: LuaFile,
    parsed: ast.FunctionDeclaration | ast.AssignmentStatement,
    name: string,
    params: string[],
    isLocal: boolean
  ) {
    super(name);
    this.parsed = parsed;
    this.file = file;
    this.params = fixParameters(params);
    this.isLocal = isLocal;
  }

  generateDoc(prefix: string): string {
    const library = this.file.library;
    let { model } = this;
    if (!model) model = library.getGlobalFunctionModel(this);
    return model ? model.generateDoc(prefix, this) : `${prefix}/** @noSelf */`;
  }

  protected onCompile(prefix: string): string {
    const library = this.file.library;
    let { name, model } = this;
    if (!model) model = library.getGlobalFunctionModel(this);
    let sDocs = this.generateDoc(prefix);

    const compileTypes = (types: string[]): string => {
      let returnS = '';
      if (types && types.length) {
        for (const type of types) {
          if (returnS.length) returnS += ' | ';
          returnS += sanitizeName(type);
        }
      }
      return returnS;
    };

    // Compile parameter(s). (If any)
    let paramS = '';
    let params: string[] = [];

    // If the model is present, set param names from it as some params may be renamed.
    if (model) {
      for (const param of model.params) {
        const types = param.types && param.types.length ? compileTypes(param.types) : WILDCARD_TYPE;
        params.push(`${param.name}: ${types}`);
      }
    } else {
      params = fixParameters(this.params).map((param) => `${param}: ${WILDCARD_TYPE}`);
    }
    if (params.length) {
      for (const param of params) paramS += `${param}, `;
      paramS = paramS.substring(0, paramS.length - 2);
    }

    // Compile return type(s). (If any)
    let returnS = '';
    let returnTypes: string[] = [];
    let applyUnknownType = true;

    if (model) {
      const { returns } = model;
      if (returns) {
        applyUnknownType = returns.applyUnknownType;
        if (returns.types && returns.types.length) {
          for (const type of returns.types) {
            // Prevent duplicate return types.
            if (returnTypes.indexOf(type) === -1) returnTypes.push(type);
          }
        }
      }
    }

    if (returnTypes.length) {
      returnS = '';
      for (const type of returnTypes) {
        if (returnS.length) returnS += ' | ';
        returnS += sanitizeName(type);
      }
    } else {
      // Default return type.
      returnS = WILDCARD_TYPE;
    }

    let s = '';
    if (sDocs.length) s += `${sDocs}\n`;

    let comp = `${s}${prefix}export const ${sanitizeName(name)}: `;
    if (applyUnknownType) comp += '(';
    comp += `(${paramS}) => ${returnS}`;
    if (applyUnknownType) comp += `) | ${WILDCARD_TYPE}`;
    comp += ';';

    return comp;
  }

  generateAPI(prefix: string): string {
    const { name, fullPath } = this;
    const doc = this.generateDoc(prefix);
    return `${prefix}${doc ? `${doc}\n` : ''}${prefix}export const ${sanitizeName(name)} = ${fullPath};`;
  }

  generateLua(prefix: string = ''): string {
    // Compile params.
    let paramsS = '(';
    const { name, params } = this;
    if(params.length) {
      for (let index = 0; index < params.length; index++) paramsS += `arg${index},`;
      paramsS = paramsS.substring(0, paramsS.length - 1);
    }
    paramsS += ')';
    // Functions are assigned differently.
    return `function Exports.${sanitizeName(name)}${paramsS} return ${name}${paramsS} end\n`;
  }

  get namespace() {
    return this.file.fieldFuncNamespace;
  }

  get fullPath() {
    const { name } = this;
    return `${this.namespace}.${sanitizeName(name)}`;
  }
}
