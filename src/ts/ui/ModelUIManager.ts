import * as fs from 'fs';
import * as hljs from 'highlight.js';
import * as electron from 'electron';
import * as prettier from 'prettier';
import { Generator } from '../Generator';
import { LuaClass } from '../lua/LuaClass';
import { LuaLibrary } from '../lua/LuaLibrary';
import { ClassModel } from '../lua/model/ClassModel';
import { ConstructorModel } from '../lua/model/ConstructorModel';
import { FieldModel } from '../lua/model/FieldModel';
import { FunctionModel } from '../lua/model/FunctionModel';
import { MethodModel } from '../lua/model/MethodModel';
import { ParamModel as ParameterModel } from '../lua/model/ParamModel';
import { TableModel } from '../lua/model/TableModel';
import { ModelFile } from '../lua/model/ModelFile';
import { LuaTable } from '../lua/LuaTable';

const { dialog } = require('electron').remote;

export class ModelUIManager {
  readonly leftPanel: HTMLDivElement;
  readonly centerPanel: HTMLDivElement;
  readonly rightPanel: HTMLDivElement;
  readonly modelPane: HTMLDivElement;
  readonly luaLibrary: LuaLibrary;
  readonly $modelPane: JQuery<HTMLDivElement>;
  readonly $code: JQuery<HTMLDivElement>;
  readonly $searchBar: JQuery;
  readonly $searchBarInput: JQuery;
  readonly $searchBarSuggestions: JQuery;
  modelFile: ModelFile;
  private path: string = null;

  selectedClass: LuaClass;
  selectedTable: LuaTable;

  readonly generator: Generator;

  constructor(luaLibrary: LuaLibrary) {
    this.luaLibrary = luaLibrary;

    this.generator = new Generator(this.luaLibrary);

    this.modelFile = new ModelFile(luaLibrary.models, 'untitled', '');

    this.leftPanel = $('.left-panel').get(0) as HTMLDivElement;
    this.centerPanel = $('.center-panel').get(0) as HTMLDivElement;
    this.rightPanel = $('.right-panel').get(0) as HTMLDivElement;

    this.modelPane = $(this.centerPanel).find('.model-pane').get(0);
    this.$modelPane = $(this.modelPane);

    this.$searchBar = $($('.search-bar').get(0));
    this.$searchBarInput = $(this.$searchBar.find('input').get(0));
    this.$searchBarSuggestions = $(this.$searchBar.find('.search-bar-suggestions').get(0));

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

    $(window).on('keypress', (event) => {
      if (event.ctrlKey) {
        if (event.originalEvent.code === 'KeyO') this.open();
        if (event.originalEvent.code === 'KeyS') this.save(!this.path || event.shiftKey);
        if (event.originalEvent.code === 'KeyG') this.generator.run();
      }
    });

    const _this = this;
    this.$searchBarInput.on('input', function () {
      const input = this as HTMLInputElement;
      const { value } = input;

      if (value.length) {
        _this.$searchBarSuggestions.show();
      } else {
        _this.$searchBarSuggestions.hide();
      }

      _this.$searchBarSuggestions.empty();

      if (!value.length) return;

      const matches: string[] = [];

      let allTypes: string[];
      let valueLower = value.toLowerCase();
      if (valueLower.indexOf('class:') === 0) {
        valueLower = valueLower.substring(6);
        const classNames = Object.keys(luaLibrary.classes);
        allTypes = [].concat(classNames);
      } else if (valueLower.indexOf('table:') === 0) {
        valueLower = valueLower.substring(6);
        const tableNames = Object.keys(luaLibrary.tables);
        allTypes = [].concat(tableNames);
      } else {
        const classNames = Object.keys(luaLibrary.classes).map((e) => `class:${e}`);
        const tableNames = Object.keys(luaLibrary.tables).map((e) => `table:${e}`);
        allTypes = [].concat(classNames, tableNames);
      }

      allTypes.sort((o1, o2) => o1.localeCompare(o2));

      for (const entry of allTypes) {
        if (
          entry
            .substring(entry.indexOf('class:'))
            .substring(entry.indexOf('table:'))
            .toLowerCase()
            .indexOf(valueLower) !== -1
        )
          matches.push(entry);
      }

      if (matches.length) {
        for (const match of matches) {
          const name = match.replace('class:', '').replace('table:', '');
          if (match.indexOf('class:') === 0) {
            _this.$searchBarSuggestions.append(`<label class="lua-class suggestion">${name}</label>`);
          } else if (match.indexOf('table:') === 0) {
            _this.$searchBarSuggestions.append(`<label class="lua-table suggestion">${name}</label>`);
          }
        }

        const clear = () => {
          _this.$searchBarInput.val('');
          _this.$searchBarSuggestions.empty();
          _this.$searchBarSuggestions.hide();
        };

        $('label.suggestion.lua-class').on('click', function () {
          const className = this.innerHTML;
          _this.setClass(className);
          clear();
        });

        $('label.suggestion.lua-table').on('click', function () {
          const tableName = this.innerHTML;
          _this.setTable(tableName);
          clear();
        });
      } else {
        _this.$searchBarSuggestions.hide();
      }
    });
  }

  open = (path: string = null) => {
    const open = (_path: string) => {
      if (_path == null) return;

      const { models } = this.luaLibrary;

      if (this.modelFile) {
        delete models.modelFiles[this.modelFile.id];
      }

      this.modelFile = models.loadFile(_path);
      this.modelFile.populate();

      const { classes, tables, globalFields, globalFunctions } = this.modelFile;

      for (const clazzName of Object.keys(classes)) {
        const clazz = this.luaLibrary.classes[clazzName];
        if(clazz) clazz.model = classes[clazzName];
      } 
      for (const tableName of Object.keys(tables)) {
        const table = this.luaLibrary.tables[tableName];
        if(table) table.model = tables[tableName];
      } 
      
      const classNames = Object.keys(classes);
      const tableNames = Object.keys(tables);

      const allNames = ([] as string[]).concat(classNames, tableNames);
      allNames.sort((o1, o2) => o1.localeCompare(o2));

      for (const name of allNames) {
        let dom = '';
        if (classNames.indexOf(name) !== -1) {
          dom = `<div class="item selected" element="${name}" onclick="setClass('${name}')"><label>${name}</label></div>`;
        } else if (tableNames.indexOf(name) !== -1) {
          dom = `<div class="item selected" element="${name}" onclick="setTable('${name}')"><label>${name}</label></div>`;
        }
        $('#class-list').append(dom);
      }
    };

    if (path == null) {
      interface DialogResult {
        canceled: boolean;
        filePaths: string[];
        bookmark: string;
      }

      const promise: Promise<electron.OpenDialogReturnValue> = dialog.showOpenDialog(null, {
        title: 'Open Model',
        buttonLabel: 'Open',
        filters: [{ name: 'PipeWrench Model', extensions: ['json'] }],
      });

      promise.then((result: DialogResult) => {
        if (result.canceled || result.filePaths == null || result.filePaths.length === 0) {
          return;
        }
        open(result.filePaths[0]);
      });
    } else {
      open(path);
    }
  };

  save = (as: boolean) => {
    if (as) {
      const { dialog } = require('electron').remote;

      interface DialogResult {
        canceled: boolean;
        filePath: string;
        bookmark: string;
      }

      const promise: Promise<electron.SaveDialogReturnValue> = dialog.showSaveDialog(null, {
        title: 'Save Model',
        buttonLabel: 'Save',
        filters: [{ name: 'PipeWrench Model', extensions: ['json'] }],
      });

      promise.then((result: DialogResult) => {
        if (result.canceled || result.filePath == null) {
          return;
        }

        // Ensure the file-name ends with the extension.
        let path = result.filePath;
        if (!path.toLowerCase().endsWith('.json')) {
          path += '.json';
        }

        this.modelFile.save(path);
      });
    }
  };

  clear() {
    this.clearList();
    this.clearModels();
    this.selectedClass = null;
    this.selectedTable = null;
  }

  clearList() {
    $('#class-list').empty();
  }

  clearModels() {
    this.$modelPane.empty();
  }

  setClass(className: string) {
    console.log(`setClass(${className})`);

    this.selectedTable = null;
    if (!className) {
      this.selectedClass = null;
      this.$modelPane.empty();
      $('#class-list .item').each(function () {
        $(this).removeClass('selected');
      });
      return;
    }

    // Make sure not to reload an already selected class.
    if (this.selectedClass && this.selectedClass.name === className) return;

    $('#class-list .item').each(function () {
      $(this).removeClass('selected');
    });

    const clazz = this.luaLibrary.classes[className];
    if (!clazz) return;

    this.selectedClass = clazz;

    let clazzModel = this.modelFile.classes[className];
    if (!clazzModel) {
      clazzModel = clazz.generateModel();
      $('#class-list').append(
        `<div class="item selected" element="${className}" onclick="setClass('${className}')">` +
          `<label>${className}</label>` +
          `</div>`
      );
    } else {
      $(`#class-list .item[element=${className}`).addClass('selected');
    }
    this.modelFile.classes[clazz.name] = clazzModel;
    this.luaLibrary.models.classes[clazz.name] = clazzModel;
    clazz.model = clazzModel;

    this.$modelPane.empty();

    this.$modelPane.append(clazzModel.generateDom());
    if (clazzModel._constructor_) {
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

        model.find('.textarea').each(function () {
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
        } else if (field === 'lines') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.doc.lines.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.doc.lines.push(line);
          }
        } else if (field === 'types') {
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
      if (!field) {
        console.warn(`Could not locate the field in class: ${clazz.name}.${field.name}`);
        return;
      }

      const fieldModel = clazzModel.getField(field);
      if (!fieldModel) {
        console.warn(`Could not locate the FieldModel for field: ${clazz.name}.${field.name}`);
        return;
      }

      if (target[2] === 'lines') {
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

      if (methodName === 'constructor') {
        handleConstructorTarget(element, target);
        return;
      }

      const method = clazz.methods[methodName];
      if (!method) {
        console.warn(`Could not locate the method in class: ${clazz.name}.${method.name}`);
        return;
      }

      const methodModel = clazzModel.getMethod(method);
      if (!methodModel) {
        console.warn(`Could not locate the MethodModel for field: ${clazz.name}.${method.name}`);
        return;
      }

      if (target[2] === 'lines') {
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
        } else if (field === 'lines') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.doc.lines.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.doc.lines.push(line);
          }
        } else if (field === 'types') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.types.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.types.push(line);
          }
        }
      } else if (target[2] === 'wrapunknowntype') {
        const checkbox = element as HTMLInputElement;
        methodModel.returns.applyUnknownType = checkbox.checked;
      }
    };

    const updateCode = () => {
      let code = '';
      if (this.selectedClass) code = this.selectedClass.compile();
      code = prettier.format(code, {
        singleQuote: true,
        bracketSpacing: true,
        parser: 'typescript',
        printWidth: 120,
      });
      const html = hljs.default.highlight(code, { language: 'typescript' }).value;
      let s = '<pre><code class="hljs language-typescript">' + html + '</code></pre>';

      this.$code.empty();
      this.$code.append(s);

      // console.log(JSON.stringify(clazzModel.save(), null, 2));
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

  setTable(tableName: string) {
    console.log(`setTable(${tableName})`);

    this.selectedClass = null;
    if (!tableName) {
      this.selectedTable = null;
      this.$modelPane.empty();
      $('#class-list .item').each(function () {
        $(this).removeClass('selected');
      });
      return;
    }

    // Make sure not to reload an already selected table.
    if (this.selectedTable && this.selectedTable.name === tableName) return;

    const table = this.luaLibrary.tables[tableName];
    if (!table) return;

    $('#class-list .item').each(function () {
      $(this).removeClass('selected');
    });

    this.selectedClass = null;
    this.selectedTable = table;
    let tableModel = this.modelFile.tables[tableName];
    if (!tableModel) {
      tableModel = table.generateModel();
      $('#class-list').append(
        `<div class="item selected" element="${tableName}" onclick="setTable('${tableName}')">` +
          `<label>${tableName}</label>` +
          `</div>`
      );
    } else {
      $(`#class-list .item[element=${tableName}`).addClass('selected');
    }
    this.modelFile.tables[table.name] = tableModel;
    this.luaLibrary.models.tables[table.name] = tableModel;
    table.model = tableModel;

    this.$modelPane.empty();
    this.$modelPane.append(tableModel.generateDom());

    const fieldNames = Object.keys(tableModel.fields);
    fieldNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const fieldName of fieldNames) {
      this.$modelPane.append(tableModel.fields[fieldName].generateDom());
    }

    const methodNames = Object.keys(tableModel.methods);
    methodNames.sort((o1, o2) => o1.localeCompare(o2));
    for (const methodName of methodNames) {
      const method = tableModel.methods[methodName];
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

        model.find('.textarea').each(function () {
          $(this).trigger('input');
        });
      } else {
        model.addClass('collapsed');
      }
    });

    const handleTableTarget = (element: HTMLElement, paths: string[]) => {
      if (paths[1] === 'lines') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        tableModel.doc.lines.length = 0;
        for (let line of raw) {
          line = line.trim();
          if (line.length) tableModel.doc.lines.push(line);
        }
      } else if (paths[1] === 'authors') {
        const textarea = element as HTMLTextAreaElement;
        const raw = textarea.value.split('\n');
        tableModel.doc.authors.length = 0;
        for (let line of raw) {
          line = line.trim();
          if (line.length) tableModel.doc.authors.push(line);
        }
      }
    };

    const handleFieldTarget = (element: HTMLElement, target: string[]) => {
      const fieldName = target[1];

      const field = table.fields[fieldName];
      if (!field) {
        console.warn(`Could not locate the field in class: ${table.name}.${field.name}`);
        return;
      }

      const fieldModel = tableModel.getField(field);
      if (!fieldModel) {
        console.warn(`Could not locate the FieldModel for field: ${table.name}.${field.name}`);
        return;
      }

      if (target[2] === 'lines') {
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

      const method = table.methods[methodName];
      if (!method) {
        console.warn(`Could not locate the method in table: ${table.name}.${method.name}`);
        return;
      }

      const methodModel = tableModel.getMethod(method);
      if (!methodModel) {
        console.warn(`Could not locate the MethodModel for field: ${table.name}.${method.name}`);
        return;
      }

      if (target[2] === 'lines') {
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
        } else if (field === 'lines') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.doc.lines.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.doc.lines.push(line);
          }
        } else if (field === 'types') {
          const textarea = element as HTMLTextAreaElement;
          const raw = textarea.value.split('\n');
          paramModel.types.length = 0;
          for (let line of raw) {
            line = line.trim();
            if (line.length) paramModel.types.push(line);
          }
        }
      } else if (target[2] === 'wrapunknowntype') {
        const checkbox = element as HTMLInputElement;
        methodModel.returns.applyUnknownType = checkbox.checked;
      }
    };

    const updateCode = () => {
      let code = '';
      if (this.selectedTable) code = this.selectedTable.compile();
      code = prettier.format(code, {
        singleQuote: true,
        bracketSpacing: true,
        parser: 'typescript',
        printWidth: 120,
      });

      const html = hljs.default.highlight(code, { language: 'typescript' }).value;
      let s = '<pre><code class="hljs language-typescript">' + html + '</code></pre>';

      this.$code.empty();
      this.$code.append(s);
    };

    // Any model-field with a target will fire this method. Changes to model values
    // are handled here.
    $('*[target]').on('input', function () {
      const target = this.getAttribute('target');
      if (target) {
        const paths = target.split(':');
        const type = paths[0];
        if (type === 'class') {
          handleTableTarget(this, paths);
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
