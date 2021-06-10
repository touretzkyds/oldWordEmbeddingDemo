#!/bin/sh
# example of creating smaller model from NLPL model release
wget -c https://github.com/jxu/Word2VecDemo/releases/download/model/model.txt

# take n many words (defined as only alpha characters, see issue #1)
grep -P "[[:alpha:]]+ " model.txt | head -n10000 > wordvecs10k.txt

# for analysis, get list of included words
cut -d' ' -f1 wordvecs10k.txt > alphawords10k.txt
