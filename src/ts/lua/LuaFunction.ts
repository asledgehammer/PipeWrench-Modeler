import { LuaElement } from './LuaElement';
import { LuaFile } from './LuaFile';
import * as ast from '../luaparser/ast';

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
    this.params = params;
    this.isLocal = isLocal;
  }
}
