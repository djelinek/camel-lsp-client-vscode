/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License", destination); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
	BottomBarPanel,
	By,
	ContentAssistItem,
	EditorView,
	InputBox,
	Marketplace,
	ModalDialog,
	ProblemsView,
	TerminalView,
	TextEditor,
	WebDriver,
	Workbench
} from "vscode-uitests-tooling";
import { storageFolder } from "../uitest_runner";
import * as path from 'path';
import * as fs from 'fs-extra';


/**
 * Workaround for issue with ContentAssistItem getText() method
 * For more details please see https://issues.redhat.com/browse/FUSETOOLS2-284
 *
 * @param item ContenAssistItem
 */
export async function getTextExt(item: ContentAssistItem): Promise<string> {
	const name: string = await item.getText();
	return name.split('\n')[0];
}

/**
 * Workaround the issue of BottomBarPanel().openProblemsView() method
 *
 * For more details see https://github.com/redhat-developer/vscode-extension-tester/issues/505
 */
export async function openProblemsView(): Promise<ProblemsView> {
	const workbench = new Workbench();
	await workbench.executeCommand('View: Open View');
	await workbench.openCommandPrompt();
	const input = await InputBox.create();
	await input.setText('view Problems');
	await input.confirm();
	return new ProblemsView();
}

/**
 * Close editor with handling of Save/Don't Save Modal dialog
 *
 * @param title Title of opened active editor
 * @param save true/false
 */
export async function closeEditor(title: string, save?: boolean) {
	const dirty = await new TextEditor().isDirty();
	await new EditorView().closeEditor(title);
	if (dirty) {
		const dialog = new ModalDialog();
		if (save) {
			await dialog.pushButton('Save');
		} else {
			await dialog.pushButton('Don\'t Save');
		}
	}
}

/**
 * Switch to an editor tab with the given title
 *
 * @param title Title of editor to activate
 */
export async function activateEditor(driver: WebDriver, title: string): Promise<TextEditor> {
	// workaround for https://issues.redhat.com/browse/FUSETOOLS2-2099
	let editor: TextEditor;
	await driver.wait(async function () {
		try {
			editor = await new EditorView().openEditor(title) as TextEditor;
			return true;
		} catch (err) {
			await driver.actions().click().perform();
			return false;
		}
	}, 10000, undefined, 500);
	return editor;
}

export function resetUserSettings(id: string): void {
	const settingsPath = path.resolve(storageFolder, 'settings', 'User', 'settings.json');
	const reset = fs.readFileSync(settingsPath, 'utf-8').replace(new RegExp(`"${id}.*`), '').replace(/,(?=[^,]*$)/, '');
	fs.writeFileSync(settingsPath, reset, 'utf-8');
}

export async function deleteFile(filename: string, folder: string): Promise<void> {
	try {
		await fs.remove(path.resolve(folder, filename));
	} catch (err) {
		console.error(err)
	}
}

export async function waitUntilEditorIsOpened(driver: WebDriver, title: string, timeout = 10000): Promise<void> {
	await driver.wait(async function () {
		return (await new EditorView().getOpenEditorTitles()).find(t => t === title);
	}, timeout);
}

export async function waitUntilTerminalHasText(driver: WebDriver, text: string, timeout = 120000, interval = 500): Promise<void> {
	await driver.wait(async function () {
		try {
			const terminal = await activateTerminalView();
			const terminalText = await terminal.getText();
			return terminalText.includes(text);
		} catch (err) {
			return false;
		}
	}, timeout, undefined, interval);
}

export async function activateTerminalView(): Promise<TerminalView> {
	await new Workbench().executeCommand('Terminal: Focus on Terminal View');
	await new BottomBarPanel().toggle(true);
	return await new BottomBarPanel().openTerminalView();
}

export async function killTerminal(): Promise<void> {
    await (await activateTerminalView()).killTerminal();
}

export async function waitUntilExtensionIsActivated(driver: WebDriver, displayName: string, timeout = 150000, interval = 500): Promise<void> {
	await driver.wait(async function () {
		return await extensionIsActivated(displayName);
	}, timeout, `The LSP extension was not activated after ${timeout} sec.`, interval);
}

export async function extensionIsActivated(displayName: string): Promise<boolean> {
	try {
		const item = await (await Marketplace.open()).findExtension(`@installed ${displayName}`);
		const activationTime = await item.findElement(By.className('activationTime'));
		if (activationTime !== undefined) {
			return true;
		} else {
			return false;
		}
	} catch (err) {
		return false;
	}
}

export function getFileContent(filename: string, folder: string): string {
	return fs.readFileSync(path.resolve(folder, 'camel_route_command', filename), { encoding: 'utf8', flag: 'r' });
}

/**
 * Executes a command in the command prompt of the workbench.
 * @param command The command to execute.
 * @returns A Promise that resolves when the command is executed.
 * @throws An error if the command is not found in the command palette.
 */
export async function executeCamelCommand(command: string): Promise<void> {
    const workbench = new Workbench();
    await workbench.openCommandPrompt();
    const input = await InputBox.create();
    await input.setText(`>${command}`);
    const quickpicks = await input.getQuickPicks();
    for (const quickpick of quickpicks) {
        if (await quickpick.getLabel() === `Camel: ${command}`) {
            await quickpick.select();
            return;
        }
    }
    throw new Error(`Command '${command}' not found in the command palette`);
}
