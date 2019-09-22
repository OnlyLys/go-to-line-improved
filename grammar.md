# Input Grammar

This document describes the grammar of the input.

- Variables are wrapped between `<` `>`. For instance `<HEY>` means a variable called '`HEY`'. 
  Variables are also known as 'non-terminals' in some nomenclatures.

- Tokens are wrapped between forward slashes. For instance `/[0-9]+/` means a token that represents 
  a number, whereas `/\.\./` means a token that represents two ascii periods. Notice that we use 
  regex notation to specify tokens. Tokens are also known as 'terminals' in some nomenclatures.

- Each arrow rule describes a production. For instance, `<HEY> -> <HO><HI>` means the variable `<HEY>` 
  can be expanded into a string `<HO><HI>`. By definition, tokens cannot be further expanded.

- `Ɛ` represents an empty expansion. That is to say, if `<HEY> -> Ɛ` that means the variable `<HEY>`
  expands into nothing.

- Our parsing strategy is top-down recursive descent. The grammar has been carefully defined to 
  eliminate the need for backtracking via a lookahead of 1 token, in addition to knowing the `FIRST`
  and `FOLLOW` sets of each variable. 

- The `FIRST` set of each variable maps tokens to production rules involving that variable on the 
  left hand side. This allows us to use the lookahead token to determine how to expand the variable.

  For instance, consider the following grammar with start variable `<HEY>`:

        PRODUCTIONS:
            1. <HEY> -> <HO>
            2. <HO> -> <HI>/w//o//w/
            3. <HO> -> /[0-9]+/
            4. <HI> -> /H/

  From that, `FIRST` set for `<HO>` would be:

        FIRST:
            /H/,      2
            /[0-9]+/, 3
        
  Let's say we are currently attmepting to expand `<HO>`. If the lookahead token is `/H/` for example, 
  then we know to apply the `<HO> -> <HI>/w//o//w/` production rule (rule number 2), since `<HO>` 
  ultimately derives some string with `/H/` as its first token.

  Note that production rules which derive `Ɛ` are not included within `FIRST` sets since they do not 
  expand into anything, instead these rules play a part in the `FOLLOW` sets.

- The `FOLLOW` set of each variable records the tokens that are allowed to follow the variable. 
  Consider again the grammar with start variable `<HEY>`: 

        PRODUCTIONS:
            1. <HEY> -> <HO>
            2. <HO> -> <HI>/w//o//w/
            3. <HO> -> /[0-9]+/
            4. <HI> -> /H/

  The `FOLLOW` set of `<HI>` would then be:

        FOLLOW: 
            /w/

  Since `/w/` that is the only token allowed to follow an `<HI>` variable. 

  Note also that we can represent the end of input with `$EOF$`, this is useful when representing 
  any variables that come at the end of a valid string. For instance, since nothing comes after 
  a `<HEY>` or `<HO>` variable,  their `FOLLOW` sets would be 
    
        FOLLOW: 
            $EOF$

  `FOLLOW` sets are most relevant for variables with production rules that expand to `Ɛ`. Since 
  those rules expand into nothing, in order to determine if we should apply that rule, we need to 
  match the lookahead token to the tokens that can appear after the left hand side variable. For
  instance, consider the grammar with start variable `<FOO>`: 

        PRODUCTIONS:
            1. <FOO> -> <BAR><BAZ>
            2. <BAR> -> /hi//hi//hi/
            3. <BAR> -> Ɛ
            4. <BAZ> -> /ho//ho//ho/

  `<BAR>` would have:

        FOLLOW: 
            /ho/

  Let's say we are attempting to expand `<BAR>` and the current lookahead token is `/ho/`. This 
  means that `<BAR>` should expand to nothing. Thus, in general we can make it easy to tell if we 
  should expand a variable to `Ɛ`: if the lookahead token matches anything in the variable's 
  `FOLLOW` set, we apply the `-> Ɛ` production rule.
  
  Consequently, `FOLLOW` sets are not very useful for production rules which aren't `-> Ɛ` since we 
  could already tell which production rule to apply by using the `FIRST` set. Therefore we do not
  bother specifying the `FOLLOW` sets for variables which do not have `-> Ɛ` production rules.
  
- The implementation of the parser is in `./src/interpreter/parser/parse.ts`. 

## Grammar

    <TARGET> (START VARIABLE)

        PRODUCTIONS: 
            1. <TARGET> -> <POSITION><OPTIONAL_RANGE_END> 
            2. <TARGET> -> <RANGE_END>

        FIRST: 
            /[0-9]+/, 1
            /-/,      1
            /(,|:)/,  1
            /H/,      1
            /L/,      1
            /h/,      1
            /l/,      1
            /\./,     2
            /\.\./,   2


    <OPTIONAL_RANGE_END>

        PRODUCTIONS: 
            1. <OPTIONAL_RANGE_END> -> <RANGE_END>
            2. <OPTIONAL_RANGE_END> -> Ɛ

        FIRST: 
            /\./,   1
            /\.\./, 1

        FOLLOW:
            $EOF$


    <RANGE_END>

        PRODUCTIONS: 
            1. <RANGE_END> -> /\./<POSITION>
            2. <RANGE_END> -> /\.\./<POSITION>

        FIRST:
            /\./,   1
            /\.\./, 2


    <POSITION>

        PRODUCTIONS: 
            1. <POSITION> -> <LINE><OPTIONAL_COLUMN>
            2. <POSITION> -> <COLUMN>

        FIRST: 
            /[0-9]+/, 1
            /-/,      1
            /(,|:)/,  2
            /H/,      2
            /L/,      2
            /h/,      2
            /l/,      2


    <LINE>

        PRODUCTIONS:
            1. <LINE> -> /[0-9]+/
            2. <LINE> -> /-//[0-9]+/

        FIRST:
            /[0-9]+/,  1
            /-/,       2


    <OPTIONAL_COLUMN>

        PRODUCTIONS: 
            1. <OPTIONAL_COLUMN> -> <COLUMN>
            2. <OPTIONAL_COLUMN> -> Ɛ

        FIRST: 
            /(,|:)/, 1
            /H/,     1
            /L/,     1
            /h/,     1
            /l/,     1

        FOLLOW: 
            $EOF$
            /\./
            /\.\./


    <COLUMN>

        PRODUCTIONS: 
            1. <COLUMN> -> /(,|:)//[0-9]+/
            2. <COLUMN> -> /H/
            3. <COLUMN> -> /L/
            4. <COLUMN> -> /h/
            5. <COLUMN> -> /l/

        FIRST: 
            /(,|:)/, 1
            /H/,     2
            /L/,     3
            /h/,     4
            /l/,     5
