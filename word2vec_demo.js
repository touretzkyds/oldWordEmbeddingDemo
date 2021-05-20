"use strict";

function processRawVecs(text) {
    let vecs = new Map();
    let lines = text.trim().split(/\n/);
    for (const line of lines) {
        let entries = line.trim().split(' ');
        vecs.set(entries[0], entries.slice(1));
        
    }

    return vecs;

}


async function main() {
    let response = await fetch("https://raw.githubusercontent.com/jxu/Word2VecDemo/master/wordvecs_toy.txt");
    let text = await response.text();
    //console.log(JSON.stringify(text));
    
    let vecs = processRawVecs(text);
    console.log(vecs);
}

main();
