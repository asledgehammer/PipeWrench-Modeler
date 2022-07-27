import { DocBuilder } from '../../DocBuilder';
import { LuaMethod } from '../LuaMethod';
import { MethodDoc, MethodDocJson } from './doc/MethodDoc';
import { Model } from './Model';
import { ParamModel, ParamModelJson } from './ParamModel';
import { ReturnModel, ReturnModelJson } from './ReturnModel';

/**
 * **MethodModel**
 *
 * @author JabDoesThings
 */
export class MethodModel extends Model<MethodModelJson> {
  /** (Loaded via {@link ModelUIManager}) */
  static HTML_TEMPLATE: string = '';

  readonly doc = new MethodDoc();
  readonly params: ParamModel[] = [];
  readonly returns = new ReturnModel();
  readonly name: string;

  constructor(name: string, src?: MethodModelJson | LuaMethod) {
    super();
    this.name = name;
    if (src) {
      if (src instanceof LuaMethod) {
        this.create(src);
      } else {
        this.load(src);
      }
    }
  }

  create(method: LuaMethod) {
    for (const param of method.params) {
      this.params.push(new ParamModel(this.name, param));
    }
  }

  load(json: MethodModelJson) {
    this.clear();
    if (json.doc) this.doc.load(json.doc);
    if (json.params) for (const param of json.params) this.params.push(new ParamModel(this.name, param));
    if (json.returns) this.returns.load(json.returns);
  }

  save(): MethodModelJson {
    let doc: MethodDocJson = undefined;
    if (this.doc && !this.doc.isDefault()) doc = this.doc.save();

    let params: ParamModelJson[] = undefined;
    let oneParamChanged = false;
    for (const param of this.params) {
      if(!param.isDefault()) {
        oneParamChanged = true;
        break;
      }
    }
    if(oneParamChanged) {
      params = [];
      for (const param of this.params) {
        params.push(param.save());
      }
    }

    let returns: ReturnModelJson = undefined;
    if (this.returns && !this.returns.isDefault()) {
      returns = this.returns.save();
    }

    return { doc, params, returns };
  }

  clear() {
    this.doc.clear();
    this.params.length = 0;
    this.returns.clear();
  }

  generateDoc(prefix: string, method: LuaMethod): string {
    if (!this.testSignature(method)) return '';

    const doc = new DocBuilder();
    if (method.isStatic) doc.appendAnnotation('noSelf');

    const { doc: methodDoc, params } = this;
    if (methodDoc) {
      const { lines } = methodDoc;

      // Process lines. (If defined)
      if (lines && lines.length) {
        let oneLine = false;
        for (let line of lines) {
          if (!oneLine) {
            line = line.trim();
            if (line.length) {
              doc.appendLine(line);
              oneLine = true;
            }
          } else {
            doc.appendLine(line);
          }
        }
        if (oneLine) doc.appendLine();
      }

      // Process params. (If defined)
      if (params) {
        for (const param of params) {
          const { name, doc: paramDoc } = param;

          if (!paramDoc) {
            continue;
          } else {
            const { lines } = paramDoc;

            // No lines.
            if (!lines || !lines.length) continue;

            // Print first line as param.
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
    return !doc.isEmpty() ? doc.build(prefix) : '';
  }

  generateDom(): string {
    let dom = MethodModel.HTML_TEMPLATE;

    const replaceAll = (from: string, to: string) => {
      const fromS = '${' + from + '}';
      while (dom.indexOf(fromS) !== -1) dom = dom.replace(fromS, to);
    };

    let linesS = '';

    const { doc } = this;
    if (doc) {
      const { lines } = doc;
      if (lines) {
        linesS = '';
        for (const line of lines) linesS += `${line}\n`;
        linesS = linesS.substring(0, linesS.length - 1);
      }
    }

    let paramsS = '';
    if (this.params.length) {
      for (const param of this.params) {
        paramsS += param.generateDom();
      }
    }

    replaceAll('HAS_PARAMS', this.params.length ? 'inline-block' : 'none');
    replaceAll('METHOD_NAME', this.name);
    replaceAll('LINES', linesS);
    replaceAll('PARAMS', paramsS);

    return dom;
  }

  testSignature(func: LuaMethod): boolean {
    if (func.name !== this.name) return false;
    if (func.params.length !== this.params.length) return false;
    if (this.params.length) {
      for (let index = 0; index < this.params.length; index++) {
        if (!this.params[index].testSignature(func.params[index])) return false;
      }
    }
    return true;
  }

  getParamModel(id: string) {
    for (const param of this.params) {
      if (param.id === id) return param;
    }
    return null;
  }

  isDefault(): boolean {
    if (this.doc && !this.doc.isDefault()) return false;
    if (this.returns && !this.returns.isDefault()) return false;
    for (const param of this.params) if (!param.isDefault) return false;
    return true;
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
  returns: ReturnModelJson;
};
