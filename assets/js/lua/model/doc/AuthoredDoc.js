"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthoredDoc = void 0;
const BasicDoc_1 = require("./BasicDoc");
class AuthoredDoc extends BasicDoc_1.ModelDocumentation {
    constructor() {
        super(...arguments);
        this.authors = [];
    }
    load(json) {
        super.load(json);
        if (json.authors)
            for (const author of json.authors)
                this.authors.push(author);
    }
    save() {
        let description = undefined;
        if (this.description.length)
            description = [].concat(this.description);
        let authors = undefined;
        if (this.authors.length)
            authors = [].concat(this.authors);
        return { description, authors };
    }
    clear() {
        super.clear();
        this.authors.length = 0;
    }
    isDefault() {
        return super.isDefault() && !this.authors.length;
    }
}
exports.AuthoredDoc = AuthoredDoc;
