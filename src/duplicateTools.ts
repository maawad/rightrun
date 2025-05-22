import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function registerDuplicateTools(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
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

    context.subscriptions.push(duplicateFileDisposable, duplicateWithTimestampDisposable);
}