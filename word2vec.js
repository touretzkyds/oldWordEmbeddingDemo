"use strict";

// global array of words plotted on scatter plot
// changes from original demo: replace "refrigerator" with "chair" and "computer"
let scatterWords = ['man', 'woman', 'boy', 'girl', 'king', 'queen', 'prince', 'princess', 'nephew', 'niece',
    'uncle', 'aunt', 'father', 'mother', 'son', 'daughter', 'husband', 'wife', 'chair', 'computer'];

// global array for words to show in vector display
let vectorWords = ["queen", "king", "girl", "boy", "woman", "man"];

// global word in scatterplot to be selected
// empty string represents nothing selected
let selectedWord = "";

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

let vecs; // global word to vector Map
let nearestWords; // global nearest words Map
let ageFeature, genderFeature, residualFeature; // global feature vectors for use in replotting

function processRawVecs(text) {
    let vecs = new Map();
    const lines = text.trim().split(/\n/);
    for (const line of lines) {
        const entries = line.trim().split(' ');
        const word = entries[0];
        const vec = new Vector(entries.slice(1).map(Number)).unit();  // normalize word vectors
        vecs.set(word, vec);
    }
    return vecs;
}

function processNearestWords(text) {
    let nearestWords = new Map();
    const lines = text.trim().split(/\n/);
    for (const line of lines) {
        const entries = line.trim().split(' ');
        const target = entries[0];
        const words = entries.slice(1);
        nearestWords.set(target, words);
    }
    return nearestWords;
}

function createFeature(vecs, wordPairs) {
    // for each word pair, subtract vectors
    const subVecs = wordPairs.map(pair => vecs.get(pair[0]).sub(vecs.get(pair[1])));
    // average subtracted vectors into one unit feature vector
    return subVecs.reduce((a,b) => a.add(b)).unit();
}


// plot each word projected onto gender, age, residual features
function plotScatter(newPlot=false) {
    // x, y, z are simply projections onto features
    // use 1 - residual for graphical convention (#3)
    const x = scatterWords.map(word => 1 - vecs.get(word).dot(residualFeature));
    const y = scatterWords.map(word => vecs.get(word).dot(genderFeature));
    const z = scatterWords.map(word => vecs.get(word).dot(ageFeature));

    const color = scatterWords.map(word => (word === selectedWord) ? "#FF0000" : "#000000");

    // For each point, include numbered list of nearest words in hovertext
    const hovertext = scatterWords.map(target =>
        `Reference word:<br>${target}<br>` +
        "Nearest words:<br>" +
        nearestWords.get(target)
            .map((word, i) => `${i+1}. ${word}`)
            .join("<br>")
    );

    const data = [
        {
            x: x,
            y: y,
            z: z,
            mode: "markers+text",
            type: "scatter3d",
            marker: {
                size: 4,
                opacity: 0.8,
                color: color
            },
            text: scatterWords,
            hoverinfo: "text",
            hovertext: hovertext
        }
    ];

    const ZOOM = 0.8;
    const layout = {
        uirevision: "true",
        scene: {
            xaxis: {title: "Residual", dtick: 0.1},
            yaxis: {title: "Gender", dtick: 0.1},
            zaxis: {title: "Age", dtick: 0.1},
            camera: {eye: {x: -2.5*ZOOM, y: -0.75*ZOOM, z: 0.5*ZOOM}}
        },
        margin: {l:0, r:0, t:0, b:0}, // maximize viewing area
        font: {size: 12}
    };


    if (newPlot) Plotly.newPlot("plotly_scatter", data, layout);
    else Plotly.react("plotly_scatter", data, layout);
}

function plotVector(newPlot=false) {
    // heatmap plots matrix of values in z
    const z = vectorWords.map(word => vecs.get(word));

    const data = [
        {
            // can't use y: vectorWords since the heatmap won't display duplicate words
            z: z,
            type: "heatmap",
            ygap: 5
        }
    ];

    const layout = {
        xaxis: {title: "Vector dimension", dtick: 10},
        yaxis: {
            title: "Words",
            tickvals: Plotly.d3.range(vectorWords.length),
            ticktext: vectorWords
        }
    };

    if (newPlot) Plotly.newPlot("plotly_vector", data, layout);
    else Plotly.react("plotly_vector", data, layout);
}

function addRemoveWord() {
    const word = document.getElementById("addRemoveWordInput").value;

    if (scatterWords.includes(word)) {  // remove word
        scatterWords = scatterWords.filter(item => item !== word);
        document.getElementById("addRemoveMessage").innerText = `"${word}" removed`;
        selectedWord = ""; // remove selected word
        plotScatter();  // replot (new plot, not Plotly.react)
    }
    else { // add word if in wordvecs
        if (vecs.has(word)) {
            scatterWords.push(word);
            document.getElementById("addRemoveMessage").innerText = `"${word}" added`;
            selectedWord = word; // make added word selected word
            plotScatter(); // replot
        }
        else { // word not found
            document.getElementById("addRemoveMessage").innerText = `"${word}" not found`;
            // no replot or change to selected word
        }
    }
}


async function main() {
    // fetch wordvecs locally (no error handling) and process
    // note python's http.server does not support response compression Content-Encoding
    const vecsResponse = await fetch("wordvecs50k.txt");
    const vecsText = await vecsResponse.text();

    // lo-tech progress indication
    document.getElementById("loading_text").innerText = "Model downloaded";

    vecs = processRawVecs(vecsText);

    // fetch nearest words list
    const nearestWordsResponse = await fetch("nearest_words.txt");
    const nearestWordsText = await nearestWordsResponse.text();
    nearestWords = processNearestWords(nearestWordsText);

    // vector calculations and plotting, including residual (issue #3)
    genderFeature = createFeature(vecs, GENDERPAIRS);
    ageFeature = createFeature(vecs, AGEPAIRS);
    residualFeature = RESIDUALWORDS.map(word => {
            const wordVec = vecs.get(word);
            const wordNoGender = wordVec.sub(genderFeature.scale(wordVec.dot(genderFeature)));
            const wordResidual = wordNoGender.sub(ageFeature.scale(wordNoGender.dot(ageFeature)));
            return wordResidual;
        }
    ).reduce((a,b) => a.add(b)).unit(); // average over residual words and normalize

    plotScatter(true);
    plotVector(true);

    // bind scatter click event
    let plotly_scatter = document.getElementById("plotly_scatter");
    let plotly_vector = document.getElementById("plotly_vector");

    plotly_scatter.on("plotly_click", (data) => {
        let ptNum = data.points[0].pointNumber;
        selectedWord = scatterWords[ptNum];

        // replot point color
        // timeout hack is needed due to https://github.com/plotly/plotly.js/issues/1025
        setTimeout(() => plotScatter(), 100);
    });

    // bind axis click to replace word in vector display
    // https://stackoverflow.com/a/47400462
    plotly_vector.on("plotly_afterplot", () => {
       Plotly.d3.selectAll(".yaxislayer-above").selectAll("text") // d3 not exported in plotly 2.0
           .on("click", (d) => {
               if (selectedWord) {
                   vectorWords[d.x] = selectedWord;
                   plotVector();
               }
           });
    });

}

// Main function runs as promise
main().catch(e => console.error(e));
