import * as fs from 'fs';
import { LuaFile } from './LuaFile';
import { LuaClass } from './LuaClass';
import { NamedElement } from './NamedElement';
import { LuaTable } from './LuaTable';
import { ModelLibrary } from './model/ModelLibrary';
import { ClassModel } from './model/ClassModel';
import { TableModel } from './model/TableModel';
import { LuaField } from './LuaField';
import { FieldModel } from './model/FieldModel';
import { LuaFunction } from './LuaFunction';
import { FunctionModel } from './model/FunctionModel';

/**
 * **LuaLibrary**
 *
 * @author JabDoesThings
 */
export class LuaLibrary {
  readonly models: ModelLibrary = new ModelLibrary(this);

  private files: string[] = [];

  luaFiles: { [id: string]: LuaFile } = {};
  classes: { [id: string]: LuaClass } = {};
  tables: { [id: string]: LuaTable } = {};
  properties: { [id: string]: NamedElement } = {};

  scan() {
    this.files = [];
    this.scanDir('./assets/media/lua/shared');
    this.scanDir('./assets/media/lua/client');
    this.scanDir('./assets/media/lua/server');
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

  parse() {
    this.classes = {};
    this.tables = {};
    this.properties = {};

    // The root class doesn't define itself using 'derive(type: string)'.
    // Add it manually.
    this.classes['ISBaseObject'] = new LuaClass(null, 'ISBaseObject');

    for (const file of this.files) {
      const id = file
        .replace('./assets/media/lua/client/', '')
        .replace('./assets/media/lua/server/', '')
        .replace('./assets/media/lua/shared/', '')
        .replace('.lua', '')
        .replace('.Lua', '')
        .replace('.LUA', '');

      const luaFile = new LuaFile(this, id, file);
      luaFile.parse();
      luaFile.scanRequires();

      this.luaFiles[id] = luaFile;
    }

    for (const file of Object.values(this.luaFiles)) file.scanGlobals();
    for (const file of Object.values(this.luaFiles)) file.scanMembers();
    for (const clazz of Object.values(this.classes)) clazz.scanMethods();
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

  compileProperties(prefix: string = ''): string {
    const propNames = Object.keys(this.properties);
    propNames.sort((o1, o2) => o1.localeCompare(o2));
    let s = '';
    for (const propName of propNames) s += `${this.properties[propName].compile(prefix)}\n`;
    return s;
  }

  getClassModel(clazz: LuaClass): ClassModel {
    return this.models ? this.models.getClassModel(clazz) : null;
  }

  getTableModel(table: LuaTable): TableModel {
    return this.models ? this.models.getTableModel(table) : null;
  }

  getGlobalFieldModel(field: LuaField): FieldModel {
    return this.models ? this.models.getGlobalFieldModel(field) : null;
  }

  getGlobalFunctionModel(func: LuaFunction): FunctionModel {
    return this.models ? this.models.getGlobalFunctionModel(func) : null;
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
      const clazz = this.classes[name];
      let superClazz = this.classes[clazz.superClassName];
      if (!superClazz) superClazz = this.resolveProxyClass(clazz.superClassName);
      if (!superClazz) {
        console.warn(`[LuaLibrary] Lua Superclass not found: ${clazz.name} extends ${clazz.superClassName}`);
      }
      clazz.superClass = superClazz;
    }
  }

  private resolveProxyClass(clazzName: string): LuaClass | null {
    for (const clazz of Object.values(this.luaFiles)) {
      if (clazz.proxies[clazzName]) return this.classes[clazz.proxies[clazzName]];
    }
    return null;
  }

  setClass(clazz: LuaClass) {
    this.classes[clazz.name] = clazz;
  }

  setProperty(element: NamedElement) {
    this.properties[element.name] = element;
  }
}
