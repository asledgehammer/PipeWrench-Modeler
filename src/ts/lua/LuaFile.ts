import * as fs from 'fs';
import * as parser from 'luaparse';
import * as prettier from 'prettier';
import * as ast from '../luaparser/ast';
import { LuaClass } from './LuaClass';
import { LuaConstructor } from './LuaConstructor';
import { LuaLibrary } from './LuaLibrary';
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
  printFunctionInfo,
  printMethodInfo,
  printProxyInfo,
  printRequireInfo,
} from './LuaUtils';
import { LuaField } from './LuaField';
import { DocBuilder } from '../DocBuilder';

const LICENSE = [
  'MIT License',
  '',
  'Copyright (c) $YEAR$ JabDoesThings',
  '',
  'Permission is hereby granted, free of charge, to any person obtaining a copy',
  'of this software and associated documentation files (the "Software"), to deal',
  'in the Software without restriction, including without limitation the rights',
  'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
  'copies of the Software, and to permit persons to whom the Software is',
  'furnished to do so, subject to the following conditions:',
  '',
  'The above copyright notice and this permission notice shall be included in all',
  'copies or substantial portions of the Software.',
  '',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
  'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
  'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
  'SOFTWARE.',
  '',
  'File generated at: $TIME_GENERATED$',
];

const generateTSLicense = (): string => {
  const date = new Date();
  const doc = new DocBuilder(true);
  for (const line of LICENSE) {
    doc.appendLine(
      line.replace('$YEAR$', date.getFullYear().toString()).replace('$TIME_GENERATED$', date.toISOString())
    );
  }
  return doc.build();
};

const generateLuaLicense = (): string => {
  const date = new Date();
  const dateS = date.toISOString();
  let lines = '';
  const year = date.getFullYear().toString();
  for (const line of LICENSE) {
    lines += '-- ' + line.replace('$YEAR$', year).replace('$TIME_GENERATED$', dateS) + '\n';
  }
  return lines;
};

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
    this.fileLocal = file.replace('./assets/media/lua/', '');
    const split = this.fileLocal.split('/');
    split.pop();
    this.folder = split.join('/');
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
      if(localVars.indexOf(info.name) !== -1) return false;

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

      const clazz = new LuaClass(this, info.subClass, info.superClass);
      this.classes[info.subClass] = this.library.classes[info.subClass] = clazz;
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
      this.globalFunctions[info.name] = func;
      if (!info.isLocal) {
        this.globalFunctions[func.name] = this.library.globalFunctions[func.name] = func;
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

      const clazz = this.library.classes[info.className];
      if (clazz) {
        if (!info.isStatic && info.name === 'new') {
          const func = new LuaConstructor(this.library, clazz, declaration, info.params);
          clazz._constructor_ = func;
        } else {
          const func = new LuaMethod(this.library, clazz, declaration, info.name, info.params, info.isStatic);
          clazz.methods[info.name] = func;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const func = new LuaMethod(this.library, table, declaration, info.name, info.params, info.isStatic);
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
        if (!info.isStatic && (info.name === 'new')) {
          const func = new LuaConstructor(this.library, clazz, statement, info.params);
          clazz._constructor_ = func;
        } else {
          const func = new LuaMethod(this.library, clazz, statement, info.name, info.params, info.isStatic);
          clazz.methods[info.name] = func;
        }
        return true;
      }

      const table = this.library.tables[info.className];
      if (table) {
        const func = new LuaMethod(this.library, table, statement, info.name, info.params, info.isStatic);
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

        const info = getFunctionDeclaration(statement);
        if (!info || info.isLocal || info.name === 'new' || info.name === 'toString') continue;
        // console.log(`Global function: ${info.name}`);
        const func = new LuaFunction(this, statement, info.name, info.params, info.isLocal);
        this.library.globalFunctions[func.name] = func;
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

  generate() {
    console.log(`Generating: ${this.fileLocal.replace('.lua', '.d.ts')}..`);
    const { folder, fileLocal, classes, tables, globalFields, globalFunctions } = this;
    let code = '';

    // Compile classes.
    for (const className of Object.keys(classes)) code += `${classes[className].compile('  ')}\n\n`;
    // Compile table(s).
    for (const tableName of Object.keys(tables)) code += `${tables[tableName].compile('  ')}\n\n`;
    // Compile function(s).
    for (const funcName of Object.keys(globalFunctions)) {
      // Not sure why these two would exist in the global scope.
      if(funcName === 'new' || funcName === 'toString') continue;
      const func = globalFunctions[funcName];
      if(func.isLocal) continue;
      code += `${func.compile('  ')}\n\n`;
    }

    code = prettier.format(this.wrapModule(code), {
      singleQuote: true,
      bracketSpacing: true,
      parser: 'typescript',
      printWidth: 120,
    });

    const mkdirsSync = (path: string) => {
      const split = path.split('/');
      let built = '';
      for (const next of split) {
        built += built.length ? `/${next}` : next;
        if (next === '.') continue;
        if (!fs.existsSync(built)) fs.mkdirSync(built);
      }
    };

    mkdirsSync(`./dist/lua/${folder}`);
    this.writeTSFile(`./dist/lua/${fileLocal.replace('.lua', '.d.ts')}`, code);

    // // Compile atlas.
    // const atlasName = 'index.d.ts';
    // const atlasPath = `${folder}${atlasName}`;
    // console.log('Compiling Atlas..');
    // references.sort((o1, o2) => o1.localeCompare(o2));
    // let atlasCode = `import * as Zomboid from 'Zomboid';\n`;
    // for (const ref of references) atlasCode += `/// <reference path="${ref}" />\n`;
    // this.writeTSFile(atlasPath, atlasCode);
  }

  writeTSFile(path: string, code: string) {
    code = `${generateTSLicense()}\n\n${code}`;
    fs.writeFileSync(path, code);
  }

  wrapModule(code: string): string {
    return `/** @noResolution @noSelfInFile */\n\ndeclare module 'ZomboidLua' {\n${code}}\n`;
  }
}
