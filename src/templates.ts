import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Embedded templates for reliable remote development support
const EMBEDDED_TEMPLATES: { [key: string]: string } = {
    shell: `#!/bin/bash

# Default values
ARG1="default1"
ARG2="default2"

# Help message
usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -a, --arg1          First argument (default: $ARG1)"
    echo "  -b, --arg2          Second argument (default: $ARG2)"
    echo "  -h, --help          Show this help message"
}

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -a|--arg1) ARG1="$2"; shift ;;
        -b|--arg2) ARG2="$2"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown parameter: $1"; usage; exit 1 ;;
    esac
    shift
done

# Display arguments
echo "Argument 1: $ARG1"
echo "Argument 2: $ARG2"
`,
    python: `#!/usr/bin/env python3

import argparse
import sys

def parse_args():
    parser = argparse.ArgumentParser(description='Description of your program')

    # Add your arguments here
    parser.add_argument('--input', '-i',
                      type=str,
                      help='Input file path')
    parser.add_argument('--output', '-o',
                      type=str,
                      help='Output file path')
    parser.add_argument('--verbose', '-v',
                      action='store_true',
                      help='Enable verbose output')

    return parser.parse_args()

def main():
    args = parse_args()

    # Your code here
    if args.verbose:
        print(f"Input file: {args.input}")
        print(f"Output file: {args.output}")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\\nProgram interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)`,
    hip: `#include <hip/hip_runtime.h>
#include <thrust/device_vector.h>
#include <thrust/host_vector.h>
#include <thrust/sequence.h>

template <typename T>
__global__ void add(T* output,
                    const T* input_a,
                    const T* input_b,
                    const std::size_t num_elements) {
  const auto thread_idx = blockIdx.x * blockDim.x + threadIdx.x;
  if (thread_idx < num_elements) {
    output[thread_idx] = input_a[thread_idx] + input_b[thread_idx];
  }
}

int main() {
  using T = float;

  const auto num_elements = 64;

  thrust::device_vector<T> d_output(num_elements);
  thrust::device_vector<T> d_input_a(num_elements);
  thrust::device_vector<T> d_input_b(num_elements);

  thrust::sequence(d_input_a.begin(), d_input_a.end());
  thrust::sequence(d_input_b.begin(), d_input_b.end());

  add<<<1, 1024>>>(d_output.data().get(), d_input_a.data().get(),
                   d_input_b.data().get(), num_elements);

  thrust::copy(d_output.begin(), d_output.end(),
               std::ostream_iterator<T>(std::cout, "\\n"));
}`,
    makefile: `# Compiler settings
HIPCC = hipcc
CXXFLAGS = -O3 -std=c++17
HIPFLAGS = -O3

# Source files
SRC = template.hip
OBJ = $(SRC:.hip=.o)
EXE = $(SRC:.hip=)

# Default target
all: $(EXE)

# Compile HIP source
%.o: %.hip
\t$(HIPCC) $(HIPFLAGS) -c $< -o $@

# Link executable
$(EXE): $(OBJ)
\t$(HIPCC) $(OBJ) -o $@

# Clean build artifacts
clean:
\trm -f $(OBJ) $(EXE)

.PHONY: all clean
`,
    cmakelists: `cmake_minimum_required(VERSION 3.8 FATAL_ERROR)

project(MyProject LANGUAGES CXX HIP)

# Set C++ and HIP standards
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_HIP_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)
set(CMAKE_HIP_STANDARD_REQUIRED TRUE)

# Compiler flags
set(CMAKE_CXX_FLAGS_RELEASE "-O3")
set(CMAKE_HIP_FLAGS_RELEASE "-O3")

# Build options
option(BUILD_TESTS "Build tests" ON)

# Main library target
add_library(\${PROJECT_NAME} INTERFACE)
add_library(\${PROJECT_NAME}::\${PROJECT_NAME} ALIAS \${PROJECT_NAME})

# Include directories
set(INCLUDE_DIRS
    \${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Compiler flags
set(CXX_FLAGS
    $<IF:$<CXX_COMPILER_ID:MSVC>,
    /std:c++17,
    --std=c++17
    >)

# Add include directories and compile options
target_include_directories(\${PROJECT_NAME}
    INTERFACE \${INCLUDE_DIRS}
)

target_compile_options(\${PROJECT_NAME} INTERFACE
    $<$<COMPILE_LANGUAGE:CXX>:\${CXX_FLAGS}>
)

# Add subdirectories
add_subdirectory(include)

if(BUILD_TESTS)
    add_subdirectory(test)
endif()`
};

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

        // Try to read from custom path if configured
        let templatePath = config.get<string>(key);
        if (templatePath) {
            try {
                let fullPath: string;
                if (path.isAbsolute(templatePath)) {
                    fullPath = templatePath;
                } else {
                    fullPath = path.join(
                        vscode.extensions.getExtension('TinkerCode.rightrun')?.extensionPath || '',
                        templatePath
                    );
                }
                return await fs.promises.readFile(fullPath, 'utf8');
            } catch (error) {
                outputChannel.appendLine(`Warning: Failed to read custom template at ${templatePath}, falling back to embedded template: ${error}`);
            }
        }

        // Use embedded template as fallback (works in all scenarios including remote development)
        const embeddedTemplate = EMBEDDED_TEMPLATES[templateName];
        if (!embeddedTemplate) {
            throw new Error(`Unknown template type: ${templateName}`);
        }
        return embeddedTemplate;
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