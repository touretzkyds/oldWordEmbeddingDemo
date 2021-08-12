"use strict";

const MAGNIFY_WINDOW = 5; // range for magnified view
const HEATMAP_MIN = -0.2;  // min and max for heatmap colorscale
const HEATMAP_MAX = 0.2;


// global variables for various plotting functionality

// words plotted on scatter plot
// changes from original demo: replace "refrigerator" with "chair" and "computer"
let scatterWords = ['man', 'woman', 'boy', 'girl', 'king', 'queen', 'prince', 'princess', 'nephew', 'niece',
    'uncle', 'aunt', 'father', 'mother', 'son', 'daughter', 'husband', 'wife', 'chair', 'computer'];

// words involved in the computation of analogy in scatter plot (#12)
let analogyScatterWords = [];

// words to show in vector display
let vectorWords = ["queen", "king", "girl", "boy", "woman", "man"];

// selected word in scatterplot (empty string represents nothing selected)
let selectedWord = "";

// saved hoverX for use in magnify view
let hoverX = MAGNIFY_WINDOW;

// main word to vector Map (may include pseudo-word vectors like "man+woman")
let vecs = new Map();

// Set of actual words found in model (no pseudo-words)
let vocab = new Set();

let vecsDim; // word vector dim
let nearestWords; // nearest words Map

// vector calculations and plotting, including residual (issue #3)
let feature1, feature2, residualFeature;

// to be used for naming features
let feature1Name;
let feature2Name;

// words to be used for creating dimensions
let feature1Set1, feature1Set2, feature2Set1, feature2Set2;


// read raw model text and write to vecs and vocab
function processRawVecs(text) {
    const lines = text.trim().split(/\n/);
    for (const line of lines) {
        const entries = line.trim().split(' ');
        vecsDim = entries.length - 1;
        const word = entries[0];
        const vec = new Vector(entries.slice(1).map(Number)).unit();  // normalize word vectors
        vocab.add(word);
        vecs.set(word, vec);
    }
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

// create feature dimension vectors
function createFeature(vecs, wordSet1, wordSet2) {
    // for each pair of words, subtract vectors
    console.assert(wordSet1.length === wordSet2.length);
    const subVecs = wordSet1.map((word1, i) => vecs.get(word1).sub(vecs.get(wordSet2[i])));
    // average subtracted vectors into one unit feature vector
    return subVecs.reduce((a,b) => a.add(b)).unit();
}



// plot each word on a 3D scatterplot projected onto gender, age, residual features
// as part of the process, computes features
// used to refresh selected word
function plotScatter(newPlot=false) {
    // populate feature vectors
    feature1 = createFeature(vecs, feature1Set1, feature1Set2);
    feature2 = createFeature(vecs, feature2Set1, feature2Set2);

    const allFeatureWords = feature1Set1.concat(feature1Set2).concat(feature2Set1).concat(feature2Set2);
    const residualWords = [...new Set(allFeatureWords)];

    // residual dim calculation described in #3
    residualFeature = residualWords.map(word => {
            const wordVec = vecs.get(word);
            const wordNoFeature1 = wordVec.sub(feature1.scale(wordVec.dot(feature1)));
            const wordResidual = wordNoFeature1.sub(feature2.scale(wordNoFeature1.dot(feature2)));
            return wordResidual;
        }
    ).reduce((a,b) => a.add(b)).unit(); // average over residual words and normalize


    // words to actually be plotted (so scatterWords is a little misleading)
    const plotWords = [...new Set(scatterWords.concat(analogyScatterWords))];

    // x, y, z are simply projections onto features
    // use 1 - residual for graphical convention (#3)
    const x = plotWords.map(word => 1 - vecs.get(word).dot(residualFeature));
    const y = plotWords.map(word => vecs.get(word).dot(feature1));
    const z = plotWords.map(word => vecs.get(word).dot(feature2));

    // color points by type with priority (#12)
    const color = plotWords.map(word =>
        (word === selectedWord) ? "#FF0000"
            : (word === analogyScatterWords[3]) ? "#FF8888"
            : (word === analogyScatterWords[4]) ? "#00FF00"
            : (analogyScatterWords.includes(word)) ? "#0000FF"
            : "#000000"
    );

    // For each point, include numbered list of nearest words in hovertext
    const hovertext = plotWords.map(target =>
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
            text: plotWords,
            hoverinfo: "text",
            hovertext: hovertext
        }
    ];

    const ZOOM = 0.8;

    // save previous camera code (workaround for #9)
    let camera;
    if (newPlot) {
        camera = {eye: {x: -2.5*ZOOM, y: -0.75*ZOOM, z: 0.5*ZOOM}};
    } else { // save camera
        const plotly_scatter = document.getElementById("plotly-scatter");
        camera = plotly_scatter.layout.scene.camera;
    }

    console.log("Using camera", camera);


    const layout = {
        title: {text: "Word vector projection"},
        scene: {
            xaxis: {
                title: {text: "[residual]"},
                dtick: 0.1
            },
            yaxis: {
                title: {
                    text: feature1Name,
                    // color based on if axis feature is selected word
                    font: {color: (selectedWord === feature1Name) ? "red" : "black"}
                },
                dtick: 0.1
            },
            zaxis: {
                title: {
                    text: feature2Name,
                    font: {color: (selectedWord === feature2Name ? "red" : "black")}
                },
                dtick: 0.1
            },
            camera: camera
        },
        margin: {l:0, r:0, t:30, b:0}, // maximize viewing area
        font: {size: 12}
    };

    // always make new plot (#9)
    // replotting scatter3d produces ugly error (#10)
    Plotly.newPlot("plotly-scatter", data, layout);

    // bind scatter click event
    let plotly_scatter = document.getElementById("plotly-scatter");

    plotly_scatter.on("plotly_click", (data) => {
        const ptNum = data.points[0].pointNumber;
        const clickedWord = plotWords[ptNum];

        if (clickedWord === selectedWord) { // deselect
            selectedWord = "";
            console.log("Deselected", clickedWord);
        } else { // select
            selectedWord = clickedWord;
            console.log("Selected", selectedWord);
        }

        // replot with new point color
        plotScatter();
    });

}

function selectAxis(axis) {
    let selectedWordInput = (axis === 0) ? feature1Name : feature2Name;
    console.log("button", selectedWordInput);

    // add features as pseudo-words (should it be computed here?)
    vecs.set(selectedWordInput, (axis === 0) ? feature1 : feature2);


    if (selectedWordInput === selectedWord) {  // deselect word
        selectedWord = "";
    } else { // select word
        selectedWord = selectedWordInput;
    }


    plotScatter(); // replot selected word
}

function updateHeatmapsOnWordClick() {
    // affects all heatmaps since they all have .yaxislayer-above!
    // https://stackoverflow.com/a/47400462
    console.log("Binding heatmap click event");

    d3.selectAll(".yaxislayer-above").selectAll("text")
        .on("click", (d) => {
            const idx = d.target.__data__.x;
            console.log("Clicked on", idx);
            if (selectedWord) {
                // modify vector view to show selected word and then deselect
                vectorWords[idx] = selectedWord;
                selectedWord = "";

                // replot all
                plotScatter();
                plotVector();
            }
        });
}

// plot vector and magnify views
function plotVector(newPlot=false) {
    // heatmap plots matrix of values in z
    const z = vectorWords.map(word => vecs.get(word));

    const data = [
        {
            // can't use y: vectorWords since the heatmap won't display duplicate words
            z: z,
            zmin: HEATMAP_MIN,
            zmax: HEATMAP_MAX,
            type: "heatmap",
            ygap: 5
        }
    ];

    const layout = {
        title: {text: "Vector visualization"},
        xaxis: {
            title: "Vector dimension",
            dtick: 10,
            zeroline: false,
            fixedrange: true
        },
        yaxis: {
            title: "Words",
            tickvals: d3.range(vectorWords.length),
            ticktext: vectorWords,
            fixedrange: true,
            tickangle: 60
        },
        margin: {t:30},
        //dragmode: false
    };

    if (newPlot) {
        Plotly.newPlot("plotly-vector", data, layout);
        const plotly_vector = document.getElementById("plotly-vector");

        // bind axis click to replace word in vector display after plot
        plotly_vector.on("plotly_afterplot", updateHeatmapsOnWordClick);

        plotly_vector.on("plotly_hover", data => {
            hoverX = data.points[0].x;
            console.log("Hover " + hoverX);
            plotMagnify();
        });

        plotMagnify(true);
    }

    else {
        Plotly.react("plotly-vector", data, layout);
        plotMagnify();
    }
}

function plotMagnify(newPlot=false) {
    // ensure hoverX will produce proper plot
    // bounds are inclusive
    const lo = hoverX - MAGNIFY_WINDOW;
    const hi = hoverX + MAGNIFY_WINDOW;
    if (!(0 <= lo && hi < vecsDim)) {
            return;
        }

    // heatmap with subset of z
    const z = vectorWords.map(word =>
        vecs.get(word).slice(lo, hi + 1));

    const data = [
        {
            x: d3.range(lo, hi + 1),
            z: z,
            zmin: HEATMAP_MIN,
            zmax: HEATMAP_MAX,
            type: "heatmap",
            ygap: 5,
            showscale: false
        }
    ];

    const layout = {
        title: {text: "Magnified view"},
        xaxis: {
            title: "Vector dimension",
            dtick:1,
            zeroline: false,
            fixedrange: true
        },
        yaxis: {
            //title: "Words",
            tickvals: d3.range(vectorWords.length),
            ticktext: vectorWords,
            fixedrange: true,
            tickangle: 60
        },
        margin: {r:5, t:30} // get close to main vector view
    };

    if (newPlot) {
        Plotly.newPlot("plotly-magnify", data, layout);
        // bind axis click after plot, similar to vector
        const plotly_magnify = document.getElementById("plotly-magnify");
        plotly_magnify.on("plotly_afterplot", updateHeatmapsOnWordClick);
    }
    else {
        Plotly.react("plotly-magnify", data, layout);
    }
}

function modifyWord() {
    const word = document.getElementById("modify-word-input").value;
    let wordModified = false;

    if (scatterWords.includes(word)) {  // remove word
        scatterWords = scatterWords.filter(item => item !== word);
        document.getElementById("modify-word-message").innerText = `"${word}" removed`;
        selectedWord = ""; // remove selected word
        wordModified = true;
    }
    else { // add word if in vocab
        if (vocab.has(word)) {
            scatterWords.push(word);
            document.getElementById("modify-word-message").innerText = `"${word}" added`;
            selectedWord = word; // make added word selected word
            wordModified = true;
        }
        else { // word not found
            document.getElementById("modify-word-message").innerText = `"${word}" not found`;
            // no replot or change to selected word
        }
    }

    if (wordModified) {
        plotScatter();  // replot to update scatter view
        document.getElementById("modify-word-input").value = ""; // clear word

    }
}

// process 3COSADD word analogy input, write arithmetic vectors to vector view and add nearest neighbors to result (#14)
// notation from original paper: "Linguistic Regularities in Continuous Space Word Representations" (Mikolov 2013)
// Analogy notation for words: a:b as c:d, with d unknown
// vector y = x_b - x_a + x_c, find w* = argmax_w cossim(x_w, y)
function processAnalogy() {
    const wordA = document.getElementById("analogy-word-a").value;
    const wordB = document.getElementById("analogy-word-b").value;
    const wordC = document.getElementById("analogy-word-c").value;

    const inputWords = [wordA, wordB, wordC];

    // Handle not found input words gracefully
    for (const word of inputWords) {
        if (!(vocab.has(word))) {
            document.getElementById("analogy-message").innerText = `"${word}" not found`;
            return;
        }
    }

    // all words in inputWords, clear analogy-message
    document.getElementById("analogy-message").innerText = "";

    const vecA = vecs.get(wordA);
    const vecB = vecs.get(wordB);
    const vecC = vecs.get(wordC);

    // vector arithmetic, scale to unit vector
    const vecBMinusA = vecB.sub(vecA);
    const wordBMinusA = `${wordB}-${wordA}`;
    const vecY = vecBMinusA.add(vecC).unit();
    const wordY = `${wordB}-${wordA}+${wordC}`;

    // find most similar words for analogy
    let wordAnalogyPairs = [...vocab]
        .filter(word => !inputWords.includes(word))  // don't match words used in arithmetic (#12)
        .map(word => [word, vecY.dot(vecs.get(word))]);

    wordAnalogyPairs.sort((a,b) => b[1] - a[1]);
    const nearestAnalogyWords = wordAnalogyPairs.slice(0, 10).map(pair => pair[0]);
    const wordWstar = nearestAnalogyWords[0];

    // add nearest words to Y to nearest word list (#12)
    nearestWords.set(wordY, nearestAnalogyWords);

    // write out most similar word to text box
    document.getElementById("analogy-word-wstar").value = wordWstar;

    // write arithmetic vectors to vector view
    vecs.set(wordBMinusA, vecBMinusA);
    vecs.set(wordY, vecY);

    // set analogy words to display in scatter (#12) in specific order:
    analogyScatterWords = [wordB, wordA, wordC, wordY, wordWstar];
    plotScatter();

    // write arithmetic vectors to vector view (#14)
    vectorWords = [wordB, wordA, wordBMinusA, wordC, wordY, wordWstar].reverse();
    plotVector();
}


// inflate option to:"string" freezes browser, see https://github.com/nodeca/pako/issues/228
// TextDecoder may hang browser but seems much faster
function unpackVectors(vecsBuf) {
    return new Promise((resolve) => {
        const vecsUint8 = pako.inflate(vecsBuf);
        const vecsText = new TextDecoder().decode(vecsUint8);
        return resolve(vecsText);
    });
}

// fill in default words used to define semantic dimensions and feature names for scatterplot
function fillDimensionDefault() {
    document.getElementById("user-dimension-feature1-name-input").value =
        "gender";
    document.getElementById("user-dimension-feature2-name-input").value =
        "age";

    document.getElementById("user-dimension-feature1-set1").textContent =
        "man\nking\nprince\nhusband\nfather\nson\nuncle\nnephew\nboy\nmale";
    document.getElementById("user-dimension-feature1-set2").textContent =
        "woman\nqueen\nprincess\nwife\nmother\ndaughter\naunt\nniece\ngirl\nfemale";
    document.getElementById("user-dimension-feature2-set1").textContent =
        "man\nwoman\nking\nqueen\nfather\nmother\nuncle\naunt";
    document.getElementById("user-dimension-feature2-set2").textContent =
        "boy\ngirl\nprince\nprincess\nson\ndaughter\nnephew\nniece";

}

function processDimensionInput() {
    // TODO: cleanup
    // local function for parsing input box data
    function parseInput(id) {
        return document.getElementById(id).value.split('\n');
    }


    const feature1Set1Input = parseInput("user-dimension-feature1-set1");
    const feature1Set2Input = parseInput("user-dimension-feature1-set2");
    const feature2Set1Input = parseInput("user-dimension-feature2-set1");
    const feature2Set2Input = parseInput("user-dimension-feature2-set2");

    // ensure feature sets are the same length
    if (!(feature1Set1Input.length === feature1Set2Input.length &&
        feature2Set1Input.length === feature2Set2Input.length)) {
        document.getElementById("user-dimension-message").innerText =
            "Ensure feature word sets are same length";
        return;
    }

    // simple user input validation
    // ensure all words in vocab
    for (const set of [feature1Set1Input, feature1Set2Input, feature2Set1Input, feature2Set2Input]) {
        for (const word of set) {
            if (!vocab.has(word)) {
                document.getElementById("user-dimension-message").innerText =
                    `"${word}" not found`;
                return;
            }
        }
    }


    // copy feature words after validation
    feature1Set1 = feature1Set1Input;
    feature1Set2 = feature1Set2Input;
    feature2Set1 = feature2Set1Input;
    feature2Set2 = feature2Set2Input;

    // read feature names from inputs, adding bracket syntax
    feature1Name = '[' + document.getElementById("user-dimension-feature1-name-input").value + ']';
    feature2Name = '[' + document.getElementById("user-dimension-feature2-name-input").value + ']';

    // write names to buttons
    document.getElementById("scatter-button0").innerText = feature1Name;
    document.getElementById("scatter-button1").innerText = feature2Name;
}

// fetch wordvecs locally (no error handling) and process

async function main() {
    // fill default feature for scatterplot
    fillDimensionDefault();


    // lo-tech progress indication
    const loadingText = document.getElementById("loading-text");
    loadingText.innerText = "Downloading model...";

    // note python's http.server does not support response compression Content-Encoding
    // browsers and servers support content-encoding, but manually compress to fit on github (#1)
    const vecsResponse = await fetch("wordvecs50k.vec.gz");
    const vecsBlob = await vecsResponse.blob();
    const vecsBuf = await vecsBlob.arrayBuffer();

    // async unpack vectors
    loadingText.innerText = "Unpacking model...";
    const vecsText = await unpackVectors(vecsBuf);

    loadingText.innerText = "Processing vectors...";
    processRawVecs(vecsText);

    // fetch nearest words list
    const nearestWordsResponse = await fetch("nearest_words.txt");
    const nearestWordsText = await nearestWordsResponse.text();

    nearestWords = processNearestWords(nearestWordsText);

    loadingText.innerText = "Model processing done";

    processDimensionInput();


    // plot new plots for the first time
    plotScatter(true);
    plotVector(true);
}

// Main function runs as promise after DOM has loaded
document.addEventListener("DOMContentLoaded", () => {
    main().catch(e => console.error(e));
});
