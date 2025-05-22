import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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
			const absPath = require('path').join(extensionPath, relPath);
			config.update(key, absPath, vscode.ConfigurationTarget.Global);
		}
	}

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
	let duplicateFileDisposable = vscode.commands.registerCommand('rightrun.duplicate', async (resource: vscode.Uri) => {
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

	// Register the show permissions command
	let showPermissionsDisposable = vscode.commands.registerCommand('rightrun.showPermissions', async (resource: vscode.Uri) => {
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
			const stats = fs.statSync(filePath);
			const mode = stats.mode;
			const permissionsOctal = mode.toString(8).slice(-3);
			const permissionsHex = mode.toString(16).slice(-3);
			outputChannel.appendLine(`File permissions for ${filePath}: Octal: ${permissionsOctal}, Hex: ${permissionsHex}`);
			vscode.window.showInformationMessage(`File permissions: Octal: ${permissionsOctal}, Hex: ${permissionsHex}`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			outputChannel.appendLine(`Error showing permissions: ${errorMessage}`);
			vscode.window.showErrorMessage(`Failed to show permissions: ${errorMessage}`);
		}
	});

	// Register the duplicate with timestamp command
	let duplicateWithTimestampDisposable = vscode.commands.registerCommand('rightrun.timestamped', async (resource: vscode.Uri) => {
		try {
			if (!resource) {
				const activeEditor = vscode.window.activeTextEditor;
				if (!activeEditor) {
					vscode.window.showErrorMessage('No file selected');
					return;
				}
				resource = activeEditor.document.uri;
			}

			const fsPromises = fs.promises;
			const srcPath = resource.fsPath;
			const parentDir = path.dirname(srcPath);
			const baseName = path.basename(srcPath);
			const date = new Date();
			const timestamp = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${date.getFullYear()}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}${String(date.getSeconds()).padStart(2, '0')}`;

			let newName: string;
			if (fs.lstatSync(srcPath).isDirectory()) {
				// Folder
				newName = `${baseName}_${timestamp}`;
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
				outputChannel.appendLine(`Duplicated folder with timestamp: ${srcPath} -> ${destPath}`);
			} else {
				// File
				const ext = path.extname(baseName);
				const base = path.basename(baseName, ext);
				newName = `${base}_${timestamp}${ext}`;
				const destPath = path.join(parentDir, newName);
				await fsPromises.copyFile(srcPath, destPath);
				outputChannel.appendLine(`Duplicated file with timestamp: ${srcPath} -> ${destPath}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			outputChannel.appendLine(`Error duplicating file with timestamp: ${errorMessage}`);
			vscode.window.showErrorMessage(`Failed to duplicate with timestamp: ${errorMessage}`);
		}
	});

	context.subscriptions.push(
		makeExecutableDisposable,
		removeExecutableDisposable,
		duplicateFileDisposable,
		showPermissionsDisposable,
		duplicateWithTimestampDisposable,
		vscode.commands.registerCommand('rightrun.createShellTemplate', createTemplate('shell')),
		vscode.commands.registerCommand('rightrun.createPythonTemplate', createTemplate('python')),
		vscode.commands.registerCommand('rightrun.createHIPTemplate', createTemplate('hip')),
		vscode.commands.registerCommand('rightrun.createMakefileTemplate', createTemplate('makefile')),
		vscode.commands.registerCommand('rightrun.createCMakeListsTemplate', createTemplate('cmakelists'))
	);
}

// This method is called when your extension is deactivated
export function deactivate() {
	outputChannel.dispose();
}

async function readTemplate(templateName: string): Promise<string> {
	const config = vscode.workspace.getConfiguration('rightrun');
	const templateKeys: { [key: string]: string } = {
		shell: 'templateShell',
		python: 'templatePython',
		hip: 'templateHIP',
		makefile: 'templateMakefile',
		cmakelists: 'templateCMakeLists'
	};

	const key = templateKeys[templateName];
	if (!key) {
		throw new Error(`Unknown template type: ${templateName}`);
	}

	const templatePath = config.get<string>(key);
	if (!templatePath) {
		if (typeof outputChannel !== 'undefined') {
			outputChannel.appendLine(`[RightRun] Template config dump: ${JSON.stringify({
				shell: config.get('templateShell'),
				python: config.get('templatePython'),
				hip: config.get('templateHIP'),
				makefile: config.get('templateMakefile'),
				cmakelists: config.get('templateCMakeLists')
			}, null, 2)}`);
		}
		throw new Error(`Template ${templateName} not found in configuration`);
	}

	const fullPath = path.join(
		vscode.extensions.getExtension('TinkerCode.rightrun')?.extensionPath || '',
		templatePath
	);

	try {
		return await fs.promises.readFile(fullPath, 'utf8');
	} catch (error) {
		throw new Error(`Failed to read template ${templateName}: ${error}`);
	}
}

function createTemplate(type: string) {
	return async (resource: vscode.Uri) => {
		try {
			if (!resource) {
				vscode.window.showErrorMessage('No file or directory selected');
				return;
			}

			const template = await readTemplate(type);
			if (!template) {
				vscode.window.showErrorMessage(`Failed to read ${type} template`);
				return;
			}

			const stats = await vscode.workspace.fs.stat(resource);
			let targetPath: string;

			if (stats.type === vscode.FileType.Directory) {
				// If a directory is selected, create a new file inside it
				const fileName = type === 'cmakelists' ? 'CMakeLists.txt' :
					type === 'makefile' ? 'Makefile' :
						type === 'shell' ? 'template.sh' :
							type === 'python' ? 'template.py' :
								`template.${type}`;
				targetPath = vscode.Uri.joinPath(resource, fileName).fsPath;
			} else {
				// If a file is selected, use its directory
				const dirPath = vscode.Uri.file(path.dirname(resource.fsPath));
				const fileName = type === 'cmakelists' ? 'CMakeLists.txt' :
					type === 'makefile' ? 'Makefile' :
						type === 'shell' ? 'template.sh' :
							type === 'python' ? 'template.py' :
								`template.${type}`;
				targetPath = vscode.Uri.joinPath(dirPath, fileName).fsPath;
			}

			await vscode.workspace.fs.writeFile(vscode.Uri.file(targetPath), Buffer.from(template));
			const doc = await vscode.workspace.openTextDocument(targetPath);
			await vscode.window.showTextDocument(doc);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to create ${type} template: ${error}`);
		}
	};
}
