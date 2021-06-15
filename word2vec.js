"use strict";

// array of words plotted on scatter plot
// changes from original demo: replace "refrigerator" with "chair" and "computer"
let scatterWords = ['man', 'woman', 'boy', 'girl', 'king', 'queen', 'prince', 'princess', 'nephew', 'niece',
    'uncle', 'aunt', 'father', 'mother', 'son', 'daughter', 'husband', 'wife', 'chair', 'computer'];

// Word pairs used to compute features
const GENDERPAIRS =
    [
        ["man", "woman"], 
        ["king", "queen"],
        ["prince", "princess"],
        ["husband", "wife"],
        ["father", "mother"],
        ["son", "daughter"],
        ["uncle", "aunt"],
        ["nephew", "niece"],
        ["boy", "girl"],
        ["male", "female"]
    ];

const AGEPAIRS =
    [
        ["man", "boy"],
        ["woman", "girl"],
        ["king", "prince"],
        ["queen", "princess"],
        ["father", "son"],
        ["mother", "daughter"],
        ["uncle", "nephew"],
        ["aunt", "niece"]
    ];

// Residual words made up from words in gender and age pairs
const RESIDUALWORDS = [...new Set(GENDERPAIRS.flat().concat(AGEPAIRS.flat()))];

// global (bad?) word to vector map
let vecs;


function processRawVecs(text) {
    let vecs = new Map();
    const lines = text.trim().split(/\n/);
    for (const line of lines) {
        const entries = line.trim().split(' ');
        const word = entries[0];
        const vec = new Vector(entries.slice(1).map(Number)).unit();  // normalize word vectors?
        vecs.set(word, vec);
    }
    return vecs;
}

function createFeature(vecs, wordPairs) {
    // for each word pair, subtract vectors
    const subVecs = wordPairs.map(pair => vecs.get(pair[0]).sub(vecs.get(pair[1])));
    // average subtracted vectors into one unit feature vector
    return subVecs.reduce((a,b) => a.add(b)).unit();
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

// plot each word projected onto gender, age, residual features
function plotScatter(words, x, y, z) {
    let trace = {
        x: x,
        y: y,
        z: z,
        mode: "markers+text",
        type: "scatter3d",
        marker: {
            size: 4,
            opacity: 0.8
        },
        text: words
    };

    let data = [trace];
    let layout = {
        scene: {
            xaxis: {title: "Gender"},
            yaxis: {title: "Age"},
            zaxis: {title: "Residual"}
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

    // vector calculations and plotting
    const genderFeature = createFeature(vecs, GENDERPAIRS);
    const ageFeature = createFeature(vecs, AGEPAIRS);
    // compute residual (issue #3)
    const residualFeature = RESIDUALWORDS.map(word => {
            const wordVec = vecs.get(word);
            const wordNoGender = wordVec.sub(genderFeature.scale(wordVec.dot(genderFeature)));
            const wordResidual = wordNoGender.sub(ageFeature.scale(wordNoGender.dot(ageFeature)));
            return wordResidual;
        }
    ).reduce((a,b) => a.add(b)).unit(); // average over residual words

    // x, y, z are simply projections onto features
    let x = scatterWords.map(word => vecs.get(word).dot(genderFeature));
    let y = scatterWords.map(word => vecs.get(word).dot(ageFeature));
    let z = scatterWords.map(word => vecs.get(word).dot(residualFeature));

    plotScatter(scatterWords, x, y, z);
    
}

// Main function runs as promise
main().catch(e => console.error(e));
