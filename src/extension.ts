'use strict';

import * as vscode from 'vscode';

import * as htmlparser from 'htmlparser2';
import * as ncp from 'copy-paste';

function processEl(list) {
	var finalList = [];
	var element = list[0];

	list.forEach(function f(el) {
		if (el.children && el.children.length) {
			el.children.forEach(f);
		}

		if (el.type === 'tag') {
			finalList.unshift(el);
		}
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
		
		processedEls.forEach(el => {
			var cssClasses = el.attribs.class.split(' ');

			cssClasses.forEach(cssClass => {
				if (outputClasses.indexOf(cssClass) === -1) {
					outputClasses.push(cssClass);
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
			vscode.window.showInformationMessage('Copied CSS format to clipboard');
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }