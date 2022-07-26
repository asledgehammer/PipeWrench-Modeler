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
      if(!fs.existsSync(path)) return '';
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
    if(!clazz) return;

    const updateCode = () => {

      let code = '';
      if(this.selectedClass) code = this.selectedClass.compile();
      const html = hljs.default.highlight(code, {language: 'typescript'}).value;
      let s = '<pre><code class="hljs language-typescript">' + html + '</code></pre>'
    
      // console.log(s);
      this.$code.empty();
      this.$code.append(s);
    };

    this.selectedClass = clazz;

    let clazzModel = this.luaLibrary.getClassModel(clazz);
    if(!clazzModel) clazzModel = clazz.generateModel();

    const dom = clazzModel.generateDom();

    this.$modelPane.empty();
    // this.$modelPane.fadeOut();
    this.$modelPane.append(dom);

    const $textAreas = this.$modelPane.find('textarea');
    $textAreas.each(function () {
      this.setAttribute('style', `height: ${this.scrollHeight}px; overflow-y:hidden;`);
    }).on('input', function () {
      this.style.height = 'auto';
      this.style.height = `${this.scrollHeight}px`;
    });

    $('textarea[target]').on('input', function() {
      const textarea = this as HTMLTextAreaElement;
      const target = this.getAttribute('target');
      if(target) {
        const paths = target.split(':');
        const clazzName = paths[0];
        const type = paths[1];
        const field = paths[2];

        if(type === 'class') {
          if(field === 'lines') {
            const raw = textarea.value.split('\n');
            clazzModel.doc.lines.length = 0;
            for(const line of raw) clazzModel.doc.lines.push(line);
          } else if(field === 'authors') {
            const raw = textarea.value.split('\n');
            clazzModel.doc.authors.length = 0;
            for(const line of raw) clazzModel.doc.authors.push(line);
          }
        }
      }

      updateCode();
    });

    this.$modelPane.fadeIn();

    
  }
}
