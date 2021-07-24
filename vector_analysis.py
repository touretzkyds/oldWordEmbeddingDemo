with open("wordvecs50k.vec") as f:
    model_lines = f.readlines()

N = len(model_lines)
vecs = dict()

for i in range(N):
    line = model_lines[i].strip().split()
    vecs[line[0]] = list(map(float, line[1:]))

for k in sorted(vecs, key=lambda k:vecs[k][249])[:20]:
    print(k, vecs[k][249])