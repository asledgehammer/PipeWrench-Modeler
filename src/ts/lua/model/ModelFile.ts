import * as fs from 'fs';
import { LuaClass } from '../LuaClass';
import { ClassModel, ClassModelJson } from './ClassModel';
import { FieldModel, FieldModelJson } from './FieldModel';
import { FunctionModel, FunctionModelJson } from './FunctionModel';
import { ModelLibrary } from './ModelLibrary';
import { TableModel, TableModelJson } from './TableModel';

/**
 * **ModelFile**
 *
 * @author JabDoesThings
 */
export class ModelFile {
  /** All classes discovered in the file. */
  readonly classes: { [id: string]: ClassModel } = {};

  /** All table(s) discovered in the file. */
  readonly tables: { [id: string]: TableModel } = {};

  /** All global field(s) discovered in the file. */
  readonly globalFields: { [id: string]: FieldModel } = {};

  /** All global functions(s) discovered in the file. */
  readonly globalFunctions: { [id: string]: FunctionModel } = {};

  /** The library storing all discovered Lua. */
  readonly library: ModelLibrary;

  /** The path to the file on the disk. */
  readonly file: string;

  /** The name of the file. */
  readonly id: string;

  /** The parsed JSON object. */
  parsed: ModelFileJson;

  /** The format version of the file. */
  version: number;

  /**
   * @param library The library storing all models.
   * @param id The name of the file.
   * @param file The path to the file on the disk.
   */
  constructor(library: ModelLibrary, id: string, file: string) {
    this.library = library;
    this.id = id;
    this.file = file;
  }

  /**
   * Parses contents of the file from JSON.
   */
  parse() {
    const raw = fs.readFileSync(this.file).toString();
    this.parsed = JSON.parse(raw);
    this.version = this.parsed.version;
  }

  /**
   * Scans the parsed JSON, loading classes, tables, global fields, and global functions.
   */
  scan() {
    const { parsed } = this;
    const { classes, tables, globalFields, globalFunctions } = parsed;

    this.clear();

    // Load class models.
    if (classes) {
      for (const name of Object.keys(classes)) {
        const luaClass = this.library.luaLibrary.classes[name];
        this.library.classes[name] = this.classes[name] = new ClassModel(luaClass, name, classes[name]);
      }
    }
    // Load table models.
    if (tables) {
      for (const name of Object.keys(tables)) {
        this.library.tables[name] = this.tables[name] = new TableModel(name, tables[name]);
      }
    }
    // Load global field models.
    if (globalFields) {
      for (const name of Object.keys(globalFields)) {
        this.library.globalFields[name] = this.globalFields[name] = new FieldModel(name, globalFields[name]);
      }
    }
    // Load global function models.
    if (globalFunctions) {
      for (const name of Object.keys(globalFunctions)) {
        this.library.globalFunctions[name] = this.globalFunctions[name] = new FunctionModel(
          name,
          globalFunctions[name]
        );
      }
    }
  }

  save(path: string) {
    let classes: {[id: string]: ClassModelJson} = undefined;
    let classNames = Object.keys(this.classes);
    if (classNames.length) {
      classes = {};
      classNames.sort((o1, o2) => o1.localeCompare(o2));
      for (const className of classNames) classes[className] = this.classes[className].save();
    }

    let tables: {[id: string]: TableModelJson} = undefined;
    let tableNames = Object.keys(this.tables);
    if (tableNames.length) {
      tables = {};
      tableNames.sort((o1, o2) => o1.localeCompare(o2));
      for (const tableName of tableNames) tables[tableName] = this.tables[tableName].save();
    }

    let globalFields: {[id: string]: FieldModelJson} = undefined;
    let globalFieldNames = Object.keys(this.globalFields);
    if (globalFieldNames.length) {
      globalFields = {};
      globalFieldNames.sort((o1, o2) => o1.localeCompare(o2));
      for (const fieldName of globalFieldNames) globalFields[fieldName] = this.globalFields[fieldName].save();
    }

    let globalFunctions: {[id: string]: FunctionModelJson} = undefined;
    let globalfunctionsNames = Object.keys(this.globalFunctions);
    if (globalfunctionsNames.length) {
      globalFunctions = {};
      globalfunctionsNames.sort((o1, o2) => o1.localeCompare(o2));
      for (const funcName of globalFieldNames) globalFunctions[funcName] = this.globalFunctions[funcName].save();
    }

    const json = { version: 1, classes, tables, globalFields, globalFunctions };
    const data = JSON.stringify(json, null, 2);
    fs.writeFileSync(path, data);
  }

  /**
   * Clears all classes, tables, global fields, and global functions loaded from the file.
   */
  private clear() {
    for (const id of Object.keys(this.classes)) delete this.classes[id];
    for (const id of Object.keys(this.tables)) delete this.tables[id];
    for (const id of Object.keys(this.globalFields)) delete this.globalFields[id];
    for (const id of Object.keys(this.globalFunctions)) delete this.globalFunctions[id];
  }
}

/**
 * **ModelFileJson**
 *
 * @author JabDoesThings
 */
export type ModelFileJson = {
  version: number;
  classes: { [id: string]: ClassModelJson };
  tables: { [id: string]: TableModelJson };
  globalFields: { [id: string]: FieldModelJson };
  globalFunctions: { [id: string]: FunctionModelJson };
};
