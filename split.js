
const fs = require('fs');
const path = require('path');
const { exit } = require('process');
const an = require('./annotations.json')
const rows = require('./rows.json')

// Source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
const shuffle = (array) => {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

const getDcmsInFolder = (dir) => {
    let files = [ ];
    const items = fs.readdirSync(dir, {
        withFileTypes : true
    });

    for (let item of items) {
        if (item.isDirectory()) {
            files = [ ...files, ...getDcmsInFolder(`${dir}/${item.name}`) ];
        } else {
            if (item.name.slice(-3) === 'dcm') {
                files.push(`${dir}/${item.name}`);
            }
        }
    }

    return files;
}

// Get the base patients.
let patients = [ ];
for (let row of rows.rows) {

    // Correct the date to match the file format
    let correctedDate = row['Anon TCIA Study Date'].split('/')
    //console.log(correctedDate)
    if (correctedDate[0].length != 2) {
        correctedDate[0] = "0" + correctedDate[0];
    }
    if (correctedDate[1].length != 2) {
        correctedDate[1] = "0" + correctedDate[1];
    }

    let details = {
        '419639' : 'XR CHEST 1 VIEW AP',
        '440808' : 'CHEST 1V',
        'SITE2' : 'NA'
    }

    let anonStudyUid = row['Anon Study UID']
    let desc = row['Anon Exam Description']
    let filepath = path.join('data', `MIDRC-RICORD-1C-${row['Anon MRN']}`)//`./data/MIDRC-RICORD-1C-${row['Anon MRN']}`;
    let subdirpath = `/${correctedDate.join('-')}-NA-${details[row['Anon MRN'].split('-')[3]]}-${anonStudyUid.substring(anonStudyUid.length - 5)}`;

    patients.push({
        id : row["Anon MRN"],
        studyID : anonStudyUid,
        filepath : filepath,
        desc : desc,
        subdirpath : subdirpath,
        fullpath : path.join(filepath, subdirpath)/*`${filepath}${subdirpath}`*/,
        date : correctedDate.join('-')
    })
}

const labels = { };
const acceptedLabels = new Set([ 'typical', 'indeterminate', 'atypical', 'negative' ]);

// Pair ids with their corresponding label.
for (let labelGroup of an.labelGroups) {
    for (let id of labelGroup.labels) {
        let label = id.name.split(' ')[0].toLowerCase();
        if (acceptedLabels.has(label)) {
            labels[id.id] = label;
        }
    }   
}


patients = patients.map(patient => {

    let textLabel = undefined;
    for (let annotation of an.datasets[0].annotations) {
        let id = annotation.StudyInstanceUID;
        let label = annotation.labelId;

        if (labels[label] === undefined) {
            continue;
        }

        if (id === patient.studyID) {
            textLabel = labels[label]
            //console.log(`match! ${textLabel}`)
            break;
        }
    }

    return {
        ...patient,
        label : textLabel
    }   
})


//console.log(patients)

patients = patients.filter(patient => {
    return patient.label !== undefined;
})

// We need to flatten the patient entries into single objects for each one
let patientsGroupedByID = { };
for (let patient of patients) {
    if (patientsGroupedByID[patient.id] === undefined) {
        patientsGroupedByID[patient.id] = [ ];
        patientsGroupedByID[patient.id].push(patient);
    } else {
        patientsGroupedByID[patient.id].push(patient);       
    }

}

//console.log(patientsGroupedByID);

/*
================================================================================
    Change this variable to change how much of the data is randomly culled.
================================================================================
*/
const cullRatio = 0;



let patientIds = Object.keys(patientsGroupedByID);
console.log('Shuffling patients...');
shuffle(patientIds);
shuffle(patientIds);
shuffle(patientIds);

let totalPatientAmount = Object.keys(patientsGroupedByID).length
let cullAmount = Math.floor(Object.keys(patientsGroupedByID).length * cullRatio);
//console.log(totalPatientAmount)
//console.log(cullAmount);
//console.log(totalPatientAmount - cullAmount);
console.log(`Cull ratio is ${cullRatio}.`)
console.log(`Culling ${cullAmount} patients..`);

for (let i = 0; i < cullAmount; i++) {
    patientIds.shift();
}
let patientCount = patientIds.length;

//let patientCount = Object.keys(patientsGroupedByID).length;
console.log(`Total Patient Count: ${Object.keys(patientsGroupedByID).length}`);
let trainingSize = Math.floor(patientCount*.75);
console.log(`Training Set Size: ${trainingSize}`);
let testSize = patientCount - trainingSize;
console.log(`Test Set Size: ${testSize}`);

/*
let patientIds = Object.keys(patientsGroupedByID);
console.log('Shuffling patients...');
shuffle(patientIds);
shuffle(patientIds);
*/

const data = {
    train : [ ],
    test : [ ]
};

console.log(`Adding ${trainingSize} patients to training set...`);
for (let i = 0; i < trainingSize; i++) {
    let patientId = patientIds[0]
    let patient = patientsGroupedByID[patientId];
    data.train.push(patient);
    patientIds.splice(0, 1);
}

//console.log(data.train);
//console.log(data.train.length)

console.log(`Adding ${testSize} patients to test set...`)
for (let i = 0; i < testSize; i++) {
    let patientId = patientIds[0]
    let patient = patientsGroupedByID[patientId];
    data.test.push(patient);
    patientIds.splice(0, 1);
}

//console.log(data.test.length);

data.test = data.test.map(patient => {
    return patient.map(entry => {
        return {
            id : entry.id,
            path : entry.filepath,
            label : entry.label,
            date : entry.date
        };
    })
})

data.train = data.train.map(patient => {
    return patient.map(entry => {
        return {
            id : entry.id,
            date : entry.date,
            path : entry.filepath,
            label : entry.label
        };
    })
})

//console.log(data.test);

console.log('Creating the shell of the directories...');

let base = './split';
if (!fs.existsSync(base)){
    fs.mkdirSync(base);
} else {
    console.log('[!] There is already a split subdirectory present, please delete it and re-run the script');
    exit(1);
}

for (let split of [ 'train', 'test']) {
    let splitDir = `${base}/${split}`
    if (!fs.existsSync(splitDir)) {
        fs.mkdirSync(splitDir);

        for (let category of acceptedLabels) {
            let categoryDir = `${splitDir}/${category}`;
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir);
            }
        }

    }
}

console.log('Copying train data... this might take a while...')

let currentlyAt = 1;
for (let patient of data.train) {

    let starCount = Math.floor(20 * (currentlyAt / data.train.length));
    let spaceCount = 20 - starCount;
    //console.log(starCount);

    console.log(`Copying train data... this might take a while... [${'*'.repeat(starCount)}${' '.repeat(spaceCount)}] (${currentlyAt}/${data.train.length})`)
    for (let scan of patient) {
        let { id, label } = scan;
        //console.log(scan);
        let dir = fs.readdirSync('.\\' + scan.path).filter(file => {
            return fs.statSync('.\\' + scan.path + '\\' + file).isDirectory();
        }).filter(dir => {
            return dir.includes(scan.date);
        })[0];
        //console.log(dir);

        let dcms = getDcmsInFolder('.\\' + scan.path + '\\' + dir);
        let count = 0;
        for (let dcm of dcms) {
            fs.copyFileSync(dcm, `.\\split\\train\\${label}\\${id}_${label}_${count}.dcm`)
            count++;
        }
        //console.log(dcms);
        //fs.copyFileSync('.\\' + scan.path + '\\' + dir, `.\\split\\train\\{id}`)
    }
    currentlyAt++;
}

currentlyAt = 1;
for (let patient of data.test) {
    starCount = Math.floor(20 * (currentlyAt / data.test.length));
    spaceCount = 20 - starCount;

    console.log(`Copying test data... this might take a while... [${'*'.repeat(starCount)}${' '.repeat(spaceCount)}] (${currentlyAt}/${data.test.length})`)
    for (let scan of patient) {
        let { id, label } = scan;
        //console.log(scan);
        let dir = fs.readdirSync('.\\' + scan.path).filter(file => {
            return fs.statSync('.\\' + scan.path + '\\' + file).isDirectory();
        }).filter(dir => {
            return dir.includes(scan.date);
        })[0];
        //console.log(dir);

        let dcms = getDcmsInFolder('.\\' + scan.path + '\\' + dir);
        let count = 0;
        for (let dcm of dcms) {
            fs.copyFileSync(dcm, `.\\split\\test\\${label}\\${id}_${label}_${count}.dcm`)
            count++;
        }
        //console.log(dcms);
        //fs.copyFileSync('.\\' + scan.path + '\\' + dir, `.\\split\\train\\{id}`)
    }
    currentlyAt++;
}

console.log('All done, enjoy [:');

return
