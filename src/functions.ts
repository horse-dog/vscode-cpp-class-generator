'use strict';

import * as vscode from 'vscode';
import { CppClass, Field, SuperClass } from "./descriptors";

export async function getSelectedCppClass(editor: vscode.TextEditor | undefined): Promise<CppClass> {
    const cppClasses: CppClass[] = [];
    let currentline = 0;
    if (editor) {
        currentline = editor.selection.end.line;
        let content = editor.document.getText();
        let classes_content = parse_classes(content);
        classes_content.forEach(cls => {
            let cppClass = parse_class(cls, content)
            if (cppClass != null)
                cppClasses.push(cppClass);
        })
    }
    if (cppClasses.length === 0) {
        return null;
    }
    if (cppClasses.length === 1) {
        return cppClasses[0];
    }
    let selectedclassId = -1;
    for (let i = 0; i < cppClasses.length; i++) {
        if (currentline >= cppClasses[i].start
            && currentline <= cppClasses[i].end) {
            selectedclassId = i;
            break;
        }
    }
    if (selectedclassId != -1) return cppClasses[selectedclassId];
    let i = 0;
    for (; i < cppClasses.length && currentline > cppClasses[i].start; i++);
    if (i == 0) return cppClasses[0];
    return cppClasses[i - 1];
}

function parse_classes(content: string) {
    content = del_comments(content);
    content = rm_friend_cls(content);
    let classes = split_classes(content);
    classes = match_classes(classes);
    let tmp: string[] = []
    for (let i = 0; i < classes.length; i++)
        if (classes[i].indexOf('{') != -1)
            tmp.push(classes[i]);
    return delete_tails(tmp);
}

function parse_class(cls: string, content: string) {
    let cls_splited: string[] = []
    cls.split('\n').forEach(element => {
        if (element.trim().length != 0)
            cls_splited.push(element);
    });
    let this_idx = content.indexOf(cls_splited[0].trim());
    while (this_idx != -1 && is_comment(content, this_idx))
        this_idx = content.indexOf(cls_splited[0], this_idx + 1);
    let above = content.substring(0, this_idx);
    let start = count(above, '\n');
    let end = start + count(cls, '\n');
    let template = '';
    if (above.trim()[above.trim().length - 1] == '>') {
        let idx = above.lastIndexOf('template');
        if (idx != -1 && is_keyword(above, idx, 'template'))
            template = above.substring(idx).trim();
    }
    let idx = 0;
    while (is_valid_char(cls[idx])) idx++;
    let cls_full_name = cls.substring(idx, cls.indexOf('{') - 1).trim();
    let classname = parse_classname(cls_full_name);
    let parents = parse_super_classes(cls_full_name);
    if (!is_legal_class_name(classname)) return null;
    let fields = parse_fields(cls);
    return new CppClass(classname, template, parents, fields, start, end);
}


function parse_fields(cls: string) {
    const keys = ['class', 'struct', 'public', 'protected', 'friend',
        'private', 'template', 'typename', 'using', 'typedef'];
    const syms = ['', ' ', '{', '}', '};', '(', ')'];
    let fields: Field[] = [];
    let lines: string[] = [];
    cls.split('\n').forEach(element => {
        if (element.trim().length != 0)
            lines.push(element);
    });
    for (let i = 0; i < lines.length; i++) {
        let flag = 0;
        let line = lines[i].trim();
        let is_key = false;
        if (syms.includes(line)) continue;
        for (let j = 0; j < keys.length; j++) {
            let idx = line.indexOf(keys[j]);
            if (idx != -1 && is_keyword(line, idx, keys[j])) {
                is_key = true;
                break;
            }
        }
        if (is_key) continue;
        if (line.indexOf('(') != -1) {
            flag = bracket_permit(line);
            if (flag == 0) continue;
        }
        let l = count(cls, '{', 0, cls.indexOf(line));
        let r = count(cls, '}', 0, cls.indexOf(line));
        if (l != r + 1) continue;

        l = count(cls, '(', 0, cls.indexOf(line));
        r = count(cls, ')', 0, cls.indexOf(line));
        if (l != r) continue;

        if (flag == 1) {
            let field = parse_func_ptr(line);
            fields.push(field);
        } else {
            let one_line_fields = parse_field(line);
            fields = fields.concat(one_line_fields);
        }
    }
    return fields;
}

function parse_field(line: string) {
    let result: Field[] = [];
    let typename = '';
    let valname_idx: Set<number> = new Set();
    line = line.trim();
    if (line[line.length - 1] != ';')
        return result;
    line = line.replace(';', '');
    let items: string[] = [];
    line.split(/[ \r\t\n]/).forEach(element => {
        if (element.trim().length != 0)
            items.push(element);
    });
    let need_merge = false;
    let tmp: string[] = [];
    items.forEach(item => {
        let has_add = false;
        if (need_merge) {
            tmp[tmp.length - 1] += item;
            item = tmp[tmp.length - 1];
            has_add = true;
        }
        if (count(item, '{') != count(item, '}'))
            need_merge = true;
        else if (count(item, '(') != count(item, ')'))
            need_merge = true;
        else if (count(item, '<') != count(item, '>'))
            need_merge = true;
        else if (item == '_STD')
            need_merge = true;
        else if (item.length > 1 &&
            item.substring(item.length - 2, item.length) == '::')
            need_merge = true;
        else
            need_merge = false;
        if (has_add == false)
            tmp.push(item);
    });
    items = tmp;
    let rhs_idx: Set<number> = new Set();
    for (let i = 0; i < items.length; i++) {
        if (items[i] == '=') {
            rhs_idx.add(i);
            rhs_idx.add(i + 1);
            if (items[i + 1].indexOf(',') == 0)
                items[i - 1] += ',';
        }
    }
    tmp = []
    for (let i = 0; i < items.length; i++)
        if (!rhs_idx.has(i))
            tmp.push(items[i]);
    items = tmp;

    for (let i = 0; i < items.length; i++)
        if (items[i].indexOf('{') != -1)
            items[i] = items[i].substring(0, items[i].indexOf('{'));

    for (let i = 0; i < items.length; i++)
        if (items[i].indexOf(',') == items[i].length - 1) {
            valname_idx.add(i);
            valname_idx.add(i + 1);
            items[i] = items[i].substring(0, items[i].length - 1);
        }
    if (valname_idx.size == 0)
        valname_idx.add(items.length - 1);
    let is_static = false;
    let min_idx = items.length;
    valname_idx.forEach(element => {
        if (element < min_idx)
            min_idx = element;
    });
    for (let i = 0; i < min_idx; i++) {
        if (items[i] == 'static')
            is_static = true;
        else
            typename = typename + ' ' + items[i];
    }
    typename = typename.substring(1);
    if (!typename_legal(typename))
        return result;

    for (let i of valname_idx) {
        if (i >= items.length) continue;
        if (items[i].length < 1) continue;
        if (items[i][0] == '*')
            result.push(new Field(items[i].substring(1), typename + '*', is_static, true));
        else if (items[i].length > 1 && items[i].substring(0, 2) == '&&')
            result.push(new Field(items[i].substring(2), typename + '&&', is_static, true));
        else if (items[i][0] == '&')
            result.push(new Field(items[i].substring(1), typename + '&', is_static, true));
        else if (items[i].indexOf('[') != -1)
            result.push(new Field(items[i].substring(0, items[i].indexOf('[')),
                typename + '*', is_static, is_fundamental(typename)));
        else
            result.push(new Field(items[i], typename, is_static, is_fundamental(typename)));
    }
    return result;
}

function is_fundamental(typename: string) {
    const keys = new Set(['unsigned', 'bool', 'char', 'short', 'int', 'long', 'float', 'double',
        '*', '&', '&&', '', ' ', 'const', 'volatile', 'mutable', 'static', 'uint8_t', 'uint16_t',
        'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t']);
    let is_basic = true;
    for (let element of typename.split(/[ *]/)) {
        console.log(element);
        if (!keys.has(element)) {
            is_basic = false;
            break;
        }
    }
    return is_basic;
}

function typename_legal(typename: string) {
    if (count(typename, '{') != count(typename, '}'))
        return false;
    if (count(typename, '<') != count(typename, '>'))
        return false;
    if (count(typename, '(') != count(typename, ')'))
        return false;
    return true;
}

function parse_func_ptr(line: string) {
    line = line.trim();
    line = line.substring(0, line.length - 1);
    let idx1 = line.indexOf('(');
    let idx2 = line.indexOf(')');
    while (idx1 < line.length) {
        if (!is_valid_char(line[idx1])) idx1++;
        else break;
    }
    let name = line.substring(idx1 + 1, idx2).trim();
    let type = line.substring(0, idx1 + 1) + line.substring(idx2, line.length);
    let items: string[] = [];
    type.split(/[ \r\t\n]/).forEach(element => {
        if (element.trim().length != 0)
            items.push(element);
    });
    let is_static = false;
    let typename = '';
    items.forEach(item => {
        if (item.trim() == 'static')
            is_static = true;
        else
            typename += item;
    });
    return new Field(name, typename, is_static, true);
}

function bracket_permit(line: string) {
    let idx = line.indexOf('(');
    while (idx < line.length) {
        if (!is_valid_char(line[idx])) idx++;
        else break;
    }
    if (idx < line.length && (line[idx] == '&' || line[idx] == '*'))
        return 1;
    let idx1 = line.indexOf('function<');
    if (idx1 != -1 && idx1 < idx) return 2;
    idx1 = line.indexOf('=');
    if (idx1 != -1 && idx1 < idx && line.indexOf('operator') == -1)
        return 3;
    return 0;
}


function is_legal_class_name(classname: string) {
    if (count(classname, '<') != count(classname, '>'))
        return false;
    if (classname.indexOf('<') == -1)
        return true;
    if (classname.indexOf('<') > classname.indexOf('>'))
        return false;
    return true;
}

function parse_classname(cls_full_name: string) {
    if (cls_full_name.indexOf(':') == -1)
        return cls_full_name;
    let tmp: string[] = []
    cls_full_name.split(':').forEach(element => {
        if (element.trim().length != 0)
            tmp.push(element);
    });
    return tmp[0].trim();
}


function parse_super_classes(cls_full_name: string) {
    let parents: SuperClass[] = []
    if (cls_full_name.indexOf(':') == -1)
        return parents;
    let super_classes: string[] = [];
    cls_full_name.substring(cls_full_name.indexOf(':') + 1).split(',').forEach(element => {
        if (element.trim().length != 0)
            super_classes.push(element);
    });
    let need_merge = false;
    let result: string[] = []
    super_classes.forEach(cls => {
        let has_add = false;
        if (need_merge == true) {
            result[result.length - 1] += cls;
            cls = result[result.length - 1];
            has_add = true;
        }
        if (count(cls, '{') != count(cls, '}'))
            need_merge = true;
        else if (count(cls, '(') != count(cls, ')'))
            need_merge = true;
        else if (count(cls, '<') != count(cls, '>'))
            need_merge = true;
        else
            need_merge = false;
        if (has_add == false)
            result.push(cls);
    });
    super_classes = result;
    super_classes.forEach(cls => {
        let isVirtual = false;
        let permission = 'public';
        let items: string[] = [];
        let name: string = cls;
        cls.trim().split(/[ \r\t\n]/).forEach(item => {
            if (item.trim().length != 0)
                items.push(item.trim())
        });
        if (items.includes('protected'))
            permission = 'protected';
        else if (items.includes('private'))
            permission = 'private';
        name = name.replace(permission, '');
        if (items.includes('virtual')) {
            isVirtual = true;
            name = name.replace('virtual', '');
        }
        name = name.trim();
        parents.push(new SuperClass(name, permission, isVirtual));
    })
    return parents;
}


function is_comment(content: string, index: number) {
    for (index -= 1; index >= 0; index--) {
        if (is_valid_char(content[index])) break;
        if (content[index] == '\n') break;
    }
    if (content[index] == '/' || content[index] == '*')
        return true;
    return false;
}

function del_comments(content: string) {
    let isCom = false, isStr = false;
    const str = content.split('');
    for (let i = 0; i < str.length; i++) {
        if (!isStr && str[i] == '/' && str[i + 1] == '*')
            isCom = true;
        else if (!isStr && '*' == str[i] && '/' == str[i + 1]) {
            isCom = false;
            str[i] = str[i + 1] = ' ';
        }
        else if (!isCom && !isStr && '\"' == str[i])
            isStr = true;
        else if (!isCom && isStr && '\"' == str[i])
            isStr = false;
        if (isCom && !isStr)
            str[i] = ' ';
    }
    isCom = false, isStr = false;
    for (let i = 0; i < str.length; i++) {
        if (!isStr && str[i] == '/' && str[i + 1] == '/')
            isCom = true;
        else if (!isStr && '\n' == str[i])
            isCom = false;
        else if (!isCom && !isStr && '\"' == str[i])
            isStr = true;
        else if (!isCom && isStr && '\"' == str[i])
            isStr = false;
        if (isCom && !isStr)
            str[i] = ' ';
    }
    return str.join('');
}

function rm_friend_cls(content: string) {
    while (true) {
        let index = content.indexOf('friend class');
        if (index == -1) break;
        let end = content.indexOf('\n', index);
        content = content.replace(content.substring(index, end), '');
    }
    return content;
}

function split_classes(content: string) {
    let result: string[] = [];
    let index = content.indexOf('class');
    let keyword = 'class';
    let struct_idx = content.indexOf('struct');
    if (struct_idx != -1 && (struct_idx < index || index == -1)) {
        index = struct_idx;
        keyword = 'struct';
    }
    if (index == -1) return result;
    content = content.substring(index);
    index = 0;
    while (true) {
        if (index == -1 || index >= content.length) break;
        let index1 = content.indexOf('class', index + 1);
        let index2 = content.indexOf('struct', index + 1);
        let idx = index1;
        let nextkey = 'class';
        if (index2 != -1 && (index2 < index1 || index1 == -1)) {
            idx = index2;
            nextkey = 'struct';
        }
        if (is_keyword(content, index, keyword)) {
            if (idx == -1) result.push(content.substring(index));
            else result.push(content.substring(index, idx));
        } else {
            if (idx == -1) result[result.length - 1] += content.substring(index);
            else result[result.length - 1] += content.substring(index, idx);
        }
        index = idx;
        keyword = nextkey;
    }
    return result;
}

function is_keyword(content: string, index: number, keyword: string) {
    if (index > 0 && is_valid_char(content[index - 1])) return false;
    if (index + keyword.length < content.length &&
        is_valid_char(content[index + keyword.length])) return false;
    while (index > 0) {
        index--;
        if (is_valid_char(content[index])) {
            if (content[index] == '<' || content[index] == ',') return false;
            else return true;
        }
    }
    return true;
}

function is_valid_char(c: string) {
    const cs = [' ', '\r', '\t', '\n', ',', ':', '<', '(', '[', '{'];
    return !cs.includes(c);
}

function match_classes(classes: string[]) {
    let result: string[] = [];
    let need_merge = false;
    classes.forEach(cls => {
        if (need_merge) {
            result[result.length - 1] += cls;
            cls = result[result.length - 1];
        }
        let left = count(cls, '{');
        let right = count(cls, '}');
        if (left == right) {
            if (need_merge == false) result.push(cls);
            else need_merge = false;
        } else if (need_merge == false) {
            result.push(cls);
            need_merge = true;
        }
    });
    return result;
}

function count(str: string, c: string, start: number = 0, end: number = str.length) {
    let result = 0;
    for (let i = start; i < end; i++)
        if (str[i] == c) result++;
    return result;
}

function delete_tails(classes: string[]) {
    for (let i = 0; i < classes.length; i++) {
        let cls = classes[i].trim();
        let idx = cls.indexOf('{');
        idx++;
        for (; idx < cls.length; idx++)
            if (count(cls, '{', 0, idx) == count(cls, '}', 0, idx))
                break;
        classes[i] = cls.substring(0, idx);
    }
    return classes;
}