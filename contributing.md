# Guide for Contributors

## Building the Source Code

You must have NPM installed to build the extension. You may obtain it here: https://nodejs.org/en/

Steps

1. Clone the project repository.
2. Run `npm install` in the project directory to have it download and install the necessary modules.

## Running the Extension

Steps

1. Open the project directory in VS Code.
2. Run `Extension` via the debug menu.

## Testing the Extension

Steps to run from an active VS Code instance:

1. Open the project directory in VS Code.
2. Run `Extension Tests` via the debug menu.

Alternatively the tests can be run from the command line by calling `npm test`.

## Contributing to the Repository

Fork the repository on GitHub and make any changes on the fork. After that, make a pull request.

## Input Grammar 

- Variables are bracketed by `<>`
- Terminals can either be strings (when enclosed by `'`) or regexes(when enclosed by `/`)

// TODO: Fix this part

VARIABLES:

- <INPUT> -> <GO_TO> | <SELECT> | <SELECT_FROM_CURSOR> | <QUICK_SELECT> | <QUICK_SELECT_FROM_CURSOR>
  * <GO_TO>                     -> <COORDINATE>
  * <SELECT>                    -> <COORDINATE><SELECT_SEPARATOR><COORDINATE>
  * <SELECT_FROM_CURSOR>        -> <COORDINATE><SELECT_SEPARATOR><COORDINATE>
  * <QUICK_SELECT>              -> <COORDINATE><QUICK_SELECT_SEPARATOR><COORDINATE>
  * <QUICK_SELECT_FROM_CURSOR>  -> <COORDINATE><QUICK_SELECT_SEPARATOR><COORDINATE>
    
- <COORDINATE> -> <LINE_ONLY_COORDINATE> | <CHARACTER_ONLY_COORDINATE> | <FULL_COORDINATE>
  * <LINE_ONLY_COORDINATE>      -> <LINE>
  * <CHARACTER_ONLY_COORDINATE> -> <COORDINATE_SEPERATOR><CHARACTER>
  * <FULL_COORDINATE>           -> <LINE><COORDINATE_SEPERATOR><CHARACTER>
  
- <LINE> -> <ABSOLUTE_NUMBER> | <RELATIVE_NUMBER>

- <CHARACTER> -> <ABSOLUTE_NUMBER> | <RELATIVE_NUMBER> | <SHORTCUT>

- <ABSOLUTE_NUMBER> -> <MAGNITUDE>

- <RELATIVE_NUMBER> -> <SIGN_PREFIX><MAGNITUDE>

- <SIGN_PREFIX>     -> <POSITIVE_SIGN_PREFIX> | <NEGATIVE_SIGN_PREFIX>

- <SHORTCUT>        -> <START_OF_LINE_SHORTCUT> | <START_OF_TRIMMED_LINE_SHORTCUT> | <END_OF_LINE_SHORTCUT> | <END_OF_TRIMMED_LINE_SHORTCUT>
                  
TERMINALS:

- <SELECT_SEPARATOR>               -> `:`
  
- <QUICK_SELECT_SEPARATOR>         -> `;`
  
- <COORDINATE_SEPERATOR>           -> `,`
  
- <MAGNITUDE>                      -> `/\d+/`
  
- <POSITIVE_SIGN_PREFIX>           -> `+`
  
- <NEGATIVE_SIGN_PREFIX>           -> `-`
  
- <START_OF_LINE_SHORTCUT>         -> `H`
  
- <START_OF_TRIMMED_LINE_SHORTCUT> -> `h`
  
- <END_OF_LINE_SHORTCUT>           -> `L`
  
- <END_OF_TRIMMED_LINE_SHORTCUT>   -> `l`


## Input Grammar Gen 2

- <INPUT> -> <COORD> | : <COORD> | ; <COORD> | <COORD> : <COORD> | <COORD> ; <COORD>



- 


<OPERATOR> -> + | - | 