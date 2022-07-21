import { LuaContainer } from './LuaContainer';
import { LuaElement } from './LuaElement';
import * as ast from '../luaparser/ast';

/**
 * **LuaMethod**
 *
 * @author JabDoesThings
 */
export class LuaMethod extends LuaElement {
  readonly container: LuaContainer;
  readonly params: string[];
  readonly isStatic: boolean;
  readonly parsed: ast.FunctionDeclaration | ast.AssignmentStatement;

  constructor(
    container: LuaContainer,
    parsed: ast.FunctionDeclaration | ast.AssignmentStatement,
    name: string,
    params: string[],
    isStatic: boolean
  ) {
    super(name);
    this.container = container;
    this.parsed = parsed;
    this.params = params;
    this.isStatic = isStatic;
  }
}
