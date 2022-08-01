"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaTable = void 0;
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const ModelUtils_1 = require("./model/ModelUtils");
const LuaContainer_1 = require("./LuaContainer");
const TableModel_1 = require("./model/TableModel");
class LuaTable extends LuaContainer_1.LuaContainer {
    constructor(file, name) {
        super(file, name, 'table');
        this.file = file;
    }
    generateModel() {
        const model = new TableModel_1.TableModel(this, this.name);
        model.populate();
        return model;
    }
    onCompile(prefix) {
        const { name } = this;
        const { library } = this.file;
        const model = library.getTableModel(this);
        let documentation = this.generateDocumentation(prefix, model);
        let s = documentation.length ? `${prefix}${documentation}\n` : '';
        if (this.isEmpty()) {
            return `${s}\n${prefix}export class ${ModelUtils_1.sanitizeName(name)} { static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE}; }`;
        }
        const { staticFields, nonStaticFields } = this.sortFields();
        const { staticMethods, nonStaticMethods } = this.sortMethods();
        const newPrefix = prefix + '  ';
        s += `${prefix}export class ${ModelUtils_1.sanitizeName(name)} {\n\n${newPrefix}private constructor();\n\n`;
        s += `${newPrefix}static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE};\n\n`;
        if (staticFields.length) {
            for (const field of staticFields)
                s += `${field.compile(newPrefix)}\n\n`;
        }
        if (nonStaticFields.length) {
            for (const field of nonStaticFields)
                s += `${field.compile(newPrefix)}\n\n`;
        }
        if (nonStaticMethods.length) {
            for (const method of nonStaticMethods)
                s += `${method.compile(newPrefix)}\n\n`;
        }
        if (staticMethods.length) {
            for (const method of staticMethods)
                s += `${method.compile(newPrefix)}\n\n`;
        }
        return `${s}${prefix}}`;
    }
    generateDocumentation(prefix, model) {
        return model ? model.generateDocumentation(prefix) : '';
    }
    generateAPI(prefix) {
        const { library } = this.file;
        const model = library.getTableModel(this);
        const documentation = this.generateDocumentation(prefix, model);
        return `${prefix}${documentation ? `${documentation}\n` : ''}${prefix}export class ${ModelUtils_1.sanitizeName(this.name)} {}`;
    }
    generateLuaInterface(prefix = '') {
        const { name } = this;
        return `${prefix}Exports.${ModelUtils_1.sanitizeName(name)} = loadstring("return _G['${name}']")()\n`;
    }
    isEmpty() {
        return !Object.keys(this.fields).length && !Object.keys(this.methods).length;
    }
}
exports.LuaTable = LuaTable;
