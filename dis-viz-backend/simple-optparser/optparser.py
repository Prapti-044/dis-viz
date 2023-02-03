import simpleoptparser

#!/usr/bin/python3

import argparse
import os
import sys
import tempfile
import subprocess


key = None

def parse(args):
    simpleoptparser.decode(last_opened_file)
    ret = simpleoptparser.get_json()
    # with open(key, 'w') as f:
    #     f.write(ret)
    print(ret)

def dot(args):
    simpleoptparser.decode(last_opened_file)
    ret = simpleoptparser.get_dot()
    # with open(key, 'w') as f:
    #     f.write(ret)
    print(ret)

def sourcefiles(args):
    simpleoptparser.decode(last_opened_file)
    ret = simpleoptparser.get_sourcefiles()
    ret = '''"sourcefiles": ''' + ret
    # with open(key, 'w') as f:
    #     f.write(ret)
    print(ret)

def stub(args):
    pass

last_opened_file = ""
last_opened_file_name = 'lastopenedfile.txt'
if not os.path.exists(last_opened_file_name):
    with open(last_opened_file_name, 'w') as f:
        f.write(last_opened_file)
with open(last_opened_file_name, 'r') as f:
    last_opened_file = f.read().strip()

def openFile(args):
    global last_opened_file
    last_opened_file = args.filepath
    with open(last_opened_file_name, 'w') as f:
        f.write(last_opened_file)
    print("/tmp/stub")

def closeFile(args):
    os.remove(last_opened_file_name)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OptParser binary parser for OptVis")
    subparsers = parser.add_subparsers(dest="sub_name")

    open_sub = subparsers.add_parser("open")
    open_sub.add_argument("filepath", help="Open executable file or shared library and return a key")
    open_sub.set_defaults(func=openFile)

    parse_sub = subparsers.add_parser("parse")
    parse_sub.add_argument("key", help="Print binary parse of key")
    parse_sub.set_defaults(func=parse)

    dot_sub = subparsers.add_parser("dot")
    dot_sub.add_argument("key", help="Print binary parse of key")
    dot_sub.set_defaults(func=dot)

    sourcefiles_sub = subparsers.add_parser("sourcefiles")
    sourcefiles_sub.add_argument("key", help="Print the list of sourcefiles of a key")
    sourcefiles_sub.set_defaults(func=sourcefiles)

    keepalive_sub = subparsers.add_parser("keepalive")
    keepalive_sub.add_argument("key", help="Keep the server associated with the keep alive")
    keepalive_sub.set_defaults(func=stub)

    close_sub = subparsers.add_parser("close")
    close_sub.add_argument("key", help="Close the binary associated with a key")
    close_sub.set_defaults(func=closeFile)

    args = parser.parse_args()
    if "key" in args:
        key = args.key

    try:
        args.func(args)
    except Exception as e:
        print(e.msg)
