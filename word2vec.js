// noinspection JSUnresolvedVariable

"use strict";

let scatter_words = ["man", "woman", "chair"];

let GENDER_PAIRS = 
    [
        ["man", "woman"], 
        ["king", "queen"],
        ["prince", "princess"],
    ];

// global word to vector map
let vecs;

// simple implementation of basic vector functions to Array
// (for learning purposes, probably cleaner to use library)
Array.prototype.add = function(b) {
    return this.map((e,i) => e + b[i]);
};

Array.prototype.sum = function() {
    return this.reduce((a,b) => a+b);
};


Array.prototype.scale = function(s) {
  return this.map((e) => s*e);
};



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

function plot_scatter(vecs, words) {
    // plotly test
    let x = [1, 2, 3];
    let y = [2, 3, 4];
    let z = [4, 5, 6];

    let trace = {
        x: x,
        y: y,
        z: z,
        mode: "markers",
        type: "scatter3d"
    };

    let data = [trace];
    let layout = {
        margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 0
        }};

    Plotly.newPlot("plotly_scatter", data, layout);

}

async function main() {
    // fetch wordvecs (no error handling)
    let response = await fetch("https://raw.githubusercontent.com/jxu/Word2VecDemo/master/wordvecs_toy.txt");
    let text = await response.text();

    document.getElementById("loading_text").innerHTML = "Model downloaded";

    vecs = processRawVecs(text);

    // vector calculations and plotting

   
    plot_scatter(vecs, scatter_words);
    
}

// Main function runs as promise
main().catch(e => console.error(e));
