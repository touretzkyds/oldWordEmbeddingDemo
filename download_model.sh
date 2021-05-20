#!/bin/sh
# example of creating smaller model

wget https://github.com/jxu/Word2VecDemo/releases/download/model/model.txt

# remove first line contains vocab size and dims, then take n many words
tail -n +2 model.txt | head -n10000 > wordvecs10k.txt

