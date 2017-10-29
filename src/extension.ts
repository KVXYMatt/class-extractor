'use strict';

import * as vscode from 'vscode';

import * as htmlparser from 'htmlparser2';
import * as ncp from 'copy-paste';

function processEl(list) {
	var finalList = [];

	function recursiveAdd(el, level) {
		if (el.type !== 'text') {
			finalList.push({
				level: level,
				classList: el.attribs.class.split(' ')
			});
	
			if (typeof el.children !== 'undefined' && el.children.length > 0) {
				el.children.forEach(childEl => {
					recursiveAdd(childEl, level + 1);
				});
			}
		}
	}

	// Start recursion
	list.forEach(element => {
		recursiveAdd(element, 0);
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

		if (parsedEls.length <= 0) {
			vscode.window.showErrorMessage('Could not identify any elements to extract classes from');
			return; // No elements to extract
		}

		// Start recursion
		var processedEls = processEl(parsedEls);

		processedEls.map((el) => {
			el.classList.filter((classItem) => {
				return classItem.indexOf()
			});
		});

		// Select each unique class across elements
		var outputClasses: string[] = [];
		processedEls.forEach(el => {
			el.classList.forEach(cssClass => {
				if (outputClasses.indexOf(cssClass) === -1) {
					outputClasses.push(cssClass + el.level);
				}
			});
		});

		// Format and combine string for output
		var finalString = outputClasses.reduce((outputClassText, classToAdd) => {
			let cleanString = `.${classToAdd} { }`;
			
			return outputClassText + (outputClassText !== '' ? '\n' : '') + cleanString;
		}, '');

		// Output string for user selection
		ncp.copy(finalString, () => {
			vscode.window.showInformationMessage('Copied CSS classes to clipboard');
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }