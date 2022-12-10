"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateParameterDocumentation = exports.unsanitizeName = exports.sanitizeName = exports.ILLEGAL_NAMES = void 0;
exports.ILLEGAL_NAMES = [
    'tostring',
    'new',
    'default',
    'class',
    'namespace',
    'declare',
    'export',
    'module',
];
exports.sanitizeName = (name) => {
    if (exports.ILLEGAL_NAMES.indexOf(name.toLowerCase()) !== -1)
        return `_${name}_`;
    return name;
};
exports.unsanitizeName = (name) => {
    const nameLower = name.toLowerCase();
    for (const illegalName of exports.ILLEGAL_NAMES) {
        if (`_${illegalName}_` === nameLower) {
            return nameLower.substring(1, nameLower.length - 1);
        }
    }
    return name;
};
exports.generateParameterDocumentation = (documentationBuilder, parameters) => {
    if (parameters.length) {
        let first = true;
        for (const parameter of parameters) {
            const { name: parameterName, documentation: parameterDocumentation } = parameter;
            const { description: parameterDescription } = parameterDocumentation;
            if (!parameterDescription.length)
                continue;
            if (first) {
                if (!documentationBuilder.isEmpty())
                    documentationBuilder.appendLine();
                first = false;
            }
            documentationBuilder.appendParam(parameterName, parameterDescription[0]);
            if (parameterDescription.length === 1)
                continue;
            for (let index = 1; index < parameterDescription.length; index++) {
                documentationBuilder.appendLine(parameterDescription[index]);
            }
        }
    }
};
