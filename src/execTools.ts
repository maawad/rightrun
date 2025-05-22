import * as vscode from 'vscode';
import * as fs from 'fs';

export function registerExecTools(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    // Register the make executable command
    let makeExecutableDisposable = vscode.commands.registerCommand('rightrun.makeExecutable', async (resource: vscode.Uri) => {
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

    context.subscriptions.push(makeExecutableDisposable, removeExecutableDisposable, showPermissionsDisposable);
}