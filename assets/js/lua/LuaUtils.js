"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixParameters = exports.sanitizeParameter = exports.printRequireInfo = exports.printProxyInfo = exports.printFunctionInfo = exports.printMethodInfo = exports.isFunctionLocal = exports.scanBodyForFields = exports.getMethodDeclarationFromAssignment = exports.getMethodDeclaration = exports.getFunctionDeclaration = exports.getTableConstructor = exports.getProxyInfo = exports.getDeriveInfo = exports.getRequireInfo = exports.correctKahluaCode = exports.DEBUG = void 0;
/** @author JabDoesThings */
/** Global DEBUG flag. (For verbose logging) */
exports.DEBUG = false;
/**
 * Corrects lua that compiles in Kahlua2 that breaks Luaparser.
 *
 * @param lua The erroneous Lua code to correct.
 * @returns The fixed lua code.
 */
exports.correctKahluaCode = (lua) => {
    /**
     * Removes Float symbols from explicit numeric constants in Lua code.
     *
     * @param symbol The numeric symbol to remove.
     * @param trailing The trailing chars where this situation can occur.
     */
    const removeNumericSymbol = (symbol, trailing) => {
        for (const t of trailing) {
            for (let x = 0; x < 10; x++) {
                const to = `${x}${t}`;
                const from = `${x}${symbol}${t}`;
                while (lua.indexOf(from) !== -1)
                    lua = lua.replace(from, to);
            }
        }
    };
    // Luaparser does not like it when break expressions have trailing
    // semi-colons. This removes them.
    while (lua.indexOf('break;') !== -1) {
        lua = lua.replace('break;', 'break ');
    }
    // Remove any Float and Long symbols present in the Lua file.
    removeNumericSymbol('l', [',', ';', ')', ' ']);
    removeNumericSymbol('f', [',', ';', ')', ' ']);
    return lua;
};
exports.getRequireInfo = (statement) => {
    let path;
    if (statement.expression.type === 'CallExpression') {
        const expression = statement.expression;
        // Check the function name.
        if (expression.base.type !== 'Identifier')
            return null;
        const base = expression.base;
        const functionName = base.name;
        if (functionName !== 'require')
            return null;
        // Check the argument(s) passed.
        if (!expression.arguments || expression.arguments.length !== 1)
            return null;
        if (expression.arguments[0].type !== 'StringLiteral')
            return null;
        const arg0 = expression.arguments[0];
        path = arg0.raw;
    }
    else if ((statement.expression.type = 'StringCallExpression')) {
        const expression = statement.expression;
        // Check the function name.
        if (expression.base.type !== 'Identifier')
            return null;
        const base = expression.base;
        const functionName = base.name;
        if (functionName !== 'require')
            return null;
        // Check the argument(s) passed.
        if (!expression.argument)
            return null;
        if (expression.argument.type !== 'StringLiteral')
            return null;
        const arg0 = expression.argument;
        path = arg0.raw;
    }
    else {
        return null;
    }
    path = path.substring(1, path.length - 1);
    return { path };
};
exports.getDeriveInfo = (statement) => {
    // Check assignment body.
    const init = statement.init;
    if (!init.length)
        return null;
    if (init[0].type !== 'CallExpression')
        return null;
    const init0 = init[0];
    if (init0.base.type !== 'MemberExpression')
        return null;
    // Check args.
    const args = init0.arguments;
    if (args.length !== 1)
        return null;
    if (args[0].type !== 'StringLiteral')
        return null;
    // Check member call.
    const base = init0.base;
    if (base.indexer !== ':')
        return null;
    if (base.identifier.name !== 'derive')
        return null;
    // This is a derive assignment call.
    const basebase = base.base;
    const superClass = basebase.name;
    const var0 = statement.variables[0];
    const subClass = var0.name;
    return { superClass, subClass };
};
exports.getProxyInfo = (statement) => {
    const { init, variables } = statement;
    if (init.length !== 1)
        return null;
    if (variables.length !== 1)
        return null;
    const target = init[0].name;
    const proxy = variables[0].name;
    if (!target || !proxy)
        return null;
    return { proxy, target };
};
exports.getTableConstructor = (statement) => {
    if (statement.init.length !== 1 || statement.init[0].type !== 'TableConstructorExpression') {
        return null;
    }
    if (statement.variables.length !== 1 || statement.variables[0].type !== 'Identifier') {
        return null;
    }
    const name = statement.variables[0].name;
    return { name };
};
exports.getFunctionDeclaration = (declaration) => {
    // The name of the function is assigned in the identifier.
    let name;
    if (declaration.identifier.type === 'MemberExpression') {
        name = declaration.identifier.identifier.name;
        // Check if the function is assigned to anything other than global.
        if (declaration.identifier.base.type === 'Identifier') {
            if (declaration.identifier.base.name)
                return null;
        }
    }
    else {
        name = declaration.identifier.name;
    }
    // Whether the function is accessible outside of its scope.
    // (Useful info for upstream processing)
    const isLocal = declaration.isLocal;
    // Compile parameter names in order. (If present)
    const parameters = [];
    if (declaration.parameters && declaration.parameters.length) {
        for (let index = 0; index < declaration.parameters.length; index++) {
            // NOTE: Maybe an issue that VarArgLiterals can be provided here?
            const parameter = declaration.parameters[index];
            parameters.push(parameter.name);
        }
    }
    // NOTE: This is a multi-pathed-table function assignment so we'll need to
    // ignore these for now.
    if (declaration.parameters && declaration.parameters.length) {
        return null;
    }
    if (name === 'Default')
        console.log(declaration);
    return { isLocal, name, parameters: parameters };
};
exports.getMethodDeclaration = (b, declaration) => {
    // This is how we know that this is a function assigned to a table on definition.
    if (declaration.identifier && declaration.identifier.type !== 'MemberExpression') {
        // if (b) console.log('M A', declaration);
        return null;
    }
    // For method declarations and static function assignments, the identifier stores either as
    // a string flag.
    const identifier = declaration.identifier;
    const isStatic = identifier.indexer === '.';
    // The name of the member assigned. (In this case we're looking for class members)
    let className = identifier.base.name;
    // The name of the method or static function is stored inside the main identifier.
    let name = identifier.identifier.name;
    if (!className || !name) {
        // if (b) console.log('M B', className, name, declaration);
        return null;
    }
    // Compile parameter names in order. (If present)
    const parameters = [];
    if (declaration.parameters && declaration.parameters.length) {
        for (let index = 0; index < declaration.parameters.length; index++) {
            // NOTE: Maybe an issue that VarArgLiterals can be provided here?
            const parameter = declaration.parameters[index];
            parameters.push(parameter.name);
        }
    }
    return { className, name, parameters: parameters, isStatic };
};
exports.getMethodDeclarationFromAssignment = (b, statement) => {
    // This is how we know that this is a function assigned to a table on definition.
    if (!statement.init ||
        statement.init.length !== 1 ||
        statement.init[0].type !== 'FunctionDeclaration') {
        // if (b) console.log('M2 A', statement);
        return null;
    }
    const declaration = statement.init[0];
    if (!statement.variables ||
        statement.variables.length !== 1 ||
        statement.variables[0].type !== 'MemberExpression') {
        // if (b) console.log('M2 B', statement);
        return null;
    }
    const variable = statement.variables[0];
    if (!variable.base || variable.base.type !== 'Identifier') {
        // if (b) console.log('M2 C', statement);
        return null;
    }
    const base = variable.base;
    if (!variable.identifier || variable.identifier.type !== 'Identifier') {
        // if (b) console.log('M2 D', statement);
        return null;
    }
    const identifier = variable.identifier;
    const isStatic = variable.indexer === '.';
    const className = base.name;
    const name = identifier.name;
    if (!className || !name) {
        // if (b) console.log('M2 E', className, name, statement);
        return null;
    }
    const parameters = [];
    if (declaration.parameters && declaration.parameters.length) {
        for (let index = 0; index < declaration.parameters.length; index++) {
            // NOTE: Maybe an issue that VarArgLiterals can be provided here?
            parameters.push(declaration.parameters[index].name);
        }
    }
    return { className, name, parameters: parameters, isStatic };
};
/**
 * NOTE: Doesn't scan `CallStatement` argument expressions for field discovery.
 * If field(s) are missing in generated results, this may be why.
 */
exports.scanBodyForFields = (body, selfName, locals = [], onlyLocals = false, fieldReferences = []) => {
    const scopedLocals = [];
    for (const entry of body) {
        if (entry.type === 'LocalStatement') {
            const statement = entry;
            if (statement.variables.length !== 1)
                continue;
            const localName = statement.variables[0].name;
            if (locals.indexOf(localName) === -1) {
                scopedLocals.push(localName);
            }
            continue;
        }
        else if (entry.type === 'WhileStatement') {
            exports.scanBodyForFields(entry.body, selfName, [].concat(locals, scopedLocals), onlyLocals, fieldReferences);
            continue;
        }
        else if (entry.type === 'DoStatement') {
            exports.scanBodyForFields(entry.body, selfName, [].concat(locals, scopedLocals), onlyLocals, fieldReferences);
        }
        else if (entry.type === 'ForGenericStatement') {
            exports.scanBodyForFields(entry.body, selfName, [].concat(locals, scopedLocals), onlyLocals, fieldReferences);
        }
        else if (entry.type === 'ForNumericStatement') {
            exports.scanBodyForFields(entry.body, selfName, [].concat(locals, scopedLocals), onlyLocals, fieldReferences);
        }
        else if (entry.type === 'IfStatement') {
            const clauses = entry.clauses;
            for (const clause of clauses) {
                exports.scanBodyForFields(clause.body, selfName, [].concat(locals, scopedLocals), onlyLocals, fieldReferences);
            }
        }
        else if (entry.type !== 'AssignmentStatement')
            continue;
        const statement = entry;
        const variables = statement.variables;
        if (!variables || !variables.length)
            continue;
        let containerName;
        let fieldName;
        let found = false;
        let isStatic = true;
        for (const varNext of variables) {
            const variable = varNext;
            if (!variable.base || variable.base.type !== 'Identifier')
                continue;
            if (!variable.identifier || variable.identifier.type !== 'Identifier')
                continue;
            const base = variable.base;
            if (base.name === 'self') {
                containerName = selfName;
                isStatic = false;
            }
            else {
                containerName = base.name;
            }
            // Make sure the assignment isn't to a local var.
            if (locals.indexOf(containerName) !== -1)
                continue;
            const identifier = variable.identifier;
            fieldName = identifier.name;
            // isStatic = variable.indexer === '.';
            found = true;
            break;
        }
        if (!found)
            continue;
        const ref = { containerName, fieldName, isStatic };
        found = false;
        for (const next of fieldReferences) {
            if (next.containerName === ref.containerName &&
                next.fieldName === ref.fieldName &&
                next.isStatic === ref.isStatic) {
                found = true;
                break;
            }
        }
        if (!found)
            fieldReferences.push(ref);
    }
    return fieldReferences;
};
exports.isFunctionLocal = (declaration) => {
    return declaration.isLocal;
};
exports.printMethodInfo = (info) => {
    let str = '';
    if (info.isStatic)
        str += 'static ';
    str += `${info.className}`;
    str += info.isStatic ? '.' : ':';
    str += `${info.name}(`;
    if (info.parameters.length) {
        for (const parameter of info.parameters)
            str += `${parameter}, `;
        str = str.substring(0, str.length - 2);
    }
    return str + ')';
};
exports.printFunctionInfo = (info) => {
    let str = '';
    if (info.isLocal)
        str += 'local ';
    str += `${info.name}(`;
    if (info.parameters.length) {
        for (const parameter of info.parameters)
            str += `${parameter}, `;
        str = str.substring(0, str.length - 2);
    }
    return str + ')';
};
exports.printProxyInfo = (info) => {
    console.log(`Proxy: ${info.proxy} -> ${info.target}`);
};
exports.printRequireInfo = (info) => {
    console.log(`Require: ${info.path}`);
};
const badParameterNames = [
    'unknown',
    'any',
    'try',
    'function',
    'export',
    'do',
    'while',
    'catch',
    'for',
    'declare',
    'const',
    'let',
    'new',
    'default',
];
exports.sanitizeParameter = (parameter) => {
    if (badParameterNames.indexOf(parameter) !== -1)
        return `_${parameter}_`;
    return parameter;
};
exports.fixParameters = (parameters) => {
    const reversedParameters = [].concat(parameters).reverse();
    const fixedParameters = [];
    let index = 0;
    while (reversedParameters.length) {
        let next = reversedParameters.pop();
        if (reversedParameters.indexOf(next) !== -1 || next === '_')
            next = `arg${index}`;
        fixedParameters.push(exports.sanitizeParameter(next));
        index++;
    }
    return fixedParameters;
};
