
let word2Vec;
var x_vals,y_vals,z_vals, text_vals, infotext, infotext1, htext, min_near =1, max_near = 12, op=1, z_heat, y_heat, marker_col, last_col, pflag = 0;//var data;
var Tvectors = [];
var Tvectors_man = '', Tvectors_woman = '', Tvectors_boy = '', Tvectors_girl = '', Tvectors_king = '', Tvectors_queen = '', Tvectors_prince = '', Tvectors_princess = '', Tvectors_nephew = '',Tvectors_niece = '', Tvectors_refrigerator = '',Tvectors_uncle = '', Tvectors_aunt = '',Tvectors_father = '', Tvectors_mother = '',Tvectors_son = '', Tvectors_daughter = '',Tvectors_husband = '', Tvectors_wife = '', Tvectors_newword = '';
var sar=[' ','  ','   ','    ','     ','      '];
var wordvectors=42;
var preindex=0, index, index1;
var myPlot;
var banana = 'banana';

function modelLoaded() {
    console.log("Model Loaded!");
}

function normalization(a){
    return tf.div(a, tf.norm(a));
}

function nearest(data, input, start, max) {
    var nearestVectors = [];
    Object.keys(wordvectors.vectors).forEach(function (word) {
        const distance = tf.util.distSquared(input, data.vectors[word]);
        nearestVectors.push({ word, distance });
    });
    nearestVectors.sort((a, b) => a.distance - b.distance);
    return nearestVectors.slice(start, max);
}

async function plot(op,data,word){
    var myPlot = document.getElementById('myDiv');
    var hoverInfo = document.getElementById('hoverinfo'),
        datap=[
            {
                opacity:1,
                type: 'scatter3d',
                x: x_vals,
                y: y_vals,
                z: z_vals,
                mode: 'markers+text',
                text: text_vals,
                hoverinfo:'text',
                hovertext:htext,
                marker: {
                    size: 4,
                    color:marker_col,
                    line: {
                        color: 'rgba(0, 0, 255, 0.14)',
                        width: 0.5
                    },
                    opacity: 0.8
                }
            }],

        max_y_vals = Math.max.apply(null,y_vals),
        min_y_vals = Math.min.apply(null,y_vals),

        max_z_vals = Math.max.apply(null,z_vals),
        min_z_vals = Math.min.apply(null,z_vals),

        max_x_vals = Math.max.apply(null,x_vals),
        min_x_vals = Math.min.apply(null,x_vals),
        layout = {
            hovermode:'closest',
            scene:{
                aspectmode: "manual",
                aspectratio: {
                    x: 1, y: 0.7, z: 1,
                },
                xaxis: {
                    nticks: 10,

                    title: 'Genderless Ageless',
                    range: [min_x_vals-0.1, max_x_vals+0.1],
                },
                yaxis: {
                    nticks: 9,
                    title: 'Gender',
                    range: [min_y_vals-0.1, max_y_vals+0.1],
                },
                zaxis: {
                    nticks: 7,
                    title: 'Age',

                    range: [min_z_vals-0.1, max_z_vals+0.1],
                }},

        };

    var myPlot1 = document.getElementById('myDiv1'),
        hoverInfo1 = document.getElementById('hoverinfo1'),
        datah = [
            {
                z: z_heat,
                zmin: -0.35,
                zmax:0.35,
                y: y_heat,
                type: 'heatmap',
                hoverongaps: false
            }];

    Plotly.newPlot('myDiv1', datah);
    Plotly.newPlot('myDiv', datap, layout);


    if (op == 1){
        //console.log(op);
        Plotly.newPlot('myDiv1', datah);
        Plotly.newPlot('myDiv', datap, layout);

    }

    if (op == 0){
        //console.log(op);
        Plotly.newPlot('myDiv1', datah);
        Plotly.newPlot('myDiv', datap, layout);
        last_col = marker_col.pop();
        //console.log(marker_col);
        marker_col.push('black');
        //console.log(marker_col);
        myPlot1.on('plotly_click', function(datah){
            infotext1 = datah.points.map(function(d){
                word1 = d.y;
                return word1;
            });
            index = y_heat.indexOf(infotext1[0]);

            if (y_heat.includes(word)){
                y_heat[index] = sar[index] + word;
            }
            else{
                y_heat[index] = word;
            }
            normed_vec = normalization(wordvectors.vectors[word]).dataSync();
            z_heat[index] = normed_vec;

            var datah = [
                {
                    z: z_heat,
                    zmin: -0.35,
                    zmax: 0.35,
                    y: y_heat,
                    type: 'heatmap',
                    hoverongaps: false
                }];
            Plotly.newPlot('myDiv1', datah);

        });

    }

    myPlot.on('plotly_click', function(datap){
        //console.log(banana);
        banana = 'grape';
        pflag = pflag + 1;
        infotext = datap.points.map(function(d){
            word = d.text;
            return word;
        });
        index1 = text_vals.indexOf(infotext[0]);
        tn = datap.points[0].curveNumber;

        if (pflag >= 1){
            marker_col[preindex]='black';
        }
        index1 = text_vals.indexOf(infotext[0]);
        tn = datap.points[0].curveNumber;
        marker_col[index1]='red';
        preindex=index1;
        var update = {
            marker: {
                size: 4,
                color:marker_col,
                opacity: 0.8
            }
        };
        setTimeout(() =>Plotly.restyle('myDiv', update, [tn]), 10);

        myPlot1.on('plotly_click', function(datah){
            infotext1 = datah.points.map(function(d){
                word = d.y;
                return word;

            });
            index = y_heat.indexOf(infotext1[0]);

            if (y_heat.includes(infotext[0])){
                y_heat[index] = sar[index] + infotext[0];
            }
            else{
                y_heat[index] = infotext[0];
            }
            normed_vec = normalization(wordvectors.vectors[infotext[0]]).dataSync();
            z_heat[index] = normed_vec;

            var datah = [
                {
                    z: z_heat,
                    zmin: -0.35,
                    zmax: 0.35,
                    y: y_heat,
                    type: 'heatmap',
                    hoverongaps: false
                }];
            Plotly.newPlot('myDiv1', datah);

            //hoverInfo1.innerHTML = infotext1.join('<br/>');
        });

    });
    /*
        myPlot.on('plotly_unhover', function(datap){
            hoverInfo.innerHTML = '';
        });
     */

}

function nearest_org(vec){
    var text = ''
    text = "Original word:<br>"+ vec[0].word+"<br>Nearest words:<br>1. " + vec[1].word;
    for (let i = 2; i < vec.length; i += 1) {
        text+="<br>"+i+". "+vec[i].word
    }
    return text;
}

async function loadModel() {
    //model from pypi word2vec with phrases
    const {data} = await axios.get("https://www.cs.cmu.edu/afs/andrew/usr/sbandyop/www/wordvecs98331.json",{headers: {"Access-Control-Allow-Origin": "*"}});

    //const {data} = await axios.get("https://raw.githubusercontent.com/saptab/word2vecdemo/master/wordvecs77000.json");

    //model from gensim word2vec with senteces
    //const {data} = await axios.get("https://raw.githubusercontent.com/saptab/word2vecdemo/master/wordvecs63490.json");

    //model provided by ml5 library
    //const {data} = await axios.get("https://raw.githubusercontent.com/ml5js/ml5-examples/master/p5js/Word2Vec/data/wordvecs10000.json");

    wordvectors = data;
}

async function defaultwords(op=1) {
    //words2vectors
    await loadModel();
    let man = tf.tensor1d(wordvectors.vectors["man"]);
    man = normalization(man);
    let woman = tf.tensor1d(wordvectors.vectors["woman"]);
    woman = normalization(woman);
    let king = tf.tensor1d(wordvectors.vectors["king"]);
    king = normalization(king);
    let queen = tf.tensor1d(wordvectors.vectors["queen"]);
    queen = normalization(queen);
    let prince = tf.tensor1d(wordvectors.vectors["prince"]);
    prince = normalization(prince);
    let princess = tf.tensor1d(wordvectors.vectors["princess"]);
    princess = normalization(princess);
    let husband = tf.tensor1d(wordvectors.vectors["husband"]);
    husband = normalization(husband);
    let wife = tf.tensor1d(wordvectors.vectors["wife"]);
    wife = normalization(wife);
    let father = tf.tensor1d(wordvectors.vectors["father"]);
    father = normalization(father);
    let mother = tf.tensor1d(wordvectors.vectors["mother"]);
    mother = normalization(mother);
    let son = tf.tensor1d(wordvectors.vectors["son"]);
    son = normalization(son);
    let daughter = tf.tensor1d(wordvectors.vectors["daughter"]);
    daughter = normalization(daughter);
    let uncle = tf.tensor1d(wordvectors.vectors["uncle"]);
    uncle = normalization(uncle);
    let aunt = tf.tensor1d(wordvectors.vectors["aunt"]);
    aunt = normalization(aunt);
    let nephew = tf.tensor1d(wordvectors.vectors["nephew"]);
    nephew = normalization(nephew);
    let niece = tf.tensor1d(wordvectors.vectors["niece"]);
    niece = normalization(niece);
    let boy = tf.tensor1d(wordvectors.vectors["boy"]);
    boy = normalization(boy);
    let girl = tf.tensor1d(wordvectors.vectors["girl"]);
    girl = normalization(girl);
    let male = tf.tensor1d(wordvectors.vectors["male"]);
    male = normalization(male);
    let female = tf.tensor1d(wordvectors.vectors["female"]);
    female = normalization(female);
    let refrigerator = tf.tensor1d(wordvectors.vectors["refrigerator"]);
    refrigerator = normalization(refrigerator);
    //Genderwise subtractions
    let diff_gmw = tf.sub(man, woman);
    let diff_gkq = tf.sub(king, queen);
    let diff_gppr = tf.sub(prince, princess);
    let diff_ghw = tf.sub(husband, wife);
    let diff_gfm = tf.sub(father, mother);
    let diff_gsd = tf.sub(son, daughter);
    let diff_gua = tf.sub(uncle, aunt);
    let diff_gnni = tf.sub(nephew, niece);
    let diff_gbg = tf.sub(boy, girl);
    let diff_gmf = tf.sub(male, female);
    //Agewise subtractions
    let diff_amb = tf.sub(man, boy);
    let diff_awg = tf.sub(woman, girl);
    let diff_akp = tf.sub(king, prince);
    let diff_aqpr = tf.sub(queen, princess);
    let diff_afs = tf.sub(father, son);
    let diff_amd = tf.sub(mother, daughter);
    let diff_aun = tf.sub(uncle, nephew);
    let diff_aani = tf.sub(aunt, niece);
    //Mean gender
    inputs = [diff_gmw, diff_gkq,diff_gppr, diff_gfm, diff_gsd, diff_gua, diff_gnni, diff_gbg];
    let SUM_gender = inputs[0];
    for (let i = 1; i < inputs.length; i += 1) {
        SUM_gender = tf.add(SUM_gender, inputs[i]);
    }
    var unnormed_MEAN_gender = tf.div(SUM_gender, tf.tensor(inputs.length));
    //Mean age
    inputs_a = [diff_amb, diff_akp,diff_aqpr, diff_afs, diff_amd, diff_aun, diff_aani, diff_awg];
    let SUM_age = inputs_a[0];
    for (let i = 1; i < inputs_a.length; i += 1) {
        SUM_age = tf.add(SUM_age, inputs_a[i]);
    }
    var unnormed_MEAN_age = tf.div(SUM_age, tf.tensor(inputs_a.length));
    //Normalization of mean age and mean gender
    MEAN_gender = tf.div(unnormed_MEAN_gender, tf.norm(unnormed_MEAN_gender));
    MEAN_age = tf.div(unnormed_MEAN_age, tf.norm(unnormed_MEAN_age));
    //Dot Product between Mean gender and Mean age
    let Dot_mean_gender_age = tf.dot(MEAN_gender,MEAN_age);

    //No Gender
    //man
    let MAN_NO_GENDER = tf.sub(man,tf.mul(MEAN_gender, tf.dot(man,MEAN_gender)));
    //woman
    let WOMAN_NO_GENDER = tf.sub(woman,tf.mul(MEAN_gender, tf.dot(woman,MEAN_gender)));
    //king
    let KING_NO_GENDER = tf.sub(king,tf.mul(MEAN_gender, tf.dot(king,MEAN_gender)));
    //queen
    let QUEEN_NO_GENDER = tf.sub(queen,tf.mul(MEAN_gender,tf.dot(queen,MEAN_gender)));
    //prince
    let PRINCE_NO_GENDER = tf.sub(prince,tf.mul(MEAN_gender, tf.dot(prince,MEAN_gender)));
    //princess
    let PRINCESS_NO_GENDER = tf.sub(princess,tf.mul(MEAN_gender, tf.dot(princess,MEAN_gender)));
    //husband
    let HUSBAND_NO_GENDER = tf.sub(husband,tf.mul(MEAN_gender, tf.dot(husband,MEAN_gender)));
    //wife
    let WIFE_NO_GENDER = tf.sub(wife,tf.mul(MEAN_gender, tf.dot(wife,MEAN_gender)));
    //father
    let FATHER_NO_GENDER =tf.sub(father,tf.mul(MEAN_gender, tf.dot(father,MEAN_gender)));
    //mother
    let MOTHER_NO_GENDER = tf.sub(mother,tf.mul(MEAN_gender,tf.dot(mother,MEAN_gender)));
    //son
    let SON_NO_GENDER = tf.sub(son,tf.mul(MEAN_gender,tf.dot(son,MEAN_gender)));
    //daughter
    let DAUGHTER_NO_GENDER = tf.sub(daughter,tf.mul(MEAN_gender, tf.dot(daughter,MEAN_gender)));
    //uncle
    let UNCLE_NO_GENDER = tf.sub(uncle, tf.mul(MEAN_gender, tf.dot(uncle,MEAN_gender)));
    //aunt
    let AUNT_NO_GENDER = tf.sub(aunt,tf.mul(MEAN_gender, tf.dot(aunt,MEAN_gender)));
    //nephew
    let NEPHEW_NO_GENDER = tf.sub(nephew,tf.mul(MEAN_gender,tf.dot(nephew,MEAN_gender)));
    //niece
    let NIECE_NO_GENDER = tf.sub(niece,tf.mul(MEAN_gender, tf.dot(niece,MEAN_gender)));

    //No Gender No age
    //man
    let MAN_NO_GENDER_NO_AGE = tf.sub(MAN_NO_GENDER,tf.mul(MEAN_age, tf.dot(MAN_NO_GENDER,MEAN_age)));
    //woman
    let WOMAN_NO_GENDER_NO_AGE = tf.sub(WOMAN_NO_GENDER,tf.mul(MEAN_age, tf.dot(WOMAN_NO_GENDER,MEAN_age)));
    //king
    let KING_NO_GENDER_NO_AGE = tf.sub(KING_NO_GENDER,tf.mul(MEAN_age, tf.dot(KING_NO_GENDER,MEAN_age)));
    //queen
    let QUEEN_NO_GENDER_NO_AGE = tf.sub(QUEEN_NO_GENDER,tf.mul(MEAN_age, tf.dot(QUEEN_NO_GENDER,MEAN_age)));
    //prince
    let PRINCE_NO_GENDER_NO_AGE = tf.sub(PRINCE_NO_GENDER,tf.mul(MEAN_age, tf.dot(PRINCE_NO_GENDER,MEAN_age)));
    //princess
    let PRINCESS_NO_GENDER_NO_AGE = tf.sub(PRINCESS_NO_GENDER,tf.mul(MEAN_age, tf.dot(PRINCESS_NO_GENDER,MEAN_age)));
    //husband
    let HUSBAND_NO_GENDER_NO_AGE = tf.sub(HUSBAND_NO_GENDER,tf.mul(MEAN_age, tf.dot(HUSBAND_NO_GENDER,MEAN_age)));
    //wife
    let WIFE_NO_GENDER_NO_AGE =tf.sub(WIFE_NO_GENDER,tf.mul(MEAN_age,tf.dot(WIFE_NO_GENDER,MEAN_age)));
    //father
    let FATHER_NO_GENDER_NO_AGE = tf.sub(FATHER_NO_GENDER,tf.mul(MEAN_age, tf.dot(FATHER_NO_GENDER,MEAN_age)));
    //mother
    let MOTHER_NO_GENDER_NO_AGE = tf.sub(MOTHER_NO_GENDER,tf.mul(MEAN_age, tf.dot(MOTHER_NO_GENDER,MEAN_age)));
    //son
    let SON_NO_GENDER_NO_AGE = tf.sub(SON_NO_GENDER,tf.mul(MEAN_age,tf.dot(SON_NO_GENDER,MEAN_age)));
    //daughter
    let DAUGHTER_NO_GENDER_NO_AGE = tf.sub(DAUGHTER_NO_GENDER,tf.mul(MEAN_age, tf.dot(DAUGHTER_NO_GENDER,MEAN_age)));
    //uncle
    let UNCLE_NO_GENDER_NO_AGE = tf.sub(UNCLE_NO_GENDER,tf.mul(MEAN_age,tf.dot(UNCLE_NO_GENDER,MEAN_age)));
    //aunt
    let AUNT_NO_GENDER_NO_AGE = tf.sub(AUNT_NO_GENDER,tf.mul(MEAN_age, tf.dot(AUNT_NO_GENDER,MEAN_age)));
    //nephew
    let NEPHEW_NO_GENDER_NO_AGE = tf.sub(NEPHEW_NO_GENDER,tf.mul(MEAN_age,tf.dot(NEPHEW_NO_GENDER,MEAN_age)));
    //niece
    let NIECE_NO_GENDER_NO_AGE = tf.sub(NIECE_NO_GENDER,tf.mul(MEAN_age, tf.dot(NIECE_NO_GENDER,MEAN_age)));


    //Mean no gender no age
    inputs_ng_na = [MAN_NO_GENDER_NO_AGE, WOMAN_NO_GENDER_NO_AGE, KING_NO_GENDER_NO_AGE, QUEEN_NO_GENDER_NO_AGE, PRINCE_NO_GENDER_NO_AGE, PRINCESS_NO_GENDER_NO_AGE, HUSBAND_NO_GENDER_NO_AGE, WIFE_NO_GENDER_NO_AGE, FATHER_NO_GENDER_NO_AGE, MOTHER_NO_GENDER_NO_AGE, SON_NO_GENDER_NO_AGE, DAUGHTER_NO_GENDER_NO_AGE, UNCLE_NO_GENDER_NO_AGE, AUNT_NO_GENDER_NO_AGE, NEPHEW_NO_GENDER_NO_AGE, NIECE_NO_GENDER_NO_AGE];
    let SUM_no_gender_no_age = inputs_a[0];
    for (let i = 1; i < inputs_ng_na.length; i += 1) {
        SUM_no_gender_no_age = tf.add(SUM_no_gender_no_age, inputs_ng_na[i]);
    }
    var unnormed_MEAN_no_gender_no_age = tf.div(SUM_no_gender_no_age, tf.tensor(inputs_ng_na.length));

    //Normalization of no mean gender, no mean age

    MEAN_no_gender_no_age = tf.div(unnormed_MEAN_no_gender_no_age, tf.norm(unnormed_MEAN_no_gender_no_age));

    let man_x =  tf.sub(1 , tf.dot(man,MEAN_no_gender_no_age)).dataSync()[0];
    let man_y =  tf.dot(man,MEAN_gender).dataSync()[0];
    let man_z =  tf.dot(man,MEAN_age).dataSync()[0];

    let woman_x =  tf.sub(1 , tf.dot(woman,MEAN_no_gender_no_age)).dataSync()[0];
    let woman_y =  tf.dot(woman,MEAN_gender).dataSync()[0];
    let woman_z =  tf.dot(woman,MEAN_age).dataSync()[0];

    let king_x =  tf.sub(1 , tf.dot(king,MEAN_no_gender_no_age)).dataSync()[0];
    let king_y =  tf.dot(king,MEAN_gender).dataSync()[0];
    let king_z =  tf.dot(king,MEAN_age).dataSync()[0];

    let queen_x =  tf.sub(1 , tf.dot(queen,MEAN_no_gender_no_age)).dataSync()[0];
    let queen_y =  tf.dot(queen,MEAN_gender).dataSync()[0];
    let queen_z =  tf.dot(queen,MEAN_age).dataSync()[0];

    let prince_x = tf.sub(1 , tf.dot(prince,MEAN_no_gender_no_age)).dataSync()[0];
    let prince_y =  tf.dot(prince,MEAN_gender).dataSync()[0];
    let prince_z =  tf.dot(prince,MEAN_age).dataSync()[0];

    let princess_x =  tf.sub(1 , tf.dot(princess,MEAN_no_gender_no_age)).dataSync()[0];
    let princess_y =  tf.dot(princess,MEAN_gender).dataSync()[0];
    let princess_z =  tf.dot(princess,MEAN_age).dataSync()[0];

    let husband_x = tf.sub(1 , tf.dot(husband,MEAN_no_gender_no_age)).dataSync()[0];
    let husband_y =  tf.dot(husband,MEAN_gender).dataSync()[0];
    let husband_z =  tf.dot(husband,MEAN_age).dataSync()[0];

    let wife_x =  tf.sub(1 , tf.dot(wife,MEAN_no_gender_no_age)).dataSync()[0];
    let wife_y =  tf.dot(wife,MEAN_gender).dataSync()[0];
    let wife_z =  tf.dot(wife,MEAN_age).dataSync()[0];

    let father_x = tf.sub(1 , tf.dot(father,MEAN_no_gender_no_age)).dataSync()[0];
    let father_y =  tf.dot(father,MEAN_gender).dataSync()[0];
    let father_z =  tf.dot(father,MEAN_age).dataSync()[0];

    let mother_x =  tf.sub(1 , tf.dot(mother,MEAN_no_gender_no_age)).dataSync()[0];
    let mother_y =  tf.dot(mother,MEAN_gender).dataSync()[0];
    let mother_z =  tf.dot(mother,MEAN_age).dataSync()[0];

    let son_x = tf.sub(1 , tf.dot(son,MEAN_no_gender_no_age)).dataSync()[0];
    let son_y =  tf.dot(son,MEAN_gender).dataSync()[0];
    let son_z =  tf.dot(son,MEAN_age).dataSync()[0];

    let daughter_x =  tf.sub(1 , tf.dot(daughter,MEAN_no_gender_no_age)).dataSync()[0];
    let daughter_y =  tf.dot(daughter,MEAN_gender).dataSync()[0];
    let daughter_z =  tf.dot(daughter,MEAN_age).dataSync()[0];

    let uncle_x = tf.sub(1 , tf.dot(uncle,MEAN_no_gender_no_age)).dataSync()[0];
    let uncle_y =  tf.dot(uncle,MEAN_gender).dataSync()[0];
    let uncle_z =  tf.dot(uncle,MEAN_age).dataSync()[0];

    let aunt_x =  tf.sub(1 , tf.dot(aunt,MEAN_no_gender_no_age)).dataSync()[0];
    let aunt_y =  tf.dot(aunt,MEAN_gender).dataSync()[0];
    let aunt_z =  tf.dot(aunt,MEAN_age).dataSync()[0];

    let nephew_x = tf.sub(1 , tf.dot(nephew,MEAN_no_gender_no_age)).dataSync()[0];
    let nephew_y =  tf.dot(nephew,MEAN_gender).dataSync()[0];
    let nephew_z =  tf.dot(nephew,MEAN_age).dataSync()[0];

    let niece_x =  tf.sub(1 , tf.dot(niece,MEAN_no_gender_no_age)).dataSync()[0];
    let niece_y =  tf.dot(niece,MEAN_gender).dataSync()[0];
    let niece_z =  tf.dot(niece,MEAN_age).dataSync()[0];

    let boy_x = tf.sub(1 , tf.dot(boy,MEAN_no_gender_no_age)).dataSync()[0];
    let boy_y =  tf.dot(boy,MEAN_gender).dataSync()[0];
    let boy_z =  tf.dot(boy,MEAN_age).dataSync()[0];

    let girl_x =  tf.sub(1 , tf.dot(girl,MEAN_no_gender_no_age)).dataSync()[0];
    let girl_y =  tf.dot(girl,MEAN_gender).dataSync()[0];
    let girl_z =  tf.dot(girl,MEAN_age).dataSync()[0];

    let ref_x =  tf.sub(1 , tf.dot(refrigerator,MEAN_no_gender_no_age)).dataSync()[0];
    let ref_y =  tf.dot(refrigerator,MEAN_gender).dataSync()[0];
    let ref_z =  tf.dot(refrigerator,MEAN_age).dataSync()[0];

    x_vals = [man_x, woman_x, boy_x, girl_x, king_x, queen_x, prince_x, princess_x, nephew_x, niece_x, ref_x, uncle_x, aunt_x, father_x, mother_x, son_x, daughter_x, husband_x, wife_x];

    y_vals = [man_y, woman_y, boy_y, girl_y, king_y, queen_y, prince_y, princess_y, nephew_y, niece_y, ref_y, uncle_y, aunt_y, father_y, mother_y, son_y, daughter_y,  husband_y, wife_y];

    z_vals = [man_z, woman_z, boy_z, girl_z, king_z, queen_z, prince_z, princess_z,  nephew_z, niece_z, ref_z, uncle_z, aunt_z, father_z, mother_z, son_z, daughter_z, husband_z, wife_z];

    text_vals = ["man", "woman", "boy", "girl", "king", "queen", "prince", "princess", "nephew", "niece", "refrigerator", "uncle","aunt", "father", "mother","son","daughter","husband","wife"];

    marker_col = ['black','black','black','black','black','black','black','black','black','black','black','black','black','black','black','black','black','black','black'];

    Tvectors_man = nearest_org(nearest(wordvectors, wordvectors.vectors["man"],min_near,max_near));

    Tvectors_woman = nearest_org(nearest(wordvectors, wordvectors.vectors["woman"],min_near,max_near));

    Tvectors_boy = nearest_org(nearest(wordvectors, wordvectors.vectors["boy"],min_near,max_near));

    Tvectors_girl = nearest_org(nearest(wordvectors, wordvectors.vectors["girl"],min_near,max_near));

    Tvectors_king = nearest_org(nearest(wordvectors, wordvectors.vectors["king"],min_near,max_near));

    Tvectors_queen = nearest_org(nearest(wordvectors, wordvectors.vectors["queen"],min_near,max_near));

    Tvectors_prince = nearest_org(nearest(wordvectors, wordvectors.vectors["prince"],min_near,max_near));

    Tvectors_princess = nearest_org(nearest(wordvectors, wordvectors.vectors["princess"],min_near,max_near));

    Tvectors_nephew = nearest_org(nearest(wordvectors, wordvectors.vectors["nephew"],min_near,max_near));

    Tvectors_niece = nearest_org(nearest(wordvectors, wordvectors.vectors["niece"],min_near,max_near));

    Tvectors_refrigerator = nearest_org(nearest(wordvectors, wordvectors.vectors["refrigerator"],min_near,max_near));

    Tvectors_uncle = nearest_org(nearest(wordvectors, wordvectors.vectors["uncle"],min_near,max_near));

    Tvectors_aunt = nearest_org(nearest(wordvectors, wordvectors.vectors["aunt"],min_near,max_near));

    Tvectors_father = nearest_org(nearest(wordvectors, wordvectors.vectors["father"],min_near,max_near));

    Tvectors_mother = nearest_org(nearest(wordvectors, wordvectors.vectors["mother"],min_near,max_near));

    Tvectors_son = nearest_org(nearest(wordvectors, wordvectors.vectors["son"],min_near,max_near));

    Tvectors_daughter = nearest_org(nearest(wordvectors, wordvectors.vectors["daughter"],min_near,max_near));

    Tvectors_husband = nearest_org(nearest(wordvectors, wordvectors.vectors["husband"],min_near,max_near));

    Tvectors_wife = nearest_org(nearest(wordvectors, wordvectors.vectors["wife"],min_near,max_near));

    htext = [Tvectors_man, Tvectors_woman, Tvectors_boy, Tvectors_girl, Tvectors_king, Tvectors_queen, Tvectors_prince, Tvectors_princess, Tvectors_nephew, Tvectors_niece, Tvectors_refrigerator, Tvectors_uncle, Tvectors_aunt, Tvectors_father, Tvectors_mother, Tvectors_son, Tvectors_daughter, Tvectors_husband, Tvectors_wife];
    z_heat = [man.dataSync(),woman.dataSync(),boy.dataSync(),girl.dataSync(),king.dataSync(),queen.dataSync()]
    //z_heat=[wordvectors.vectors["man"],wordvectors.vectors["woman"],wordvectors.vectors["boy"],wordvectors.vectors["girl"],wordvectors.vectors["king"],wordvectors.vectors["queen"]];

    y_heat= ['man', 'woman', 'boy','girl','king','queen'];

    //z_heat=[wordvectors.vectors["man"],wordvectors.vectors["woman"],wordvectors.vectors["boy"],wordvectors.vectors["girl"],wordvectors.vectors["king"],wordvectors.vectors["queen"],wordvectors.vectors["prince"],wordvectors.vectors["princess"],wordvectors.vectors["nephew"],wordvectors.vectors["niece"],wordvectors.vectors["refrigerator"],wordvectors.vectors["uncle"],wordvectors.vectors["aunt"],wordvectors.vectors["father"],wordvectors.vectors["mother"],wordvectors.vectors["son"],wordvectors.vectors["daughter"],wordvectors.vectors["husband"],wordvectors.vectors["wife"]],
    //y_heat= ['man', 'woman', 'boy','girl','king','queen','prince','princess','nephew','niece','refrigerator','uncle','aunt','father','mother','son','daughter','husband','wife'],

    plot(op,wordvectors);
}

async function newwords(op=0) {
    let new_vec;
    var word = document.getElementById("myForm").elements[0].value;
    if (wordvectors.vectors[word] == null){
        errornew.innerHTML = "The word is out of vocabulary.";
    }
    else{
        document.getElementById("myForm").elements[0].value = '';
        errornew.innerHTML = "";
        new_vec = tf.tensor1d(wordvectors.vectors[word]);
        new_vec = normalization(new_vec);

        let new_vec_x =  tf.sub(1 , tf.dot(new_vec,MEAN_no_gender_no_age)).dataSync()[0];
        let new_vec_y =  tf.dot(new_vec,MEAN_gender).dataSync()[0];
        let new_vec_z =  tf.dot(new_vec,MEAN_age).dataSync()[0];
        Tvectors_newword = nearest_org(nearest(wordvectors, wordvectors.vectors[word],min_near,max_near));

        x_vals.push(new_vec_x);
        y_vals.push(new_vec_y);
        z_vals.push(new_vec_z);
        marker_col = marker_col.map(function(col){
            return col.replace('red','black');;
        });
        marker_col.push('red');
        text_vals.push(word);
        htext.push(Tvectors_newword);

        //z_heat.push(wordvectors.vectors[word]);
        //y_heat.push(word);
        plot(op,wordvectors,word);
    }
}

//steup();
//loadModel();
defaultwords();
