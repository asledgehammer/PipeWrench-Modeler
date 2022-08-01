"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldModel = void 0;
const Model_1 = require("./Model");
const ModelDocumentation_1 = require("./doc/ModelDocumentation");
const ReturnModel_1 = require("./ReturnModel");
const Utils_1 = require("../../Utils");
const DocumentationBuilder_1 = require("../../DocumentationBuilder");
class FieldModel extends Model_1.Model {
    constructor(name, src) {
        super();
        this.documentation = new ModelDocumentation_1.ModelDocumentation();
        this._return_ = new ReturnModel_1.ReturnModel();
        this.name = name;
        if (src)
            this.load(src);
    }
    generateDocumentation(prefix) {
        const { documentation: fieldDoc, _return_ } = this;
        const { description: fieldDescription } = fieldDoc;
        const documentationBuilder = new DocumentationBuilder_1.DocumentationBuilder();
        if (fieldDescription && fieldDescription.length) {
            for (const line of fieldDescription)
                documentationBuilder.appendLine(line);
        }
        _return_.generateDocumentation(documentationBuilder);
        return documentationBuilder.isEmpty() ? '' : documentationBuilder.build(prefix);
    }
    generateDom() {
        const { name, documentation, _return_ } = this;
        let dom = FieldModel.HTML_TEMPLATE;
        dom = Utils_1.replaceAll(dom, '${FIELD_NAME}', name);
        dom = Utils_1.replaceAll(dom, '${DESCRIPTION}', documentation.description.join('\n'));
        dom = Utils_1.replaceAll(dom, '${RETURN_TYPES}', _return_.types.join('\n'));
        dom = Utils_1.replaceAll(dom, '${RETURN_DESCRIPTION}', _return_.description.join('\n'));
        return dom;
    }
    testSignature(field) {
        return field.name === this.name;
    }
    load(json) {
        this.clear();
        if (json._return_)
            this._return_.load(json._return_);
        if (json.documentation)
            this.documentation.load(json.documentation);
    }
    save() {
        let documentation = undefined;
        if (!this.documentation.isDefault())
            documentation = this.documentation.save();
        let _return_ = undefined;
        if (!this._return_.isDefault())
            _return_ = this._return_.save();
        return { documentation, _return_ };
    }
    clear() {
        this.documentation.clear();
        this._return_.clear();
    }
    isDefault() {
        return this.documentation.isDefault() && this._return_.isDefault();
    }
}
exports.FieldModel = FieldModel;
FieldModel.HTML_TEMPLATE = '';
