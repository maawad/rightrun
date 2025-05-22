import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function registerSymlinkTools(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    let createSymlinkDisposable = vscode.commands.registerCommand('rightrun.createSymlink', async (resource: vscode.Uri) => {
        try {
            if (!resource) {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showErrorMessage('No file selected');
                    return;
                }
                resource = activeEditor.document.uri;
            }

            const sourcePath = resource.fsPath;
            const sourceName = path.basename(sourcePath);
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

            if (!workspaceRoot) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }

            // Check if source is a directory
            const isDirectory = fs.statSync(sourcePath).isDirectory();

            // Ask user for the target directory
            const targetDir = await vscode.window.showInputBox({
                prompt: 'Enter target directory for the symlink',
                value: `${sourceName}.link`,
                validateInput: (value) => {
                    if (!value) {
                        return 'Name cannot be empty';
                    }
                    const fullPath = path.join(workspaceRoot, value);
                    if (fs.existsSync(fullPath)) {
                        return 'A file or directory with this name already exists';
                    }
                    return null;
                }
            });

            if (!targetDir) {
                return;
            }

            const targetPath = path.join(workspaceRoot, targetDir);

            // Create the symlink
            await fs.promises.symlink(sourcePath, targetPath);
            outputChannel.appendLine(`Created symlink: ${targetPath} -> ${sourcePath}`);

            // For directories, reveal in explorer
            if (isDirectory) {
                const uri = vscode.Uri.file(targetPath);
                await vscode.commands.executeCommand('revealInExplorer', uri);
            } else {
                // For files, try to open as text document
                try {
                    const doc = await vscode.workspace.openTextDocument(targetPath);
                    await vscode.window.showTextDocument(doc);
                } catch (error) {
                    // If we can't open as text document, just reveal in explorer
                    const uri = vscode.Uri.file(targetPath);
                    await vscode.commands.executeCommand('revealInExplorer', uri);
                }
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            outputChannel.appendLine(`Error creating symlink: ${errorMessage}`);
            vscode.window.showErrorMessage(`Failed to create symlink: ${errorMessage}`);
        }
    });

    context.subscriptions.push(createSymlinkDisposable);
}