"use strict";

const MAGNIFY_WINDOW = 5; // range for magnified view
const HEATMAPMIN = -0.2;  // min and max for heatmap colorscale
const HEATMAPMAX = 0.2;

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

// global variables for various plotting functionality

// words plotted on scatter plot
// changes from original demo: replace "refrigerator" with "chair" and "computer"
let scatterWords = ['man', 'woman', 'boy', 'girl', 'king', 'queen', 'prince', 'princess', 'nephew', 'niece',
    'uncle', 'aunt', 'father', 'mother', 'son', 'daughter', 'husband', 'wife', 'chair', 'computer'];

// words to show in vector display
let vectorWords = ["queen", "king", "girl", "boy", "woman", "man"];

// selected word in scatterplot (empty string represents nothing selected)
let selectedWord = "";

// saved hoverX for use in magnify view
let hoverX = MAGNIFY_WINDOW;

// main word to vector Map (may include pseudo-word vectors like "man+woman")
let vecs = new Map();

// list of actual words found in model
let vocab = new Set();

let vecsDim; // word vector dim
let nearestWords; // nearest words Map
let ageFeature, genderFeature, residualFeature; // feature vectors for use in replotting


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

    // sanity check for debugging input data
    RESIDUALWORDS.forEach(word => console.assert(vecs.has(word),word + " not in vecs"));
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

    // save previous camera code (workaround for #9)
    let camera;
    if (newPlot) {
        camera = {eye: {x: -2.5*ZOOM, y: -0.75*ZOOM, z: 0.5*ZOOM}};
    } else { // save camera
        const plotly_scatter = document.getElementById("plotly_scatter");
        camera = plotly_scatter.layout.scene.camera;
    }

    console.log("Using camera", camera);


    const layout = {
        title: {text: "Word vector projection"},
        //uirevision: "true",
        scene: {
            xaxis: {title: "Residual", dtick: 0.1},
            yaxis: {title: "Gender", dtick: 0.1},
            zaxis: {title: "Age", dtick: 0.1},
            camera: camera
        },
        margin: {l:0, r:0, t:30, b:0}, // maximize viewing area
        font: {size: 12}
    };

    // always make new plot (#9)
    // replotting scatter3d produces ugly error (#10)
    Plotly.newPlot("plotly_scatter", data, layout);

    // bind scatter click event
    let plotly_scatter = document.getElementById("plotly_scatter");

    plotly_scatter.on("plotly_click", (data) => {
        const ptNum = data.points[0].pointNumber;
        const clickedWord = scatterWords[ptNum];

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
                plotMagnify();
            }
        });
}

function plotVector(newPlot=false) {
    // heatmap plots matrix of values in z
    const z = vectorWords.map(word => vecs.get(word));

    const data = [
        {
            // can't use y: vectorWords since the heatmap won't display duplicate words
            z: z,
            zmin: HEATMAPMIN,
            zmax: HEATMAPMAX,
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
            fixedrange: true
        },
        margin: {t:30},
        //dragmode: false
    };

    if (newPlot) {
        Plotly.newPlot("plotly_vector", data, layout);
        const plotly_vector = document.getElementById("plotly_vector");

        // bind axis click to replace word in vector display after plot
        plotly_vector.on("plotly_afterplot", updateHeatmapsOnWordClick);

        plotly_vector.on("plotly_hover", data => {
            hoverX = data.points[0].x;
            console.log("Hover " + hoverX);
            plotMagnify();
        });
    }
    else Plotly.react("plotly_vector", data, layout);
}

function plotMagnify(newPlot=false) {
    // ensure hoverX will produce proper plot
    // bounds are inclusive
    const lo = hoverX - MAGNIFY_WINDOW;
    const hi = hoverX + MAGNIFY_WINDOW;
    if (!(0 <= lo && hi < vecsDim))
        return;

    // heatmap with subset of z
    const z = vectorWords.map(word =>
        vecs.get(word).slice(lo, hi + 1));

    const data = [
        {
            x: d3.range(lo, hi + 1),
            z: z,
            zmin: HEATMAPMIN,
            zmax: HEATMAPMAX,
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
            fixedrange: true
        },
        margin: {r:5, t:30} // get close to main vector view
    };

    if (newPlot) {
        Plotly.newPlot("plotly_magnify", data, layout);
        // bind axis click after plot, similar to vector
        const plotly_magnify = document.getElementById("plotly_magnify");
        plotly_magnify.on("plotly_afterplot", updateHeatmapsOnWordClick);
    }
    else Plotly.react("plotly_magnify", data, layout);
}

function modifyWord() {
    const word = document.getElementById("modifyWordInput").value;
    let wordModified = false;

    if (scatterWords.includes(word)) {  // remove word
        scatterWords = scatterWords.filter(item => item !== word);
        document.getElementById("modifyWordMessage").innerText = `"${word}" removed`;
        selectedWord = ""; // remove selected word
        wordModified = true;
    }
    else { // add word if in wordvecs
        if (vecs.has(word)) {
            scatterWords.push(word);
            document.getElementById("modifyWordMessage").innerText = `"${word}" added`;
            selectedWord = word; // make added word selected word
            wordModified = true;
        }
        else { // word not found
            document.getElementById("modifyWordMessage").innerText = `"${word}" not found`;
            // no replot or change to selected word
        }
    }

    if (wordModified) {
        plotScatter();  // replot to update scatter view
        document.getElementById("modifyWordInput").value = ""; // clear word

    }
}

// compute 3COSADD word similarity
// also writes arithmetic vectors to vector view (#14)
function computeWordSimilarity() {
    const wordOriginal = document.getElementById("similarity-word-original").value;
    const wordToSubtract = document.getElementById("similarity-word-subtract").value;
    const wordToAdd = document.getElementById("similarity-word-add").value;

    // TODO: handle more gracefully telling user if words not available
    if (!(vecs.has(wordOriginal) && vecs.has(wordToSubtract) && vecs.has(wordToAdd))) {
        console.warn("bad word");
        return;
    }

    // vector arithmetic, scale to unit vector
    const vecSubtraction = vecs.get(wordOriginal).sub(vecs.get(wordToSubtract));
    const vecTarget = vecSubtraction.add(vecs.get(wordToAdd));

    let bestSimilarity = 0;
    let bestWord;
    for (const word of vocab) {
        //if (word === wordOriginal) continue; // don't match original word

        const similarity = vecTarget.unit().dot(vecs.get(word)); // cosine for unit vecs

        if (similarity > bestSimilarity) {
            bestWord = word;
            bestSimilarity = similarity;
        }
    }

    // write out most similar word to text box
    document.getElementById("similarity-word-closest").value = bestWord;

    // write arithmetic vectors to vector view
    const wordSubtraction = `${wordOriginal}-${wordToSubtract}`;
    const wordTarget = `${wordOriginal}-${wordToSubtract}+${wordToAdd}`;
    console.log(wordSubtraction, wordTarget);
    vecs.set(wordSubtraction, vecs.get(wordOriginal).sub(vecs.get(wordToSubtract)));
    vecs.set(wordTarget, vecTarget);

    vectorWords = [wordOriginal, wordToSubtract, wordSubtraction, wordToAdd, wordTarget, bestWord].reverse();
    plotVector();
}

// inflate option to:"string" freezes browser, see https://github.com/nodeca/pako/issues/228
// TextDecoder may hang browser but seems much faster
function unpackVectors(vecsBuf) {
    return new Promise((resolve, reject) => {
        const vecsUint8 = pako.inflate(vecsBuf);
        const vecsText = new TextDecoder().decode(vecsUint8);
        return resolve(vecsText);
    });
}


async function main() {
    // fetch wordvecs locally (no error handling) and process
    // note python's http.server does not support response compression Content-Encoding
    // browsers and servers support content-encoding, but manually compress to fit on github (#1)

    // lo-tech progress indication
    const loadingText = document.getElementById("loading_text");
    loadingText.innerText = "Downloading model...";

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

    loadingText.innerText = "Model processing done";

    // plot new plots for the first time
    plotScatter(true);
    plotVector(true);
    plotMagnify(true);

}

// Main function runs as promise after DOM has loaded
document.addEventListener("DOMContentLoaded", () => {
    main().catch(e => console.error(e));
});
