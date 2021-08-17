"use strict";

// Class currently holding all controller and model functionality (God class?)
class Demo {
    constructor() {
        this.MAGNIFY_WINDOW = 5; // range for magnified view
        this.HEATMAP_MIN = -0.2;  // min and max for heatmap colorscale
        this.HEATMAP_MAX = 0.2;
        
        // words plotted on scatter plot
        // changes from original demo: replace "refrigerator" with "chair" and "computer"
        this.scatterWords = ['man', 'woman', 'boy', 'girl', 'king', 'queen', 'prince', 'princess', 'nephew', 'niece',
                'uncle', 'aunt', 'father', 'mother', 'son', 'daughter', 'husband', 'wife', 'chair', 'computer'];

        // words involved in the computation of analogy (#12)
        this.analogyWords = {};  // default empty

        // words to show in vector display
        this.vectorWords = ["queen", "king", "girl", "boy", "woman", "man"];

        // selected word in scatterplot (empty string represents nothing selected)
        this.selectedWord = "";

        // saved hoverX for use in magnify view
        this.hoverX = this.MAGNIFY_WINDOW;

        // main word to vector Map (may include pseudo-word vectors like "man+woman")
        this.vecs = new Map();

        // Set of actual words found in model (no pseudo-words)
        this.vocab = new Set();

        this.vecsDim = undefined; // word vector dim
        this.nearestWords = new Map(); // nearest words Map

        // vector calculations and plotting, including residual (issue #3)
        this.feature1 = undefined;
        this.feature2 = undefined;
        this.residualFeature = undefined;

        // to be used for naming features
        this.feature1Name = undefined;
        this.feature2Name = undefined;

        // words to be used for creating dimensions
        this.feature1Set1 = undefined;
        this.feature1Set2 = undefined;
        this.feature2Set1 = undefined;
        this.feature2Set2 = undefined;
    }


    // read raw model text and write to vecs and vocab
    processRawVecs(text) {
        const lines = text.trim().split(/\n/);
        for (const line of lines) {
            const entries = line.trim().split(' ');
            this.vecsDim = entries.length - 1;
            const word = entries[0];
            const vec = new Vector(entries.slice(1).map(Number)).unit();  // normalize word vectors
            this.vocab.add(word);
            this.vecs.set(word, vec);
        }
    }

    processNearestWords(text) {
        const lines = text.trim().split(/\n/);
        for (const line of lines) {
            const entries = line.trim().split(' ');
            const target = entries[0];
            const words = entries.slice(1);
            this.nearestWords.set(target, words);
        }
    }

    // create feature dimension vectors
    createFeature(vecs, wordSet1, wordSet2) {
        // for each pair of words, subtract vectors
        console.assert(wordSet1.length === wordSet2.length);
        const subVecs = wordSet1.map((word1, i) => vecs.get(word1).sub(vecs.get(wordSet2[i])));
        // average subtracted vectors into one unit feature vector
        return subVecs.reduce((a, b) => a.add(b)).unit();
    }

    // x, y, z are simply projections onto features
    // use 1 - residual and scale residual for graphical convention (#3, #17)
    projectResidual(word) {
        return 2 * (1 - this.vecs.get(word).dot(this.residualFeature));
    }


    // plot each word on a 3D scatterplot projected onto gender, age, residual features
    // as part of the process, computes features
    // used to refresh selected word
    plotScatter(newPlot = false) {
        // populate feature vectors
        this.feature1 = this.createFeature(this.vecs, this.feature1Set1, this.feature1Set2);
        this.feature2 = this.createFeature(this.vecs, this.feature2Set1, this.feature2Set2);

        const allFeatureWords = this.feature1Set1.concat(this.feature1Set2).concat(this.feature2Set1).concat(this.feature2Set2);
        const residualWords = [...new Set(allFeatureWords)];

        // residual dim calculation described in #3
        this.residualFeature = residualWords.map(word => {
                const wordVec = this.vecs.get(word);
                const wordNoFeature1 = wordVec.sub(this.feature1.scale(wordVec.dot(this.feature1)));
                const wordResidual = wordNoFeature1.sub(this.feature2.scale(wordNoFeature1.dot(this.feature2)));
                return wordResidual;
            }
        ).reduce((a, b) => a.add(b)).unit(); // average over residual words and normalize


        // words to actually be plotted (so this.scatterWords is a little misleading)
        let plotWords = this.scatterWords.concat(Object.values(this.analogyWords));
        plotWords = [...new Set(plotWords)]; // remove duplicates




        const x = plotWords.map(this.projectResidual, this);
        const y = plotWords.map(word => this.vecs.get(word).dot(this.feature1));
        const z = plotWords.map(word => this.vecs.get(word).dot(this.feature2));

        // color points by type with priority (#12)
        const color = plotWords.map(word =>
            (word === this.selectedWord) ? "red" // selected word has highest priority
            : (word === this.analogyWords.y) ? "pink"
            : (word === this.analogyWords.Wstar) ? "lime"
            : (Object.values(this.analogyWords).includes(word)) ? "blue"
            : "black"
        );

        // For each point, include numbered list of nearest words in hovertext
        const hovertext = plotWords.map(target =>
            `Reference word:<br>${target}<br>` +
            "Nearest words:<br>" +
            this.nearestWords.get(target)
                .map((word, i) => `${i + 1}. ${word}`)
                .join("<br>")
        );

        let data = [
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

        // draw vectors if analogy words are available
        if (Object.keys(this.analogyWords).length > 0) {
            const arrowPairs = [[this.analogyWords.a, this.analogyWords.b], [this.analogyWords.c, this.analogyWords.y]];
            for (const arrowPair of arrowPairs) {
                // xyz coordinates of endpoints
                const x = arrowPair.map(this.projectResidual, this);
                const y = arrowPair.map(word => this.vecs.get(word).dot(this.feature1));
                const z = arrowPair.map(word => this.vecs.get(word).dot(this.feature2));


                data.push(
                    {
                        x: x,
                        y: y,
                        z: z,
                        mode: "lines",
                        type: "scatter3d",
                        hoverinfo: "none",
                        line: {
                            color: "blue",
                            width: 3
                        }
                    },
                    {
                        type: "cone",
                        x: [x[1]],
                        y: [y[1]],
                        z: [z[1]],
                        u: [0.3 * (x[1] - x[0])],
                        v: [0.3 * (y[1] - y[0])],
                        w: [0.3 * (z[1] - z[0])],
                        anchor: "tip",
                        hoverinfo: "none",
                        colorscale: [[0, "blue"], [1, "blue"]],
                        showscale: false,
                    }
                )
            }


        }

        const ZOOM = 0.8;

        // save previous camera code (workaround for #9)
        let camera;
        if (newPlot) {
            camera = {eye: {x: -2.5 * ZOOM, y: -0.75 * ZOOM, z: 0.5 * ZOOM}};
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
                        text: this.feature1Name,
                        // color based on if axis feature is selected word
                        font: {color: (this.selectedWord === this.feature1Name) ? "red" : "black"}
                    },
                    dtick: 0.1
                },
                zaxis: {
                    title: {
                        text: this.feature2Name,
                        font: {color: (this.selectedWord === this.feature2Name ? "red" : "black")}
                    },
                    dtick: 0.1
                },
                camera: camera
            },
            margin: {l: 0, r: 0, t: 30, b: 0}, // maximize viewing area
            font: {size: 12},
            showlegend: false
        };

        // always make new plot (#9)
        // replotting scatter3d produces ugly error (#10)
        Plotly.newPlot("plotly-scatter", data, layout);

        // bind scatter click event
        let plotly_scatter = document.getElementById("plotly-scatter");

        plotly_scatter.on("plotly_click", (data) => {
            const ptNum = data.points[0].pointNumber;
            const clickedWord = plotWords[ptNum];

            if (clickedWord === this.selectedWord) { // deselect
                this.selectedWord = "";
                console.log("Deselected", clickedWord);
            } else { // select
                this.selectedWord = clickedWord;
                console.log("Selected", this.selectedWord);
            }

            // replot with new point color
            this.plotScatter();
        });

    }

    selectFeature(axis) {
        let selectedWordInput = (axis === 0) ? this.feature1Name : this.feature2Name;
        console.log("button", selectedWordInput);

        // add features as pseudo-words (should it be computed here?)
        this.vecs.set(selectedWordInput, (axis === 0) ? this.feature1 : this.feature2);


        if (selectedWordInput === this.selectedWord) {  // deselect word
            this.selectedWord = "";
        } else { // select word
            this.selectedWord = selectedWordInput;
        }


        this.plotScatter(); // replot selected word
    }


    // after plotly plot, bind heatmap axis click event using d3
    updateHeatmapsOnWordClick() {
        // affects all heatmaps since they all have .yaxislayer-above!
        // https://stackoverflow.com/a/47400462
        console.log("Binding heatmap click event");

        d3.selectAll(".yaxislayer-above").selectAll("text")
            .on("click", (d) => {
                const idx = d.target.__data__.x;
                console.log("Clicked on", idx);
                console.log("Using this", this); // should be demo `this`, not d3
                if (this.selectedWord) {
                    // modify vector view to show selected word and then deselect
                    this.vectorWords[idx] = this.selectedWord;
                    this.selectedWord = "";

                    // replot all
                    this.plotScatter();
                    this.plotVector();
                }
            });
    }

    // plot vector and magnify views
    plotVector(newPlot = false) {
        // heatmap plots matrix of values in z
        const z = this.vectorWords.map(word => this.vecs.get(word));

        const data = [
            {
                // can't use y: this.vectorWords since the heatmap won't display duplicate words
                z: z,
                zmin: this.HEATMAP_MIN,
                zmax: this.HEATMAP_MAX,
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
                tickvals: d3.range(this.vectorWords.length),
                ticktext: this.vectorWords,
                fixedrange: true,
                tickangle: 60
            },
            margin: {t: 30},
            //dragmode: false
        };

        if (newPlot) {
            Plotly.newPlot("plotly-vector", data, layout);
            const plotly_vector = document.getElementById("plotly-vector");

            // bind axis click to replace word in vector display after plot
            // use demo instance `this`, not plotly listener `this`
            plotly_vector.on("plotly_afterplot", this.updateHeatmapsOnWordClick.bind(this));

            plotly_vector.on("plotly_hover", data => {
                this.hoverX = data.points[0].x;
                console.log("Hover " + this.hoverX);
                this.plotMagnify();
            });

            this.plotMagnify(true);
        } else {
            Plotly.react("plotly-vector", data, layout);
            this.plotMagnify();
        }
    }

    plotMagnify(newPlot = false) {
        // ensure this.hoverX will produce proper plot
        // bounds are inclusive
        const lo = this.hoverX - this.MAGNIFY_WINDOW;
        const hi = this.hoverX + this.MAGNIFY_WINDOW;
        if (!(0 <= lo && hi < this.vecsDim)) {
            return;
        }

        // heatmap with subset of z
        const z = this.vectorWords.map(word =>
            this.vecs.get(word).slice(lo, hi + 1));

        const data = [
            {
                x: d3.range(lo, hi + 1),
                z: z,
                zmin: this.HEATMAP_MIN,
                zmax: this.HEATMAP_MAX,
                type: "heatmap",
                ygap: 5,
                showscale: false
            }
        ];

        const layout = {
            title: {text: "Magnified view"},
            xaxis: {
                title: "Vector dimension",
                dtick: 1,
                zeroline: false,
                fixedrange: true
            },
            yaxis: {
                //title: "Words",
                tickvals: d3.range(this.vectorWords.length),
                ticktext: this.vectorWords,
                fixedrange: true,
                tickangle: 60
            },
            margin: {r: 5, t: 30} // get close to main vector view
        };

        if (newPlot) {
            Plotly.newPlot("plotly-magnify", data, layout);
            // bind axis click after plot, similar to vector
            const plotly_magnify = document.getElementById("plotly-magnify");
            plotly_magnify.on("plotly_afterplot", this.updateHeatmapsOnWordClick.bind(this));
        } else {
            Plotly.react("plotly-magnify", data, layout);
        }
    }

    modifyWord() {
        const word = document.getElementById("modify-word-input").value;
        let wordModified = false;

        if (this.scatterWords.includes(word)) {  // remove word
            this.scatterWords = this.scatterWords.filter(item => item !== word);
            document.getElementById("modify-word-message").innerText = `"${word}" removed`;
            this.selectedWord = ""; // remove selected word
            wordModified = true;
        } else { // add word if in vocab
            if (this.vocab.has(word)) {
                this.scatterWords.push(word);
                document.getElementById("modify-word-message").innerText = `"${word}" added`;
                this.selectedWord = word; // make added word selected word
                wordModified = true;
            } else { // word not found
                document.getElementById("modify-word-message").innerText = `"${word}" not found`;
                // no replot or change to selected word
            }
        }

        if (wordModified) {
            this.plotScatter();  // replot to update scatter view
            document.getElementById("modify-word-input").value = ""; // clear word

        }
    }

    // process 3COSADD word analogy input, write arithmetic vectors to vector view and add nearest neighbors to result (#14)
    // notation from original paper: "Linguistic Regularities in Continuous Space Word Representations" (Mikolov 2013)
    // Analogy notation for words: a:b as c:d, with d unknown
    // vector y = x_b - x_a + x_c, find w* = argmax_w cossim(x_w, y)

    processAnalogy() {
        const wordA = document.getElementById("analogy-word-a").value;
        const wordB = document.getElementById("analogy-word-b").value;
        const wordC = document.getElementById("analogy-word-c").value;

        const inputWords = [wordA, wordB, wordC];

        // Handle not found input words gracefully
        for (const word of inputWords) {
            if (!(this.vocab.has(word))) {
                document.getElementById("analogy-message").innerText = `"${word}" not found`;
                return;
            }
        }

        // all words in inputWords, clear analogy-message
        document.getElementById("analogy-message").innerText = "";

        const vecA = this.vecs.get(wordA);
        const vecB = this.vecs.get(wordB);
        const vecC = this.vecs.get(wordC);

        // vector arithmetic
        const vecBMinusA = vecB.sub(vecA);
        const wordBMinusA = `${wordB}-${wordA}`;
        const vecY = vecBMinusA.add(vecC); // dont normalize for now (#12)
        const wordY = `${wordB}-${wordA}+${wordC}`;

        // find most similar words for analogy
        let wordAnalogyPairs = [...this.vocab]
            .filter(word => !inputWords.includes(word))  // don't match words used in arithmetic (#12)
            .map(word => [word, vecY.dot(this.vecs.get(word))]);

        wordAnalogyPairs.sort((a, b) => b[1] - a[1]);
        const nearestAnalogyWords = wordAnalogyPairs.slice(0, 10).map(pair => pair[0]);
        const wordWstar = nearestAnalogyWords[0];

        // add nearest words to Y to nearest word list (#12)
        this.nearestWords.set(wordY, nearestAnalogyWords);

        // write out most similar word to text box
        document.getElementById("analogy-word-wstar").value = wordWstar;

        // write arithmetic vectors to vector view
        this.vecs.set(wordBMinusA, vecBMinusA);
        this.vecs.set(wordY, vecY);

        // set analogy words to display in scatter (#12):
        this.analogyWords = {"b": wordB, "a": wordA, "c": wordC, "y": wordY, "Wstar": wordWstar};

        this.plotScatter();

        // write arithmetic vectors to vector view (#14)
        this.vectorWords = [wordB, wordA, wordBMinusA, wordC, wordY, wordWstar].reverse();
        this.plotVector();
    }


    // inflate option to:"string" freezes browser, see https://github.com/nodeca/pako/issues/228
    // TextDecoder may hang browser but seems much faster
    unpackVectors(vecsBuf) {
        return new Promise((resolve) => {
            const vecsUint8 = pako.inflate(vecsBuf);
            const vecsText = new TextDecoder().decode(vecsUint8);
            return resolve(vecsText);
        });
    }

    // fill in default words used to define semantic dimensions and feature names for scatterplot
    fillDimensionDefault() {
        document.getElementById("user-feature-feature1-name-input").value =
            "gender";
        document.getElementById("user-feature-feature2-name-input").value =
            "age";

        document.getElementById("user-feature-feature1-set1").textContent =
            "man\nking\nprince\nhusband\nfather\nson\nuncle\nnephew\nboy\nmale";
        document.getElementById("user-feature-feature1-set2").textContent =
            "woman\nqueen\nprincess\nwife\nmother\ndaughter\naunt\nniece\ngirl\nfemale";
        document.getElementById("user-feature-feature2-set1").textContent =
            "man\nwoman\nking\nqueen\nfather\nmother\nuncle\naunt";
        document.getElementById("user-feature-feature2-set2").textContent =
            "boy\ngirl\nprince\nprincess\nson\ndaughter\nnephew\nniece";

    }

    processFeatureInput() {
        // TODO: cleanup
        // local function for parsing input box data
        function parseInput(id) {
            return document.getElementById(id).value.split('\n');
        }


        const feature1Set1Input = parseInput("user-feature-feature1-set1");
        const feature1Set2Input = parseInput("user-feature-feature1-set2");
        const feature2Set1Input = parseInput("user-feature-feature2-set1");
        const feature2Set2Input = parseInput("user-feature-feature2-set2");

        // ensure feature sets are the same length
        if (!(feature1Set1Input.length === feature1Set2Input.length &&
            feature2Set1Input.length === feature2Set2Input.length)) {
            document.getElementById("user-feature-message").innerText =
                "Ensure feature word sets are same length";
            return;
        }

        // simple user input validation
        // ensure all words in vocab
        for (const set of [feature1Set1Input, feature1Set2Input, feature2Set1Input, feature2Set2Input]) {
            for (const word of set) {
                if (!this.vocab.has(word)) {
                    document.getElementById("user-feature-message").innerText =
                        `"${word}" not found`;
                    return;
                }
            }
        }


        // copy feature words after validation
        this.feature1Set1 = feature1Set1Input;
        this.feature1Set2 = feature1Set2Input;
        this.feature2Set1 = feature2Set1Input;
        this.feature2Set2 = feature2Set2Input;

        // read feature names from inputs, adding bracket syntax
        this.feature1Name = '[' + document.getElementById("user-feature-feature1-name-input").value + ']';
        this.feature2Name = '[' + document.getElementById("user-feature-feature2-name-input").value + ']';

        // write names to buttons
        document.getElementById("scatter-button0").innerText = this.feature1Name;
        document.getElementById("scatter-button1").innerText = this.feature2Name;
    }

    // fetch wordvecs locally (no error handling) and process
    async main() {
        // fill default feature for scatterplot
        this.fillDimensionDefault();


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
        const vecsText = await this.unpackVectors(vecsBuf);

        loadingText.innerText = "Processing vectors...";
        this.processRawVecs(vecsText);

        // fetch nearest words list
        const nearestWordsResponse = await fetch("nearest_words.txt");
        const nearestWordsText = await nearestWordsResponse.text();

        this.processNearestWords(nearestWordsText);

        loadingText.innerText = "Model processing done";

        this.processFeatureInput();


        // plot new plots for the first time
        this.plotScatter(true);
        this.plotVector(true);
    }
}

// Main function runs as promise after DOM has loaded
const demo = new Demo();
document.addEventListener("DOMContentLoaded", () => {
    demo.main().catch(e => console.error(e));
});
