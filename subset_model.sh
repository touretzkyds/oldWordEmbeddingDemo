#!/bin/sh
# example of creating smaller model from NLPL model release

# take n many words (defined as only alpha characters, see issue #1)
tail -n +2 wiki-news-300d-1M.vec | grep -P "^[a-zA-Z]+ " | head -n50000 > wordvecs50k.vec

# for analysis, get list of included words
cut -d' ' -f1 wordvecs50k.vec > words50k.txt
