'use strict';

import { Commands } from "./commands";
import * as srcActions from "./srcactions";

interface ICppCodeActionCmd {
    command: string,
    title: string,
    func: Function
}

class CppCodeActionCmd implements ICppCodeActionCmd {
    constructor(public command: string, public title: string, public func: Function) { }
}

export const CppCodeActionCmdList = [
    new CppCodeActionCmd(Commands.GENERATE_ALL_PROMPT, 'Generate All', srcActions.generateAll),
    new CppCodeActionCmd(Commands.GENERATE_CONSTRUCTORS_PROMPT, 'Generate Constructors', srcActions.generateConstructor),
    new CppCodeActionCmd(Commands.GENERATE_DESTRUCTORS_PROMPT, 'Generate Destructors', srcActions.generateDestructor),
    new CppCodeActionCmd(Commands.GENERATE_COPY_SEMANTICS_PROMPT, 'Generate Copy Semantics', srcActions.generateCopySemantic),
    new CppCodeActionCmd(Commands.GENERATE_MOVE_SEMANTICS_PROMPT, 'Generate Move Semantics', srcActions.generateMoveSemantic),
    new CppCodeActionCmd(Commands.GENERATE_GETTERS_PROMPT, 'Generate Getters', srcActions.generateGetters),
    new CppCodeActionCmd(Commands.GENERATE_SETTERS_PROMPT, 'Generate Setters', srcActions.generateSetters),
    new CppCodeActionCmd(Commands.GENERATE_GETTERS_AND_SETTERS_PROMPT, 'Generate Getters And Setters', srcActions.generateGettersAndSetters),
    new CppCodeActionCmd(Commands.GENERATE_TO_STRING_PROMPT, 'Generate ToString', srcActions.generateToString),
    new CppCodeActionCmd(Commands.GENERATE_COUT_OPERATORS_PROMPT, 'Generate operator<<', srcActions.generateCoutOperator),
    new CppCodeActionCmd(Commands.GENERATE_EQUAL_OPERATORS_PROMPT, 'Generate operator==', srcActions.generateEqualOperator),
    new CppCodeActionCmd(Commands.GENERATE_BOOL_OPERATORS_PROMPT, 'Generate operator bool()', srcActions.generateBoolOperator),
];