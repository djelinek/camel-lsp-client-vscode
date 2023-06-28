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
import { expect } from 'chai';
import { WebDriver, VSBrowser, EditorView, Workbench, InputBox, before, ActivityBar, after, afterEach } from 'vscode-uitests-tooling';
import * as pjson from '../../../package.json';
import * as path from 'path';
import * as utils from '../utils/testUtils';

describe('JBang user preference version set test', function () {
    this.timeout(400000);

    let driver: WebDriver;
    let input: InputBox;
    let DEFAULT_JBANG: string;

    const RESOURCES = path.resolve('src', 'ui-test', 'resources');
    const FILENAME = 'test.camel.xml';
    const OLDER_JBANG_VERSION = '3.20.5';

    before(async function () {
        driver = VSBrowser.instance.driver;
        await VSBrowser.instance.openResources(RESOURCES);
        await VSBrowser.instance.waitForWorkbench();

        await utils.waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
        DEFAULT_JBANG = await getJBangVersion();
    });

    after(async function () {
        utils.resetUserSettings('camel.languageSupport.JBangVersion');
    });

    describe('Different JBang versions', function () {

        before(async function () {
			await (await new ActivityBar().getViewControl('Explorer')).openView();
        });

        afterEach(async function () {
            await utils.killTerminal();
            await new EditorView().closeAllEditors();
            await utils.deleteFile(FILENAME, RESOURCES);
        });

        it('Default version', async function () {
            await initNewCamelFile('test');
            await utils.waitUntilTerminalHasText(driver, `-Dcamel.jbang.version=${DEFAULT_JBANG}`);
            expect(await (await utils.activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${DEFAULT_JBANG}`);
        });

        it(`Older version - ${OLDER_JBANG_VERSION}`, async function () {
            await setJBangVersion(OLDER_JBANG_VERSION);
            await initNewCamelFile('test');
            await utils.waitUntilTerminalHasText(driver, `-Dcamel.jbang.version=${OLDER_JBANG_VERSION}`);
            expect(await (await utils.activateTerminalView()).getText()).to.contain(`-Dcamel.jbang.version=${OLDER_JBANG_VERSION}`);
        });
    });

	async function initNewCamelFile(filename: string): Promise<void> {
		await utils.executeCamelCommand('Create a Camel Route using XML DSL');
		await driver.wait(async function () {
			input = await InputBox.create();
			return (await input.isDisplayed());
		}, 30000);
		await input.setText(filename);
		await input.confirm();

		await utils.waitUntilEditorIsOpened(driver, FILENAME, 220000);
	}

    async function getJBangVersion(): Promise<string> {
        const textField = await (await new Workbench().openSettings()).findSetting('JBang Version', 'Camel', 'Language Support');
        const value = await textField.getValue() as string;
        await new EditorView().closeEditor('Settings');
        return value;
    }

    async function setJBangVersion(version: string): Promise<void> {
        const textField = await (await new Workbench().openSettings()).findSetting('JBang Version', 'Camel', 'Language Support');
        await textField.setValue(version);
        await driver.sleep(500);
        await new EditorView().closeEditor('Settings');
    }

});
