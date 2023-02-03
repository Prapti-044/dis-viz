from distutils.core import setup, Extension
import os

os.environ["CC"] = "g++"

def main():
    setup(
        name="simpleoptparser",
        version="0.1.0",
        description="Python interface for the simpleoptparser C library function",
        author="Shadmaan Hye",
        author_email="praptishadmaan@gmail.com",
        ext_modules=[
            Extension(
                name="simpleoptparser",
                sources=["simpleopt_wrapper.cc", "simpleopt.cc"],
                include_dirs=["/opt/view/include", "/root/simple-optparser/includes", "/usr/include"],
                library_dirs=["/opt/view/lib", "/opt/view/lib64"],
                libraries=["symtabAPI", "parseAPI", "instructionAPI", "symLite", "dynDwarf", "dynElf", "common", "elf"],
                extra_compile_args=["-std=c++0x"],
                language="c++",
            )
        ]
    )

if __name__ == "__main__":
    main()
