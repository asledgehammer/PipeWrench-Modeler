"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodDoc = void 0;
const BaseDoc_1 = require("./BaseDoc");
class MethodDoc extends BaseDoc_1.BaseDoc {
    constructor(json) {
        super();
        if (json)
            this.load(json);
    }
    save() {
        return super.save();
    }
}
exports.MethodDoc = MethodDoc;
