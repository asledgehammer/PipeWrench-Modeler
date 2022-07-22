import * as fs from 'fs';
import { ClassModel } from './ClassModel';
import { TableModel } from './TableModel';
import { FunctionModel } from './FunctionModel';
import { FieldModel } from './FieldModel';
import { ModelFile } from './ModelFile';

export class ModelLibrary {
  private files: string[] = [];
  modelFiles: { [id: string]: ModelFile } = {};
  classes: { [id: string]: ClassModel } = {};
  tables: { [id: string]: TableModel } = {};
  globalFields: { [id: string]: FieldModel } = {};
  globalFunctions: { [id: string]: FunctionModel } = {};

  scan() {
    this.files = [];
    this.scanDir('./assets/media/models');
    this.files.sort((a: string, b: string) => a.localeCompare(b));
  }

  parse() {
    this.classes = {};
    this.tables = {};
    this.globalFields = {};
    this.globalFunctions = {};
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

  clear() {
    for (const id of Object.keys(this.classes)) delete this.classes[id];
    for (const id of Object.keys(this.tables)) delete this.tables[id];
    for (const id of Object.keys(this.globalFields)) delete this.globalFields[id];
    for (const id of Object.keys(this.globalFunctions)) delete this.globalFunctions[id];
  }

  private scanDir(dir: string) {
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
