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
			classText + (classText !== '' ? '\n' : '') + `.${classToAdd} { }`, '');

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
			}, {});
		
		// Format and combine string for output
		var finalString = "";
		const cleanJSONRegex = /,|"|:/g;
		Object.keys(bemObject).forEach(key => {
			finalString +=
				key + JSON.stringify(bemObject[key]).replace(cleanJSONRegex, "");
		});

		// Output string for user selection
		ncp.copy(finalString, () => {
			vscode.window.showInformationMessage('Copied LESS/SCSS BEM format to clipboard');
		});
	}));
}

export function deactivate() { }
