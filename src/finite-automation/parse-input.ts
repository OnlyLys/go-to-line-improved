import { Position, TextEditor, Selection, TextLine, TextDocument } from 'vscode';
import { FiniteAutomation } from './finite-automation';
import { Intent } from './intent';
import { LineTerm } from './intent/coordinate/terms/line-term';
import { CharacterTerm } from './intent/coordinate/terms/character-term';
import { Coordinate } from './intent/coordinate/coordinate';
import { Configuration } from '../configuration';
import { SELECTION_MODE } from './selection-mode';
import { ACTIVE_RELATIVE_TO } from '../configuration/active-relative-to';

// TODO: Move most of the conversion methods to `intent.ts`

