"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassDoc = void 0;
const AuthoredDoc_1 = require("./AuthoredDoc");
class ClassDoc extends AuthoredDoc_1.AuthoredDoc {
    constructor(json) {
        super();
        if (json)
            this.load(json);
    }
    save() {
        return super.save();
    }
}
exports.ClassDoc = ClassDoc;
