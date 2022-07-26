import * as fs from 'fs';
import { ClassModel } from './ClassModel';
import { TableModel } from './TableModel';
import { FunctionModel } from './FunctionModel';
import { FieldModel } from './FieldModel';
import { ModelFile } from './ModelFile';
import { LuaClass } from '../LuaClass';
import { LuaTable } from '../LuaTable';
import { LuaFunction } from '../LuaFunction';
import { LuaField } from '../LuaField';
import { LuaLibrary } from '../LuaLibrary';

/**
 * **ModelLibrary**
 * 
 * @author JabDoesThings
 */
export class ModelLibrary {
  /** All model files discovered from scanning directories. */
  private readonly files: string[] = [];

  /** All model files in the library. */
  readonly modelFiles: { [id: string]: ModelFile } = {};

  /** All class models in the library. */
  readonly classes: { [id: string]: ClassModel } = {};

  /** All table models in the library. */
  readonly tables: { [id: string]: TableModel } = {};

  /** All global field models in the library. */
  readonly globalFields: { [id: string]: FieldModel } = {};

  /** All global function models in the library. */
  readonly globalFunctions: { [id: string]: FunctionModel } = {};

  readonly luaLibrary: LuaLibrary;

  constructor(luaLibrary: LuaLibrary) {
    this.luaLibrary = luaLibrary;
  }

  /**
   * Scans and discovers JSON model files to load & read.
   */
  scan() {
    this.files.length = 0;
    this.scanDir('./assets/media/models');
    this.files.sort((a: string, b: string) => a.localeCompare(b));
  }

  /**
   * Parses through all loaded ModelFiles, loading classes, tables, global fields, and global functions.
   */
  parse() {
    this.clear();
    for (const file of this.files) {
      let id: string;
      const path = file.replace('\\', '/').replace('.json', '').replace('.json', '').replace('.json', '');
      if (path.indexOf('/') !== -1) {
        const split = path.split('/');
        id = split[split.length - 1];
      } else {
        id = path;
      }
      const modelFile = new ModelFile(this, id, file);
      modelFile.parse();
      modelFile.scan();
      this.modelFiles[id] = modelFile;
    }
  }

  getClassModel(clazz: LuaClass): ClassModel {
    const model = this.classes[clazz.name];
    return model && model.testSignature(clazz) ? model : null;
  }

  getTableModel(table: LuaTable): TableModel {
    const model = this.tables[table.name];
    return model && model.testSignature(table) ? model : null;
  }

  getGlobalFieldModel(field: LuaField): FieldModel {
    const model = this.globalFields[field.name];
    return model && model.testSignature(field) ? model : null;
  }

  getGlobalFunctionModel(func: LuaFunction): FunctionModel {
    const model = this.globalFunctions[func.name];
    return model && model.testSignature(func) ? model : null;
  }

  /**
   * Clears all classes, tables, global fields, and global functions in the library.
   */
  clear() {
    for (const id of Object.keys(this.classes)) delete this.classes[id];
    for (const id of Object.keys(this.tables)) delete this.tables[id];
    for (const id of Object.keys(this.globalFields)) delete this.globalFields[id];
    for (const id of Object.keys(this.globalFunctions)) delete this.globalFunctions[id];
  }

  private scanDir(dir: string) {
    this.files.length = 0;
    const entries = fs.readdirSync(dir);
    const dirs: string[] = [];
    for (const entry of entries) {
      const path = dir + '/' + entry;
      if (path === '.' || path === '..' || path === '...') {
        continue;
      }
      const stats = fs.lstatSync(path);
      if (stats.isDirectory() && dirs.indexOf(path) === -1) {
        dirs.push(path);
        continue;
      }
      if (path.toLowerCase().endsWith('.json') && this.files.indexOf(path) === -1) {
        this.files.push(path);
      }
    }
    if (dirs.length !== 0) {
      for (const dir of dirs) {
        this.scanDir(dir);
      }
    }
  }
}
