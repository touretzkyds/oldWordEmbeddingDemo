"use strict";

let vecs;

function processRawVecs(text) {
    let vecs = new Map();
    let lines = text.trim().split(/\n/);
    for (const line of lines) {
        let entries = line.trim().split(' ');
        vecs.set(entries[0], entries.slice(1));
    }
    return vecs;
}

function getTopDim() {
    const dim = document.getElementById("dim_display").value;

    // TODO only get to run when vecs is actually loaded
    // turns Map into sorted Object by specified dim
    const sortedVecs = [...vecs.entries()].sort((a,b) => b[1][dim] - a[1][dim]);
    //console.log(sortedVecs);
    let topWords = "";

    

    for (let i=0; i<10; i++) {
        topWords += `${i} ${sortedVecs[i][0]} ${sortedVecs[i][1][dim]}<br>`;
    }
    
    // similar for bottom words
    
    for (let i=vecs.size-10; i<vecs.size; i++) {
        topWords += `${i} ${sortedVecs[i][0]} ${sortedVecs[i][1][dim]}<br>`;
    }
 
    document.getElementById("top_dim_list").innerHTML = topWords;
}

async function main() {
    // fetch wordvecs 
    let response = await fetch("https://raw.githubusercontent.com/jxu/Word2VecDemo/master/wordvecs10k.txt");
    let text = await response.text();
    
    document.getElementById("loading_text").innerHTML = "Model downloaded";

    vecs = processRawVecs(text);
    //console.log(vecs);
}

main();
