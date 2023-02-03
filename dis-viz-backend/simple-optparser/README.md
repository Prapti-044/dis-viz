# simple optparser

The simpleopt takes a binary file and disassembles it and creates a convenient json file. This is a python module wrapping the simpleopt c files.

## Installation

```bash
python3 setup.py install
```

## Usage

```python
import simpleoptparser as sopt

# Decode the binary files to get all the information
# This must be run before running any other functions in the module
# Here "./test" is a binary file compiled with "g++ -g test.cc -o test"
sopt.decode("./test")

with open("out.json", "w") as f:
    f.write(
        # Get the json file (same as optparser parse functionality)
        sopt.get_json()
    )


with open("out.dot", "w") as f:
    f.write(
      # Get the dot file (same as optparser dot functionality)
      sopt.get_dot()
    )


with open("sourceFiles.json", "w") as f:
    f.write(
        # Get the dot file (same as optparser sourcefiles functionality)
        sopt.get_sourcefiles()
    )
```

## Docker

If you do not have dyninst installed in your system, you can easily use docker container to run this module.

```bash
# Build the image
docker build -t dyninst-dev .

# Run an interactive shell in it
docker run --rm -it -v "$(pwd)":/root/simple-optparser --entrypoint fish dyninst-dev

# install the python module
python3 setup.py install

# Now everything is setup
```