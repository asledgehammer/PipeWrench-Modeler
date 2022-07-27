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
    let clazzModel = clazz.generateModel();
    this.luaLibrary.models.classes[clazz.name] = clazzModel;
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
      const e = this.$modelPane.append(method.generateDom());
      e.find('input[type=checkbox]').prop('checked', method.returns.applyUnknownType);
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

    const handleClassTarget = (element: HTMLElement, paths: string[]) => {
      if (paths[1] === 'lines') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        clazzModel.doc.lines.length = 0;
        for (let line of raw) {
          line = line.trim();
          if (line.length) clazzModel.doc.lines.push(line);
        }
      } else if (paths[1] === 'authors') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        clazzModel.doc.authors.length = 0;
        for (let line of raw) {
          line = line.trim();
          if (line.length) clazzModel.doc.authors.push(line);
        }
      }
    };

    const handleConstructorTarget = (element: HTMLElement, paths: string[]) => {
      if (paths[1] === 'lines') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        clazzModel._constructor_.doc.lines.length = 0;
        for (let line of raw) {
          line = line.trim();
          if (line.length) clazzModel._constructor_.doc.lines.push(line);
        }
      } else if (paths[2] === 'param') {
        const input = element as HTMLInputElement;
        const paramName = paths[3];
        const field = paths[4];
        const paramModel = clazzModel._constructor_.getParamModel(paramName);
        if (field === 'rename') {
          paramModel.rename = input.value.trim();
        } else if(field === 'lines') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.doc.lines.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.doc.lines.push(line);
          }
        } else if(field === 'types') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.types.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.types.push(line);
          }
        }
      }
    };

    const handleFieldTarget = (element: HTMLElement, target: string[]) => {
      const fieldName = target[1];

      const field = clazz.fields[fieldName];
      if(!field) {
        console.warn(`Could not locate the field in class: ${clazz.name}.${field.name}`)
        return;
      }

      const fieldModel = clazzModel.getField(field);
      if(!fieldModel) {
        console.warn(`Could not locate the FieldModel for field: ${clazz.name}.${field.name}`)
        return;
      }

      if(target[2] === 'lines') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        fieldModel.doc.lines.length = 0;
        for (let line of raw) fieldModel.doc.lines.push(line);
      } else if (target[2] === 'returntypes') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        fieldModel.types.length = 0;
        for (let line of raw) {
          line = line.trim();
          if (line.length) fieldModel.types.push(line);
        }
      }
    };

    const handleMethodTarget = (element: HTMLElement, target: string[]) => {
      const methodName = target[1];

      if(methodName === 'constructor') {
        handleConstructorTarget(element, target);
        return;
      }

      const method = clazz.methods[methodName];
      if(!method) {
        console.warn(`Could not locate the method in class: ${clazz.name}.${method.name}`)
        return;
      }

      const methodModel = clazzModel.getMethod(method);
      if(!methodModel) {
        console.warn(`Could not locate the MethodModel for field: ${clazz.name}.${method.name}`)
        return;
      }

      if(target[2] === 'lines') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        methodModel.doc.lines.length = 0;
        for (let line of raw) methodModel.doc.lines.push(line);
      } else if (target[2] === 'returntypes') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        methodModel.returns.types.length = 0;
        for (let line of raw) {
          line = line.trim();
          if (line.length) methodModel.returns.types.push(line);
        }
      } else if (target[2] === 'param') {
        const input = element as HTMLInputElement;
        const paramName = target[3];
        const field = target[4];
        const paramModel = methodModel.getParamModel(paramName);
        if (field === 'rename') {
          paramModel.rename = input.value.trim();
        } else if(field === 'lines') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.doc.lines.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.doc.lines.push(line);
          }
        } else if(field === 'types') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.types.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.types.push(line);
          }
        } 
      } else if(target[2] === 'wrapunknowntype') {
        const checkbox = element as HTMLInputElement;
        methodModel.returns.applyUnknownType = checkbox.checked;
      }
    };

    const updateCode = () => {
      let code = '';
      if (this.selectedClass) code = this.selectedClass.compile();
      const html = hljs.default.highlight(code, { language: 'typescript' }).value;
      let s = '<pre><code class="hljs language-typescript">' + html + '</code></pre>';

      this.$code.empty();
      this.$code.append(s);

      console.log(JSON.stringify(clazzModel.save(), null, 2));
    };

    // Any model-field with a target will fire this method. Changes to model values
    // are handled here.
    $('*[target]').on('input', function () {
      const target = this.getAttribute('target');
      if (target) {
        const paths = target.split(':');
        const type = paths[0];
        if (type === 'class') {
          handleClassTarget(this, paths);
        } else if (type === 'constructor') {
          handleConstructorTarget(this, paths);
        } else if (type === 'field') {
          handleFieldTarget(this, paths);
        } else if (type === 'method') {
          handleMethodTarget(this, paths);
        }
      }

      // Reflect the changes to the model by updating the code-panel.
      updateCode();
    });

    this.$modelPane.fadeIn();
    updateCode();
  }
}
