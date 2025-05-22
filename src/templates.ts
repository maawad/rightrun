import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

function readTemplateFactory(outputChannel: vscode.OutputChannel) {
    return async function readTemplate(templateName: string): Promise<string> {
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
        let fullPath: string;
        if (path.isAbsolute(templatePath)) {
            fullPath = templatePath;
        } else {
            fullPath = path.join(
                vscode.extensions.getExtension('TinkerCode.rightrun')?.extensionPath || '',
                templatePath
            );
        }
        try {
            return await fs.promises.readFile(fullPath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read template ${templateName}: ${error}`);
        }
    };
}

function createTemplateFactory(readTemplate: (type: string) => Promise<string>, outputChannel: vscode.OutputChannel) {
    return function createTemplate(type: string) {
        return async (resource: vscode.Uri) => {
            try {
                if (!resource) {
                    vscode.window.showErrorMessage('No file or directory selected');
                    return;
                }

                // Get the actual file path, following symlinks
                const actualPath = fs.realpathSync(resource.fsPath);
                const actualUri = vscode.Uri.file(actualPath);
                const stats = await vscode.workspace.fs.stat(actualUri);

                const template = await readTemplate(type);
                if (!template) {
                    vscode.window.showErrorMessage(`Failed to read ${type} template`);
                    return;
                }

                let targetPath: string;
                if (stats.type === vscode.FileType.Directory) {
                    const fileName = type === 'cmakelists' ? 'CMakeLists.txt' :
                        type === 'makefile' ? 'Makefile' :
                            type === 'shell' ? 'template.sh' :
                                type === 'python' ? 'template.py' :
                                    `template.${type}`;
                    targetPath = vscode.Uri.joinPath(actualUri, fileName).fsPath;
                } else {
                    const dirPath = vscode.Uri.file(path.dirname(actualPath));
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
    };
}

export function registerTemplateTools(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    const readTemplate = readTemplateFactory(outputChannel);
    const createTemplate = createTemplateFactory(readTemplate, outputChannel);
    context.subscriptions.push(
        vscode.commands.registerCommand('rightrun.createShellTemplate', createTemplate('shell')),
        vscode.commands.registerCommand('rightrun.createPythonTemplate', createTemplate('python')),
        vscode.commands.registerCommand('rightrun.createHIPTemplate', createTemplate('hip')),
        vscode.commands.registerCommand('rightrun.createMakefileTemplate', createTemplate('makefile')),
        vscode.commands.registerCommand('rightrun.createCMakeListsTemplate', createTemplate('cmakelists'))
    );
}