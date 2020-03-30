'use strict';

import * as vscode from 'vscode';

import * as htmlparser from 'htmlparser2';
import * as ncp from 'copy-paste';

function processEl(list) {
	var finalList = [];

	function recursiveAdd(el) {
		if (el.type === 'tag') {
			finalList.push(el);
	
			if (typeof el.children !== 'undefined' && el.children.length > 0) {
				el.children.forEach(childEl => {
					recursiveAdd(childEl);
				});
			}
		}
	}

	// Start recursion
	list.forEach(element => {
		recursiveAdd(element);
	});

	return finalList;
}

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('extension.extractClasses', () => {
		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		// Parse selected DOM to extract elements
		var selectedText = editor.document.getText(editor.selection);
		var parsedEls = htmlparser.parseDOM(selectedText);

		// Start recursion
		var processedEls = processEl(parsedEls);

		// Select each unique class across elements
		var outputClasses: string[] = [];
		
		processedEls.filter((el) => {
			return typeof el.attribs.class !== 'undefined' && el.attribs.class.trim() !== '';
		}).forEach(el => {
			var cssClasses = el.attribs.class.split(' ').filter(className => className.trim() !== '');

			cssClasses.forEach(cssClass => {
				if (outputClasses.indexOf(cssClass) === -1) {
					outputClasses.push(cssClass);
				}
			});
		});

		// Create BEM convention
		const rootClasses: any = {};
		var bemObject = outputClasses.reduce(
			(className_acc: any, currentClassName: any) => {
				var x: any = className_acc;
				if (
					currentClassName.split(/__/).length === 1 &&
					currentClassName.split(/__/).length === 1
				) {
					x[`.${currentClassName}`] = {};
					rootClasses[currentClassName] = {};
					return className_acc;
				}
				currentClassName.split(/__/).forEach(item => {
					item = rootClasses.hasOwnProperty(item) ? `.${item}` : `&__${item}`;

					if (!x[item]) {
						if (item.split(/--/).length === 2) {
							const tokens = currentClassName.split(/--/);
							x[`&__${tokens[0].split("__").slice(-1)[0]}`] = {
								[`&--${tokens[1]}`]: {}
							};
						} else {
							x[item] = {};
						}
					}
					x = x[item];
				});
				return className_acc;
			},
			{}
		);
		// Format and combine string for output
		var finalString = "";
		const cleanJSONRegex = /,|"|:/g;
		Object.keys(bemObject).forEach(key => {
			finalString +=
				key + JSON.stringify(bemObject[key]).replace(cleanJSONRegex, "");
		});

		// Output string for user selection
		ncp.copy(finalString, () => {
			vscode.window.showInformationMessage('Copied CSS format to clipboard');
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }