#include <Python.h>

#if PY_MAJOR_VERSION < 3
#error "Requires Python 3"
#include "stopcompilation"
#endif

#include "simpleopt.h"


#include <iostream>

static PyObject *method_decode(PyObject *self, PyObject *args) {
    char *binaryFilePath = NULL;

    /* Parse arguments */
    if(!PyArg_ParseTuple(args, "s", &binaryFilePath)) {
        return NULL;
    }

    if(!decode(binaryFilePath))
        // TODO: Throw python exception here
        return PyLong_FromLong(-1);

    return PyLong_FromLong(0);
}

static PyObject *method_printParse(PyObject *self, PyObject *args) {

    std::string ret = printParse().dump();
    return PyUnicode_FromString(ret.c_str());
}

static PyObject *method_printSourceFiles(PyObject *self, PyObject *args) {

    std::string ret = printSourceFiles().dump();
    return PyUnicode_FromString(ret.c_str());
}

static PyObject *method_getAssembly(PyObject *self, PyObject *args) {

    std::string ret = getAssembly().dump();
    return PyUnicode_FromString(ret.c_str());
}

static PyObject *method_writeDot(PyObject *self, PyObject *args) {
    std::string ret = writeDOT();
    return PyUnicode_FromString(ret.c_str());
}


static PyMethodDef SimpleOptMethods[] = {
    {"decode", method_decode, METH_VARARGS, "Python interface for decode C function"},
    {"get_json", method_printParse, METH_VARARGS, "return the json string"},
    {"get_sourcefiles", method_printSourceFiles, METH_VARARGS, "return the source files"},
    {"get_dot", method_writeDot, METH_VARARGS, "return the dot string"},
    {"get_assembly", method_getAssembly, METH_VARARGS, "return the disassembly code"},
    {NULL, NULL, 0, NULL}
};


static struct PyModuleDef simpleoptmodule = {
    PyModuleDef_HEAD_INIT,
    "simpleoptparser",
    "Python interface for the simpleopt C file",
    -1,
    SimpleOptMethods
};

PyMODINIT_FUNC PyInit_simpleoptparser(void) {
    return PyModule_Create(&simpleoptmodule);
}

