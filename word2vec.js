"use strict";

let scatter_words = ["man", "woman", "chair"];

let GENDER_PAIRS = 
    [
        ["man", "woman"], 
        ["king", "queen"],
        ["prince", "princess"],
    ];

// global (bad?) word to vector map
let vecs;


function processRawVecs(text) {
    let vecs = new Map();
    const lines = text.trim().split(/\n/);
    for (const line of lines) {
        const entries = line.trim().split(' ');
        const word = entries[0];
        const vec = new Vector(entries.slice(1).map(Number));
        vecs.set(word, vec);
    }
    return vecs;
}

function createFeatures(vecs, wordPairs) {
    // for each word pair, subtract vectors
    const subVecs = wordPairs.map(pair => vecs.get(pair[0]).sub(vecs.get(pair[1])));
    // average subtracted vectors into one unit feature vector
    const featureVec = subVecs.reduce((a,b) => a.add(b)).unit();
    return featureVec;
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

// plot each word projected onto axes
function plot_scatter(vecs, words, xVec, yVec, zVec) {

    // plotly test
    let x = words.map(word => vecs.get(word).dot(xVec));
    let y = words.map(word => vecs.get(word).dot(yVec));
    let z = words.map(word => vecs.get(word).dot(zVec));

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
    let response = await fetch("https://raw.githubusercontent.com/jxu/Word2VecDemo/master/wordvecs10k.txt");
    let text = await response.text();

    document.getElementById("loading_text").innerHTML = "Model downloaded";

    vecs = processRawVecs(text);

    // vector calculations and plotting
    const genderFeature = createFeatures(vecs, GENDER_PAIRS);
    const ageFeature = genderFeature;
    const residualFeature = genderFeature;
    console.log(genderFeature);

   
    plot_scatter(vecs, scatter_words, genderFeature, ageFeature, residualFeature);
    
}

// Main function runs as promise
main().catch(e => console.error(e));
