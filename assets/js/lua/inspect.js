"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printRequireInfo = exports.printProxyInfo = exports.printFunctionInfo = exports.printMethodInfo = exports.isFunctionLocal = exports.getMethodDeclarationFromAssignment = exports.getMethodDeclaration = exports.getFunctionDeclaration = exports.getTableConstructor = exports.getProxyInfo = exports.getDeriveInfo = exports.getRequireInfo = void 0;
exports.getRequireInfo = (statement) => {
    let path;
    if (statement.expression.type === 'CallExpression') {
        const expression = statement.expression;
        if (expression.base.type !== 'Identifier')
            return null;
        const base = expression.base;
        const functionName = base.name;
        if (functionName !== 'require')
            return null;
        if (!expression.arguments || expression.arguments.length !== 1)
            return null;
        if (expression.arguments[0].type !== 'StringLiteral')
            return null;
        const arg0 = expression.arguments[0];
        path = arg0.raw;
    }
    else if ((statement.expression.type = 'StringCallExpression')) {
        const expression = statement.expression;
        if (expression.base.type !== 'Identifier')
            return null;
        const base = expression.base;
        const functionName = base.name;
        if (functionName !== 'require')
            return null;
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
    const init = statement.init;
    if (!init.length)
        return null;
    if (init[0].type !== 'CallExpression')
        return null;
    const init0 = init[0];
    if (init0.base.type !== 'MemberExpression')
        return null;
    const args = init0.arguments;
    if (args.length !== 1)
        return null;
    if (args[0].type !== 'StringLiteral')
        return null;
    const base = init0.base;
    if (base.indexer !== ':')
        return null;
    if (base.identifier.name !== 'derive')
        return null;
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
    if (declaration.identifier.type !== 'Identifier') {
        return null;
    }
    const name = declaration.identifier.name;
    const isLocal = declaration.isLocal;
    const params = [];
    if (declaration.parameters && declaration.parameters.length) {
        for (let index = 0; index < declaration.parameters.length; index++) {
            const param = declaration.parameters[index];
            params.push(param.name);
        }
    }
    return { isLocal, name, params };
};
exports.getMethodDeclaration = (b, declaration) => {
    if (declaration.identifier && declaration.identifier.type !== 'MemberExpression') {
        if (b)
            console.log("M A", declaration);
        return null;
    }
    const identifier = declaration.identifier;
    const isStatic = identifier.indexer === '.';
    let className = identifier.base.name;
    let name = identifier.identifier.name;
    if (!className || !name) {
        if (b)
            console.log("M B", className, name, declaration);
        return null;
    }
    const params = [];
    if (declaration.parameters && declaration.parameters.length) {
        for (let index = 0; index < declaration.parameters.length; index++) {
            const param = declaration.parameters[index];
            params.push(param.name);
        }
    }
    return { className, name, params, isStatic };
};
exports.getMethodDeclarationFromAssignment = (b, statement) => {
    if (!statement.init || statement.init.length !== 1 || statement.init[0].type !== 'FunctionDeclaration') {
        if (b)
            console.log('M2 A', statement);
        return null;
    }
    const declaration = statement.init[0];
    if (!statement.variables || statement.variables.length !== 1 || statement.variables[0].type !== 'MemberExpression') {
        if (b)
            console.log('M2 B', statement);
        return null;
    }
    const variable = statement.variables[0];
    if (!variable.base || variable.base.type !== 'Identifier') {
        if (b)
            console.log('M2 C', statement);
        return null;
    }
    const base = variable.base;
    if (!variable.identifier || variable.identifier.type !== 'Identifier') {
        if (b)
            console.log('M2 D', statement);
        return null;
    }
    const identifier = variable.identifier;
    const isStatic = variable.indexer === '.';
    const className = base.name;
    const name = identifier.name;
    if (!className || !name) {
        if (b)
            console.log("M2 E", className, name, statement);
        return null;
    }
    const params = [];
    if (declaration.parameters && declaration.parameters.length) {
        for (let index = 0; index < declaration.parameters.length; index++) {
            params.push(declaration.parameters[index].name);
        }
    }
    return { className, name, params, isStatic };
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
    if (info.params.length) {
        for (const param of info.params)
            str += `${param}, `;
        str = str.substring(0, str.length - 2);
    }
    return str + ')';
};
exports.printFunctionInfo = (info) => {
    let str = '';
    if (info.isLocal)
        str += 'local ';
    str += `${info.name}(`;
    if (info.params.length) {
        for (const param of info.params)
            str += `${param}, `;
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
