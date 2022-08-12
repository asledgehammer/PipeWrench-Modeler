import * as fs from 'fs';
import * as parser from 'luaparse';
import * as ast from '../luaparser/ast';

import { wrapModule } from '../Utils';
import {
  correctKahluaCode,
  DEBUG,
  getDeriveInfo,
  getFunctionDeclaration,
  getMethodDeclaration,
  getMethodDeclarationFromAssignment,
  getProxyInfo,
  getRequireInfo,
  getTableConstructor,
  printFunctionInfo,
  printMethodInfo,
  printProxyInfo,
  printRequireInfo,
} from './LuaUtils';

import { ZomboidGenerator } from '../ZomboidGenerator';

import { LuaLibrary } from './LuaLibrary';
import { LuaClass } from './LuaClass';
import { LuaTable } from './LuaTable';
import { LuaFunction } from './LuaFunction';
import { LuaField } from './LuaField';
import { LuaMethod } from './LuaMethod';
import { LuaConstructor } from './LuaConstructor';

/**
 * **LuaFile** loads, parses, and processes Lua code stored in files.
 *
 * @author JabDoesThings
 */
export class LuaFile {
  /** All proxy assigners discovered in the file. */
  readonly proxies: { [id: string]: string } = {};

  /** All pseudo-classes discovered in the file. */
  readonly classes: { [id: string]: LuaClass } = {};

  /** All tables discovered in the file. */
  readonly tables: { [id: string]: LuaTable } = {};

  globalFields: { [id: string]: LuaField } = {};
  globalFunctions: { [id: string]: LuaFunction } = {};

  /** All requires in the file. (Used for dependency chains) */
  readonly requires: string[] = [];

  /** The library storing all discovered Lua. */
  readonly library: LuaLibrary;

  /** The `require(..) / require '..'` path to the file. */
  readonly id: string;

  /** The path to the file on the disk. */
  readonly file: string;

  /** Used to export on generation. */
  readonly fileLocal: string;
  readonly folder: string;
  readonly containerNamespace: string;
  readonly propertyNamespace: string;

  /** The parsed chunk provided by LuaParse. */
  parsed: ast.Chunk;

  /**
   * @param library The library storing all discovered Lua.
   * @param id The `require(..) / require '..'` path to the file.
   * @param file The path to the file on the disk.
   * @param luapath The path to the zomboid lua directory on the disk.
   */
  constructor(library: LuaLibrary, id: string, file: string, luapath: string) {
    this.library = library;
    this.id = id;
    this.file = file;
    this.fileLocal = file.replace(luapath, '');
    // console.log("luapath:", luapath)
    // console.log("id:", this.id)
    // console.log("file:", this.file)
    // console.log("fileLocal:", this.fileLocal)
    let split = this.fileLocal.split('/');
    split.pop();
    this.folder = split.join('/');
    // console.log("folder:", this.folder)
    // console.log("-----------------------")
    split = this.fileLocal.split('.');
    split.pop();
    this.containerNamespace = `lua.${this.folder.split('/').join('.')}`.replaceAll('..', '.');
    this.propertyNamespace = `lua.${split.join('.').split('/').join('.')}`.replaceAll('..', '.');
  }

  /**
   * Cleans & parses Lua in the file using LuaParse.
   */
  parse() {
    let raw = fs.readFileSync(this.file).toString();
    raw = correctKahluaCode(raw);
    this.parsed = parser.parse(raw, { luaVersion: '5.1' });
  }

  /**
   * Ran first, scans for all `require(..) | require '..'` call-statements in the file.
   * These statements are used for generating dependency-chains for all files in the
   * library.
   */
  scanRequires() {
    const processRequire = (statement: ast.CallStatement): boolean => {
      const info = getRequireInfo(statement);
      if (!info) return false;
      if (DEBUG) printRequireInfo(info);
      const { path } = info;
      if (this.requires.indexOf(path) === -1) {
        this.requires.push(path);
      }
      return true;
    };
    for (const statement of this.parsed.body) {
      if (statement.type === 'CallStatement') {
        if (processRequire(statement)) continue;
      }
    }
  }

  /**
   * Ran second, scans and discovers global functions, global pseudo-classes, and proxy
   * assignments to discovered elements in the file.
   */
  scanGlobals() {
    const { parsed } = this;

    const localVars: string[] = [];

    const processTable = (statement: ast.AssignmentStatement): boolean => {
      const info = getTableConstructor(statement);
      if (!info) return false;

      // Double-check if reused local tables are being reassigned. Ignore these.
      if (localVars.indexOf(info.name) !== -1) return false;

      // Make sure that the root class isn't rendered as a table.
      if (info.name === 'ISBaseObject') {
        this.classes['ISBaseObject'] = this.library.classes['ISBaseObject'];
        return false;
      }
      const table = new LuaTable(this, info.name);
      this.tables[info.name] = this.library.tables[info.name] = table;
      // console.log(`Adding table: ${table.name}`);
      return true;
    };

    const processDerive = (statement: ast.AssignmentStatement): boolean => {
      const info = getDeriveInfo(statement);
      if (!info) return false;

      if (info.subClass === 'ISBaseObject') {
        this.library.classes['ISBaseObject'].file = this;
        return true;
      }

      const _class_ = new LuaClass(this, info.subClass, info.superClass);
      this.classes[info.subClass] = this.library.classes[info.subClass] = _class_;
      // console.log(`Adding class: ${_class_.name}`);
      return true;
    };

    const processLocalProxy = (statement: ast.LocalStatement): boolean => {
      const info = getProxyInfo(statement);
      if (!info) return false;
      if (DEBUG) printProxyInfo(info);
      // Check to make sure a class exists for the proxy.
      if (!this.library.classes[info.target]) return false;
      this.proxies[info.proxy] = info.target;
      return true;
    };

    const processFunction = (declaration: ast.FunctionDeclaration): boolean => {
      const info = getFunctionDeclaration(declaration);
      if (!info) return false;
      if (DEBUG) printFunctionInfo(info);
      const _function_ = new LuaFunction(this, declaration, info.name, info.parameters, info.isLocal);
      this.globalFunctions[info.name] = _function_;
      if (!info.isLocal) {
        this.globalFunctions[_function_.name] = this.library.globalFunctions[_function_.name] = _function_;
      }
      return true;
    };

    // Scan for local vars.
    for (const statement of parsed.body) {
      if (statement.type === 'LocalStatement') {
        localVars.push((statement.variables[0] as ast.Identifier).name);
      }
    }

    // Scan for explicit class declaractions.
    for (const statement of parsed.body) {
      if (statement.type === 'AssignmentStatement') {
        if (processDerive(statement)) continue;
        else if (processTable(statement)) continue;
      } else if (statement.type === 'FunctionDeclaration') {
        if (processFunction(statement)) continue;
      }
    }

    // Scan for local references to class declarations.
    for (const statement of parsed.body) {
      if (statement.type === 'LocalStatement') {
        if (processLocalProxy(statement)) continue;
      }
    }
  }

  /**
   * Ran third, scans for elements assigned to global elements like methods and static
   * functions | properties.
   */
  scanMembers() {
    const { parsed } = this;

    const processMethod = (declaration: ast.FunctionDeclaration): boolean => {
      const info = getMethodDeclaration(this.id.endsWith('luautils'), declaration);
      if (!info) return false;
      if (DEBUG) console.log(`\tMethod: ${printMethodInfo(info)}`);

      if (this.proxies[info.className]) {
        if (DEBUG) console.log(`${info.className} -> ${this.proxies[info.className]}`);
        info.className = this.proxies[info.className];
      }

      const _class_ = this.library.classes[info.className];
      if (_class_) {
        if (!info.isStatic && info.name === 'new') {
          const _constructor_ = new LuaConstructor(this.library, _class_, declaration, info.parameters);
          _class_._constructor_ = _constructor_;
        } else {
          const method = new LuaMethod(
            this.library,
            _class_,
            declaration,
            info.name,
            info.parameters,
            info.isStatic
          );
          _class_.methods[info.name] = method;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const method = new LuaMethod(
          this.library,
          table,
          declaration,
          info.name,
          info.parameters,
          info.isStatic
        );
        table.methods[info.name] = method;
        return true;
      }

      // console.warn(`Cannot resolve container for method: \n\t${printMethodInfo(info)}`);
      return true;
    };

    const processMethodFromAssignment = (statement: ast.AssignmentStatement): boolean => {
      const info = getMethodDeclarationFromAssignment(this.id.endsWith('luautils'), statement);
      if (!info) return false;
      if (DEBUG) console.log(`\tMethod: ${printMethodInfo(info)}`);

      if (this.proxies[info.className]) {
        if (DEBUG) console.log(`${info.className} -> ${this.proxies[info.className]}`);
        info.className = this.proxies[info.className];
      }

      const _class_ = this.library.classes[info.className];
      if (_class_) {
        if (!info.isStatic && info.name === 'new') {
          const _constructor_ = new LuaConstructor(this.library, _class_, statement, info.parameters);
          _class_._constructor_ = _constructor_;
        } else {
          const method = new LuaMethod(
            this.library,
            _class_,
            statement,
            info.name,
            info.parameters,
            info.isStatic
          );
          _class_.methods[info.name] = method;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const method = new LuaMethod(
          this.library,
          table,
          statement,
          info.name,
          info.parameters,
          info.isStatic
        );
        table.methods[info.name] = method;
        return true;
      }

      // console.warn(`Cannot resolve container for method: \n\t${printMethodInfo(info)}`);
      return true;
    };

    // Scan for class function declarations.
    for (const statement of parsed.body) {
      if (statement.type === 'FunctionDeclaration') {
        if (processMethod(statement)) continue;

        const info = getFunctionDeclaration(statement);
        if (!info || info.isLocal || info.name === 'new' || info.name === 'toString') continue;
        // console.log(`Global function: ${info.name}`);
        const _function_ = new LuaFunction(this, statement, info.name, info.parameters, info.isLocal);
        this.library.globalFunctions[_function_.name] = _function_;
      } else if (statement.type === 'AssignmentStatement') {
        if (statement.init.length === 1) {
          const init = statement.init[0];
          if (init.type === 'FunctionDeclaration') {
            // These assignments can only be static.
            if (processMethodFromAssignment(statement)) continue;
          }
        }
      }
    }
    if (DEBUG) console.log('\n');
  }

  generateDefinitionFile(moduleName: string): string {
    const { classes, tables, globalFields: fields, globalFunctions: functions } = this;
    const classNames = Object.keys(classes).sort((o1, o2) => o1.localeCompare(o2));
    const tableNames = Object.keys(tables).sort((o1, o2) => o1.localeCompare(o2));
    const fieldNames = Object.keys(fields).sort((o1, o2) => o1.localeCompare(o2));
    const funcNames = Object.keys(functions).sort((o1, o2) => o1.localeCompare(o2));
    let code = `  export namespace ${this.containerNamespace} {\n`;
    for (const className of classNames) code += `${classes[className].compile('    ')}\n\n`;
    for (const tableName of tableNames) code += `${tables[tableName].compile('    ')}\n\n`;
    code += '  }\n';
    code += `  export namespace ${this.propertyNamespace} {\n`;
    for (const fieldName of fieldNames) code += `${fields[fieldName].compile('  ')}\n\n`;
    for (const functionName of funcNames) {
      // Not sure why these two would exist in the global scope.
      if (functionName === 'new' || functionName === 'toString') continue;
      const _function_ = functions[functionName];
      if (_function_.isLocal) continue;
      code += `${_function_.compile('  ')}\n\n`;
    }
    code += '}\n';
    code = wrapModule(moduleName, this.fileLocal, this.containerNamespace, code);
    return code;
  }

  generateLuaInterface(prefix: string = '') {
    const { classes, tables, globalFields: fields, globalFunctions: funcs } = this;
    const classNames = Object.keys(classes).sort((o1, o2) => o1.localeCompare(o2));
    const tableNames = Object.keys(tables).sort((o1, o2) => o1.localeCompare(o2));
    const fieldNames = Object.keys(fields).sort((o1, o2) => o1.localeCompare(o2));
    const funcionNames = Object.keys(funcs).sort((o1, o2) => o1.localeCompare(o2));
    if (!classNames.length && !tableNames.length && !fieldNames.length && !funcionNames.length) {
      return '';
    }
    let code = `--[${this.fileLocal.replace('.lua', '.d.ts')}]\n`;
    if (classNames.length) {
      for (const className of classNames) code += classes[className].generateLuaInterface(prefix);
    }
    if (tableNames.length) {
      for (const tableName of tableNames) code += tables[tableName].generateLuaInterface(prefix);
    }
    if (fieldNames.length) {
      for (const fieldName of fieldNames) code += fields[fieldName].generateLua(prefix);
    }
    if (funcionNames.length) {
      for (const functionName of funcionNames) funcs[functionName].generateLuaInterface(prefix);
    }
    return code;
  }

  generateAPI(partial: string): string {
    const { classes, tables, globalFields: fields, globalFunctions: functions } = this;
    const classNames = Object.keys(classes).sort((o1, o2) => o1.localeCompare(o2));
    const tableNames = Object.keys(tables).sort((o1, o2) => o1.localeCompare(o2));
    const fieldNames = Object.keys(fields).sort((o1, o2) => o1.localeCompare(o2));
    const functionNames = Object.keys(functions).sort((o1, o2) => o1.localeCompare(o2));
    if (!classNames.length && !tableNames.length && !fieldNames.length && !functionNames.length) {
      return '';
    }
    let code = `// [${this.fileLocal.replace('.lua', '.d.ts')}]\n`;
    for (const className of classNames) code += `${classes[className].generateAPI(partial)}\n`;
    for (const tableName of tableNames) code += `${tables[tableName].generateAPI(partial)}\n`;
    for (const fieldName of fieldNames) code += `${fields[fieldName].generateAPI(partial, this)}\n`;
    for (const functionName of functionNames) {
      const _function_ = functions[functionName];

      // Only render global functions for the API.
      if (_function_.isLocal) continue;

      // Not sure why these two would exist in the global scope.
      if (functionName === 'new' || functionName === 'toString') continue;

      // Avoid duplicate global functions.
      if (ZomboidGenerator.FUNCTION_CACHE.indexOf(functionName) !== -1) continue;
      ZomboidGenerator.FUNCTION_CACHE.push(functionName);

      code += `${_function_.generateAPI(partial)}\n`;
    }
    return code;
  }
}
