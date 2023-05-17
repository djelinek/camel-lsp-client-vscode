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
import { expect } from "chai";
import path = require("path");
import { ActivityBar, DefaultTreeSection, DefaultWait, EditorView, InputBox, SideBarView, TextEditor, VSBrowser, ViewContent, Workbench } from "vscode-uitests-tooling";

describe('Create a Camel Route using command', function () {
    this.timeout(240000);

    const RESOURCES: string = path.resolve('src', 'ui-test', 'resources');
    const QUICK_PICK = '>Camel:';

    let input: InputBox;
    let editor: TextEditor;
    let content: ViewContent;

    before(async function () {
        this.timeout(120000);
        VSBrowser.instance.waitForWorkbench();
        await DefaultWait.sleep(60000);
    });

    after(async function () {
        this.timeout(20000);
        await new EditorView().closeAllEditors();
    });

    function _setup() {
        return async function () {
            this.timeout(20000);

            await new EditorView().closeAllEditors();
            await VSBrowser.instance.openResources(RESOURCES);

            await new Workbench().openCommandPrompt();
            input = await InputBox.create();
        };
    }

    function _clean(file: string) {
        return async function () {
            deleteFile(file);
        };
    }

    const DSL_LIST = [
        // DSL, COMMAND, FILENAME, FILENAME LONG, EXAMPLE FILE
        ['XML', 'Camel: Create a Camel Route using XML DSL', 'xmlSample', 'xmlSample.xml', 'XML.xml'],
        ['Java', 'Camel: Create a Camel Route using Java DSL', 'Java', 'Java.java', 'Java.java'],
        ['Yaml', 'Camel: Create a Camel Route using Yaml DSL', 'yamlSample', 'yamlSample.camel.yaml', 'YAML.yaml']
    ];

    DSL_LIST.forEach((dsl) => {
        const DSL = dsl.at(0);
        const COMMAND = dsl.at(1);
        const FILENAME = dsl.at(2);
        const FILENAME_LONG = dsl.at(3);
        const EXAMPLE = dsl.at(4);

        describe(`${DSL} DSL`, function () {
            before(_setup());
            after(_clean(FILENAME_LONG));

            it('Create file', async function () {
                await input.setText(QUICK_PICK);
                await input.selectQuickPick(COMMAND);
                await input.getDriver().wait(async function () {
                    console.log('Waiting for "provide name" dialaog...');
                    return (await input.isDisplayed());
                }, 10000);
                await input.setText(FILENAME);
                await input.confirm();

                const section = await new SideBarView().getContent().getSection('resources');
                await section.getDriver().wait(async function () {
                    console.log('Waiting for opened editor...');
                    return (await new EditorView().getOpenEditorTitles()).find(title => title === FILENAME_LONG);
                }, 15000);
            });

            it('File avaialble', async function () {
                (await new ActivityBar().getViewControl('Explorer'))?.openView();
                content = new SideBarView().getContent();
                const tree = await content.getSection('resources') as DefaultTreeSection;
                const items = await tree.getVisibleItems();
                const labels = await Promise.all(items.map(item => item.getLabel()));
                expect(labels).contains(FILENAME_LONG);
            });

            it('Check file content', async function () {
                editor = await new EditorView().openEditor(FILENAME_LONG) as TextEditor;
                const text = await editor.getText();
                expect(text).equals(getExampleContent(EXAMPLE));
            });
        });
    });
});

function getExampleContent(filename: string): string {
    const fs = require('fs-extra');
    const data = fs.readFileSync(path.resolve('src', 'ui-test', 'resources', 'camel_route_command', filename),
        { encoding: 'utf8', flag: 'r' });
    return data;
}

function deleteFile(filename: string): void {
    const fs = require('fs-extra');
    fs.remove(path.resolve('src', 'ui-test', 'resources', filename), err => {
        if (err) return console.error(err)
        console.log('File ' + filename + ' removed successfully.')
    });
}
