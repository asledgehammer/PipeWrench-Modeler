import * as fs from 'fs';
import * as parser from 'luaparse';
import * as ast from './ast';

import {
  getDeriveInfo,
  getFunctionDeclaration,
  getMethodDeclaration,
  getMethodDeclarationFromAssignment,
  getProxyInfo,
  getRequireInfo,
  getTableConstructor,
  isFunctionLocal,
  printFunctionInfo,
  printMethodInfo,
  printProxyInfo,
  printRequireInfo,
} from './inspect';
import { LuaClass } from './LuaClass';
import { LuaLibrary } from './LuaLibrary';
import { LuaElement } from './LuaElement';
import { LuaFunction } from './LuaFunction';
import { LuaTable } from './LuaTable';
import { LuaMethod } from './LuaMethod';

const DEBUG = false;

export class LuaFile {
  readonly proxies: { [id: string]: string } = {};
  readonly classes: { [id: string]: LuaClass } = {};
  readonly properties: { [id: string]: LuaElement } = {};
  readonly tables: { [id: string]: LuaTable } = {};
  readonly requires: string[] = [];
  readonly library: LuaLibrary;
  readonly id: string;
  readonly file: string;

  parsed: ast.Chunk;

  constructor(library: LuaLibrary, id: string, file: string) {
    this.library = library;
    this.id = id;
    this.file = file;
  }

  parse() {
    let raw = fs.readFileSync(this.file).toString();
    raw = LuaFile.correctKahluaCode(raw);
    this.parsed = parser.parse(raw, { luaVersion: '5.1' });
    if (this.id.endsWith('luautils')) {
      console.log(this.parsed);
    }
  }

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

  scanGlobalAssignments() {
    const { parsed } = this;

    const processTable = (statement: ast.AssignmentStatement): boolean => {
      const info = getTableConstructor(statement);
      if (!info) return false;
      const table = new LuaTable(this, info.name);
      this.library.tables[info.name] = table;
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

      const clazz = new LuaClass(this, info.subClass, info.superClass);
      this.library.classes[info.subClass] = clazz;
      // console.log(`Adding class: ${clazz.name}`);
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
      const func = new LuaFunction(this, info.name, info.params, info.isLocal);
      this.properties[info.name] = func;
      if (!info.isLocal) {
        this.library.properties[func.name] = func;
        // console.log(`Adding function: ${func.name}`);
      }
      return true;
    };

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

  scan() {
    const { parsed } = this;

    // if (this.id.endsWith('luautils')) {
    //   console.log(parsed);
    // }

    const processMethod = (declaration: ast.FunctionDeclaration, forceStatic: boolean): boolean => {
      const info = getMethodDeclaration(this.id.endsWith('luautils'), declaration);
      if (!info) return false;
      if (forceStatic) info.isStatic = true;
      if (DEBUG) console.log(`\tMethod: ${printMethodInfo(info)}`);

      if (this.proxies[info.className]) {
        if (DEBUG) console.log(`${info.className} -> ${this.proxies[info.className]}`);
        info.className = this.proxies[info.className];
      }

      const clazz = this.library.classes[info.className];
      if (clazz) {
        const func = new LuaMethod(clazz, info.name, info.params, info.isStatic);
        if (!info.isStatic && info.name === 'new') {
          clazz._constructor_ = func;
        } else {
          clazz.methods[info.name] = func;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const func = new LuaMethod(table, info.name, info.params, info.isStatic);
        table.methods[info.name] = func;
        return true;
      }

      // console.warn(`Cannot resolve container for method: \n\t${printMethodInfo(info)}`);
      return true;
    };

    const processMethodFromAssignment = (statement: ast.AssignmentStatement, forceStatic: boolean): boolean => {
      const info = getMethodDeclarationFromAssignment(this.id.endsWith('luautils'), statement);
      if (!info) return false;
      if (forceStatic) info.isStatic = true;
      if (DEBUG) console.log(`\tMethod: ${printMethodInfo(info)}`);

      if (this.proxies[info.className]) {
        if (DEBUG) console.log(`${info.className} -> ${this.proxies[info.className]}`);
        info.className = this.proxies[info.className];
      }

      const clazz = this.library.classes[info.className];
      if (clazz) {
        const func = new LuaMethod(clazz, info.name, info.params, info.isStatic);
        if (!info.isStatic && info.name === 'new') {
          clazz._constructor_ = func;
        } else {
          clazz.methods[info.name] = func;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const func = new LuaMethod(table, info.name, info.params, info.isStatic);
        table.methods[info.name] = func;
        return true;
      }

      // console.warn(`Cannot resolve container for method: \n\t${printMethodInfo(info)}`);
      return true;
    };

    // Scan for class function declarations.
    for (const statement of parsed.body) {
      if (statement.type === 'FunctionDeclaration') {
        if (processMethod(statement, false)) continue;
        else {
          if (!isFunctionLocal(statement)) {
            console.warn(`\tApplying function as global property.`);
            // TODO: Add as property.
          }
        }
      } else if (statement.type === 'AssignmentStatement') {
        if (statement.init.length === 1 && statement.init[0].type === 'FunctionDeclaration') {
          // These assignments can only be static.
          if (processMethodFromAssignment(statement, true)) continue;
        }
      }
    }
    if (DEBUG) console.log('\n');
  }

  /**
   * Corrects lua that compiles in Kahlua2 that breaks Luaparser.
   *
   * @param lua The erroneous Lua code to correct.
   * @returns The fixed lua code.
   */
  private static correctKahluaCode(lua: string): string {
    /**
     * Removes Float symbols from explicit numeric constants in Lua code.
     *
     * @param symbol The numeric symbol to remove.
     * @param trailing The trailing chars where this situation can occur.
     */
    const removeNumericSymbol = (symbol: string, trailing: string[]) => {
      for (const t of trailing) {
        for (let x = 0; x < 10; x++) {
          const to = `${x}${t}`;
          const from = `${x}${symbol}${t}`;
          while (lua.indexOf(from) !== -1) lua = lua.replace(from, to);
        }
      }
    };

    // Luaparser does not like it when break expressions have trailing
    // semi-colons. This removes them.
    while (lua.indexOf('break;') !== -1) {
      lua = lua.replace('break;', 'break ');
    }

    // Remove any Float and Long symbols present in the Lua file.
    removeNumericSymbol('l', [',', ';', ')', ' ']);
    removeNumericSymbol('f', [',', ';', ')', ' ']);

    return lua;
  }
}
