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
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, SideBarView, VSBrowser, WebDriver, Workbench } from "vscode-uitests-tooling";
import { expect } from "chai";
import * as path from 'path';
import * as pjson from '../../../package.json';
import * as utils from '../utils/testUtils';

describe('Create a Camel Route using command', function () {
	this.timeout(400000);

	const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');

	let driver: WebDriver;
	let input: InputBox;
	let sideBar: SideBarView;

	before(async function () {
		this.timeout(200000);
		driver = VSBrowser.instance.driver;

		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await utils.waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
	});

	const DSL_LIST = [
		// DSL, COMMAND, FILENAME, FILENAME LONG, EXAMPLE FILE
		['XML', 'Camel: Create a Camel Route using XML DSL', 'xmlSample', 'xmlSample.camel.xml', 'XML.xml'],
		['Java', 'Camel: Create a Camel Route using Java DSL', 'Java', 'Java.java', 'Java.java'],
		['Yaml', 'Camel: Create a Camel Route using Yaml DSL', 'yamlSample', 'yamlSample.camel.yaml', 'YAML.yaml']
	];

	DSL_LIST.forEach(function (dsl) {

		const DSL = dsl.at(0);
		const COMMAND = dsl.at(1);
		const FILENAME = dsl.at(2);
		const FILENAME_LONG = dsl.at(3);
		const EXAMPLE = dsl.at(4);

		describe(`${DSL} DSL`, function () {

			before(async function () {
				sideBar = await (await new ActivityBar().getViewControl('Explorer'))?.openView();
			});

			after(async function () {
				await new EditorView().closeAllEditors();
				await utils.deleteFile(FILENAME_LONG, RESOURCES);
				await utils.killTerminal();
			});

			it('Create file', async function () {
				await new Workbench().executeCommand(COMMAND);

				await driver.wait(async function () {
					input = await InputBox.create();
					return (await input.isDisplayed());
				}, 30000);
				await input.setText(FILENAME);
				await input.confirm();

				await utils.waitUntilEditorIsOpened(driver, FILENAME_LONG);
			});

			it('File available', async function () {
				const tree = await sideBar.getContent().getSection('resources') as DefaultTreeSection;
				const items = await tree.getVisibleItems();

				const labels = await Promise.all(items.map(item => item.getLabel()));
				expect(labels).contains(FILENAME_LONG);
			});

			it('Check file content', async function () {
				const editor = await utils.activateEditor(driver, FILENAME_LONG);
				const text = await editor.getText();
				expect(text).equals(utils.getFileContent(EXAMPLE, RESOURCES));
			});
		});
	});

});
