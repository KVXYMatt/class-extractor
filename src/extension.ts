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
		replacementTemplate = '@ { }';
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

function getMatchingLetterCount(firstWord: string, secondWord: string) {
	for (let position = 0; position < firstWord.length; position++) {
		if (firstWord[position] !== secondWord[position]) {
			return position;
		}
	}

	return firstWord.length;
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('extension.extractClasses', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor)
			return; // No open text editor

		const outputClasses = extractClassesFromMarkup(editor.document.getText(editor.selection));

		const finalString = outputClasses.reduce((classText, classToAdd) =>
			classText + (classText !== '' ? '\n' : '') + replaceClassFromTemplate(`.${classToAdd}`), '');

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

		// Create BEM convention, the order of operations here is important
		const separatorTypes = [{ text: '--', pattern: /(.*)--(.+)$/, outputType: 'modifier' },
			{ text: '__', pattern: /(.*)__(.+)$/, outputType: 'element' },
			{ text: '', pattern: /(.*)^(.+)$/, outputType: 'block' }];

		// Create object structure
		let classObjectStructure = outputClasses.map(cssClass => {
			let classOutput = [];

			while (cssClass.length) {
				for (const separator of separatorTypes) {
					if (separator.pattern.test(cssClass)) {
						let [ _, remainingClass, component ] = separator.pattern.exec(cssClass);

						classOutput.unshift({ type: separator.outputType, component });
						cssClass = remainingClass;
					}
				}
			}

			return {
				path: classOutput.reduce((path, component) => path += `/${component.type}:${component.component}`, ''),
				components: classOutput
			};
		});

		let collapsedClassStructure = classObjectStructure.sort((a, b) => b.components.length - a.components.length).reduce((structure, classObject, _, original) => {
			if (classObject.components.length === 1) {
				structure.push(classObject);
			} else if (classObject.components.length > 1) {
				let previousHighestScore = 0;
				let matchingOption = original.filter((potentialMatch) => {
					if (potentialMatch.components.length >= classObject.components.length) {
						return false;
					}
					
					let thisScore = getMatchingLetterCount(classObject.path, potentialMatch.path);
					// Only allow this as a match if the score is higher AND the potential path is a complete match OR the next character in the path is the path separator
					// This way we only match on whole paths rather than partials
					if (thisScore > previousHighestScore && (thisScore >= potentialMatch.path.length || classObject.path[thisScore] === '/')) {
						previousHighestScore = thisScore;
						return true;
					}

					return false;
				})[0];
				
				if (!matchingOption) {
					structure.push(classObject);
				} else {
					var lastComponent = matchingOption.components[matchingOption.components.length - 1];
					if (!lastComponent.children)
						lastComponent.children = [];
					
					lastComponent.children = [ ...lastComponent.children, ...classObject.components.slice(classObject.path.substring(0, previousHighestScore).split('/').length - 1)];
				}
			}
			
			return structure;
		}, []).flatMap(structure => structure.components);

		let finalString = collapsedClassStructure.reduce((output, currentComponent) => {
			let processComponent = (component, depth) => {
				const classIndenting = '\t'.repeat(depth);
				const separator = separatorTypes.find(type => type.outputType === component.type);

				let componentOutput = replaceClassFromTemplate(`${classIndenting}${separator.text !== '' ? `&${separator.text}` : '.'}${component.component}`);

				if (component.children) {
					componentOutput = componentOutput.replace(/\s*}([^}]*)$/,
						'\n' +
						component.children.map(childComponent => processComponent(childComponent, depth + 1)).join('\n') +
						`\n${classIndenting}}`);
				}

				return componentOutput;
			};
			
			output += `\n${processComponent(currentComponent, 0)}`;

			return output;
		}, '').replace(/^\s+/, '');

		// Output string for user selection
		ncp.copy(finalString, () => {
			vscode.window.showInformationMessage('Copied LESS/SCSS BEM format to clipboard');
		});
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
