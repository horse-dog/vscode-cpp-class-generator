'use strict';

export interface ISuperClass {
    name: string;
    permission: string;
    isVirtual: boolean;
}

export class SuperClass implements ISuperClass {
    constructor(
        public name: string,
        public permission: string,
        public isVirtual: boolean
    ) { }
}

export interface IField {
    name: string;
    type: string;
    isStatic: boolean;
    isFundamental: boolean;
    isArray: boolean;
}

export class Field implements IField {
    constructor(
        public name: string,
        public type: string,
        public isStatic: boolean,
        public isFundamental: boolean,
        public isArray: boolean
    ) { }
}

export interface ICppClass {
    name: string;
    template: string;
    supercls: SuperClass[];
    field: Field[];
    start: number;
    end: number;
}

export class CppClass implements ICppClass {
    constructor(
        public name: string,
        public template: string,
        public supercls: SuperClass[],
        public field: Field[],
        public start: number,
        public end: number
    ) { }
}