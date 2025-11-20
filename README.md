<h1 align="center">🏃 RightRun 🏃</h1>

<p align="center">
  <a href="https://github.com/maawad/rightrun/actions/workflows/main.yml">
    <img src="https://github.com/maawad/rightrun/actions/workflows/main.yml/badge.svg" alt="CI Status">
  </a>
  <a href="https://github.com/maawad/rightrun/actions/workflows/main.yml">
    <img src="https://img.shields.io/badge/Download-Latest%20VSIX-blue?style=flat-square" alt="Download VSIX">
  </a>
  <a href="https://open-vsx.org/extension/TinkerCode/rightrun">
    <img src="https://img.shields.io/open-vsx/v/TinkerCode/rightrun?label=Open%20VSX&style=flat-square" alt="Open VSX">
  </a>
</p>

<p align="center">
  <img src="resources/icon.png" alt="RightRun Icon" width="128" height="128">
</p>

<p align="center">
  <strong>Add powerful file permission and execution actions to VS Code — making your workflow faster and more intuitive.</strong>
</p>

## 📦 Installation

### Download Latest Version

[![Download VSIX](https://img.shields.io/badge/Download-Latest%20VSIX-blue?style=for-the-badge)](https://github.com/maawad/rightrun/actions/workflows/main.yml)

1. Go to [Actions](https://github.com/maawad/rightrun/actions)
2. Click on the latest successful workflow run
3. Scroll to "Artifacts" and download `rightrun-vsix`
4. Extract the `.vsix` file from the zip
5. In VS Code: `Extensions` → `...` → `Install from VSIX`
6. Select the downloaded `.vsix` file

### From Open VSX

[![Open VSX Version](https://img.shields.io/open-vsx/v/TinkerCode/rightrun?label=Open%20VSX&style=for-the-badge)](https://open-vsx.org/extension/TinkerCode/rightrun)

Visit [Open VSX](https://open-vsx.org/extension/TinkerCode/rightrun) to download the `.vsix` file.

## 🚀 Features

### File Permissions
- ✅ Make any file executable (chmod +x)
- ✅ Remove executable permissions
- ✅ View current file permissions

### File Management
- 📁 Duplicate files or directories
- 📁 Create timestamped copies
- 🔗 Create symlinks to files or directories

### Templates
- 📝 Create files from templates:
  - Shell scripts
  - Python scripts
  - HIP files
  - Makefiles
  - CMakeLists.txt
- ⚙️ Customize template paths in settings

## ⚙️ Extension Commands

This extension contributes the following context menu commands:

### File Permissions
1. **Enable** – Make a file executable (`chmod +x`)
2. **Disable** – Remove executable permission (`chmod -x`)
3. **Show** – Display current file permissions

### Duplication
1. **Duplicate** – Create a copy of a file or folder
2. **Timestamped** – Create a timestamped copy

### Templates
1. **Shell** – Create a shell script from template
2. **Python** – Create a Python script from template
3. **HIP** – Create a HIP file from template
4. **Makefile** – Create a Makefile from template
5. **CMakeLists** – Create a CMakeLists.txt from template

### Symlinks
1. **Create** – Create a symlink to a file or directory

## ⚙️ Configuration

You can customize template paths in VS Code settings:
- `rightrun.templateShell`: Path to shell script template
- `rightrun.templatePython`: Path to Python script template
- `rightrun.templateHIP`: Path to HIP template
- `rightrun.templateMakefile`: Path to Makefile template
- `rightrun.templateCMakeLists`: Path to CMakeLists.txt template

## 🐞 Known Issues

- On Windows, creating symlinks requires administrator privileges
- None currently reported. Please open an issue if you find any bugs!

## 📘 Release Notes

### v1.0.0

- First stable release with:
  - File permission management
  - File and directory duplication
  - Timestamped copies
  - Template system with customizable paths
  - Symlink creation

### v0.0.1

- Initial release with:
  - Make executable (right-click)
  - Duplicate files/folders