"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnModel = void 0;
const Model_1 = require("./Model");
class ReturnModel extends Model_1.Model {
    constructor(json) {
        super();
        this.types = [];
        this.description = [];
        this.wrapWildcardType = true;
        if (json)
            this.load(json);
    }
    load(json) {
        this.clear();
        if (json.types != null)
            for (const type of json.types)
                this.types.push(type);
        if (json.description)
            for (const line of json.description)
                this.description.push(line);
        if (json.wrapWildcardType != null)
            this.wrapWildcardType = json.wrapWildcardType;
    }
    save() {
        let wrapWildcardType = this.wrapWildcardType ? undefined : false;
        let description = undefined;
        if (this.description.length)
            description = [].concat(this.description);
        let types = undefined;
        if (this.types.length)
            types = [].concat(this.types);
        return { description, types, wrapWildcardType };
    }
    clear() {
        this.description.length = 0;
        this.types.length = 0;
        this.wrapWildcardType = true;
    }
    generateDocumentation(documentationBuilder) {
        const { description } = this;
        if (description.length && description[0].length) {
            if (!documentationBuilder.isEmpty())
                documentationBuilder.appendLine();
            if (description.length >= 1) {
                documentationBuilder.appendReturn(description[0]);
            }
            if (description.length > 1) {
                for (let index = 1; index < description.length; index++) {
                    documentationBuilder.appendLine(description[index]);
                }
            }
        }
    }
    generateDom() {
        return '';
    }
    isDefault() {
        if (!this.wrapWildcardType)
            return false;
        if (this.description.length)
            return false;
        return !this.types.length;
    }
}
exports.ReturnModel = ReturnModel;
