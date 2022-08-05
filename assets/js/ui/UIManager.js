"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelUIManager = void 0;
const { dialog } = require('electron').remote;
const fs = __importStar(require("fs"));
const hljs = __importStar(require("highlight.js"));
const prettier = __importStar(require("prettier"));
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const LuaClass_1 = require("../lua/LuaClass");
const LuaTable_1 = require("../lua/LuaTable");
const ClassModel_1 = require("../lua/model/ClassModel");
const TableModel_1 = require("../lua/model/TableModel");
const FunctionModel_1 = require("../lua/model/FunctionModel");
const ConstructorModel_1 = require("../lua/model/ConstructorModel");
const FieldModel_1 = require("../lua/model/FieldModel");
const MethodModel_1 = require("../lua/model/MethodModel");
const ParamModel_1 = require("../lua/model/ParamModel");
const Utils_1 = require("../Utils");
/** @author JabDoesThings */
class ModelUIManager {
    constructor(luaLibrary) {
        this.path = null;
        this.open = (path = null) => {
            const open = (_path) => {
                if (_path == null)
                    return;
                const { models } = this.luaLibrary;
                if (this.modelFile) {
                    delete models.modelFiles[this.modelFile.id];
                }
                this.modelFile = models.loadFile(_path);
                this.modelFile.populate();
                const { classes, tables, globalFields, globalFunctions } = this.modelFile;
                for (const className of Object.keys(classes)) {
                    const _class_ = this.luaLibrary.classes[className];
                    // if (_class_) _class_.model = classes[className];
                }
                for (const tableName of Object.keys(tables)) {
                    const table = this.luaLibrary.tables[tableName];
                    // if (table) table.model = tables[tableName];
                }
                const classNames = Object.keys(classes);
                const tableNames = Object.keys(tables);
                const allNames = [].concat(classNames, tableNames);
                allNames.sort((o1, o2) => o1.localeCompare(o2));
                for (const name of allNames) {
                    let dom = '';
                    if (classNames.indexOf(name) !== -1) {
                        dom = `<div class="item selected" element="${name}" onclick="setClass('${name}')"><label>${name}</label></div>`;
                    }
                    else if (tableNames.indexOf(name) !== -1) {
                        dom = `<div class="item selected" element="${name}" onclick="setTable('${name}')"><label>${name}</label></div>`;
                    }
                    $('#class-list').append(dom);
                }
            };
            if (path == null) {
                const promise = dialog.showOpenDialog(null, {
                    title: 'Open Model',
                    buttonLabel: 'Open',
                    filters: [{ name: 'PipeWrench Model', extensions: ['json'] }],
                });
                promise.then((result) => {
                    if (result.canceled || result.filePaths == null || result.filePaths.length === 0) {
                        return;
                    }
                    open(result.filePaths[0]);
                });
            }
            else {
                open(path);
            }
        };
        this.save = (as) => {
            if (as) {
                const { dialog } = require('electron').remote;
                const promise = dialog.showSaveDialog(null, {
                    title: 'Save Model',
                    buttonLabel: 'Save',
                    filters: [{ name: 'PipeWrench Model', extensions: ['json'] }],
                });
                promise.then((result) => {
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
        this.luaLibrary = luaLibrary;
        this.generator = new ZomboidGenerator_1.ZomboidGenerator(this.luaLibrary);
        this.modelFile = this.luaLibrary.models.createFile('untitled');
        this.leftPanel = $('.left-panel').get(0);
        this.centerPanel = $('.center-panel').get(0);
        this.rightPanel = $('.right-panel').get(0);
        // @ts-ignore
        this.modelPane = $(this.centerPanel).find('.model-pane').get(0);
        this.$modelPane = $(this.modelPane);
        this.$searchBar = $($('.search-bar').get(0));
        this.$searchBarInput = $(this.$searchBar.find('input').get(0));
        this.$searchBarSuggestions = $(this.$searchBar.find('.search-bar-suggestions').get(0));
        this.$code = $('#code');
        const dir = './assets/html';
        const getModelTemplate = (id) => {
            const path = `${dir}/model_${id}_template.html`;
            if (!fs.existsSync(path))
                return '';
            return fs.readFileSync(path).toString();
        };
        ClassModel_1.ClassModel.HTML_TEMPLATE = getModelTemplate('class');
        TableModel_1.TableModel.HTML_TEMPLATE = getModelTemplate('table');
        ConstructorModel_1.ConstructorModel.HTML_TEMPLATE = getModelTemplate('constructor');
        FieldModel_1.FieldModel.HTML_TEMPLATE = getModelTemplate('field');
        FunctionModel_1.FunctionModel.HTML_TEMPLATE = MethodModel_1.MethodModel.HTML_TEMPLATE = getModelTemplate('method');
        ParamModel_1.ParameterModel.HTML_TEMPLATE = getModelTemplate('parameter');
        $(window).on('keypress', (event) => {
            if (event.ctrlKey) {
                if (event.originalEvent.code === 'KeyO')
                    this.open();
                if (event.originalEvent.code === 'KeyS')
                    this.save(!this.path || event.shiftKey);
                if (event.originalEvent.code === 'KeyG')
                    this.generator.run();
            }
        });
        const _this = this;
        this.$searchBarInput.on('input', function () {
            const input = this;
            const { value } = input;
            if (value.length) {
                _this.$searchBarSuggestions.show();
            }
            else {
                _this.$searchBarSuggestions.hide();
            }
            _this.$searchBarSuggestions.empty();
            if (!value.length)
                return;
            const matches = [];
            let allTypes;
            let valueLower = value.toLowerCase();
            if (valueLower.indexOf('class:') === 0) {
                valueLower = valueLower.substring(6);
                const classNames = Object.keys(luaLibrary.classes);
                allTypes = [].concat(classNames);
            }
            else if (valueLower.indexOf('table:') === 0) {
                valueLower = valueLower.substring(6);
                const tableNames = Object.keys(luaLibrary.tables);
                allTypes = [].concat(tableNames);
            }
            else {
                const classNames = Object.keys(luaLibrary.classes).map((e) => `class:${e}`);
                const tableNames = Object.keys(luaLibrary.tables).map((e) => `table:${e}`);
                allTypes = [].concat(classNames, tableNames);
            }
            allTypes.sort((o1, o2) => o1.localeCompare(o2));
            for (const entry of allTypes) {
                if (entry
                    .substring(entry.indexOf('class:'))
                    .substring(entry.indexOf('table:'))
                    .toLowerCase()
                    .indexOf(valueLower) !== -1)
                    matches.push(entry);
            }
            if (matches.length) {
                for (const match of matches) {
                    const name = match.replace('class:', '').replace('table:', '');
                    if (match.indexOf('class:') === 0) {
                        _this.$searchBarSuggestions.append(`<label class="lua-class suggestion">${name}</label>`);
                    }
                    else if (match.indexOf('table:') === 0) {
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
            }
            else {
                _this.$searchBarSuggestions.hide();
            }
        });
    }
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
    handleClassTarget(model, element, paths) {
        if (paths[1] === 'description') {
            const textarea = element;
            Utils_1.applyTextArea(textarea, model.documentation.description);
        }
        else if (paths[1] === 'doc_authors') {
            const textarea = element;
            Utils_1.applyTextArea(textarea, model.documentation.authors);
        }
    }
    handleTableTarget(model, element, paths) {
        if (paths[1] === 'description') {
            const textarea = element;
            Utils_1.applyTextArea(textarea, model.documentation.description);
        }
        else if (paths[1] === 'doc_authors') {
            const textarea = element;
            Utils_1.applyTextArea(textarea, model.documentation.authors);
        }
    }
    handleConstructorTarget(container, element, paths) {
        const classModel = this.luaLibrary.models.getClassModel(container);
        const { _constructor_ } = classModel;
        if (paths[2] === 'description') {
            const textarea = element;
            Utils_1.applyTextArea(textarea, _constructor_.documentation.description);
        }
        else if (paths[2] === 'parameter') {
            const input = element;
            const parameterName = paths[3];
            const parameterModel = _constructor_.getParameterModel(parameterName);
            const field = paths[4];
            if (field === 'rename') {
                parameterModel.rename = input.value.trim();
            }
            else if (field === 'description') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, parameterModel.documentation.description);
            }
            else if (field === 'types') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, parameterModel.types);
            }
        }
    }
    handleFieldTarget(container, element, target) {
        const name = target[1];
        const field = container.fields[name];
        if (!field) {
            console.warn(`Could not locate the field in container: ${container.name}.${field.name}`);
            return;
        }
        let model;
        if (container instanceof LuaClass_1.LuaClass) {
            const classModel = this.luaLibrary.models.getClassModel(container);
            model = classModel === null || classModel === void 0 ? void 0 : classModel.getFieldModel(field);
        }
        else if (container instanceof LuaTable_1.LuaTable) {
            const tableModel = this.luaLibrary.models.getTableModel(container);
            model = tableModel === null || tableModel === void 0 ? void 0 : tableModel.getFieldModel(field);
        }
        if (!model) {
            console.warn(`Could not locate the FieldModel for field: ${container.name}.${field.name}`);
            return;
        }
        if (target[2] === 'description') {
            const textarea = element;
            Utils_1.applyTextArea(textarea, model.documentation.description);
        }
        else if (target[2] === 'return') {
            const { _return_ } = model;
            if (target[3] === 'types') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, _return_.types);
            }
            else if (target[3] === 'description') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, _return_.description);
            }
        }
    }
    handleMethodTarget(container, element, target) {
        const name = target[1];
        if (name === 'constructor') {
            this.handleConstructorTarget(container, element, target);
            return;
        }
        const method = container.methods[name];
        if (!method) {
            console.warn(`Could not locate method: ${container.name}.${method.name}`);
            return;
        }
        let model;
        if (container instanceof LuaClass_1.LuaClass) {
            const classModel = this.luaLibrary.models.getClassModel(container);
            model = classModel === null || classModel === void 0 ? void 0 : classModel.getMethodModel(method);
        }
        else if (container instanceof LuaTable_1.LuaTable) {
            const tableModel = this.luaLibrary.models.getTableModel(container);
            model = tableModel === null || tableModel === void 0 ? void 0 : tableModel.getMethodModel(method);
        }
        if (!model) {
            console.warn(`Could not locate MethodModel: ${container.name}.${method.name}`);
            return;
        }
        if (target[2] === 'description') {
            const textarea = element;
            Utils_1.applyTextArea(textarea, model.documentation.description);
        }
        else if (target[2] === 'parameter') {
            const input = element;
            const parameterName = target[3];
            const field = target[4];
            const parameterModel = model.getParameterModel(parameterName);
            if (field === 'rename') {
                parameterModel.rename = input.value.trim();
            }
            else if (field === 'description') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, parameterModel.documentation.description);
            }
            else if (field === 'types') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, parameterModel.types);
            }
        }
        else if (target[2] === 'return') {
            const { _return_ } = model;
            if (target[3] === 'types') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, _return_.types);
            }
            else if (target[3] === 'description') {
                const textarea = element;
                Utils_1.applyTextArea(textarea, _return_.description);
            }
            else if (target[3] === 'wrap_wildcard_type') {
                const checkbox = element;
                model._return_.wrapWildcardType = checkbox.checked;
            }
        }
    }
    ;
    setCode(code) {
        if (!code || !code.length) {
            this.$code.empty();
            return;
        }
        code = prettier.format(code, {
            singleQuote: true,
            bracketSpacing: true,
            parser: 'typescript',
            printWidth: 120,
        });
        const html = hljs.default.highlight(code, { language: 'typescript' }).value;
        code = `<pre><code class="hljs language-typescript">${html}</code></pre>`;
        this.$code.empty();
        this.$code.append(code);
    }
    setClass(className) {
        // console.log(`setClass(${className})`);
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
        if (this.selectedClass && this.selectedClass.name === className)
            return;
        $('#class-list .item').each(function () {
            $(this).removeClass('selected');
        });
        const _class_ = this.luaLibrary.classes[className];
        if (!_class_)
            return;
        this.selectedClass = _class_;
        let classModel = this.modelFile.classes[className];
        if (!classModel) {
            classModel = _class_.generateModel();
            this.modelFile.library.classes[className] = classModel;
            $('#class-list').append(`<div class="item selected" element="${className}" onclick="setClass('${className}')">` +
                `<label>${className}</label>` +
                `</div>`);
        }
        else {
            $(`#class-list .item[element=${className}`).addClass('selected');
        }
        this.modelFile.classes[_class_.name] = classModel;
        this.luaLibrary.models.classes[_class_.name] = classModel;
        this.$modelPane.empty();
        this.$modelPane.append(classModel.generateDom());
        if (classModel._constructor_) {
            this.$modelPane.append(classModel._constructor_.generateDom());
        }
        const fieldNames = Object.keys(classModel.fields);
        fieldNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const fieldName of fieldNames) {
            this.$modelPane.append(classModel.fields[fieldName].generateDom());
        }
        const methodNames = Object.keys(classModel.methods);
        methodNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const methodName of methodNames) {
            const method = classModel.methods[methodName];
            const e = this.$modelPane.append(method.generateDom());
            e.find('input[type=checkbox]').prop('checked', method._return_.wrapWildcardType);
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
            }
            else {
                model.addClass('collapsed');
            }
        });
        const _this_ = this;
        // Any model-field with a target will fire this method. Changes to model values
        // are handled here.
        $('*[target]').on('input', function () {
            const target = this.getAttribute('target');
            if (target) {
                const paths = target.split(':');
                const type = paths[0];
                if (type === 'class') {
                    _this_.handleClassTarget(classModel, this, paths);
                }
                else if (type === 'constructor') {
                    _this_.handleConstructorTarget(_class_, this, paths);
                }
                else if (type === 'field') {
                    _this_.handleFieldTarget(_class_, this, paths);
                }
                else if (type === 'method') {
                    _this_.handleMethodTarget(_class_, this, paths);
                }
            }
            // Reflect the changes to the model by updating the code-panel.
            _this_.setCode(_class_.compile());
        });
        this.$modelPane.fadeIn();
        this.setCode(_class_.compile());
    }
    setTable(tableName) {
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
        if (this.selectedTable && this.selectedTable.name === tableName)
            return;
        const table = this.luaLibrary.tables[tableName];
        if (!table)
            return;
        $('#class-list .item').each(function () {
            $(this).removeClass('selected');
        });
        this.selectedClass = null;
        this.selectedTable = table;
        let tableModel = this.modelFile.tables[tableName];
        if (!tableModel) {
            tableModel = table.generateModel();
            this.modelFile.library.tables[tableName] = tableModel;
            $('#class-list').append(`<div class="item selected" element="${tableName}" onclick="setTable('${tableName}')">` +
                `<label>${tableName}</label>` +
                `</div>`);
        }
        else {
            $(`#class-list .item[element=${tableName}`).addClass('selected');
        }
        this.modelFile.tables[table.name] = tableModel;
        this.luaLibrary.models.tables[table.name] = tableModel;
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
            e.find('input[type=checkbox]').prop('checked', method._return_.wrapWildcardType);
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
            }
            else {
                model.addClass('collapsed');
            }
        });
        const _this_ = this;
        // Any model-field with a target will fire this method. Changes to model values
        // are handled here.
        $('*[target]').on('input', function () {
            const target = this.getAttribute('target');
            if (target) {
                const paths = target.split(':');
                const type = paths[0];
                if (type === 'table') {
                    _this_.handleTableTarget(tableModel, this, paths);
                }
                else if (type === 'field') {
                    _this_.handleFieldTarget(table, this, paths);
                }
                else if (type === 'method') {
                    _this_.handleMethodTarget(table, this, paths);
                }
            }
            // Reflect the changes to the model by updating the code-panel.
            _this_.setCode(table.compile());
        });
        this.$modelPane.fadeIn();
        this.setCode(table.compile());
    }
}
exports.ModelUIManager = ModelUIManager;
