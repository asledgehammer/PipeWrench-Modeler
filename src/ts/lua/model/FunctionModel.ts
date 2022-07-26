import { DocBuilder } from '../../DocBuilder';
import { LuaFunction } from '../LuaFunction';
import { FunctionDoc, FunctionDocJson } from './doc/FunctionDoc';
import { Model } from './Model';
import { ParamModel, ParamModelJson } from './ParamModel';
import { ReturnModel, ReturnModelJson } from './ReturnModel';

/**
 * **FunctionModel**
 *
 * @author JabDoesThings
 */
export class FunctionModel extends Model<FunctionModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly doc = new FunctionDoc();
  readonly params: ParamModel[] = [];
  readonly returns = new ReturnModel();
  readonly name: string;

  constructor(name: string, json?: FunctionModelJson) {
    super();
    this.name = name;
    if (json) this.load(json);
    this.dom = this.generateDom();
  }

  load(json: FunctionModelJson) {
    this.clear();
    if (json.doc) this.doc.load(json.doc);
    if (json.params) for (const param of json.params) this.params.push(new ParamModel(param));
    if (json.returns) this.returns.load(json.returns);
  }

  save(): FunctionModelJson {
    const doc = this.doc.save();
    const params = this.params.map((param) => param.save());
    const { returns } = this;
    return { doc, params, returns };
  }

  clear() {
    this.doc.clear();
    this.params.length = 0;
    this.returns.clear();
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

  generateDom(): string {
    return '';
  }

  testSignature(func: LuaFunction): boolean {
    if (func.name !== this.name) return false;
    if (func.params.length !== this.params.length) return false;
    if (this.params.length) {
      for (let index = 0; index < this.params.length; index++) {
        if (!this.params[index].testSignature(func.params[index])) return false;
      }
    }
    return true;
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
  returns: ReturnModelJson;
};
