import { DocBuilder } from '../../DocBuilder';
import { LuaMethod } from '../LuaMethod';
import { MethodDoc, MethodDocJson } from './doc/MethodDoc';
import { ParamModel, ParamModelJson } from './ParamModel';

/**
 * **MethodModel**
 *
 * @author JabDoesThings
 */
export class MethodModel {
  doc: MethodDoc;
  params: ParamModel[] = [];
  returns: { applyUnknownType: boolean; types: string[] } = { applyUnknownType: true, types: [] };
  readonly name: string;

  constructor(name: string, json?: MethodModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  generateDoc(prefix: string, method: LuaMethod): string {

    if (!this.testSignature(method)) return '';

    const doc = new DocBuilder();
    if(method.isStatic) doc.appendAnnotation('noSelf');

    const { doc: methodDoc, params } = this;
    if (methodDoc) {
      const { annotations, lines } = methodDoc;

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

  testSignature(func: LuaMethod): boolean {
    if(func.name !== this.name) return false;
    if(func.params.length !== this.params.length) return false;
    if(this.params.length) {
      for(let index = 0; index < this.params.length; index++) {
        if(!this.params[index].testSignature(func.params[index])) return false;
      }
    }
    return true;
  }

  load(json: MethodModelJson) {
    this.doc = new MethodDoc(json.doc);
    this.params = [];
    for (const param of json.params) {
      this.params.push(new ParamModel(param));
    }
    this.returns = json.returns;
  }

  save(): MethodModelJson {
    const doc = this.doc.save();
    const params: ParamModelJson[] = [];
    for (const param of this.params) {
      params.push(param.save());
    }
    const returns = this.returns;
    return { doc, params, returns };
  }
}

/**
 * **MethodModelJson**
 * 
 * @author JabDoesThings
 */
export type MethodModelJson = {
  doc: MethodDocJson;
  params: ParamModelJson[];
  returns: {
    applyUnknownType: boolean;
    types: string[];
  };
};
