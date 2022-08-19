'use strict';

import { CppClass, Field } from "./descriptors";
import { QuickPickItem, window } from "vscode";

export async function generateConstructor(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    let items: QuickPickItem[] = [];
    cppClass.field.forEach(field => {
        if (!field.isStatic)
            items.push({ label: field.name, description: field.type });
    });
    if (items.length == 0) {
        if (internal) {
            return ['\n\t' + cppClass.name + '(){};\n'];
        } else {
            let content1 = '\t' + cppClass.name + '();\n';
            let content2 = '\n' + cppClass.name + '::'
                + cppClass.name + '(){}\n';
            return [content1, content2];
        }
    }

    let pickedItems: QuickPickItem[] = [];
    if (flag) pickedItems = items;
    else {
        pickedItems = await window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select fields to initialize by constructor(s)',
        });
    }

    let fieldNames: string[] = [];
    let pickedFields: Field[] = [];
    pickedItems.forEach(element => {
        fieldNames.push(element.label);
    });
    cppClass.field.forEach(field => {
        if (fieldNames.includes(field.name))
            pickedFields.push(field);
    });

    if (internal) {
        let result = '\n\t' + cppClass.name;
        let addstr1 = ''
        let addstr2 = ' : '
        pickedFields.forEach(item => {
            if (item.isFundamental)
                addstr1 = addstr1 + item.type + ' ' + item.name + ', ';
            else
                addstr1 = addstr1 + 'const ' + item.type + ' &' + item.name + ', ';
            addstr2 = addstr2 + item.name + '(' + item.name + '), ';
        });
        addstr1 = addstr1.substring(0, addstr1.length - 2);
        addstr2 = addstr2.substring(0, addstr2.length - 2);
        result += '(' + addstr1 + ')' + addstr2 + '{};\n';
        return [result];
    }
    else {
        let content1 = '\t' + cppClass.name;
        let content2 = '\n' + cppClass.name + '::' + cppClass.name;
        let addstr1 = ''
        let addstr2 = ' : '
        pickedFields.forEach(item => {
            if (item.isFundamental)
                addstr1 = addstr1 + item.type + ' ' + item.name + ', ';
            else
                addstr1 = addstr1 + 'const ' + item.type + ' &' + item.name + ', ';
            addstr2 = addstr2 + item.name + '(' + item.name + '), ';
        });
        addstr1 = addstr1.substring(0, addstr1.length - 2);
        addstr2 = addstr2.substring(0, addstr2.length - 2);
        content1 += '(' + addstr1 + ');\n';
        content2 += '(' + addstr1 + ')' + addstr2 + '{};\n';
        return [content1, content2];
    }
}

export async function generateDestructor(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    if (internal) return ['\n\t~' + cppClass.name + '(){};\n'];
    let content1 = '\t~' + cppClass.name + '();\n';
    let content2 = '\n' + cppClass.name + '::~' + cppClass.name + '(){};\n';
    return [content1, content2];
}

export async function generateCopySemantic(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    if (internal) {
        let result1 = '\n\t' + cppClass.name + '(const ' + cppClass.name + ' &rhs)';
        let items: string[] = [];
        cppClass.field.forEach(field => {
            if (!field.isStatic)
                items.push(field.name);
        });
        if (items.length == 0) {
            result1 += '{};\n';
        } else {
            let addstr = ' : ';
            items.forEach(item => {
                addstr += item + '(rhs.' + item + '), ';
            });
            addstr = addstr.substring(0, addstr.length - 2);
            result1 = result1 + addstr + '{};\n';
        }
        let result = '\n\t' + cppClass.name + ' &operator=(const ' + cppClass.name + ' &rhs) {\n';
        result += '\t\tif (this == &rhs) return *this;\n';
        result += '\t\tthis->~' + cppClass.name + '();\n';
        result += '\t\tnew (this) ' + cppClass.name + '(rhs);\n';
        result += '\t\treturn *this;\n\t}\n';
        return [result1 + result];
    } else {
        let result11 = '\t' + cppClass.name + '(const ' + cppClass.name + ' &rhs);\n';
        let result21 = '\t' + cppClass.name + ' &operator=(const ' + cppClass.name + ' &rhs);\n';
        let result12 = '\n' + cppClass.name + '::' + cppClass.name + '(const ' + cppClass.name + ' &rhs)';
        let result22 = '\n' + cppClass.name + ' &' + cppClass.name +
            '::operator=(const ' + cppClass.name + ' &rhs) {\n';
        result22 += '\tif (this == &rhs) return *this;\n';
        result22 += '\tthis->~' + cppClass.name + '();\n';
        result22 += '\tnew (this) ' + cppClass.name + '(rhs);\n';
        result22 += '\treturn *this;\n}\n';

        let items: string[] = [];
        cppClass.field.forEach(field => {
            if (!field.isStatic)
                items.push(field.name);
        });
        if (items.length == 0) {
            result12 += '{};\n';
        } else {
            let addstr = ' : ';
            items.forEach(item => {
                addstr += item + '(rhs.' + item + '), ';
            });
            addstr = addstr.substring(0, addstr.length - 2);
            result12 = result12 + addstr + '{};\n';
        }
        return [result11 + result21, result12 + result22];
    }
}

export async function generateMoveSemantic(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    if (internal) {
        let result1 = '\n\t' + cppClass.name + '(' + cppClass.name + ' &&rhs)';
        let items: string[] = [];
        cppClass.field.forEach(field => {
            if (!field.isStatic)
                items.push(field.name);
        });
        if (items.length == 0) {
            result1 += '{};\n';
        } else {
            let addstr = ' : ';
            items.forEach(item => {
                addstr += item + '(std::move(rhs.' + item + ')), ';
            });
            addstr = addstr.substring(0, addstr.length - 2);
            result1 = result1 + addstr + '{};\n';
        }
        let result = '\n\t' + cppClass.name + ' &operator=(' + cppClass.name + ' &&rhs) {\n';
        result += '\t\tif (this == &rhs) return *this;\n';
        result += '\t\tthis->~' + cppClass.name + '();\n';
        result += '\t\tnew (this) ' + cppClass.name + '(std::move(rhs));\n';
        result += '\t\treturn *this;\n\t}\n';
        return [result1 + result];
    } else {
        let result11 = '\t' + cppClass.name + '(' + cppClass.name + ' &&rhs);\n';
        let result21 = '\t' + cppClass.name + ' &operator=(' + cppClass.name + ' &&rhs);\n';
        let result12 = '\n' + cppClass.name + '::' + cppClass.name + '(' + cppClass.name + ' &&rhs)';
        let result22 = '\n' + cppClass.name + ' &' + cppClass.name +
            '::operator=(' + cppClass.name + ' &&rhs) {\n';
        result22 += '\tif (this == &rhs) return *this;\n';
        result22 += '\tthis->~' + cppClass.name + '();\n';
        result22 += '\tnew (this) ' + cppClass.name + '(std::move(rhs));\n';
        result22 += '\treturn *this;\n}\n';

        let items: string[] = [];
        cppClass.field.forEach(field => {
            if (!field.isStatic)
                items.push(field.name);
        });
        if (items.length == 0) {
            result12 += '{};\n';
        } else {
            let addstr = ' : ';
            items.forEach(item => {
                addstr += item + '(std::move(rhs.' + item + ')), ';
            });
            addstr = addstr.substring(0, addstr.length - 2);
            result12 = result12 + addstr + '{};\n';
        }
        return [result11 + result21, result12 + result22];
    }
}

export async function generateGetters(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    let items: QuickPickItem[] = [];
    cppClass.field.forEach(field => {
        if (!field.isStatic)
            items.push({ label: field.name, description: field.type, picked: true });
        else
            items.push({ label: field.name, description: field.type, picked: false, detail: 'static field' });
    });

    if (internal) {
        if (items.length == 0) {
            return [''];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to generate getters',
            });
        }

        if (pickedItems.length == 0) {
            return [''];
        }
        let result = '';
        let fieldNames: string[] = [];
        let pickedFields: Field[] = [];
        pickedItems.forEach(element => {
            fieldNames.push(element.label);
        });
        cppClass.field.forEach(field => {
            if (fieldNames.includes(field.name))
                pickedFields.push(field);
        });
        pickedFields.forEach(field => {
            result += generateGetter(field);
        });
        return [result];
    } else {
        if (items.length == 0) {
            return ['', ''];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to generate getters',
            });
        }

        if (pickedItems.length == 0) {
            return ['', ''];
        }
        let result1 = '';
        let result = '';
        let fieldNames: string[] = [];
        let pickedFields: Field[] = [];
        pickedItems.forEach(element => {
            fieldNames.push(element.label);
        });
        cppClass.field.forEach(field => {
            if (fieldNames.includes(field.name))
                pickedFields.push(field);
        });
        pickedFields.forEach(field => {
            let tmp = generateGetterOutSide(field, cppClass.name);
            result1 += tmp[0];
            result += tmp[1];
        });
        return [result1, result];
    }
}

export async function generateSetters(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    let items: QuickPickItem[] = [];
    cppClass.field.forEach(field => {
        if (!field.isStatic)
            items.push({ label: field.name, description: field.type, picked: true });
        else
            items.push({ label: field.name, description: field.type, picked: false, detail: 'static field' });
    });
    if (internal) {
        if (items.length == 0) {
            return [''];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to generate setters',
            });
        }

        if (pickedItems.length == 0) {
            return [''];
        }
        let result = '';
        let fieldNames: string[] = [];
        let pickedFields: Field[] = [];
        pickedItems.forEach(element => {
            fieldNames.push(element.label);
        });
        cppClass.field.forEach(field => {
            if (fieldNames.includes(field.name))
                pickedFields.push(field);
        });
        pickedFields.forEach(field => {
            result += generateSetter(field, cppClass.name);
        });
        return [result];
    } else {
        if (items.length == 0) {
            return ['', ''];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to generate setters',
            });
        }

        if (pickedItems.length == 0) {
            return ['', ''];
        }
        let result1 = '';
        let result = '';
        let fieldNames: string[] = [];
        let pickedFields: Field[] = [];
        pickedItems.forEach(element => {
            fieldNames.push(element.label);
        });
        cppClass.field.forEach(field => {
            if (fieldNames.includes(field.name))
                pickedFields.push(field);
        });
        pickedFields.forEach(field => {
            let tmp = generateSetterOutSide(field, cppClass.name);
            result1 += tmp[0];
            result += tmp[1];
        });
        return [result1, result];
    }
}

export async function generateGettersAndSetters(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    let items: QuickPickItem[] = [];
    cppClass.field.forEach(field => {
        if (!field.isStatic)
            items.push({ label: field.name, description: field.type, picked: true });
        else
            items.push({ label: field.name, description: field.type, picked: false, detail: 'static field' });
    });

    if (internal) {
        if (items.length == 0) {
            return [''];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to generate getters and setters',
            });
        }

        if (pickedItems.length == 0) {
            return [''];
        }
        let result = '';
        let fieldNames: string[] = [];
        let pickedFields: Field[] = [];
        pickedItems.forEach(element => {
            fieldNames.push(element.label);
        });
        cppClass.field.forEach(field => {
            if (fieldNames.includes(field.name))
                pickedFields.push(field);
        });
        pickedFields.forEach(field => {
            result += generateGetter(field);
        });
        pickedFields.forEach(field => {
            result += generateSetter(field, cppClass.name);
        });
        return [result];
    } else {
        if (items.length == 0) {
            return ['', ''];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to generate getters and setters',
            });
        }

        if (pickedItems.length == 0) {
            return ['', ''];
        }
        let result1 = '';
        let result = '';
        let fieldNames: string[] = [];
        let pickedFields: Field[] = [];
        pickedItems.forEach(element => {
            fieldNames.push(element.label);
        });
        cppClass.field.forEach(field => {
            if (fieldNames.includes(field.name))
                pickedFields.push(field);
        });
        pickedFields.forEach(field => {
            let tmp = generateGetterOutSide(field, cppClass.name);
            result1 += tmp[0];
            result += tmp[1];
        });
        pickedFields.forEach(field => {
            let tmp = generateSetterOutSide(field, cppClass.name);
            result1 += tmp[0];
            result += tmp[1];
        });
        return [result1, result];
    }
}

export async function generateToString(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    if (internal) {
        let result = '\n\tstd::string toString() const {\n';
        result += '\t\tstd::ostringstream os;\n';
        result += '\t\tos << *this;\n';
        result += '\t\treturn os.str();\n\t}\n';
        return [result];
    } else {
        let result1 = '\tstd::string toString() const;\n';
        let result = '\nstd::string ' + cppClass.name + '::toString() const {\n';
        result += '\tstd::ostringstream os;\n';
        result += '\tos << *this;\n';
        result += '\treturn os.str();\n}\n';
        return [result1, result];
    }
}

export async function generateCoutOperator(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    let items: QuickPickItem[] = [];
    cppClass.field.forEach(field => {
        if (!field.isStatic)
            items.push({ label: field.name, description: field.type, picked: true });
        else
            items.push({ label: field.name, description: field.type, picked: false, detail: 'static field' });
    });

    if (internal) {
        let result = '\n\tfriend std::ostream &operator<<(std::ostream &os, const ' + cppClass.name + ' &obj) {\n';
        result += '\t\treturn os << \"' + cppClass.name + ' [';

        if (items.length == 0) {
            return [result + ']\";\n\t}\n'];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to include in the operator<< overload',
            });
        }

        if (pickedItems.length == 0) {
            return [result + ']\";\n\t}\n'];
        }
        let str = '';
        pickedItems.forEach(item => {
            str += '\", ' + item.label + '=\" << obj.' + item.label + ' << ';
        });
        result += str.substring(3) + '\"]\";\n\t}\n';
        return [result];
    } else {
        let result1 = '\tfriend std::ostream &operator<<(std::ostream &os, const ' + cppClass.name + ' &obj);\n';
        let result = '\nstd::ostream &operator<<(std::ostream &os, const ' + cppClass.name + ' &obj) {\n';
        result += '\treturn os << \"' + cppClass.name + ' [';

        if (items.length == 0) {
            return [result1, result + ']\";\n}\n'];
        }

        let pickedItems: QuickPickItem[] = [];
        if (flag) pickedItems = items;
        else {
            pickedItems = await window.showQuickPick(items, {
                canPickMany: true,
                placeHolder: 'Select fields to include in the operator<< overload',
            });
        }

        if (pickedItems.length == 0) {
            return [result1, result + ']\";\n}\n'];
        }
        let str = '';
        pickedItems.forEach(item => {
            str += '\", ' + item.label + '=\" << obj.' + item.label + ' << ';
        });
        result += str.substring(3) + '\"]\";\n}\n';
        return [result1, result];
    }
}

export async function generateEqualOperator(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    if (internal) {
        return ['\n\tbool operator==(const ' + cppClass.name + ' &rhs) const { return false; }\n'];
    } else {
        let l1 = '\tbool operator==(const ' + cppClass.name + ' &rhs) const;\n';
        let l2 = '\nbool ' + cppClass.name + '::operator==(const ' + cppClass.name +
            ' &rhs) const { return false; }\n';
        return [l1, l2];
    }
}

export async function generateBoolOperator(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    if (internal) {
        return ['\n\texplicit operator bool() const { return true; }\n'];
    } else {
        let l1 = '\texplicit operator bool() const;\n';
        let l2 = '\n' + cppClass.name + '::operator bool() const { return true; }\n';
        return [l1, l2];
    }
}

export async function generateAll(cppClass: CppClass, internal: boolean, flag: boolean): Promise<string[]> {
    if (internal) {
        let result = '';
        result += await generateConstructor(cppClass, internal, true);
        result += await generateDestructor(cppClass, internal, true);
        result += await generateCopySemantic(cppClass, internal, true);
        result += await generateMoveSemantic(cppClass, internal, true);
        result += await generateGettersAndSetters(cppClass, internal, true);
        result += await generateToString(cppClass, internal, true);
        result += await generateCoutOperator(cppClass, internal, true);
        result += await generateEqualOperator(cppClass, internal, true);
        result += await generateBoolOperator(cppClass, internal, true);
        return [result];
    } else {
        let result1 = '';
        let result = '';
        let tmp = await generateConstructor(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateDestructor(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateCopySemantic(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateMoveSemantic(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateGettersAndSetters(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateToString(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateCoutOperator(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateEqualOperator(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];

        tmp = await generateBoolOperator(cppClass, internal, true);
        result1 += tmp[0];
        result += tmp[1];
        return [result1, result];
    }
}

function UpperCaseFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateGetter(field: Field) {
    let result = '\n\t';
    if (field.isArray) {
        if (field.type.startsWith('const')) result += field.type + ' ';
        else result += 'const ' + field.type + ' ';
    } else if (field.isFundamental) result += field.type + ' ';
    else result += 'const ' + field.type + ' &';
    result += 'get' + UpperCaseFirstLetter(field.name) + '() const { return ';
    result += field.name + '; }\n';
    return result;
}

function generateGetterOutSide(field: Field, className: string) {
    let result1 = '\t';
    let result = '\n';
    if (field.isArray) {
        if (field.type.startsWith('const')) {
            result1 += field.type + ' ';
            result += field.type + ' ' + className + '::';
        } else {
            result1 += 'const ' + field.type + ' ';
            result += 'const ' + field.type + ' ' + className + '::';
        }
    } else if (field.isFundamental) {
        result1 += field.type + ' ';
        result += field.type + ' ' + className + '::';
    } else {
        result1 += 'const ' + field.type + ' &';
        result += 'const ' + field.type + ' &' + className + '::';
    }
    result1 += 'get' + UpperCaseFirstLetter(field.name) + '() const;\n';
    result += 'get' + UpperCaseFirstLetter(field.name) + '() const { return ';
    result += field.name + '; }\n';
    return [result1, result];
}

function generateSetter(field: Field, className: string) {
    let result = '\n\tvoid set' + UpperCaseFirstLetter(field.name) + '(';
    if (field.isFundamental) result += field.type + ' val) { ';
    else result += 'const ' + field.type + ' &val) { ';
    if (field.isStatic) result += className + '::' + field.name;
    else result += 'this->' + field.name;
    result += ' = val; }\n';
    return result;
}

function generateSetterOutSide(field: Field, className: string) {
    let result1 = '\tvoid set' + UpperCaseFirstLetter(field.name) + '(';
    let result = '\nvoid ' + className + '::set' + UpperCaseFirstLetter(field.name) + '(';
    if (field.isFundamental) {
        result1 += field.type + ' val);\n';
        result += field.type + ' val) { ';
    }
    else {
        result1 += 'const ' + field.type + ' &val);\n';
        result += 'const ' + field.type + ' &val) { ';
    }
    if (field.isStatic) result += className + '::' + field.name;
    else result += 'this->' + field.name;
    result += ' = val; }\n';
    return [result1, result];
}
