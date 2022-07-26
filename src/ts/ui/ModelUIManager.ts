import * as fs from 'fs';
import * as hljs from 'highlight.js';
import { LuaClass } from '../lua/LuaClass';
import { LuaLibrary } from '../lua/LuaLibrary';
import { ClassModel } from '../lua/model/ClassModel';
import { ConstructorModel } from '../lua/model/ConstructorModel';
import { FieldModel } from '../lua/model/FieldModel';
import { FunctionModel } from '../lua/model/FunctionModel';
import { MethodModel } from '../lua/model/MethodModel';
import { ParamModel as ParameterModel } from '../lua/model/ParamModel';
import { TableModel } from '../lua/model/TableModel';

export class ModelUIManager {
  readonly leftPanel: HTMLDivElement;
  readonly centerPanel: HTMLDivElement;
  readonly rightPanel: HTMLDivElement;

  readonly modelPane: HTMLDivElement;
  readonly $modelPane: JQuery<HTMLDivElement>;

  readonly luaLibrary: LuaLibrary;
  selectedClass: LuaClass;

  readonly $code: JQuery<HTMLDivElement>;

  constructor(luaLibrary: LuaLibrary) {
    this.luaLibrary = luaLibrary;
    this.leftPanel = $('.left-panel').get(0) as HTMLDivElement;
    this.centerPanel = $('.center-panel').get(0) as HTMLDivElement;
    this.rightPanel = $('.right-panel').get(0) as HTMLDivElement;

    this.modelPane = $(this.centerPanel).find('.model-pane').get(0);
    this.$modelPane = $(this.modelPane);

    this.$code = $('#code');

    const dir = './assets/html';
    const getModelTemplate = (id: string): string => {
      const path = `${dir}/model_${id}_template.html`;
      if (!fs.existsSync(path)) return '';
      return fs.readFileSync(path).toString();
    };

    ClassModel.HTML_TEMPLATE = getModelTemplate('class');
    TableModel.HTML_TEMPLATE = getModelTemplate('table');
    ConstructorModel.HTML_TEMPLATE = getModelTemplate('constructor');
    FieldModel.HTML_TEMPLATE = getModelTemplate('field');
    MethodModel.HTML_TEMPLATE = getModelTemplate('method');
    FunctionModel.HTML_TEMPLATE = getModelTemplate('function');
    ParameterModel.HTML_TEMPLATE = getModelTemplate('parameter');
  }

  setClass(className: string) {
    const clazz = this.luaLibrary.classes[className];
    if (!clazz) return;

    this.selectedClass = clazz;

    const updateCode = () => {
      let code = '';
      if (this.selectedClass) code = this.selectedClass.compile();
      const html = hljs.default.highlight(code, { language: 'typescript' }).value;
      let s = '<pre><code class="hljs language-typescript">' + html + '</code></pre>';

      this.$code.empty();
      this.$code.append(s);
    };

    let clazzModel = clazz.generateModel();
    clazz.model = clazzModel;

    this.$modelPane.empty();

    this.$modelPane.append(clazzModel.generateDom());
    if(clazzModel._constructor_) {
      this.$modelPane.append(clazzModel._constructor_.generateDom());
    }

    const fieldNames = Object.keys(clazzModel.fields);
    fieldNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const fieldName of fieldNames) {
      this.$modelPane.append(clazzModel.fields[fieldName].generateDom());
    }

    const methodNames = Object.keys(clazzModel.methods);
    methodNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const methodName of methodNames) {
      const method = clazzModel.methods[methodName];
      this.$modelPane.append(method.generateDom());
    }

    const $textAreas = this.$modelPane.find('textarea');
    $textAreas
      .each(function () {
        this.setAttribute('style', `height: ${this.scrollHeight}px; overflow-y:hidden;`);
      })
      .on('input', function () {
        this.style.height = 'auto';
        this.style.height = `${this.scrollHeight}px`;
      });

    $('.collapse-button').on('click', function () {
      const model = $($($(this).parent()).parent());

      if (model.hasClass('collapsed')) {
        model.removeClass('collapsed');

        model.find('.textarea').each(function() {
          $(this).trigger('input');
        });
      } else {
        model.addClass('collapsed');
      }
    });

    $('*[target]').on('input', function () {
      const textarea = this as HTMLTextAreaElement;
      const target = this.getAttribute('target');
      if (target) {
        const paths = target.split(':');
        console.log(paths);

        if (paths[0] === 'class') {
          if (paths[1] === 'lines') {
            const raw = textarea.value.split('\n');
            clazzModel.doc.lines.length = 0;
            for (let line of raw) {
              line = line.trim();
              if (line.length) clazzModel.doc.lines.push(line);
            }
          } else if (paths[1] === 'authors') {
            const raw = textarea.value.split('\n');
            clazzModel.doc.authors.length = 0;
            for (let line of raw) {
              line = line.trim();
              if (line.length) clazzModel.doc.authors.push(line);
            }
          }
        } else if (paths[0] === 'constructor') {
          if (paths[1] === 'lines') {
            const raw = textarea.value.split('\n');
            clazzModel._constructor_.doc.lines.length = 0;
            for (let line of raw) {
              line = line.trim();
              if (line.length) clazzModel._constructor_.doc.lines.push(line);
            }
          } else if (paths[1] === 'param') {
            const paramName = paths[2];
            const field = paths[3];
            const paramModel = clazzModel._constructor_.getParamModel(paramName);
            if (field === 'rename') {
              console.log(textarea.value);
              paramModel.rename = textarea.value.trim();
            } else if(field === 'lines') {
              const raw = textarea.value.split('\n');
              paramModel.doc.lines.length = 0;
              for (let line of raw) {
                line = line.trim();
                if (line.length) paramModel.doc.lines.push(line);
              }
            } else if(field === 'types') {
              const raw = textarea.value.split('\n');
              paramModel.types.length = 0;
              for (let line of raw) {
                line = line.trim();
                if (line.length) paramModel.types.push(line);
              }
            }
          }
        }
      }

      updateCode();
    });

    this.$modelPane.fadeIn();
    updateCode();
  }
}
