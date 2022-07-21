import * as fs from 'fs';
import * as parser from 'luaparse';
import * as ast from '../luaparser/ast';
import { LuaClass } from './LuaClass';
import { LuaLibrary } from './LuaLibrary';
import { LuaElement } from './LuaElement';
import { LuaFunction } from './LuaFunction';
import { LuaTable } from './LuaTable';
import { LuaMethod } from './LuaMethod';

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
  isFunctionLocal,
  printFunctionInfo,
  printMethodInfo,
  printProxyInfo,
  printRequireInfo,
} from './LuaUtils';

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

  /** All properties discovered in the file. (Fields) */
  readonly properties: { [id: string]: LuaElement } = {};

  /** All tables discovered in the file. */
  readonly tables: { [id: string]: LuaTable } = {};

  /** All requires in the file. (Used for dependency chains) */
  readonly requires: string[] = [];

  /** The library storing all discovered Lua. */
  readonly library: LuaLibrary;

  /** The `require(..) / require '..'` path to the file. */
  readonly id: string;

  /** The path to the file on the disk. */
  readonly file: string;

  /** The parsed chunk provided by LuaParse. */
  parsed: ast.Chunk;

  /**
   * @param library The library storing all discovered Lua.
   * @param id The `require(..) / require '..'` path to the file.
   * @param file The path to the file on the disk.
   */
  constructor(library: LuaLibrary, id: string, file: string) {
    this.library = library;
    this.id = id;
    this.file = file;
  }

  /**
   * Cleans & parses Lua in the file using LuaParse.
   */
  parse() {
    let raw = fs.readFileSync(this.file).toString();
    raw = correctKahluaCode(raw);
    this.parsed = parser.parse(raw, { luaVersion: '5.1' });
    if (this.id.endsWith('ISUIElement')) {
      console.log(this.parsed);
    }
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
      const func = new LuaFunction(this, declaration, info.name, info.params, info.isLocal);
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

  /**
   * Ran third, scans for elements assigned to global elements like methods and static 
   * functions | properties.
   */
  scanMembers() {
    const { parsed } = this;

    // if (this.id.endsWith('luautils')) {
    //   console.log(parsed);
    // }

    const processMethod = (declaration: ast.FunctionDeclaration): boolean => {
      const info = getMethodDeclaration(this.id.endsWith('luautils'), declaration);
      if (!info) return false;
      if (DEBUG) console.log(`\tMethod: ${printMethodInfo(info)}`);

      if (this.proxies[info.className]) {
        if (DEBUG) console.log(`${info.className} -> ${this.proxies[info.className]}`);
        info.className = this.proxies[info.className];
      }

      const clazz = this.library.classes[info.className];
      if (clazz) {
        const func = new LuaMethod(clazz, declaration, info.name, info.params, info.isStatic);
        if (!info.isStatic && info.name === 'new') {
          clazz._constructor_ = func;
        } else {
          clazz.methods[info.name] = func;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const func = new LuaMethod(table, declaration, info.name, info.params, info.isStatic);
        table.methods[info.name] = func;
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

      const clazz = this.library.classes[info.className];
      if (clazz) {
        const func = new LuaMethod(clazz, statement, info.name, info.params, info.isStatic);
        if (!info.isStatic && info.name === 'new') {
          clazz._constructor_ = func;
        } else {
          clazz.methods[info.name] = func;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const func = new LuaMethod(table, statement, info.name, info.params, info.isStatic);
        table.methods[info.name] = func;
        return true;
      }

      // console.warn(`Cannot resolve container for method: \n\t${printMethodInfo(info)}`);
      return true;
    };

    // Scan for class function declarations.
    for (const statement of parsed.body) {
      if (statement.type === 'FunctionDeclaration') {
        if (processMethod(statement)) continue;
        else {
          if (!isFunctionLocal(statement)) {
            console.warn(`\tApplying function as global property.`);
            // TODO: Add as property.
          }
        }
      } else if (statement.type === 'AssignmentStatement') {
        if (statement.init.length === 1 && statement.init[0].type === 'FunctionDeclaration') {
          // These assignments can only be static.
          if (processMethodFromAssignment(statement)) continue;
        }
      }
    }
    if (DEBUG) console.log('\n');
  }
}
