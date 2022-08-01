"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationBuilder = void 0;
class DocumentationBuilder {
    constructor(isComment = false) {
        this.lines = [];
        this.isComment = isComment;
    }
    build(prefix = '') {
        const { lines: la } = this;
        const start = this.isComment ? '/*' : '/**';
        if (!la)
            return `${prefix}${start} */`;
        else if (la.length === 1)
            return `${prefix}${start} ${la[0]} */`;
        let s = `${prefix}${start}\n`;
        for (const l of la)
            s += !l || !l.length ? `${prefix} *\n` : `${prefix} * ${l}\n`;
        return `${s}${prefix} */`;
    }
    appendLine(...lines) {
        if (!lines.length) {
            this.lines.push('');
            return this;
        }
        for (const line of lines)
            this.lines.push(line);
        return this;
    }
    appendAnnotation(name, value = '') {
        return this.appendLine(`@${name}${value.length ? ` ${value}` : ''}`);
    }
    appendParam(name, description = '') {
        return this.appendLine(`@param ${name} ${description.length ? `- ${description}` : ''}`);
    }
    appendReturn(description) {
        return this.appendLine(`@returns ${description}`);
    }
    toString() {
        return this.build();
    }
    isEmpty() {
        return !this.size;
    }
    get size() {
        return this.lines.length;
    }
}
exports.DocumentationBuilder = DocumentationBuilder;
