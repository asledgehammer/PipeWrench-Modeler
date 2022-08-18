"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaContainer = void 0;
const LuaNamedObject_1 = require("./LuaNamedObject");
/**
 * **LuaContainer** represents pseudo-classes and tables, packaging information for both.
 *
 * All functions that are assigned with ':' indexers are interpreted as methods. Functions that
 * are assigned with '.' are considered as static functions.
 *
 * All 'self.<property>' calls are interpreted as fields in the container. All
 * '<class>.<property>' calls are interpreted as static fields.
 *
 * @author JabDoesThings
 */
class LuaContainer extends LuaNamedObject_1.LuaNamedObject {
    /**
     * @param file The file containing the table's declaration.
     * @param name The name of the table. (In global)
     * @param type The type of container. ('table' or 'class')
     */
    constructor(file, name, type) {
        super(name);
        /** All methods and static functions in the container. */
        this.methods = {};
        /** All fields in the container. */
        this.fields = {};
        this.file = file;
        this.type = type;
    }
    sortFields() {
        const staticFields = [];
        const nonStaticFields = [];
        // Sort fields by name alphanumerically.
        const fieldNames = Object.keys(this.fields);
        fieldNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const fieldName of fieldNames) {
            const field = this.fields[fieldName];
            if (field.isStatic)
                staticFields.push(field);
            else
                nonStaticFields.push(field);
        }
        return { staticFields, nonStaticFields };
    }
    sortMethods() {
        const staticMethods = [];
        const nonStaticMethods = [];
        // Sort methods by name alphanumerically.
        const methodNames = Object.keys(this.methods);
        methodNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const methodName of methodNames) {
            const method = this.methods[methodName];
            if (method.isStatic)
                staticMethods.push(method);
            else
                nonStaticMethods.push(method);
        }
        return { staticMethods, nonStaticMethods };
    }
    audit() {
        // Remove any field duplicates of methods.
        for (const methodName of Object.keys(this.methods)) {
            if (this.fields[methodName])
                delete this.fields[methodName];
        }
    }
}
exports.LuaContainer = LuaContainer;
