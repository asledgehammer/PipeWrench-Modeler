"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionModel = void 0;
const DocumentationBuilder_1 = require("../../DocumentationBuilder");
const Model_1 = require("./Model");
const ModelDocumentation_1 = require("./doc/ModelDocumentation");
const ParamModel_1 = require("./ParamModel");
const ReturnModel_1 = require("./ReturnModel");
const Utils_1 = require("../../Utils");
const ModelUtils_1 = require("./ModelUtils");
/** @author JabDoesThings */
class FunctionModel extends Model_1.Model {
    constructor(name, json) {
        super();
        this.documentation = new ModelDocumentation_1.ModelDocumentation();
        this.parameters = [];
        this._return_ = new ReturnModel_1.ReturnModel();
        this.name = name;
        if (json)
            this.load(json);
    }
    load(json) {
        this.clear();
        if (json.documentation)
            this.documentation.load(json.documentation);
        if (json.parameters) {
            for (const parameter of json.parameters) {
                this.parameters.push(new ParamModel_1.ParameterModel(this.name, parameter));
            }
        }
        if (json._return_)
            this._return_.load(json._return_);
    }
    save() {
        let documentation = undefined;
        if (this.documentation && !this.documentation.isDefault()) {
            documentation = this.documentation.save();
        }
        let parameters = undefined;
        let oneParameterChanged = false;
        for (const parameter of this.parameters) {
            if (!parameter.isDefault()) {
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
        let _return_ = undefined;
        if (!this._return_.isDefault())
            _return_ = this._return_.save();
        return { documentation, parameters, _return_ };
    }
    clear() {
        this.documentation.clear();
        this.parameters.length = 0;
        this._return_.clear();
    }
    generateDocumentation(prefix, _function_) {
        if (!this.testSignature(_function_))
            return '';
        const { documentation, parameters, _return_ } = this;
        const documentationBuilder = new DocumentationBuilder_1.DocumentationBuilder();
        documentationBuilder.appendAnnotation('noSelf');
        const { description } = documentation;
        if (description.length) {
            if (!documentationBuilder.isEmpty())
                documentationBuilder.appendLine();
            for (const line of description)
                documentationBuilder.appendLine(line);
        }
        ModelUtils_1.generateParameterDocumentation(documentationBuilder, parameters);
        _return_.generateDocumentation(documentationBuilder);
        return documentationBuilder.isEmpty() ? '' : documentationBuilder.build(prefix);
    }
    generateDom() {
        const { name, documentation, parameters, _return_ } = this;
        let parametersDom = '';
        if (this.parameters.length) {
            for (const parameter of this.parameters) {
                parametersDom += parameter.generateDom();
            }
        }
        let dom = FunctionModel.HTML_TEMPLATE;
        dom = Utils_1.replaceAll(dom, '${METHOD_NAME}', name);
        dom = Utils_1.replaceAll(dom, '${DESCRIPTION}', documentation.description.join('\n'));
        dom = Utils_1.replaceAll(dom, '${HAS_PARAMETERS}', parameters.length ? 'inline-block' : 'none');
        dom = Utils_1.replaceAll(dom, '${PARAMETERS}', parametersDom);
        dom = Utils_1.replaceAll(dom, '${RETURN_TYPES}', _return_.types.join('\n'));
        dom = Utils_1.replaceAll(dom, '${RETURN_DESCRIPTION}', _return_.description.join('\n'));
        dom = Utils_1.replaceAll(dom, '${WRAP_WILDCARD_TYPE}', _return_.wrapWildcardType ? 'checked' : '');
        return dom;
    }
    testSignature(_function_) {
        if (_function_.name !== this.name)
            return false;
        if (_function_.parameters.length !== this.parameters.length)
            return false;
        if (this.parameters.length) {
            for (let index = 0; index < this.parameters.length; index++) {
                if (!this.parameters[index].testSignature(_function_.parameters[index]))
                    return false;
            }
        }
        return true;
    }
    getParamModel(id) {
        for (const parameter of this.parameters)
            if (parameter.id === id)
                return parameter;
        return null;
    }
    isDefault() {
        for (const parameter of this.parameters)
            if (!parameter.isDefault())
                return false;
        if (!this._return_.isDefault())
            return false;
        return this.documentation.isDefault();
    }
}
exports.FunctionModel = FunctionModel;
/** (Loaded via {@link ModelUIManager}) */
FunctionModel.HTML_TEMPLATE = '';
