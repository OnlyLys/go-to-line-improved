import { verifyInputs } from './test-utilities.test';
import { goToTestInputs, selectionTestInputs, selectionFromCursorTestInputs, quickSelectionTestInputs, quickSelectionFromCursorTestInputs, whitespaceIgnoreTestInputs, knownBadTestInputs } from './inputs.test';
import { loremIpsumEditor } from './extension.test';

export function runSuite(): void {
    
    // Load extension setting's at the time the tests are run
    // TODO: Change this to load defaults (later)
    const settings = Settings.load();

    // Launch the tests using the Mocha JS framework
    suite('Parser Tests', () => {
        test(
            `1 - Go To`, 
            async () => await verifyInputs(await loremIpsumEditor, settings, goToTestInputs)
        );
        test(
            `2 - Selection`, 
            async () => await verifyInputs(await loremIpsumEditor, settings, selectionTestInputs)
        );
        test(
            `3 - Selection From Cursor`, 
            async () => await verifyInputs(await loremIpsumEditor, settings, selectionFromCursorTestInputs)
        );
        test(
            `4 - Quick Selection`,
            async () => await verifyInputs(await loremIpsumEditor, settings, quickSelectionTestInputs)
        );
        test (
            `5 - Quick Selection From Cursor`,
            async () => await verifyInputs(await loremIpsumEditor, settings, quickSelectionFromCursorTestInputs)
        );
        test (
            `6 - Check That Whitespace Is Ignored`,
            async () => await verifyInputs(await loremIpsumEditor, settings, whitespaceIgnoreTestInputs)
        );
        test (
            `7 - Known Bad Inputs`,
            async () => await verifyInputs(await loremIpsumEditor, settings, knownBadTestInputs)
        );
    });

}

