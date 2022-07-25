import * as ast from '../luaparser/ast';
import { NamedElement } from './NamedElement';
import { LuaFile } from './LuaFile';
import { fixParameters } from './LuaUtils';
import { FunctionModel } from './model/FunctionModel';

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

  protected onCompile(prefix: string): string {
    
    const library = this.file.library;

    let funcModel: FunctionModel = library.getGlobalFunctionModel(this);
    let sDocs = funcModel ? funcModel.generateDoc(prefix, this) : '';

    const compileTypes = (types: string[]): string => {
      let returnS = '';
      if(types && types.length) {
        for(const type of types) {
          if (returnS.length) returnS += ' | ';
          returnS += type;
        }
      }
      return returnS;
    };

    // Compile parameter(s). (If any)
    let paramS = '';
    let params: string[] = [];

    // If the model is present, set param names from it as some params may be renamed.
    if (funcModel) {
      for (const param of funcModel.params) {
        const types = param.types ? compileTypes(param.types) : 'unknown';
        params.push(`${param.name}: ${types}`);
      }
    } else {
      params = fixParameters(this.params).map((param) => `${param}: unknown`);
    }
    if (params.length) {
      for (const param of params) paramS += `${param}, `;
      paramS = paramS.substring(0, paramS.length - 2);
    }

    // Compile return type(s). (If any)
    let returnS = '';
    let returnTypes: string[] = [];
    let applyUnknownType = true;

    if(funcModel) {
      const { returns } = funcModel;
      if(returns) {
        applyUnknownType = returns.applyUnknownType;
        if(returns.types && returns.types.length) {
          for(const type of returns.types) {
            // Prevent duplicate return types.
            if(returnTypes.indexOf(type) === -1) returnTypes.push(type);
          }
        }
      }
    }

    if(returnTypes.length) {
      returnS = ''
      for(const type of returnTypes) {
        if(returnS.length) returnS += ' | ';
        returnS += type;
      }
    } else {
      // Default return type.
      returnS = 'unknown';
    }

    let s = '';
    if(sDocs.length) s += `${sDocs}\n`;

    let comp = `${s}${prefix}declare const ${this.name}: `;
    if(applyUnknownType) comp += '(';
    comp += `(${paramS}) => ${returnS}`;
    if(applyUnknownType) comp += ') | unknown';
    comp += ';';
    
    return comp;
  }
}
