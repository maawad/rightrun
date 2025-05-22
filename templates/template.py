#!/usr/bin/env python3

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
        print("\nProgram interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)