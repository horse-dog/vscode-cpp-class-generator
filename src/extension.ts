'use strict';

import { ExtensionContext, window, SnippetString, Position } from 'vscode';
import * as vscode from 'vscode';

import { getSelectedCppClass } from './functions';
import { CppCodeActionCmdList } from './actions';
import { generateToString, generateAll } from './srcactions';

export function activate(context: ExtensionContext) {
	CppCodeActionCmdList.forEach(cmd => {
		context.subscriptions.push(
			vscode.commands.registerCommand(cmd.command, () => {
				runner(cmd.func);
			}));
	});
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'cpp' }, new CppSourceActions(), {
			providedCodeActionKinds: CppSourceActions.providedCodeActionKinds,
		})
	);
}

export function deactivate() { }

function runner(fun: Function) {
	let editor = window.activeTextEditor!;
	let generateInternal = vscode.workspace.getConfiguration().get('cppClassGenerator.generateInternal');
	getSelectedCppClass(editor).then(async cppClass => {
		if (cppClass.template != '') generateInternal = true;
		let contents: string[] = await fun(cppClass, generateInternal, false);
		if (generateInternal) {
			editor.insertSnippet(new SnippetString('\n public:' + contents[0]), new Position(cppClass.end, 0));
		} else {
			editor.insertSnippet(new SnippetString(contents[1]), new Position(cppClass.end + 1, 0));
			editor.insertSnippet(new SnippetString('\n public:\n' + contents[0]), new Position(cppClass.end, 0));	
		}
		if (fun == generateAll || fun == generateToString) {
			if (!hasInclude(editor.document.getText(), 'sstream')) {
				editor.insertSnippet(new SnippetString('#include <sstream>\n'), new Position(1, 0));
			}
		}
	}).catch(err => {
		window.showErrorMessage(err);
	})
}

function hasInclude(content: string, include: string) {
	let lines = content.split('\n');
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i].trim();
		if (line.startsWith('#include') && line.includes(include))
		return true;
	}
	return false;
}

export class CppSourceActions implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [vscode.CodeActionKind.Source];
	public static readonly cache: vscode.CodeAction[] = [];
	constructor() {
		CppCodeActionCmdList.forEach(cmd => {
			const action = new vscode.CodeAction(cmd.title, vscode.CodeActionKind.Source);
			action.command = { command: cmd.command, title: cmd.title };
			CppSourceActions.cache.push(action);
		});
	}
	public provideCodeActions(document: vscode.TextDocument,
		range: vscode.Range): vscode.CodeAction[] | undefined {
		return CppSourceActions.cache;
	}
}