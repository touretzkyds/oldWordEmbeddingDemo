import numpy as np

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
    v = np.array(line[1:], dtype=np.float32)
    vecs[i,] = v / np.linalg.norm(v)  # normalize vecs

# too much memory to store all vector distances, so compute on-the-fly

for i in range(N):
    dists = []  # (index, dist) pairs
    for j in range(N):
        if j == i: continue
        dist = np.linalg.norm(vecs[i,] - vecs[j,])
        dists.append((j, dist))

    dists.sort(key = lambda pair: pair[1])
    nearest_words = [pair[0] for pair in dists[:K]]  # by index
    print(" ".join(map(str, nearest_words)))