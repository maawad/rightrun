import * as vscode from 'vscode';
import { registerDuplicateTools } from './duplicateTools';
import { registerExecTools } from './execTools';
import { registerTemplateTools } from './templates';
import { registerSymlinkTools } from './symlinkTools';
import path from 'path';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	// Set absolute template paths at activation if not already set
	const config = vscode.workspace.getConfiguration('rightrun');
	const extensionPath = context.extensionPath;
	const templateDefaults: { [key: string]: string } = {
		templateShell: 'templates/template.sh',
		templatePython: 'templates/template.py',
		templateHIP: 'templates/template.hip',
		templateMakefile: 'templates/template.Makefile',
		templateCMakeLists: 'templates/template.CMakeLists.txt'
	};
	for (const [key, relPath] of Object.entries(templateDefaults)) {
		const current = config.get<string>(key);
		if (!current) {
			const fullPath = path.join(
				vscode.extensions.getExtension('TinkerCode.rightrun')?.extensionPath || '',
				relPath
			);
			config.update(key, fullPath, vscode.ConfigurationTarget.Global);
		}
	}

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
