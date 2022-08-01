"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterModel = void 0;
const Model_1 = require("./Model");
const ModelDocumentation_1 = require("./doc/ModelDocumentation");
const Utils_1 = require("../../Utils");
class ParameterModel extends Model_1.Model {
    constructor(methodName, src) {
        super();
        this.documentation = new ModelDocumentation_1.ModelDocumentation();
        this.types = [];
        this.id = '';
        this.rename = '';
        this.methodName = methodName;
        if (src) {
            if (typeof src === 'string') {
                this.id = src;
            }
            else {
                this.load(src);
            }
        }
    }
    load(json) {
        this.clear();
        if (json.documentation)
            this.documentation.load(json.documentation);
        if (json.id)
            this.id = json.id;
        else
            throw new Error('Parameter without ID.');
        if (json.rename)
            this.rename = json.rename;
        if (json.types) {
            this.types.length = 0;
            for (const type of json.types)
                this.types.push(type);
        }
    }
    save() {
        const { id } = this;
        let documentation = undefined;
        if (!this.documentation.isDefault())
            documentation = this.documentation.save();
        let rename = undefined;
        if (this.rename.length)
            rename = this.rename;
        let types = undefined;
        if (this.types.length)
            types = [].concat(this.types);
        return { documentation: documentation, id, rename, types };
    }
    clear() {
        this.documentation.clear();
        this.types.length = 0;
        this.rename = '';
    }
    generateDom() {
        const { methodName, rename, types, documentation, id } = this;
        let dom = ParameterModel.HTML_TEMPLATE;
        dom = Utils_1.replaceAll(dom, '${RENAME}', rename);
        dom = Utils_1.replaceAll(dom, '${PARAMETER_TYPES}', types.join('\n'));
        dom = Utils_1.replaceAll(dom, '${PARAMETER_DESCRIPTION}', documentation.description.join('\n'));
        dom = Utils_1.replaceAll(dom, '${METHOD_NAME}', methodName);
        dom = Utils_1.replaceAll(dom, '${PARAMETER_NAME}', id);
        return dom;
    }
    testSignature(paramName) {
        return paramName === this.id;
    }
    isDefault() {
        if (this.rename.length)
            return false;
        if (this.types.length)
            return false;
        return this.documentation.isDefault();
    }
    get name() {
        return this.rename && this.rename.length ? this.rename : this.id;
    }
}
exports.ParameterModel = ParameterModel;
ParameterModel.HTML_TEMPLATE = '';
