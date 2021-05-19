"use strict";
let x = 3;
let vec;

function processRawVecs(text) {
    let lines = text.trim().split(/\n/);
    return lines;

}


async function main() {
    let response = await fetch("https://raw.githubusercontent.com/jxu/Word2VecDemo/master/wordvecs_toy.txt");
    let text = await response.text();
    //console.log(JSON.stringify(text));
    
    let vecs = processRawVecs(text);
    console.log(vecs);
}

main();
