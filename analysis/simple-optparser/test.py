import simpleoptparser as sopt

sopt.decode("./test")

with open("out.json", "w") as f:
    f.write(
        sopt.get_json()
    )


with open("out.dot", "w") as f:
    f.write(
        sopt.get_dot()
    )


with open("sourceFiles.json", "w") as f:
    f.write(
        sopt.get_sourcefiles()
    )