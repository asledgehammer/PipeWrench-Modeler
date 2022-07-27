import { DocBuilder } from '../DocBuilder';
import { LuaClass } from './LuaClass';
import { LuaContainer } from './LuaContainer';
import { NamedElement } from './NamedElement';
import { LuaTable } from './LuaTable';
import { FieldModel } from './model/FieldModel';

/**
 * **LuaField** stores calls to constants or variables.
 *
 * LuaFields are treated as fields for classes and treated as properties for tables and global.
 *
 * @author JabDoesThings
 */
export class LuaField extends NamedElement {
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

  onCompile(prefix: string): string {
    const types: string[] = [];
    let sDoc = '';

    const processField = (model: FieldModel) => {

      console.log(`processField(${this.name})`);

      const { types: fTypes, doc: fieldDoc } = model;

      // Process field types.
      if (fTypes && fTypes.length) {
        for (const fType of fTypes) {
          // Prevent duplicate type entries.
          if (types.indexOf(fType) !== -1) continue;
          types.push(fType);
        }
      } else {
        types.push('unknown');
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
        console.log(lines);
        if (lines && lines.length) {
          if (hasAnnotations) doc.appendLine();
          for (const line of lines) doc.appendLine(line);
        }

        if (!doc.isEmpty()) sDoc = doc.build(prefix);
        
      }
    };

    
    const { container } = this;
    if (container) {
      let fieldModel: FieldModel;
      if(container instanceof LuaClass) {
        let clazzModel = container.model;
        fieldModel = clazzModel ? clazzModel.getField(this) : null;
      }

      if(fieldModel) {
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
            fieldModel = classModel.getField(this);
            if (fieldModel) processField(fieldModel);
          }
        } else if (container instanceof LuaTable) {
          const tableModel = library.getTableModel(container);
          if (tableModel) {
            fieldModel = tableModel.getField(this);
            if (fieldModel) processField(fieldModel);
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
