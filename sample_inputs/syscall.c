#include <stdio.h>
#include <string.h>
#include <unistd.h>

static int fcall_write(int fd, void *buffer, size_t buffer_size)
    __attribute__((noinline));

static int fcall_write(int fd, void *buffer, size_t buffer_size) {
    return write(fd, buffer, buffer_size);
}

static int inlined_write(int fd, void *buffer, size_t buffer_size)
    __attribute__((always_inline));

static int inlined_write(int fd, void *buffer, size_t buffer_size) {
    return write(fd, buffer, buffer_size);
}

int main(int argc, char *argv[]) {
  char *msg = "This message is being printed directly by the linux kernel "
              "through a syscall instruction\n";

  __asm__("movq $1,%%rax\n"
          "movq $1, %%rdi\n"
          "movq %0, %%rsi\n"
          "movq %1, %%rdx\n"
          "syscall\n"
          :
          : "r"(msg), "r"(strlen(msg))
          : "rax", "rdi", "rsi");

  msg = "This message is printed through an external call to the write() "
        "function in libc.so\n";

  write(1, msg, strlen(msg));

  msg = "This message is printed through a local call to fcall_write()\n";

  fcall_write(1, msg, strlen(msg));

  msg = "This message is sent through an inlined call to inlined_write, which "
        "will compile into an external call to lib.so's write()\n";

  inlined_write(1, msg, strlen(msg));

  return 0;
}
