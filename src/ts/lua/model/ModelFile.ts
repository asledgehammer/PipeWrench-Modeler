import * as fs from 'fs';
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
      for (const id of Object.keys(classes)) {
        this.library.classes[id] = this.classes[id] = new ClassModel(classes[id]);
      }
    }
    // Load table models.
    if (tables) {
      for (const id of Object.keys(tables)) {
        this.library.tables[id] = this.tables[id] = new TableModel(tables[id]);
      }
    }
    // Load global field models.
    if (globalFields) {
      for (const id of Object.keys(globalFields)) {
        this.library.globalFields[id] = this.globalFields[id] = new FieldModel(globalFields[id]);
      }
    }
    // Load global function models.
    if (globalFunctions) {
      for (const id of Object.keys(globalFunctions)) {
        this.library.globalFunctions[id] = this.globalFunctions[id] = new FunctionModel(globalFunctions[id]);
      }
    }
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
