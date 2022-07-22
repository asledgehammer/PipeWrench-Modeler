import { ClassDoc, ClassDocJson } from './doc/ClassDoc';
import { ConstructorModel, ConstructorModelJson } from './ConstructorModel';
import { FieldModel, FieldModelJson } from './FieldModel';
import { MethodModel, MethodModelJson } from './MethodModel';
import { LuaClass } from '../LuaClass';
import { LuaField } from '../LuaField';
import { LuaMethod } from '../LuaMethod';
import { DocBuilder } from '../../DocBuilder';

/**
 * **ClassModel**
 *
 * @author JabDoesThings
 */
export class ClassModel {
  fields: { [id: string]: FieldModel } = {};
  methods: { [id: string]: MethodModel } = {};
  _constructor_: ConstructorModel;
  doc: ClassDoc;
  readonly name: string;

  constructor(name: string, json?: ClassModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  generateConstructorDoc(prefix: string, clazz: LuaClass): string {
    const { _constructor_ } = this;

    if (!_constructor_ || !_constructor_.testSignature(clazz._constructor_)) {
      return '';
    }

    const doc = new DocBuilder();
    const { doc: constructorDoc, params } = _constructor_;
    if (constructorDoc) {
      const { annotations, lines } = constructorDoc;

      // Process annotations. (If defined)
      if (annotations) {
        const keys = Object.keys(annotations);
        if (keys && keys.length) {
          for (const key of keys) doc.appendAnnotation(key, annotations[key]);
          doc.appendLine();
        }
      }

      // Process lines. (If defined)
      if (lines && lines.length) {
        for (const line of lines) doc.appendLine(line);
        doc.appendLine();
      }

      // Process params. (If defined)
      if (params) {
        for (const param of params) {
          const { name, doc: paramDoc } = param;

          if (!doc) {
            doc.appendParam(name);
            continue;
          } else {
            const { lines } = paramDoc;

            // No lines. Print basic @param <name>
            if (!lines || !lines.length) {
              doc.appendParam(name);
              continue;
            }
            
            doc.appendParam(name, lines[0]);
            
            // Check if multi-line.
            if (lines.length === 1) continue;
            for (let index = 1; index < lines.length; index++) {
              doc.appendLine(lines[index]);
            }
          }
        }
      }
    }
    return doc.build(prefix);
  }

  testSignature(clazz: LuaClass): boolean {
    return clazz.name === this.name;
  }

  getField(field: LuaField): FieldModel {
    const model = this.fields[field.name];
    if (model && model.testSignature(field)) return model;
    return null;
  }

  sanitizeMethodName(name: string) {
    if(name === 'toString') {
      return `_${name}`;
    }
    return name;
  }

  unsanitizeMethodName(name: string) {
    if(name === '_toString') {
      return name.substring(1);
    }
    return name;
  }

  getMethod(method: LuaMethod): MethodModel {
    const name = this.sanitizeMethodName(method.name);
    const model = this.methods[name];
    if (model && model.testSignature(method)) return model;
    return null;
  }

  getConstructor(_constructor_: LuaMethod): ConstructorModel {
    const model = this._constructor_;
    if (model && model.testSignature(_constructor_)) return model;
    return null;
  }

  load(json: ClassModelJson) {
    this.fields = {};

    if (json.fields) {
      for (const name of Object.keys(json.fields)) {
        this.fields[name] = new FieldModel(name, json.fields[name]);
      }
    }

    if (json.methods) {
      this.methods = {};
      for (const name of Object.keys(json.methods)) {
        this.methods[this.sanitizeMethodName(name)] = new MethodModel(name, json.methods[name]);
      }
    }

    if (json._constructor_) {
      this._constructor_ = new ConstructorModel(this, json._constructor_);
    }

    this.doc = new ClassDoc(json.doc);
  }

  save(): ClassModelJson {
    const fields: { [id: string]: FieldModelJson } = {};
    const methods: { [id: string]: MethodModelJson } = {};

    for (const fieldName in Object.keys(this.fields)) {
      const fieldModel = this.fields[fieldName];
      fields[fieldName] = fieldModel.save();
    }

    for (const name in Object.keys(this.methods)) {
      const methodModel = this.methods[name];
      methods[this.unsanitizeMethodName(name)] = methodModel.save();
    }

    const _constructor_ = this._constructor_.save();
    const doc = this.doc.save();

    return { fields, methods, _constructor_, doc };
  }
}

/**
 * **ClassJson**
 *
 * @author JabDoesThings
 */
export type ClassModelJson = {
  doc: ClassDocJson;
  _constructor_: ConstructorModelJson;
  fields: { [id: string]: FieldModelJson };
  methods: { [id: string]: MethodModelJson };
};
