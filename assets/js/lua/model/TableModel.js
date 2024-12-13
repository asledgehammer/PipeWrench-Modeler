"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableModel = void 0;
const ModelUtils_1 = require("./ModelUtils");
const DocumentationBuilder_1 = require("../../DocumentationBuilder");
const Model_1 = require("./Model");
const FieldModel_1 = require("./FieldModel");
const MethodModel_1 = require("./MethodModel");
const AuthoredModelDocumentation_1 = require("./doc/AuthoredModelDocumentation");
const Utils_1 = require("../../Utils");
/** @author JabDoesThings */
class TableModel extends Model_1.Model {
    constructor(table, name, json) {
        super();
        this.fields = {};
        this.methods = {};
        this.documentation = new AuthoredModelDocumentation_1.AuthoredModelDocumentation();
        this.table = table;
        this.name = name;
        if (json)
            this.load(json);
    }
    populate() {
        const { fields, methods } = this.table;
        const fieldNames = Object.keys(fields);
        fieldNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const fieldName of fieldNames) {
            if (!this.fields[fieldName]) {
                this.fields[fieldName] = new FieldModel_1.FieldModel(fieldName);
            }
        }
        const methodNames = Object.keys(methods);
        methodNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const methodName of methodNames) {
            if (!this.methods[methodName]) {
                this.methods[methodName] = new MethodModel_1.MethodModel(methodName, methods[methodName]);
            }
        }
    }
    load(json) {
        this.clear();
        if (json.fields) {
            for (const fieldName of Object.keys(json.fields)) {
                this.fields[fieldName] = new FieldModel_1.FieldModel(fieldName, json.fields[fieldName]);
            }
        }
        if (json.methods) {
            for (const methodName of Object.keys(json.methods)) {
                this.methods[methodName] = new MethodModel_1.MethodModel(methodName, json.methods[methodName]);
            }
        }
        if (json.documentation)
            this.documentation.load(json.documentation);
    }
    save() {
        let fields = undefined;
        let methods = undefined;
        let oneFieldDifferent = false;
        for (const field of Object.values(this.fields)) {
            if (!field.isDefault()) {
                oneFieldDifferent = true;
                break;
            }
        }
        if (oneFieldDifferent) {
            fields = {};
            for (const fieldName of Object.keys(this.fields)) {
                const fieldModel = this.fields[fieldName];
                if (!fieldModel.isDefault())
                    fields[fieldName] = fieldModel.save();
            }
        }
        let oneMethodDifferent = false;
        for (const method of Object.values(this.methods)) {
            if (!method.isDefault()) {
                oneMethodDifferent = true;
                break;
            }
        }
        if (oneMethodDifferent) {
            methods = {};
            for (const methodName of Object.keys(this.methods)) {
                const methodModel = this.methods[methodName];
                if (!methodModel.isDefault())
                    methods[ModelUtils_1.unsanitizeName(methodName)] = methodModel.save();
            }
        }
        let documentation = undefined;
        if (!this.documentation.isDefault())
            documentation = this.documentation.save();
        return { fields, methods, documentation };
    }
    clear() {
        for (const key of Object.keys(this.fields))
            delete this.fields[key];
        for (const key of Object.keys(this.methods))
            delete this.methods[key];
        this.documentation.clear();
    }
    generateDocumentation(prefix) {
        const documentationBuilder = new DocumentationBuilder_1.DocumentationBuilder();
        const { documentation: tableDoc } = this;
        if (tableDoc) {
            const { authors, description: tableDescription } = tableDoc;
            // Process authors. (If defined)
            if (authors && authors.length) {
                let s = '[';
                for (const author of authors)
                    s += `${author}, `;
                s = `${s.substring(0, s.length - 2)}]`;
                documentationBuilder.appendAnnotation('docAuthors', s);
            }
            // Process lines. (If defined)
            if (tableDescription && tableDescription.length) {
                if (authors && authors.length)
                    documentationBuilder.appendLine();
                for (const line of tableDescription)
                    documentationBuilder.appendLine(line);
            }
        }
        return documentationBuilder.isEmpty() ? '' : documentationBuilder.build(prefix);
    }
    generateDom() {
        const { name, documentation } = this;
        const { authors, description } = documentation;
        let dom = TableModel.HTML_TEMPLATE;
        dom = Utils_1.replaceAll(dom, '${TABLE_NAME}', name);
        dom = Utils_1.replaceAll(dom, '${DOC_AUTHORS}', authors.join('\n'));
        dom = Utils_1.replaceAll(dom, '${DESCRIPTION}', description.join('\n'));
        return dom;
    }
    testSignature(table) {
        return table.name === this.name;
    }
    getFieldModel(field) {
        const model = this.fields[field.name];
        if (model && model.testSignature(field))
            return model;
        return null;
    }
    getMethodModel(method) {
        const model = this.methods[method.name];
        if (model && model.testSignature(method))
            return model;
        return null;
    }
    isDefault() {
        for (const field of Object.values(this.fields))
            if (!field.isDefault())
                return false;
        for (const method of Object.values(this.methods))
            if (!method.isDefault())
                return false;
        return this.documentation.isDefault();
    }
}
exports.TableModel = TableModel;
/** (Loaded via {@link ModelUIManager}) */
TableModel.HTML_TEMPLATE = '';
