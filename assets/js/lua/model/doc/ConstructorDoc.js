"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstructorDoc = void 0;
const BaseDoc_1 = require("./BaseDoc");
class ConstructorDoc extends BaseDoc_1.BaseDoc {
    constructor(json) {
        super();
        if (json)
            this.load(json);
    }
    save() {
        return super.save();
    }
}
exports.ConstructorDoc = ConstructorDoc;
