"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelDocumentation = void 0;
class ModelDocumentation {
    constructor() {
        this.description = [];
    }
    load(json) {
        this.clear();
        if (json.description)
            for (const line of json.description)
                this.description.push(line);
    }
    save() {
        let description = undefined;
        if (this.description.length)
            description = [].concat(this.description);
        return { description };
    }
    clear() {
        this.description.length = 0;
    }
    isDefault() {
        return !this.description.length;
    }
}
exports.ModelDocumentation = ModelDocumentation;
