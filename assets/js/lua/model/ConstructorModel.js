"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstructorModel = void 0;
const DocumentationBuilder_1 = require("../../DocumentationBuilder");
const Model_1 = require("./Model");
const ModelDocumentation_1 = require("./doc/ModelDocumentation");
const ParamModel_1 = require("./ParamModel");
const Utils_1 = require("../../Utils");
const ModelUtils_1 = require("./ModelUtils");
/** @author JabDoesThings */
class ConstructorModel extends Model_1.Model {
    constructor(_class_, json) {
        super();
        this.parameters = [];
        this.documentation = new ModelDocumentation_1.ModelDocumentation();
        if (!_class_._class_)
            throw new Error(`LuaClass is null: ${_class_.name}`);
        this._class_ = _class_;
        if (_class_)
            this.create();
        if (json)
            this.load(json);
    }
    create() {
        if (this._class_._class_) {
            const { _constructor_ } = this._class_._class_;
            if (_constructor_) {
                for (const parameter of _constructor_.parameters) {
                    this.parameters.push(new ParamModel_1.ParameterModel('constructor', parameter));
                }
            }
        }
    }
    load(json) {
        this.clear();
        if (json.documentation)
            this.documentation.load(json.documentation);
        if (json.parameters && this._class_._class_ && this._class_._class_._constructor_) {
            const { _constructor_ } = this._class_._class_;
            if (json.parameters.length === _constructor_.parameters.length) {
                for (const parameter of json.parameters) {
                    this.parameters.push(new ParamModel_1.ParameterModel('constructor', parameter));
                }
            }
            else {
                for (const parameter of _constructor_.parameters) {
                    this.parameters.push(new ParamModel_1.ParameterModel(parameter));
                }
            }
        }
    }
    save() {
        let parameters = undefined;
        let oneParameterChanged = false;
        for (const parameters of this.parameters) {
            if (!parameters.isDefault()) {
                oneParameterChanged = true;
                break;
            }
        }
        if (oneParameterChanged) {
            parameters = [];
            for (const parameter of this.parameters) {
                parameters.push(parameter.save());
            }
        }
        let documentation = undefined;
        if (!this.documentation.isDefault()) {
            documentation = this.documentation.save();
        }
        return { documentation, parameters };
    }
    clear() {
        this.documentation.clear();
        this.parameters.length = 0;
    }
    generateDoc(prefix, _constructor_) {
        if (!this.testSignature(_constructor_))
            return '';
        const { documentation, parameters } = this;
        const { description } = documentation;
        const documentationBuilder = new DocumentationBuilder_1.DocumentationBuilder();
        if (description.length) {
            if (!documentationBuilder.isEmpty())
                documentationBuilder.appendLine();
            for (const line of description)
                documentationBuilder.appendLine(line);
        }
        ModelUtils_1.generateParameterDocumentation(documentationBuilder, parameters);
        return documentationBuilder.isEmpty() ? '' : documentationBuilder.build(prefix);
    }
    generateDom() {
        const { documentation, _class_, parameters } = this;
        let parametersString = '';
        if (this.parameters.length) {
            for (const parameter of this.parameters) {
                parametersString += parameter.generateDom();
            }
        }
        let dom = ConstructorModel.HTML_TEMPLATE;
        dom = Utils_1.replaceAll(dom, '${CLASS_NAME}', _class_.name);
        dom = Utils_1.replaceAll(dom, '${DESCRIPTION}', documentation.description.join('\n'));
        dom = Utils_1.replaceAll(dom, '${HAS_PARAMETERS}', parameters.length ? 'inline-block' : 'none');
        dom = Utils_1.replaceAll(dom, '${PARAMETERS}', parametersString);
        return dom;
    }
    testSignature(_constructor_) {
        if (_constructor_.parameters.length !== this.parameters.length)
            return false;
        if (this.parameters.length) {
            for (let index = 0; index < this.parameters.length; index++) {
                if (!this.parameters[index].testSignature(_constructor_.parameters[index]))
                    return false;
            }
        }
        return true;
    }
    getParameterModel(id) {
        for (const parameter of this.parameters)
            if (parameter.id === id)
                return parameter;
        return null;
    }
    isDefault() {
        for (const parameter of Object.values(this.parameters)) {
            if (!parameter.isDefault())
                return false;
        }
        return this.documentation.isDefault();
    }
}
exports.ConstructorModel = ConstructorModel;
/** (Loaded via {@link ModelUIManager}) */
ConstructorModel.HTML_TEMPLATE = '';
