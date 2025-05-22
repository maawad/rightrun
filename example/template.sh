#!/bin/bash

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