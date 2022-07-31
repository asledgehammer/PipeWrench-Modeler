import { WILDCARD_TYPE } from '../ZomboidGenerator';
import * as ast from '../luaparser/ast';
import { LuaClass } from './LuaClass';
import { LuaField } from './LuaField';
import { LuaLibrary } from './LuaLibrary';
import { LuaMethod } from './LuaMethod';
import { fixParameters, scanBodyForFields } from './LuaUtils';
import { sanitizeName } from './model/ModelUtils';

/** @author JabDoesThings */
export class LuaConstructor extends LuaMethod {
  readonly _class_: LuaClass;

  constructor(
    library: LuaLibrary,
    _class_: LuaClass,
    parsed: ast.FunctionDeclaration | ast.AssignmentStatement,
    parameters: string[]
  ) {
    super(library, _class_, parsed, 'constructor', parameters, false);
    this._class_ = _class_;
  }

  protected onCompile(prefix: string): string {
    const { _class_ } = this;
    const { library } = _class_.file;
    let classModel = library.getClassModel(_class_);
    if (!classModel) classModel = library.getClassModel(_class_);
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
    let parametersString = '';
    let parameters: string[] = [];

    // If the model is present, set parameter names from it as some parameters may be renamed.
    if (constructorModel && constructorModel.testSignature(this)) {
      for (const parameter of constructorModel.parameters) {
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

    return `${docs.length ? `${docs}\n` : ''}${prefix}constructor(${parametersString});`;
  }

  scan() {
    const { parsed, container } = this;
    if (!parsed || !container || container.type !== 'class') return;

    const declaration = parsed as ast.FunctionDeclaration;
    const fieldRefs = scanBodyForFields(
      declaration.body,
      this.container.name,
      [].concat(this.parameters),
      true
    );

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
