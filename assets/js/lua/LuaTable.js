"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaTable = void 0;
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const ModelUtils_1 = require("./model/ModelUtils");
const LuaContainer_1 = require("./LuaContainer");
const TableModel_1 = require("./model/TableModel");
/**
 * **LuaTable** represents tables that are not pseudo-classes.
 *
 * All functions that are assigned with ':' indexers are interpreted as methods. Functions that
 * are assigned with '.' are considered as static functions.
 *
 * All 'self.<property>' calls are interpreted as fields in the pseudo-class. All
 * '<class>.<property>' calls are interpreted as static fields.
 *
 * @author JabDoesThings
 */
class LuaTable extends LuaContainer_1.LuaContainer {
    /**
     * @param file The file containing the table declaration.
     * @param name The name of the table. (In global)
     */
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
        // Render empty tables on one line.
        if (this.isEmpty()) {
            return `${s}\n${prefix}export abstract class ${ModelUtils_1.sanitizeName(name)} { static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE}; }`;
        }
        const { staticFields, nonStaticFields } = this.sortFields();
        const { staticMethods, nonStaticMethods } = this.sortMethods();
        const newPrefix = prefix + '  ';
        // Make sure that no one can try to use Lua tables as a class, even though we're using
        // the class type for tables. This is to keep things clean. We *could* go with an interface,
        // however values cannot be assigned to them in TypeScript like tables can in Lua.
        s += `${prefix}export abstract class ${ModelUtils_1.sanitizeName(name)} {\n\n`;
        // Wildcard.
        s += `${newPrefix}static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE};\n\n`;
        // Render static field(s). (If any)
        if (staticFields.length) {
            for (const field of staticFields)
                s += `${field.compile(newPrefix)}\n\n`;
        }
        // Render static field(s). (If any)
        if (nonStaticFields.length) {
            for (const field of nonStaticFields)
                s += `${field.compile(newPrefix)}\n\n`;
        }
        // Render static method(s). (If any)
        if (nonStaticMethods.length) {
            for (const method of nonStaticMethods)
                s += `${method.compile(newPrefix)}\n\n`;
        }
        // Render static method(s). (If any)
        if (staticMethods.length) {
            for (const method of staticMethods)
                s += `${method.compile(newPrefix)}\n\n`;
        }
        // End of Table Declaration line.
        return `${s}${prefix}}`;
    }
    generateDocumentation(prefix, model) {
        return model ? model.generateDocumentation(prefix) : '';
    }
    generateAPI(prefix) {
        const { library } = this.file;
        // Render the class documentation. (If present)
        const model = library.getTableModel(this);
        const documentation = this.generateDocumentation(prefix, model);
        // Render empty classes on one line.
        return `${prefix}${documentation ? `${documentation}\n` : ''}${prefix}export abstract class ${ModelUtils_1.sanitizeName(this.name)} extends ${this.fullPath} {}`;
    }
    generateLuaInterface(prefix = '') {
        const { name } = this;
        return `${prefix}Exports.${ModelUtils_1.sanitizeName(name)} = loadstring("return _G['${name}']")()\n`;
    }
    isEmpty() {
        return !Object.keys(this.fields).length && !Object.keys(this.methods).length;
    }
    get namespace() {
        return this.file.containerNamespace;
    }
    get fullPath() {
        return `${this.namespace}.${ModelUtils_1.sanitizeName(this.name)}`;
    }
}
exports.LuaTable = LuaTable;
