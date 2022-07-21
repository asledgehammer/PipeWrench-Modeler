import { LuaContainer } from './LuaContainer';
import { LuaElement } from './LuaElement';
import * as ast from '../luaparser/ast';
import { LuaField } from './LuaField';
import { LuaLibrary } from './LuaLibrary';
import { scanBodyForFields } from './LuaUtils';

/**
 * **LuaMethod**
 *
 * @author JabDoesThings
 */
export class LuaMethod extends LuaElement {
  readonly library: LuaLibrary;
  readonly container: LuaContainer;
  readonly params: string[];
  readonly isStatic: boolean;
  readonly parsed: ast.FunctionDeclaration | ast.AssignmentStatement;

  constructor(
    library: LuaLibrary,
    container: LuaContainer,
    parsed: ast.FunctionDeclaration | ast.AssignmentStatement,
    name: string,
    params: string[],
    isStatic: boolean
  ) {
    super(name);
    this.library = library;
    this.container = container;
    this.parsed = parsed;
    this.params = params;
    this.isStatic = isStatic;
  }

  scanFields() {
    const D = false; /// this.container.name === 'ISUIElement';

    if (D) {
      let s = '';
      for (const param of this.params) s += `${param}, `;
      console.log(`${this.container.name}.${this.name}(` + s.substring(0, s.length - 2) + ')');
    }

    const { parsed, container } = this;
    if (!parsed || !container || container.type !== 'class') {
      if (D) console.log('SF 1');
      return;
    }

    if (parsed.type === 'FunctionDeclaration') {
      this.scanFieldsAsFunctionDeclaration(parsed as ast.FunctionDeclaration, D);
    } else {
      this.scanFieldAsAssignmentStatement(parsed as ast.AssignmentStatement);
    }
  }

  private scanFieldsAsFunctionDeclaration(declaration: ast.FunctionDeclaration, D: boolean) {
    if (!declaration.body.length) return;

    const fieldRefs = scanBodyForFields(declaration.body, this.container.name, [].concat(this.params));

    if (D && fieldRefs.length) console.log(fieldRefs);

    for ( const ref of fieldRefs) {
      
      const { containerName, fieldName, isStatic } = ref;
      
      let container: LuaContainer = this.library.classes[containerName];
      if (!container) container = this.library.tables[containerName];
      if (!container) continue;

      if (D) console.log(`Field: ${!isStatic ? 'self' : containerName}.${fieldName}`);

      const field = new LuaField(this.container, fieldName, isStatic);
      container.fields[fieldName] = field;
    }

  }

  private scanFieldAsAssignmentStatement(statement: ast.AssignmentStatement) {}
}
