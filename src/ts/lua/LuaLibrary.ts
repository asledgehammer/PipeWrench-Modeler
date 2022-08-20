import * as fs from 'fs';
import path from 'path';

import { LuaFile } from './LuaFile';
import { LuaClass } from './LuaClass';
import { LuaTable } from './LuaTable';
import { LuaFunction } from './LuaFunction';
import { LuaField } from './LuaField';

import { ModelLibrary } from './model/ModelLibrary';
import { ClassModel } from './model/ClassModel';
import { TableModel } from './model/TableModel';
import { FunctionModel } from './model/FunctionModel';
import { FieldModel } from './model/FieldModel';

/** @author JabDoesThings */
export class LuaLibrary {
  readonly models: ModelLibrary = new ModelLibrary(this);

  private files: string[] = [];

  luaFiles: { [id: string]: LuaFile } = {};
  classes: { [id: string]: LuaClass } = {};
  tables: { [id: string]: LuaTable } = {};
  globalFields: { [id: string]: LuaField } = {};
  globalFunctions: { [id: string]: LuaFunction } = {};

  scan(luaPath?: string) {
    luaPath = luaPath || './assets/media/lua';
    this.files = [];
    this.scanDir(path.join(luaPath, 'shared').replaceAll("\\", "/"));
    this.scanDir(path.join(luaPath, 'client').replaceAll("\\", "/"));
    this.scanDir(path.join(luaPath, 'server').replaceAll("\\", "/"));
    this.files.sort((a: string, b: string) => {
      return a.localeCompare(b);
    });
    this.models.scan();
  }

  private scanDir(dir: string) {
    const entries = fs.readdirSync(dir);
    const dirs: string[] = [];

    for (const entry of entries) {
      const path = dir + '/' + entry;
      if (path === '.' || path === '..' || path === '...') continue;
      const stats = fs.lstatSync(path);
      if (stats.isDirectory() && dirs.indexOf(path) === -1) {
        dirs.push(path);
        continue;
      }
      if (path.toLowerCase().endsWith('.lua') && this.files.indexOf(path) === -1) {
        this.files.push(path);
      }
    }

    if (dirs.length !== 0) {
      for (const dir of dirs) this.scanDir(dir);
    }
  }

  parse(luaPath?: string) {
    luaPath = luaPath || './assets/media/lua';

    this.classes = {};
    this.tables = {};
    this.globalFields = {};
    this.globalFunctions = {};

    // The root class doesn't define itself using 'derive(type: string)'.
    // Add it manually.
    this.classes['ISBaseObject'] = new LuaClass(null, 'ISBaseObject');
    this.classes['ISBaseObject'].file = new LuaFile(this, '', '', luaPath.replace("./", "/"));

    for (const file of this.files) {
      const id = file
        .replace(path.join(luaPath, 'client').replaceAll("\\", "/"), '')
        .replace(path.join(luaPath, 'server').replaceAll("\\", "/"), '')
        .replace(path.join(luaPath, 'shared').replaceAll("\\", "/"), '')
      // .replace('.lua', '')
      // .replace('.Lua', '')
      // .replace('.LUA', '');

      const luaFile = new LuaFile(this, id, file, luaPath.replace("./", "/"));
      luaFile.parse();
      luaFile.scanRequires();

      this.luaFiles[id] = luaFile;
    }

    for (const file of Object.values(this.luaFiles)) file.scanGlobals();
    for (const file of Object.values(this.luaFiles)) file.scanMembers();
    for (const _class_ of Object.values(this.classes)) _class_.scanMethods();
    this.linkClasses();
    this.audit();
    this.models.parse();
  }

  compileClasses(prefix: string = ''): string {
    const classNames = Object.keys(this.classes);
    classNames.sort((o1, o2) => o1.localeCompare(o2));
    let s = '';
    for (const className of classNames) s += `${this.classes[className].compile(prefix)}\n`;
    return s;
  }

  compileTables(prefix: string = ''): string {
    const tableNames = Object.keys(this.tables);
    tableNames.sort((o1, o2) => o1.localeCompare(o2));
    let s = '';
    for (const tableName of tableNames) s += `${this.tables[tableName].compile(prefix)}\n`;
    return s;
  }

  getClassModel(_class_: LuaClass): ClassModel {
    return this.models ? this.models.getClassModel(_class_) : null;
  }

  getTableModel(table: LuaTable): TableModel {
    return this.models ? this.models.getTableModel(table) : null;
  }

  getGlobalFieldModel(field: LuaField): FieldModel {
    return this.models ? this.models.getGlobalFieldModel(field) : null;
  }

  getGlobalFunctionModel(_function_: LuaFunction): FunctionModel {
    return this.models ? this.models.getGlobalFunctionModel(_function_) : null;
  }

  private audit() {
    for (const className of Object.keys(this.classes)) {
      // Classes takes precedence over duplicate tables.
      if (this.tables[className]) delete this.tables[className];
      // Make sure that class properties are properly assigned.
      this.classes[className].audit();
    }
  }

  private linkClasses() {
    for (const name of Object.keys(this.classes)) {
      const _class_ = this.classes[name];
      // Ignore the root class.
      if (_class_.name === 'ISBaseObject') continue;

      let superClass = this.classes[_class_.superClassName];
      if (!superClass) superClass = this.resolveProxyClass(_class_.superClassName);
      if (!superClass) {
        console.warn(
          `[LuaLibrary] Lua Superclass not found: ${_class_.name} extends ${_class_.superClassName}`
        );
      }
      _class_.superClass = superClass;
    }
  }

  private resolveProxyClass(className: string): LuaClass | null {
    for (const _class_ of Object.values(this.luaFiles)) {
      if (_class_.proxies[className]) return this.classes[_class_.proxies[className]];
    }
    return null;
  }

  setClass(_class_: LuaClass) {
    this.classes[_class_.name] = _class_;
  }
}
