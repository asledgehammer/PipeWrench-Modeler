import { LuaElement } from './LuaElement';
import { LuaFile } from './LuaFile';
import * as ast from '../luaparser/ast';
import { fixParameters } from './LuaUtils';
import { DocBuilder } from '../DocBuilder';

/**
 * **LuaFunction**
 *
 * @author JabDoesThings
 */
export class LuaFunction extends LuaElement {
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

  compile(prefix: string = ''): string {

    const doc = new DocBuilder();
    if(!this.isLocal) doc.appendAnnotation('noSelf');

    // Compile parameter(s). (If any)
    let paramS = '';
    const { params } = this;
    if (params.length) {
      for (const param of params) paramS += `${param}: unknown, `;
      paramS = paramS.substring(0, paramS.length - 2);
    }

    let s = '';
    if(!doc.isEmpty()) s += `${doc.build(prefix)}\n`;
    return `${s}${prefix}declare const ${this.name}: ((${paramS})=>unknown) | unknown;`;
  }
}
