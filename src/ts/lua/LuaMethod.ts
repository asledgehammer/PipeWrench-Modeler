import * as ast from '../luaparser/ast';
import { LuaContainer } from './LuaContainer';
import { NamedElement } from './NamedElement';
import { LuaField } from './LuaField';
import { LuaLibrary } from './LuaLibrary';
import { fixParameters, scanBodyForFields } from './LuaUtils';
import { LuaClass } from './LuaClass';
import { LuaTable } from './LuaTable';
import { MethodModel } from './model/MethodModel';

/**
 * **LuaMethod**
 *
 * @author JabDoesThings
 */
export class LuaMethod extends NamedElement {
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

  protected onCompile(prefix: string): string {
    
    let sDocs = '';
    let methodModel: MethodModel = null;
    
    const { container, library } = this;
    if(container instanceof LuaClass) {
      const classModel = library.getClassModel(container);
      methodModel = classModel ? classModel.getMethod(this) : null;
      sDocs = methodModel ? methodModel.generateDoc(prefix, this) : '';
    } else if(container instanceof LuaTable) {
      const tableModel = library.getTableModel(container);
      methodModel = tableModel ? tableModel.getMethod(this) : null;
      sDocs = methodModel ? methodModel.generateDoc(prefix, this) : '';
    }

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
    if (methodModel) {
      for (const param of methodModel.params) {
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

    if(methodModel) {
      const { returns } = methodModel;
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

    let comp = `${s}${prefix}${this.isStatic ? 'static ' : ''}${this.name}: `;
    if(applyUnknownType) comp += '(';
    comp += `(${paramS}) => ${returnS}`;
    if(applyUnknownType) comp += ') | unknown';
    comp += ';';
    
    return comp;

    // return `${s}${prefix}${this.isStatic ? 'static ' : ''}${this.name}: ((${paramS})=>unknown) | unknown;`;
  }

  scanFields() {
    const { parsed, container } = this;
    if (!parsed || !container || container.type !== 'class') {
      return;
    }

    if (parsed.type === 'FunctionDeclaration') {
      this.scanFieldsAsFunctionDeclaration(parsed as ast.FunctionDeclaration);
    }
  }

  private scanFieldsAsFunctionDeclaration(declaration: ast.FunctionDeclaration) {
    if (!declaration.body.length) return;

    const fieldRefs = scanBodyForFields(declaration.body, this.container.name, [].concat(this.params));

    for (const ref of fieldRefs) {
      const { containerName, fieldName, isStatic } = ref;

      let container: LuaContainer = this.library.classes[containerName];
      if (!container) container = this.library.tables[containerName];
      if (!container) continue;

      const field = new LuaField(this.container, fieldName, isStatic);
      container.fields[fieldName] = field;
    }
  }
}
