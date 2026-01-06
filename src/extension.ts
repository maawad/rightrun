import * as vscode from 'vscode';
import { registerDuplicateTools } from './duplicateTools';
import { registerExecTools } from './execTools';
import { registerTemplateTools } from './templates';
import { registerSymlinkTools } from './symlinkTools';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	// Create a dedicated output channel for RightRun
	outputChannel = vscode.window.createOutputChannel('RightRun');

	// Register all tool modules
	registerExecTools(context, outputChannel);
	registerDuplicateTools(context, outputChannel);
	registerTemplateTools(context, outputChannel);
	registerSymlinkTools(context, outputChannel);
}

// This method is called when your extension is deactivated
export function deactivate() {
	outputChannel.dispose();
}
