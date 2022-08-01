"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableDoc = void 0;
const AuthoredDoc_1 = require("./AuthoredDoc");
class TableDoc extends AuthoredDoc_1.AuthoredDoc {
    constructor(json) {
        super();
        if (json)
            this.load(json);
    }
    save() {
        return super.save();
    }
}
exports.TableDoc = TableDoc;
