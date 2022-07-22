import { LuaContainer } from './LuaContainer';
import { LuaElement } from './LuaElement';
import * as ast from '../luaparser/ast';
import { LuaField } from './LuaField';
import { LuaLibrary } from './LuaLibrary';
import { fixParameters, sanitizeParameter, scanBodyForFields } from './LuaUtils';
import { Identifier } from 'luaparse';
import { DocBuilder } from '../DocBuilder';

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
    this.params = fixParameters(params);
    this.isStatic = isStatic;
  }

  compile(prefix: string = ''): string {
    
    const doc = new DocBuilder();
    if(this.isStatic) doc.appendLine('@noSelf');
    
    // Compile parameter(s). (If any)
    let paramS = '';
    const { params } = this;
    if (params.length) {
      for (const param of params) paramS += `${param}: unknown, `;
      paramS = paramS.substring(0, paramS.length - 2);
    }

    let s = '';
    if(!doc.isEmpty()) s += `${doc.build(prefix)}\n`;
    return `${s}${prefix}${this.isStatic ? 'static ' : ''}${this.name}: ((${paramS})=>unknown) | unknown;`;
  }

  scanAsConstructor() {
    const D = this.container.name === 'ISUIElement';

    const { parsed, container } = this;
    if (!parsed || !container || container.type !== 'class') {
      return;
    }

    const declaration = parsed as ast.FunctionDeclaration;
    const fieldRefs = scanBodyForFields(declaration.body, this.container.name, [].concat(this.params), true);

    // Grab the name of the returned local table. This is what initial values for fields are set.
    let returnName;
    for (let index = declaration.body.length - 1; index >= 0; index--) {
      const statement = declaration.body[index];
      if (statement.type === 'ReturnStatement') {
        const returnStatement = statement as ast.ReturnStatement;
        returnName = (returnStatement.arguments[0] as Identifier).name;
        break;
      }
    }

    // Go through all local assignments and add the ones matching the returnName as fields to the containser.
    for (const ref of fieldRefs) {
      if (ref.containerName === returnName) {
        const { containerName, fieldName } = ref;
        if (!this.container.fields[fieldName]) {
          const field = new LuaField(this.container, ref.fieldName, false);
          container.fields[fieldName] = field;
        }
      }
    }
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
      return;
    }

    if (parsed.type === 'FunctionDeclaration') {
      this.scanFieldsAsFunctionDeclaration(parsed as ast.FunctionDeclaration, D);
    }
  }

  private scanFieldsAsFunctionDeclaration(declaration: ast.FunctionDeclaration, D: boolean) {
    if (!declaration.body.length) return;

    const fieldRefs = scanBodyForFields(declaration.body, this.container.name, [].concat(this.params));

    if (D && fieldRefs.length) console.log(fieldRefs);

    for (const ref of fieldRefs) {
      const { containerName, fieldName, isStatic } = ref;

      let container: LuaContainer = this.library.classes[containerName];
      if (!container) container = this.library.tables[containerName];
      if (!container) continue;

      if (D) console.log(`Field: ${!isStatic ? 'self' : containerName}.${fieldName}`);

      const field = new LuaField(this.container, fieldName, isStatic);
      container.fields[fieldName] = field;
    }
  }
}
