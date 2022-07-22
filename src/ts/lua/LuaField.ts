import { DocBuilder } from '../DocBuilder';
import { LuaClass } from './LuaClass';
import { LuaContainer } from './LuaContainer';
import { LuaElement } from './LuaElement';
import { LuaTable } from './LuaTable';
import { sanitizeParameter } from './LuaUtils';
import { FieldModel } from './model/FieldModel';

/**
 * **LuaField** stores calls to constants or variables.
 *
 * LuaFields are treated as fields for classes and treated as properties for tables and global.
 *
 * @author JabDoesThings
 */
export class LuaField extends LuaElement {
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

  compile(prefix: string = ''): string {
    const types: string[] = ['unknown'];
    let sDoc = '';

    const processField = (fieldModel: FieldModel) => {
      const { applyUnknownType, types: fTypes, doc: fieldDoc } = fieldModel;

      // Process field types.
      if (!applyUnknownType) types.length = 0;
      if (fTypes && fTypes.length) {
        for (const fType of fTypes) {
          // Prevent duplicate type entries.
          if (types.indexOf(fType) !== -1) continue;
          types.push(fType);
        }
      }

      if (fieldDoc) {
        const doc = new DocBuilder();
        const { annotations, lines } = fieldDoc;

        // Process annotations. (If defined)
        let hasAnnotations = false;
        if (annotations) {
          const keys = Object.keys(annotations);
          if (keys && keys.length) {
            hasAnnotations = true;
            for (const key of keys) doc.appendAnnotation(key, annotations[key]);
          }
        }

        // Process lines. (If defined)
        if (lines && lines.length) {
          if(hasAnnotations) doc.appendLine();
          for (const line of lines) doc.appendLine(line);
        }

        sDoc = doc.build(prefix);
      }
    };

    const { container } = this;
    if (container) {
      const { library } = this.container.file;

      if (container instanceof LuaClass) {
        const classModel = library.getClassModel(container);
        if (classModel && classModel.testSignature(container)) {
          const fieldModel = classModel.getField(this);
          if (fieldModel && fieldModel.testSignature(this)) {
            processField(fieldModel);
          }
        }
      } else if (container instanceof LuaTable) {
        const tableModel = library.getTableModel(container);
        if (tableModel && tableModel.testSignature(container)) {
          const fieldModel = tableModel.getField(this);
          if (fieldModel && fieldModel.testSignature(this)) {
            processField(fieldModel);
          }
        }
      }
    }

    // Compile the gathered types as TypeScript syntax.
    let compiledTypes = '';
    for (const type of types) {
      if (compiledTypes.length) compiledTypes += ' | ';
      compiledTypes += type;
    }

    const sStatic = this.isStatic ? 'static ' : '';
    if (sDoc.length) return `${sDoc}\n${prefix}${sStatic}${this.name}: ${compiledTypes};`;
    return `${prefix}${sStatic}${this.name}: ${compiledTypes};`;
  }
}
