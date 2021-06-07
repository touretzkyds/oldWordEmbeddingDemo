"use strict";

// array of words plotted on scatter plot
// changes from original demo: replace refrigerator with chair
let scatterWords = ['man', 'woman', 'boy', 'girl', 'king', 'queen', 'prince', 'princess', 'nephew', 'niece', 'chair',
    'uncle', 'aunt', 'father', 'mother', 'son', 'daughter', 'husband', 'wife'];

// TODO: finish filling in pairs
const GENDERPAIRS =
    [
        ["man", "woman"], 
        ["king", "queen"],
        ["prince", "princess"],
    ];

const AGEPAIRS =
    [
        ["man", "boy"],
        ["woman", "girl"],
        ["king", "prince"],
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

function createFeature(vecs, wordPairs) {
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

// plot each word projected onto gender feature, age feature
function plotScatter(vecs, words, genderFeature, ageFeature) {

    let trace = {
        x: words.map(word => vecs.get(word).dot(genderFeature)),
        y: words.map(word => vecs.get(word).dot(ageFeature)),
        mode: "markers",
        type: "scatter",
        marker: {
            size: 4,
            opacity: 0.8
        },
        text: words
    };

    let data = [trace];
    let layout = {
        xaxis: {
            title: "Gender"
        },

        yaxis: {
            title: "Age"
        }

    };

    Plotly.newPlot("plotly_scatter", data, layout);

}

async function main() {
    // fetch wordvecs (no error handling)
    let response = await fetch("https://raw.githubusercontent.com/jxu/Word2VecDemo/master/wordvecs10k.txt");
    let text = await response.text();

    document.getElementById("loading_text").innerHTML = "Model downloaded";

    vecs = processRawVecs(text);
    const dims = vecs.get("man").length;

    // vector calculations and plotting
    const genderFeature = createFeature(vecs, GENDERPAIRS);
    const ageFeature = createFeature(vecs, AGEPAIRS);

    const residualFeature = genderFeature;

   
    plotScatter(vecs, scatterWords, genderFeature, ageFeature);
    
}

// Main function runs as promise
main().catch(e => console.error(e));
