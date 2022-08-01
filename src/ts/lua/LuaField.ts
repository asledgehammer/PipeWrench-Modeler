import { sanitizeName } from './model/ModelUtils';
import { WILDCARD_TYPE } from '../ZomboidGenerator';
import { DocumentationBuilder } from '../DocumentationBuilder';

import { LuaNamedObject } from './LuaNamedObject';
import { LuaFile } from './LuaFile';
import { LuaContainer } from './LuaContainer';
import { LuaClass } from './LuaClass';
import { LuaTable } from './LuaTable';

import { FieldModel } from './model/FieldModel';

/**
 * **LuaField** stores calls to constants or variables.
 *
 * LuaFields are treated as fields for classes and treated as properties for tables and global.
 *
 * @author JabDoesThings
 */
export class LuaField extends LuaNamedObject {
  /** (Optional) The container the field is assigned to. */
  readonly container: LuaContainer | null;
  /** (Optional) If assigned to a class, this tells the generator if the field should be accessed statically or accessed only from a class instance. */
  readonly isStatic: boolean;

  /**
   * @param container (Optional) The container the field is assigned to.
   * @param name The name of the element. (If stored globally, identifies as such)
   * @param isStatic (Optional) If assigned to a class, this tells the generator if the field should be accessed statically or accessed only from a class instance.
   */
  constructor(container: LuaContainer | null, name: string, isStatic: boolean = true) {
    super(name);
    this.container = container;
    this.isStatic = isStatic;
  }

  getModel(): FieldModel {
    const { container } = this;
    const { library } = container.file;

    let model: FieldModel;
    if (container instanceof LuaClass) {
      const classModel = library.getClassModel(container);
      model = classModel ? classModel.getFieldModel(this) : null;
    } else if (container instanceof LuaTable) {
      const tableModel = library.getTableModel(container);
      model = tableModel ? tableModel.getFieldModel(this) : null;
    }
    return model;
  }

  generateDocumentation(prefix: string): string {
    const model = this.getModel();
    return model ? model.generateDocumentation(prefix) : '';
  }

  onCompile(prefix: string): string {
    const { name, container, isStatic } = this;
    const documentationString = this.generateDocumentation(prefix);

    const processTypes = (types: string[], model: FieldModel): void => {
      const { _return_ } = model;
      const { types: returnTypes } = _return_;
      if (!returnTypes.length) {
        return;
      }
      types.length = 0;
      for (const type of returnTypes) {
        if (types.indexOf(type) === -1) types.push(type);
      }
    };
    
    const types: string[] = [WILDCARD_TYPE];

    if (container) {
      const fieldModel = this.getModel();
      if (fieldModel) processTypes(types, fieldModel);
    }

    const sStatic = isStatic ? 'static ' : '';
    const sanitizedName = sanitizeName(name);
    if (documentationString.length)
      return `${documentationString}\n${prefix}${sStatic}${sanitizedName}: ${types.join(' | ')};`;
    return `${prefix}${sStatic}${sanitizedName}: ${types.join(' | ')};`;
  }

  generateAPI(prefix: string, file: LuaFile): string {
    const { name } = this;
    const doc = this.generateDocumentation(prefix);
    return `${prefix}${doc ? `${doc}\n` : ''}${prefix}export const ${sanitizeName(
      name
    )} = ${this.getFullPath(file)};`;
  }

  generateLua(prefix: string = ''): string {
    const { name } = this;
    return `${prefix}Exports.${sanitizeName(name)} = loadstring("return _G['${name}']")()\n`;
  }

  getNamespace(file: LuaFile) {
    return file.propertyNamespace;
  }

  getFullPath(file: LuaFile) {
    const { name } = this;
    return `${this.getNamespace(file)}.${sanitizeName(name)}`;
  }
}
