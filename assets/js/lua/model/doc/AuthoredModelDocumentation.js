"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthoredModelDocumentation = void 0;
const ModelDocumentation_1 = require("./ModelDocumentation");
/** @author JabDoesThings */
class AuthoredModelDocumentation extends ModelDocumentation_1.ModelDocumentation {
    constructor() {
        super(...arguments);
        /** Authors of the documentation. */
        this.authors = [];
    }
    /**
     * @param json The JSON data to load.
     */
    load(json) {
        super.load(json);
        if (json.authors)
            for (const author of json.authors)
                this.authors.push(author);
    }
    /**
     * @returns The documentation as JSON data.
     */
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
exports.AuthoredModelDocumentation = AuthoredModelDocumentation;
