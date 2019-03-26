//Modules
const bodyParser = require(`body-parser`),
  fileUpload = require(`express-fileupload`),
  fs = require(`fs`),
  unzip = require(`unzip`),
  path = require(`path`),
  stemmer = require(`stemmer`),
  rimraf = require(`rimraf`),
  soundex = require(`soundex-code`);

//Models
const Term = require(`../models/term`),
  Document = require(`../models/document`);

//controller consts
const MACOSX = `__MACOSX`;
const DS_Store = `.DS_Store`;
const sourceDir = path.join(__dirname, "../documents/source");
const storageDir = path.join(__dirname, "../documents/storage");

/* generates a serial number depending on the files in stoage */
function getSerialNumber() {
  let filesInDir = fs.readdirSync(
    `${__dirname}/../documents/storage`,
    (err, files) => {
      if (err) res.status(500).send(err);
    }
  );

  filesInDir = filesInDir.filter(file => {
    return file != DS_Store; // in order to ignore the '.DS_Store' file
  });

  for (let i = 0; i < filesInDir.length; i++)
    filesInDir[i] = filesInDir[i].slice(0, -4);

  return filesInDir.length === 0 ? 0 : Math.max(...filesInDir);
}

/* function for holding all the terms in the txt document, in 1 array */
function tokenize(fileContent) {
  splitMulti = (str, tokens) => {
    var tempChar = tokens[0];
    for (var i = 1; i < tokens.length; i++) {
      str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
  };

  fileContent = fileContent.toLowerCase();
  fileContent = splitMulti(fileContent, [
    `:`,
    `;`,
    ` `,
    `\n`,
    `"`,
    `,`,
    `'`,
    `.`,
    `-`,
    `+`,
    `=`,
    `!`,
    `@`,
    `#`,
    `$`,
    `%`,
    `^`,
    `&`,
    `*`,
    `(`,
    `)`,
    `|`,
    `?`,
    `>`,
    `<`,
    `~`,
    `/`,
    `[`,
    `]`,
    `\\`
  ]);

  //Stemming the words in word array
  for (let i = 0; i < fileContent.length; i++) {
    fileContent[i] = stemmer(`${fileContent[i]}`);
  }

  //Removing empty words
  fileContent = fileContent.filter(word => {
    return word.length != 0;
  });
  return fileContent;
}

/*
function for saving all the terms (after cleaning the non-letters chars and stemming) with first
initialization of documentNumber & hits. duplicate terms are allowed
*/
function createInitializedTermsArray(fileName) {
  let fileContent = fs.readFileSync(`${sourceDir}/${fileName}`);
  let tokenizedFileContent = tokenize(fileContent.toString("utf8"));
  let objectsArray = new Array();

  tokenizedFileContent.map(term => {
    // basic initializaition of the objects array. duplicate values are allowed.
    let tmpTerm = {
      term: term,
      locations: [
        {
          documentNumber: fileName.slice(0, -4),
          hits: 1
        }
      ],
      sundexCode: soundex(term)
    };
    objectsArray.push(tmpTerm);
  });

  return objectsArray;
}

function compareTermsForSortingFunc(a, b) {
  if (a.term < b.term) return -1;
  if (a.term > b.term) return 1;
  return 0;
}

/* this function will create a sorted Array, that holds all the words from all the documents- all together as Terms Object */
function createGeneralTermsObjectsArray(filesInSource) {
  let generalWordsArray = new Array();
  for (let i = 0; i < filesInSource.length; i++) {
    if (i === 0)
      generalWordsArray = createInitializedTermsArray(filesInSource[i]);
    else
      generalWordsArray = generalWordsArray.concat(
        createInitializedTermsArray(filesInSource[i])
      );
  }
  generalWordsArray.sort(compareTermsForSortingFunc);
  return generalWordsArray;
}

function sortAndMergeTermsFunc(generalTermsArray) {
  let keyIndex = 0; // "ptr" to the term that we are working on. final merged term will be stored in this index.
  let runnerIndex = 1; // "ptr" for checking the next words
  let mergedArray = new Array();
  let numOfTerms = generalTermsArray.length;
  let firstInitializationFlag = true;
  let tmpTerm = {
    term: "",
    locations: [
      {
        documentNumber: -1,
        hits: -1
      }
    ],
    sundexCode: null
  };

  while (keyIndex < numOfTerms) {
    if (firstInitializationFlag) {
      // initialization needed just when first visiting a new term. Before moving to the next new term, the flag will set to 'true'
      tmpTerm = JSON.parse(JSON.stringify(generalTermsArray[keyIndex])); // a *real* shallow copy
      firstInitializationFlag = false;
    }

    if (runnerIndex >= numOfTerms) {
      // runner got to the end of the termsArray
      mergedArray.push(JSON.parse(JSON.stringify(tmpTerm))); // pushing a clone of the tmpTerm to the final merged Array
      keyIndex += runnerIndex - keyIndex;
      firstInitializationFlag = true;
      break;
    }

    if (tmpTerm.term === generalTermsArray[runnerIndex].term) {
      /* check if they are in the same document */
      for (let i = 0; i < tmpTerm.locations.length; i++) {
        if (
          tmpTerm.locations[i].documentNumber ===
          generalTermsArray[runnerIndex].locations[0].documentNumber
        ) {
          // same document
          tmpTerm.locations[i].hits++;
          break;
        } else if (
          tmpTerm.locations[i].documentNumber !==
            generalTermsArray[runnerIndex].locations[0].documentNumber &&
          i === tmpTerm.locations.length - 1
        ) {
          // adding the new documentNumber to the tmpTerm locations array
          tmpTerm.locations.push(
            JSON.parse(
              JSON.stringify(generalTermsArray[runnerIndex].locations[0])
            )
          ); // pushing a clone- by value
          break;
        }
      }
      runnerIndex++;
    } else {
      // in this case- tmpTerm is not equals to the up running term in the 'generalTermsArray[runnerIndex]'
      mergedArray.push(JSON.parse(JSON.stringify(tmpTerm))); // pushing a clone of the tmpTerm to the final merged Array
      keyIndex += runnerIndex - keyIndex; // keyIndex will now point to the next new term.
      runnerIndex = keyIndex + 1;
      firstInitializationFlag = true;
      tmpTerm = {
        // empting the tmpTerm. ready for holding the next term.
        term: "",
        locations: [
          {
            documentNumber: -1,
            hits: -1
          }
        ],
        sundexCode: null
      };
    }
  }
  return mergedArray;
}

/* saving term from indexObject to the indexFile on the DB */
function saveTermsInDB(mergedArray) {
  let numOfTerms = mergedArray.length;
  for (let i = 0; i < numOfTerms; i++) {
    for (let j = 0; j < mergedArray[i].locations.length; j++) {
      mergedArray[i].locations[j].documentNumber = Number(
        mergedArray[i].locations[j].documentNumber
      );
    }

    Term.findOneAndUpdate(
      { word: `${mergedArray[i].term}` },
      {
        $push: { locations: mergedArray[i].locations },
        soundexCode: soundex(`${mergedArray[i].term}`)
      },
      { upsert: true, new: true }
    ).catch(err => {
      res.status(500).json(err);
      return;
    });
  }
}

function saveDocumentsMetadataInDB() {
  let filesInDir = fs.readdirSync(`${sourceDir}`, (err, files) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
  });

  filesInDir.map(txtFile => {
    if (txtFile != DS_Store) {
      let fileNumber = Number(txtFile.substring(0, txtFile.indexOf(".")));
      let fileContent = fs.readFileSync(`${sourceDir}/${txtFile}`).toString();
      let endOfFirstLineIndex = fileContent.indexOf("\n");
      let endOfSecondLineIndex = fileContent.indexOf(
        "\n",
        endOfFirstLineIndex + 1
      );
      let endOfDescriptionIndex;
      for (let i = 0; i < 20; i++) {
        // for saving the first 20 words in the text file (excluding Title & Author name)
        if (i === 0)
          endOfDescriptionIndex = fileContent.indexOf(
            " ",
            endOfSecondLineIndex + 1
          );
        else
          endOfDescriptionIndex = fileContent.indexOf(
            " ",
            endOfDescriptionIndex + 1
          );
      }
      let fileTitle = fileContent.substring(0, endOfFirstLineIndex);
      let fileAuthor = fileContent.substring(
        endOfFirstLineIndex + 1,
        endOfSecondLineIndex
      );
      let description = fileContent.substring(
        endOfSecondLineIndex + 2,
        endOfDescriptionIndex
      );

      Document.findOneAndUpdate(
        { documentNumber: `${fileNumber}` },
        {
          title: `${fileTitle}`,
          author: `${fileAuthor}`,
          description: `${description}`,
          isActive: true
        },
        { upsert: true, new: true }
      ).catch(err => {
        res.status(500).json(err);
        return;
      });
    }
  });
}

/* moving the txt files from the Source folder to the Storage --> after saving the term in the DB */
function moveTxtFilesToStorage() {
  let filesInDir = fs.readdirSync(`${sourceDir}`, (err, files) => {
    if (err) {
      res.status(500).send(err);
      return;
    }
  });

  filesInDir.map(txtFile => {
    if (txtFile != DS_Store) {
      fs.renameSync(`${sourceDir}/${txtFile}`, `${storageDir}/${txtFile}`);
    }
  });
}

module.exports = {
  async uploadFile(req, res) {
    const file = req.files.file;
    const zipFileName = req.files.file.name;
    let uploadedFolder;
    let mergedArray = new Array();
    let generalTermsArray = new Array();

    if (file.mimetype !== `application/zip`) {
      res.status(404).send(`File must be of type zip`);
      return;
    }

    await file.mv(`${sourceDir}/${zipFileName}`); // moving the zip file to the zipUploade folder

    /* unzip the zip file */
    await fs
      .createReadStream(`${sourceDir}/${zipFileName}`)
      .pipe(unzip.Extract({ path: `${sourceDir}` }))
      .on("close", () => {
        let filesInDir = fs.readdirSync(`${sourceDir}`, (err, files) => {
          if (err) res.status(500).send(err);
        });

        fs.unlinkSync(`${sourceDir}/${zipFileName}`); // deleting the zip file after unzipping it

        for (let i = 0; i < filesInDir.length; i++) {
          if (
            filesInDir[i] != MACOSX &&
            filesInDir[i] != DS_Store &&
            filesInDir[i] != zipFileName
          ) {
            uploadedFolder = filesInDir[i]; // for holding the uploaded folder name
          }
        }

        let uploadedTxtFiles = fs.readdirSync(
          // for holding the uploaded files names

          `${sourceDir}/${uploadedFolder}`,
          (err, files) => {
            if (err) res.status(500).send(err);
          }
        );

        /* give the txt files names + locating the txt file in 'source' */
        let serialNumber = getSerialNumber();

        uploadedTxtFiles.map(txtFile => {
          if (txtFile != DS_Store) {
            fs.renameSync(
              // moving the file to the Storage folder + changing the files name
              `${sourceDir}/${uploadedFolder}/${txtFile}`,
              `${sourceDir}/${++serialNumber}.txt`
            );
          }
        });

        /*Erasing the prev extracted folder*/
        rimraf.sync(`${sourceDir}/${uploadedFolder}`, null, err => {
          res.status(500).send(err);
        });
        rimraf.sync(`${sourceDir}/${MACOSX}`, null, err => {
          res.status(500).send(err);
        });

        let filesInSource = fs.readdirSync(`${sourceDir}`, (err, files) => {
          // for holding the uploaded files names
          if (err) res.status(500).send(err);
        });

        filesInSource = filesInSource.filter(file => {
          return file.match(`[0-9]+.txt`); //removing redundent files from filesInSource array
        });
        /* *** at this point: files are uploaded. *** */

        // for holding the words from all the documents- all together as a TermsObjects Array
        generalTermsArray = createGeneralTermsObjectsArray(filesInSource);
        // mergedArray is now an I`ndex JSON object. holds locations, hits, no duplicates terms.
        mergedArray = sortAndMergeTermsFunc(generalTermsArray);
        // saving /updating the indexFile on DB with the local indexObject
        saveTermsInDB(mergedArray);
        // saving /updating Documents on DB
        saveDocumentsMetadataInDB();
        // moving the txt files from the 'Source' Folder to the 'Storage' folder, after saving the term in the db
        moveTxtFilesToStorage();
        res.json(`files uploaded`);
      });
  },

  //"deleting" - deactivating documents
  async deactivateFile(req, res) {
    const fileNumberToDelete = req.body.fileNumber;
    console.log(fileNumberToDelete);
    const response = await Document.findOneAndUpdate(
      { documentNumber: fileNumberToDelete },
      {
        isActive: false
      }
    );

    response
      ? res.status(200).send(`file number ${fileNumberToDelete} deactivated`)
      : res.status(404).send(`file not found`);
  },

  //deleting the "deleting" - activating documents
  async activateFile(req, res) {
    const fileNumberToDelete = req.body.fileNumber;
    const response = await Document.findOneAndUpdate(
      { documentNumber: fileNumberToDelete },
      {
        isActive: true
      }
    );
    response
      ? res.status(200).send(`file number ${fileNumberToDelete} activated`)
      : res.status(404).send(`file not found`);
  },

  getAllDocumentsMetaData(req, res) {
    Document.find({}, (err, result) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      res.json(result);
    });
  }
};
