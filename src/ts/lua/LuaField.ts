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

  generateDoc(prefix: string): string {
    const types: string[] = [WILDCARD_TYPE];
    let sDoc = '';

    const processField = (model: FieldModel) => {
      const { _return_, documentation: fieldDoc } = model;
      const { types: fTypes } = _return_;
      // Process field types.
      if (fTypes && fTypes.length) {
        types.length = 0;
        for (const fType of fTypes) {
          // Prevent duplicate type entries.
          if (types.indexOf(fType) !== -1) continue;
          types.push(fType);
        }
      }
      if (fieldDoc) {
        const doc = new DocumentationBuilder();
        const { description: lines } = fieldDoc;
        // Process lines. (If defined)
        if (lines && lines.length) {
          for (const line of lines) doc.appendLine(line);
        }
        if (!doc.isEmpty()) sDoc = doc.build(prefix);
      }
    };

    const { container } = this;
    const { library } = container.file;
    if (container) {
      let fieldModel: FieldModel;
      if (container instanceof LuaClass) {
        let classModel = library.getClassModel(container);
        fieldModel = classModel ? classModel.getFieldModel(this) : null;
      }
      if (fieldModel) {
        if (container instanceof LuaClass) {
          processField(fieldModel);
        } else if (container instanceof LuaTable) {
          processField(fieldModel);
        }
      } else {
        const { library } = this.container.file;
        if (container instanceof LuaClass) {
          const classModel = library.getClassModel(container);
          if (classModel) {
            fieldModel = classModel.getFieldModel(this);
            if (fieldModel) processField(fieldModel);
          }
        } else if (container instanceof LuaTable) {
          const tableModel = library.getTableModel(container);
          if (tableModel) {
            fieldModel = tableModel.getFieldModel(this);
            if (fieldModel) processField(fieldModel);
          }
        }
      }
    }

    return sDoc;
  }

  onCompile(prefix: string): string {
    const { name } = this;
    const lTypes: string[] = [WILDCARD_TYPE];
    let documentationString = '';

    const processField = (model: FieldModel) => {
      const { _return_, documentation: fieldDoc } = model;
      const { types: fTypes } = _return_;

      // Process field types.
      if (fTypes.length) {
        lTypes.length = 0;
        for (const fType of fTypes) {
          // Prevent duplicate type entries.
          if (lTypes.indexOf(fType) === -1) lTypes.push(fType);
        }
      }

      if (fieldDoc) {
        const { description } = fieldDoc;
        const documentationBuilder = new DocumentationBuilder();

        // Process lines. (If defined)
        if (description && description.length) {
          for (const line of description) documentationBuilder.appendLine(line);
        }

        if (!documentationBuilder.isEmpty()) documentationString = documentationBuilder.build(prefix);
      }
    };

    const { container } = this;
    const { library } = container.file;
    if (container) {
      let fieldModel: FieldModel;
      if (container instanceof LuaClass) {
        const classModel = library.getClassModel(container);
        fieldModel = classModel ? classModel.getFieldModel(this) : null;
      } else if(container instanceof LuaTable) {
        const tableModel = library.getTableModel(container);
        fieldModel = tableModel ? tableModel.getFieldModel(this) : null;
      }

      if (fieldModel) {
        processField(fieldModel);
      } 
    }

    const sStatic = this.isStatic ? 'static ' : '';
    if (documentationString.length) return `${documentationString}\n${prefix}${sStatic}${sanitizeName(name)}: ${lTypes.join(' | ')};`;
    return `${prefix}${sStatic}${sanitizeName(name)}: ${lTypes.join(' | ')};`;
  }

  generateAPI(prefix: string, file: LuaFile): string {
    const { name } = this;
    const doc = this.generateDoc(prefix);
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
