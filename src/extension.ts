import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
	// Create a dedicated output channel for RightRun
	outputChannel = vscode.window.createOutputChannel('RightRun');

	// Register the make executable command
	let makeExecutableDisposable = vscode.commands.registerCommand('rightrun.makeExecutable', async (resource: vscode.Uri) => {
		try {
			if (!resource) {
				// If no resource is provided, try to get the active editor
				const activeEditor = vscode.window.activeTextEditor;
				if (!activeEditor) {
					vscode.window.showErrorMessage('No file selected');
					return;
				}
				resource = activeEditor.document.uri;
			}

			const filePath = resource.fsPath;
			outputChannel.appendLine(`Making file executable: ${filePath}`);

			// Get current file permissions
			const stats = fs.statSync(filePath);
			const currentMode = stats.mode;

			// Add execute permissions for owner, group, and others
			const newMode = currentMode | 0o111;

			// Set new permissions
			fs.chmodSync(filePath, newMode);

			outputChannel.appendLine(`Successfully made file executable: ${filePath}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			outputChannel.appendLine(`Error making file executable: ${errorMessage}`);
			vscode.window.showErrorMessage(`Failed to make file executable: ${errorMessage}`);
		}
	});

	// Register the remove executable command
	let removeExecutableDisposable = vscode.commands.registerCommand('rightrun.removeExecutable', async (resource: vscode.Uri) => {
		try {
			if (!resource) {
				const activeEditor = vscode.window.activeTextEditor;
				if (!activeEditor) {
					vscode.window.showErrorMessage('No file selected');
					return;
				}
				resource = activeEditor.document.uri;
			}

			const filePath = resource.fsPath;
			outputChannel.appendLine(`Removing executable permission: ${filePath}`);

			// Get current file permissions
			const stats = fs.statSync(filePath);
			const currentMode = stats.mode;

			// Remove execute permissions for owner, group, and others
			const newMode = currentMode & ~0o111;

			// Set new permissions
			fs.chmodSync(filePath, newMode);

			outputChannel.appendLine(`Successfully removed executable permission: ${filePath}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			outputChannel.appendLine(`Error removing executable permission: ${errorMessage}`);
			vscode.window.showErrorMessage(`Failed to remove executable permission: ${errorMessage}`);
		}
	});

	// Register the duplicate file/folder command
	let duplicateFileDisposable = vscode.commands.registerCommand('rightrun.duplicateFile', async (resource: vscode.Uri) => {
		try {
			if (!resource) {
				const activeEditor = vscode.window.activeTextEditor;
				if (!activeEditor) {
					vscode.window.showErrorMessage('No file or folder selected');
					return;
				}
				resource = activeEditor.document.uri;
			}

			const fsPromises = fs.promises;
			const srcPath = resource.fsPath;
			const parentDir = path.dirname(srcPath);
			const baseName = path.basename(srcPath);

			// Helper to find a non-colliding copy name
			function getCopyName(base: string, ext: string, dir: string): string {
				let copyName = `${base} copy${ext}`;
				let counter = 2;
				while (fs.existsSync(path.join(dir, copyName))) {
					copyName = `${base} copy ${counter}${ext}`;
					counter++;
				}
				return copyName;
			}

			let newName: string;
			if (fs.lstatSync(srcPath).isDirectory()) {
				// Folder
				newName = getCopyName(baseName, '', parentDir);
				const destPath = path.join(parentDir, newName);
				// Recursively copy folder
				const copyDir = async (src: string, dest: string) => {
					await fsPromises.mkdir(dest, { recursive: true });
					const entries = await fsPromises.readdir(src, { withFileTypes: true });
					for (const entry of entries) {
						const srcEntry = path.join(src, entry.name);
						const destEntry = path.join(dest, entry.name);
						if (entry.isDirectory()) {
							await copyDir(srcEntry, destEntry);
						} else {
							await fsPromises.copyFile(srcEntry, destEntry);
						}
					}
				};
				await copyDir(srcPath, destPath);
				outputChannel.appendLine(`Duplicated folder: ${srcPath} -> ${destPath}`);
			} else {
				// File
				const ext = path.extname(baseName);
				const base = path.basename(baseName, ext);
				newName = getCopyName(base, ext, parentDir);
				const destPath = path.join(parentDir, newName);
				await fsPromises.copyFile(srcPath, destPath);
				outputChannel.appendLine(`Duplicated file: ${srcPath} -> ${destPath}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			outputChannel.appendLine(`Error duplicating file/folder: ${errorMessage}`);
			vscode.window.showErrorMessage(`Failed to duplicate: ${errorMessage}`);
		}
	});

	context.subscriptions.push(makeExecutableDisposable, removeExecutableDisposable, duplicateFileDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	outputChannel.dispose();
}
