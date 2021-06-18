import numpy as np
from heapq import *

DIM = 300  # vector dim
N = 10000  # number of words
K = 10  # top-k words
words = [""] * N  # word index
vecs = np.empty((N, DIM))  # words indexed by row

# ensure model stays up to date with website!
MODEL_PATH = "wordvecs10k.txt"

with open(MODEL_PATH) as f:
    model_lines = f.readlines()

assert len(model_lines) == N

for i in range(N):
    line = model_lines[i].strip().split()
    words[i] = line[0]
    assert len(line[1:]) == DIM
    v = np.array(line[1:], dtype=np.float)
    vecs[i,] = v / np.linalg.norm(v)  # normalize vecs

# too much memory to store all vector distances, so compute on-the-fly

for i in range(N):
    # maintain top-k largest similarities using a *min* heap
    # continuously remove min element, at the end we have all the max elements
    sims = []

    for j in range(N):
        if j == i: continue
        sim = vecs[i,].dot(vecs[j,])
        pair = (sim, j)  # sort by sim as kv pair

        if len(sims) < K:  # heap isn't full yet
            heappush(sims, pair)
        elif pair > sims[0]:
            heapreplace(sims, pair)


    nearest_words = [pair[1] for pair in nlargest(K, sims)]  # by index
    print(" ".join(map(str, nearest_words)))

