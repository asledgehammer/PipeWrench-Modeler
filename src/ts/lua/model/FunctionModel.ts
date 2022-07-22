import { DocBuilder } from '../../DocBuilder';
import { LuaFunction } from '../LuaFunction';
import { FunctionDoc, FunctionDocJson } from './doc/FunctionDoc';
import { ParamModel, ParamModelJson } from './ParamModel';

/**
 * **FunctionModel**
 *
 * @author JabDoesThings
 */
export class FunctionModel {
  doc: FunctionDoc;
  params: ParamModel[] = [];
  returns: { applyUnknownType: boolean; types: string[] } = { applyUnknownType: true, types: [] };
  readonly name: string;

  constructor(name: string, json?: FunctionModelJson) {
    this.name = name;
    if (json) this.load(json);
  }

  generateDoc(prefix: string, func: LuaFunction): string {

    if (!this.testSignature(func)) return '';

    const { doc: funcDoc, params } = this;

    const doc = new DocBuilder();
    doc.appendAnnotation('noSelf');

    if (funcDoc) {
      const { annotations, lines } = funcDoc;

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

  testSignature(func: LuaFunction): boolean {
    if(func.name !== this.name) return false;
    if(func.params.length !== this.params.length) return false;
    if(this.params.length) {
      for(let index = 0; index < this.params.length; index++) {
        if(!this.params[index].testSignature(func.params[index])) return false;
      }
    }
    return true;
  }

  load(json: FunctionModelJson) {
    this.doc = new FunctionDoc(json.doc);
    this.params = [];
    for (const param of json.params) {
      this.params.push(new ParamModel(param));
    }
    this.returns = json.returns;
  }

  save(): FunctionModelJson {
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
 * **FunctionModelJson**
 * 
 * @author JabDoesThings
 */
export type FunctionModelJson = {
  doc: FunctionDocJson;
  params: ParamModelJson[];
  returns: {
    applyUnknownType: boolean;
    types: string[];
  };
};
