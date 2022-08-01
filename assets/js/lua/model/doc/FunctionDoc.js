"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionDoc = void 0;
const AuthoredDoc_1 = require("./AuthoredDoc");
class FunctionDoc extends AuthoredDoc_1.AuthoredDoc {
    constructor(json) {
        super();
        if (json)
            this.load(json);
    }
    save() {
        return super.save();
    }
}
exports.FunctionDoc = FunctionDoc;
