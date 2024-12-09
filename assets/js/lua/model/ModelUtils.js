"use strict";
/** @author JabDoesThings */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateParameterDocumentation = exports.unsanitizeName = exports.sanitizeName = exports.ILLEGAL_NAMES = void 0;
/** All names that aren't allowed to be used for parameters & fields in TypeScript. */
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
/**
 * Converts {@link ILLEGAL_NAMES} to '_name_' to avoid errors in TypeScript.
 *
 * @param name The name to sanitize.
 *
 * @returns The sanitized name.
 */
exports.sanitizeName = (name) => {
    if (exports.ILLEGAL_NAMES.indexOf(name.toLowerCase()) !== -1)
        return `_${name}_`;
    return name;
};
/**
 * Reverts {@link ILLEGAL_NAMES} from '_name_' to 'name'.
 *
 * @param name The name to unsanitize.
 *
 * @returns The unsanitized name.
 */
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
            // Check for spacing. (If needed)
            if (first) {
                if (!documentationBuilder.isEmpty())
                    documentationBuilder.appendLine();
                first = false;
            }
            documentationBuilder.appendParam(parameterName, parameterDescription[0]);
            // Check if multi-line.
            if (parameterDescription.length === 1)
                continue;
            for (let index = 1; index < parameterDescription.length; index++) {
                documentationBuilder.appendLine(parameterDescription[index]);
            }
        }
    }
};
