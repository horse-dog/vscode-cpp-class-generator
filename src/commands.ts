'use strict';

export namespace Commands {
    /**
     * Generate All Basics.
     */
    export const GENERATE_ALL_BASICS_PROMPT = 'cpp.action.generateAllBasicsPrompt';
    /**
     * Generate All.
     */
    export const GENERATE_ALL_PROMPT = 'cpp.action.generateAllPrompt';

    /**
     * Generate Constructors.
     */
    export const GENERATE_CONSTRUCTORS_PROMPT = 'cpp.action.generateConstructorsPrompt';
    /**
    * Generate Destructors.
    */
    export const GENERATE_DESTRUCTORS_PROMPT = 'cpp.action.generateDestructorsPrompt';

    /**
     * Generate Copy Semantics.
     */
    export const GENERATE_COPY_SEMANTICS_PROMPT = 'cpp.action.generateCopySemanticsPrompt';
    /**
     * Generate Move Semantics.
     */
    export const GENERATE_MOVE_SEMANTICS_PROMPT = 'cpp.action.generateMoveSemanticsPrompt';

    /**
     * Generate Getters.
     */
    export const GENERATE_GETTERS_PROMPT = 'cpp.action.generateGettersPrompt';
    /**
     * Generate Setters.
     */
    export const GENERATE_SETTERS_PROMPT = 'cpp.action.generateSettersPrompt';
    /**
     * Generate Getters And Setters.
     */
    export const GENERATE_GETTERS_AND_SETTERS_PROMPT = 'cpp.action.generateGettersAndSettersPrompt';
    /**
     * Generate ToString.
     */
    export const GENERATE_TO_STRING_PROMPT = 'cpp.action.generateToStringPrompt';
    
    /**
     * Generate operator<<.
     */
    export const GENERATE_COUT_OPERATORS_PROMPT = 'cpp.action.generateCoutOperatorsPrompt';
    /**
     * Generate operator==.
     */
    export const GENERATE_EQUAL_OPERATORS_PROMPT = 'cpp.action.generateEqualOperatorsPrompt';
    /**
     * Generate operator bool().
     */
    export const GENERATE_BOOL_OPERATORS_PROMPT = 'cpp.action.generateBoolOperatorsPrompt';
}