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
	CATALOG_VERSION_ID,
	CATALOG_VERSION_UI,
	RESOURCES,
	closeEditor,
	readUserSetting,
	waitUntilExtensionIsActivated
} from '../../utils/testUtils';
import {
	ActivityBar,
	before,
	VSBrowser,
	WebDriver,
	TextSetting,
	Workbench
} from 'vscode-uitests-tooling';
import * as pjson from '../../../../package.json';

describe('Camel version', function () {
	this.timeout(150000);

	const testDescription = process.env.CAMEL_VERSION ? `Set ${process.env.CAMEL_VERSION}` : 'Use default';

	let driver: WebDriver;

	before(async function () {
		this.timeout(40000);
		driver = VSBrowser.instance.driver;
		await VSBrowser.instance.openResources(RESOURCES);
		await VSBrowser.instance.waitForWorkbench();

		await waitUntilExtensionIsActivated(driver, `${pjson.displayName}`);
		await (await new ActivityBar().getViewControl('Explorer')).openView();
	});

	it(testDescription, async function () {
		// no env variable set or is empty
		if (process.env.CAMEL_VERSION == null || process.env.CAMEL_VERSION.length == 0) {
			this.skip();
		}

		// set version in ui
		const settings = await new Workbench().openSettings();
		const textSetting = await settings.findSetting(CATALOG_VERSION_UI, 'Camel') as TextSetting;
		await textSetting.setValue(process.env.CAMEL_VERSION);
		await closeEditor('Settings', true);

		// wait until change is available in settings file
		await driver.wait(async function () {
			return readUserSetting(CATALOG_VERSION_ID) === process.env.CAMEL_VERSION;
		}, 15000, `Camel Version - '${process.env.CAMEL_VERSION}' not set in time limit.`, 1500);
	});
});
