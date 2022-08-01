"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassModel = void 0;
const Utils_1 = require("../../Utils");
const ModelUtils_1 = require("./ModelUtils");
const DocumentationBuilder_1 = require("../../DocumentationBuilder");
const Model_1 = require("./Model");
const ConstructorModel_1 = require("./ConstructorModel");
const FieldModel_1 = require("./FieldModel");
const MethodModel_1 = require("./MethodModel");
const AuthoredModelDocumentation_1 = require("./doc/AuthoredModelDocumentation");
class ClassModel extends Model_1.Model {
    constructor(_class_, name, src) {
        super();
        this.fields = {};
        this.methods = {};
        this.documentation = new AuthoredModelDocumentation_1.AuthoredModelDocumentation();
        this._class_ = _class_;
        this.name = name;
        this._constructor_ = new ConstructorModel_1.ConstructorModel(this);
        if (src)
            this.load(src);
    }
    populate() {
        const { fields, methods, _constructor_ } = this._class_;
        const fieldNames = Object.keys(fields);
        fieldNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const fieldName of fieldNames) {
            if (!this.fields[fieldName])
                this.fields[fieldName] = new FieldModel_1.FieldModel(fieldName);
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
            for (const name of Object.keys(json.fields)) {
                this.fields[name] = new FieldModel_1.FieldModel(name, json.fields[name]);
            }
        }
        if (json.methods) {
            for (const name of Object.keys(json.methods)) {
                this.methods[ModelUtils_1.sanitizeName(name)] = new MethodModel_1.MethodModel(name, json.methods[name]);
            }
        }
        if (json._constructor_)
            this._constructor_.load(json._constructor_);
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
            for (const name of Object.keys(this.methods)) {
                const methodModel = this.methods[name];
                if (!methodModel.isDefault())
                    methods[ModelUtils_1.unsanitizeName(name)] = methodModel.save();
            }
        }
        let _constructor_ = undefined;
        if (this._constructor_ && !this._constructor_.isDefault())
            _constructor_ = this._constructor_.save();
        let documentation = undefined;
        if (this.documentation && !this.documentation.isDefault()) {
            documentation = this.documentation.save();
        }
        return { fields, methods, _constructor_, documentation };
    }
    clear() {
        for (const key of Object.keys(this.fields))
            delete this.fields[key];
        for (const key of Object.keys(this.methods))
            delete this.methods[key];
        this._constructor_.clear();
        this.documentation.clear();
    }
    generateDoc(prefix, _class_) {
        const doc = new DocumentationBuilder_1.DocumentationBuilder();
        doc.appendAnnotation('customConstructor', `${_class_.name}:new`);
        const { documentation: classDoc } = this;
        if (classDoc) {
            const { authors, description } = classDoc;
            if (authors && authors.length) {
                let s = '';
                for (let author of authors) {
                    author = author.trim();
                    if (author.length) {
                        if (!s.length)
                            s += '[';
                        s += `${author}, `;
                    }
                }
                if (s.length) {
                    s = `${s.substring(0, s.length - 2)}]`;
                    doc.appendAnnotation('docAuthors', s);
                }
            }
            if (description && description.length) {
                let foundLine = false;
                for (let line of description) {
                    line = line.trim();
                    if (line.length) {
                        if (!foundLine) {
                            if (!doc.isEmpty())
                                doc.appendLine();
                            foundLine = true;
                        }
                        doc.appendLine(line);
                    }
                }
            }
        }
        return doc.build(prefix);
    }
    generateDom() {
        const { name, documentation } = this;
        const { authors, description } = documentation;
        let dom = ClassModel.HTML_TEMPLATE;
        dom = Utils_1.replaceAll(dom, '${CLASS_NAME}', name);
        dom = Utils_1.replaceAll(dom, '${DOC_AUTHORS}', authors.join('\n'));
        dom = Utils_1.replaceAll(dom, '${DESCRIPTION}', description.join('\n'));
        return dom;
    }
    isDefault() {
        for (const field of Object.values(this.fields))
            if (!field.isDefault())
                return false;
        for (const method of Object.values(this.methods))
            if (!method.isDefault())
                return false;
        if (this._constructor_ && !this._constructor_.isDefault())
            return false;
        if (!this.documentation.isDefault())
            return false;
        return true;
    }
    testSignature(_class_) {
        return _class_.name === this.name;
    }
    getFieldModel(field) {
        const model = this.fields[field.name];
        if (model && model.testSignature(field))
            return model;
        return null;
    }
    getMethodModel(method) {
        const name = ModelUtils_1.sanitizeName(method.name);
        const model = this.methods[name];
        if (model && model.testSignature(method))
            return model;
        return null;
    }
    getConstructorModel(_constructor_) {
        const model = this._constructor_;
        if (model && model.testSignature(_constructor_))
            return model;
        return null;
    }
}
exports.ClassModel = ClassModel;
ClassModel.HTML_TEMPLATE = '';
