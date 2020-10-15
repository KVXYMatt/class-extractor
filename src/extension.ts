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

function replaceClassFromTemplate(cssClass: string): string {
	var replacementTemplate: string = vscode.workspace.getConfiguration('class-extractor').get('outputClassFormat');
	if (replacementTemplate == null || replacementTemplate === '') {
		replacementTemplate = '.@ { }';
	}

	return replacementTemplate.replace('@', cssClass);
}

function extractClassesFromMarkup(markup: string) {
	// Parse markup using htmlparser
	var parsedEls = htmlparser.parseDOM(markup);

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

	return outputClasses;
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.extractClasses', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor)
			return; // No open text editor

		const outputClasses = extractClassesFromMarkup(editor.document.getText(editor.selection));

		const finalString = outputClasses.reduce((classText, classToAdd) =>
			classText + (classText !== '' ? '\n' : '') + replaceClassFromTemplate(classToAdd), '');

		// Copy string to user's clipboard and show notification
		ncp.copy(finalString, () => {
			vscode.window.showInformationMessage('Copied CSS format to clipboard');
		});
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.extractBemClasses', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor)
			return; // No open text editor

		const outputClasses = extractClassesFromMarkup(editor.document.getText(editor.selection));

		// Create BEM convention
		const separators = ['__', '--']
		const result = outputClasses.map((outputClass: string) => {
			return test(outputClass, '__');
		}).reduce((allClasses, currentClass: Array<Array<string>>) => {
			currentClass.forEach(([separator, name], index: number) => {
				if (separator === '') {
					// Add at top level
					allClasses[name] = {};
					return;
				}
				
				// TODO handle other separators
			});

			return allClasses;
		}, {});

		const finalString = '';

		// Output string for user selection
		// ncp.copy(finalString, () => {
		// 	vscode.window.showInformationMessage('Copied LESS/SCSS BEM format to clipboard');
		// });
	}));
}

export function deactivate() { }

function test(input: string, separator: string, depth: number = 0) {
	if (!input.includes(separator)) {
		return [['', input]];
	} else {
		const splitIndex = input.indexOf(separator);
		const leftPartSeparator = depth === 0 ? '' : separator;
		const leftPart = input.substring(0, splitIndex);
		const rightPart = input.substring(splitIndex + separator.length);

		if (rightPart.includes(separator)) {
			return [[leftPartSeparator, leftPart], ...test(rightPart, separator, depth + 1)];
		} else {
			return [[leftPartSeparator, leftPart], [separator, rightPart]];
		}
	}
}
