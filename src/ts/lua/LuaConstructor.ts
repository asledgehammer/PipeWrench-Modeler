import { WILDCARD_TYPE } from '../Generator';
import * as ast from '../luaparser/ast';
import { LuaClass } from './LuaClass';
import { LuaField } from './LuaField';
import { LuaLibrary } from './LuaLibrary';
import { LuaMethod } from './LuaMethod';
import { fixParameters, scanBodyForFields } from './LuaUtils';
import { sanitizeName } from './model/ModelUtils';

/**
 * **LuaConstructor**
 *
 * @author JabDoesThings
 */
export class LuaConstructor extends LuaMethod {
  readonly clazz: LuaClass;

  constructor(library: LuaLibrary, clazz: LuaClass, parsed: ast.FunctionDeclaration | ast.AssignmentStatement, params: string[]) {
    super(library, clazz, parsed, 'constructor', params, false);
    this.clazz = clazz;
  }

  protected onCompile(prefix: string): string {
    const { clazz } = this;
    const { library } = this.clazz.file;
    let classModel = this.clazz.model;
    if(!classModel) classModel = library.getClassModel(clazz);
    const constructorModel = classModel ? classModel._constructor_ : null;
    const docs = constructorModel ? constructorModel.generateDoc(prefix, this) : '';

    const compileTypes = (types: string[]): string => {
      let returnS = '';
      if (types && types.length) {
        for (const type of types) {
          if (returnS.length) returnS += ' | ';
          returnS += sanitizeName(type);
        }
      } else {
        returnS = WILDCARD_TYPE;
      }
      return returnS;
    };

    // Compile parameter(s). (If any)
    let paramS = '';
    let params: string[] = [];

    // If the model is present, set param names from it as some params may be renamed.
    if (constructorModel && constructorModel.testSignature(this)) {
      for (const param of constructorModel.params) {
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

    return `${docs.length ? `${docs}\n` : ''}${prefix}constructor(${paramS});`;
  }

  scan() {
    const { parsed, container } = this;
    if (!parsed || !container || container.type !== 'class') return;

    const declaration = parsed as ast.FunctionDeclaration;
    const fieldRefs = scanBodyForFields(declaration.body, this.container.name, [].concat(this.params), true);

    // Grab the name of the returned local table. This is what initial values for fields are set.
    let returnName;
    for (let index = declaration.body.length - 1; index >= 0; index--) {
      const statement = declaration.body[index];
      if (statement.type === 'ReturnStatement') {
        const returnStatement = statement as ast.ReturnStatement;
        returnName = (returnStatement.arguments[0] as ast.Identifier).name;
        break;
      }
    }

    // Go through all local assignments and add the ones matching the returnName as fields to the containser.
    for (const ref of fieldRefs) {
      if (ref.containerName === returnName) {
        const { fieldName } = ref;
        if (!this.container.fields[fieldName]) {
          const field = new LuaField(this.container, ref.fieldName, false);
          container.fields[fieldName] = field;
        }
      }
    }
  }
}
