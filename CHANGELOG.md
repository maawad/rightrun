# Change Log

All notable changes to the "RightRun" extension will be documented in this file.

## [1.0.2] - 2025-01-06

### Fixed
- **Remote Development Support**: Templates are now embedded directly in the extension code, fixing issues with template files not being available in remote development scenarios (Remote-SSH, Remote-Containers, etc.)
- Templates no longer rely on file system paths during remote development

### Changed
- Refactored template system to use inline string constants instead of file-based templates
- Removed unnecessary template path configuration from extension activation
- Custom template paths in settings still supported as an override option

## [1.0.1] - Previous Release

### Added
- File permission management (chmod +x, chmod -x, show permissions)
- File and directory duplication tools
- Timestamped copy creation
- Template system for Shell, Python, HIP, Makefile, and CMakeLists.txt
- Symlink creation support
- Configurable template paths in settings

## [1.0.0] - Initial Release

### Added
- Basic file execution permissions
- Duplicate files and folders functionality