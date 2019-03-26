//Modules
const stemmer = require(`stemmer`),
  bodyParser = require(`body-parser`),
  fs = require(`fs`),
  path = require(`path`),
  isLetter = require(`is-letter`),
  soundex = require(`soundex-code`),
  _ = require(`lodash`);

//stopList
const StopList = require(`../stopList`);

//Models
const Term = require(`../models/term`),
  Document = require(`../models/document`);

//controller consts
const storageDir = path.join(__dirname, `../documents/storage`);

//helper functions
//Checking for balanced quotation marks
isQuotationMarksBalanced = query => {
  let isBalanced = true;

  for (let i = 0; i < query.length; i++) {
    if (query[i] === '"') {
      isBalanced = !isBalanced;
    }
  }
  return isBalanced;
};

//Checking for balanced parentheses
let isParenthesesBalanced = query => {
  let counter = 0;

  for (let i = 0; i < query.length; i++) {
    if (query[i] === "(") {
      counter++;
    }
    if (query[i] === ")") {
      counter--;
    }
    if (counter < 0) return false;
  }
  return counter === 0;
};

//Lower casing query and removing double spaces
let lowerCaseAndRemoveDoubleSpaces = query =>
  query.toLowerCase().replace(/\s+/g, " ");

//Removing redundent operators
let removeRedundantOperators = query => {
  let index = 0;
  while ((index = query.indexOf("&", index)) !== -1) {
    let isNotOperandAfterAnd =
      query[index + 1] === "!" || query[index + 2] === "!";
    if (isNotOperandAfterAnd) {
      query = query.substr(0, index) + query.substr(index).replace("&", "");
    }
    index++;
  }
  return query;
};

//Checking for correct order of operators
let isOperatorsCorrect = query => {
  let tmpQuery = lowerCaseAndRemoveDoubleSpaces(query);

  tmpQuery = removeRedundantOperators(tmpQuery);

  let operators = query.match(/&|!|(\|)/g);

  return (
    operators == null ||
    (operators[0] !== "!" && // NOT cannot be first
      checkOperand(tmpQuery, "!") &&
      checkOperand(tmpQuery, "|") &&
      checkOperand(tmpQuery, "&"))
  );
};

let checkOperand = (text, operand) => {
  let index = 0;
  while ((index = text.indexOf(operand, index)) !== -1) {
    let condition =
      text[index + 1] !== "(" &&
      text[index + 1] !== '"' &&
      !isLetter(text[index + 1]) &&
      (text[index + 2] !== "(" &&
        text[index + 2] !== '"' &&
        !isLetter(text[index + 2]));

    condition =
      operand === "!"
        ? condition
        : condition ||
        (text[index - 1] !== ")" &&
          text[index - 1] !== '"' &&
          !isLetter(text[index - 1]) &&
          (text[index - 2] !== ")" &&
            text[index - 2] !== '"' &&
            !isLetter(text[index - 2])));

    if (condition) return false;

    index++;
  }
  return true;
};

//Checking if a word is Between quoataion marks
let isBetweenQuotationMarks = (word, query) => {
  let indexOfWord = query.indexOf(word);

  let hasStartingQuotationMarks = false;

  for (let i = 0; i < indexOfWord; i++) {
    if (query[i] === '"') {
      hasStartingQuotationMarks = !hasStartingQuotationMarks;
    }
  }
  return hasStartingQuotationMarks;
};

//Checking if a word is Between parentheses
let isBetweenParentheses = (query, operatorPosition) => {
  let index = 0;
  for (let i = 0; i < operatorPosition + 1; i++) {
    let notIndex = query.indexOf("!", index);
    let andIndex = query.indexOf("&", index);
    let orIndex = query.indexOf("|", index);
    if (notIndex === -1) notIndex = 1000;
    if (andIndex === -1) andIndex = 1000;
    if (orIndex === -1) orIndex = 1000;
    index = Math.min(notIndex, andIndex, orIndex);
    index++;
  }

  let hasStartingParentheses = 0;

  for (let i = 0; i < index - 1; i++) {
    if (query[i] === "(") {
      hasStartingParentheses++;
    }
    if (query[i] === ")") {
      hasStartingParentheses--;
    }
  }

  return hasStartingParentheses > 0;
};

let evaluateExpressions = (
  withParentheses,
  expressions,
  operator,
  setOperation,
  resultDocuments,
  docsByWord
) => {
  let evaluateCondition;
  for (let i = 0; i < expressions.length; i++) {
    evaluateCondition = expressions[i].operator === operator;

    if (withParentheses) {
      evaluateCondition &= expressions[i].isInsideParentheses;
    }
    if (evaluateCondition) {
      // On the first time, the docs are retrieved from the word in leftHand/rightHand
      if (!("leftHandDocs" in expressions[i])) {
        expressions[i].leftHandDocs = docsByWord[expressions[i].leftHand];
      }
      if (!("rightHandDocs" in expressions[i])) {
        expressions[i].rightHandDocs = docsByWord[expressions[i].rightHand];
      }

      // Evaluate the expression with the relevant operation (intersection, union or difference)
      resultDocuments = setOperation(
        expressions[i].leftHandDocs,
        expressions[i].rightHandDocs
      );

      // populating neighbour expressions with our new results
      if (i - 1 >= 0) {
        expressions[i - 1].rightHandDocs = resultDocuments;
      }
      if (i + 1 < expressions.length) {
        expressions[i + 1].leftHandDocs = resultDocuments;
      }

      // Splicing evaluated expressions, OR is evaluated last so there is no need for splice
      if (operator !== "|" || withParentheses) {
        expressions.splice(i, 1);
        i--;
      }
    }
  }
  return resultDocuments;
};

let evaluateAllExpressions = (
  withParentheses,
  resultDocuments,
  expressions,
  docsByWord
) => {
  // Evaluate NOT
  resultDocuments = evaluateExpressions(
    withParentheses,
    expressions,
    "!",
    _.difference,
    resultDocuments,
    docsByWord
  );
  // Evaluate AND
  resultDocuments = evaluateExpressions(
    withParentheses,
    expressions,
    "&",
    _.intersection,
    resultDocuments,
    docsByWord
  );
  // Evaluate OR
  resultDocuments = evaluateExpressions(
    withParentheses,
    expressions,
    "|",
    _.union,
    resultDocuments,
    docsByWord
  );

  return resultDocuments;
};

let cleanquery = query => {
  let originalquery = query;

  // LowerCase && remove double spaces
  query = lowerCaseAndRemoveDoubleSpaces(query);

  query = removeRedundantOperators(query);

  let expressions = [];
  let wordsOnly = query.match(/\b(\w+)\b/g);
  let operatorsOnly = query.match(/&|!|(\|)/g);

  if (wordsOnly != null) {
    for (let i = 0; i < wordsOnly.length; i++) {
      wordsOnly[i] = stemmer(wordsOnly[i]);
    }

    if (operatorsOnly != null) {
      for (let i = 0; i < operatorsOnly.length; i++) {
        let expression = {};

        expression.operator = operatorsOnly[i];
        expression.leftHand = wordsOnly[i];
        expression.rightHand = wordsOnly[i + 1];
        expression.isInsideParentheses = isBetweenParentheses(query, i);

        expressions.push(expression);
      }
    }

    // Clear words which belong to StopList && is not between " "
    wordsOnly = wordsOnly.filter(
      w =>
        !(
          StopList.indexOf(w) > -1 && !isBetweenQuotationMarks(w, originalquery)
        )
    );

    expressions = expressions.filter(
      e =>
        wordsOnly.indexOf(e.rightHand) > -1 &&
        wordsOnly.indexOf(e.leftHand) > -1
    );
  }

  return {
    words: wordsOnly,
    expressions: expressions
  };
};

let generateSoundexCodes = words => {
  let arrayOfSoundexCodes = [];
  for (let word of words) {
    arrayOfSoundexCodes.push(soundex(word));
  }
  return arrayOfSoundexCodes;
};

module.exports = {
  search(req, res) {
    let query = req.body.query;
    let isSoundexActivated = req.body.soundex === `true`;
    if (query == null || query.length === 0 || !query.trim()) {
      res.status(500).json(`Search field cannot be empty`);
      return;
    }

    if (!isQuotationMarksBalanced(query)) {
      res.status(500).json(`Quotation Marks are not balanced`);
      return;
    }

    if (!isParenthesesBalanced(query)) {
      res.status(500).json(`Parentheses are not balanced`);
      return;
    }

    if (!isOperatorsCorrect(query)) {
      res.status(500).json(`Operators are not correct`);
      return;
    }

    let queryObj = cleanquery(query);
    if (queryObj.words == null) {
      res.status(500).json(`Search field must contain at least one word`);
      return;
    }
    let isQueryWithParentheses = query.match(/\(|\)/g) != null;
    console.log(queryObj);

    let whereObject = {
      $or: [{ word: { $in: queryObj.words } }]
    };

    if (isSoundexActivated) {
      let arrayOfSoundexCodes = generateSoundexCodes(queryObj.words);
      whereObject.$or.push({ soundexCode: { $in: arrayOfSoundexCodes } });
    }

    Term.find(whereObject)
      .then(words => {
        let documents = [];
        let resultDocuments = null;
        let documentsData = [];
        if (queryObj.expressions.length === 0) {
          for (let word of words) {
            for (let location of word.locations) {
              if (!documents.includes(location.documentNumber))
                documents.push(location.documentNumber); //check if noe exist
            }
          }
          resultDocuments = documents;
        } else {
          let documentsByWord = {};
          for (let word of words) {
            documentsByWord[word.word] = [];
            for (let location of word.locations) {
              documentsByWord[word.word].push(location.documentNumber);
            }
          }
          let expressions = queryObj.expressions;
          if (isQueryWithParentheses) {
            resultDocuments = evaluateAllExpressions(
              true,
              resultDocuments,
              expressions,
              documentsByWord
            );
          } else {
            resultDocuments = evaluateAllExpressions(
              false,
              resultDocuments,
              expressions,
              documentsByWord
            );
          }
        }
        Document.find({
          $or: [{ documentNumber: { $in: resultDocuments } }]
        }).then(documents => {
          documents = Object.values(documents).filter(
            document => document.isActive
          );
          res.json(documents);
        });
      })
      .catch(err => {
        res.status(500).json(err);
        return;
      });
  },
  //Get document content by document number
  getDocumentContent(req, res) {
    let filesInStorageDir = fs.readdirSync(`${storageDir}`, (err, files) => {
      if (err) res.send(new errObj(404, err));
    });
    let chosenFileContent;
    let fileFoundFlag = false;

    if (filesInStorageDir.length !== 0) {
      filesInStorageDir.map(fileName => {
        if (fileName === `${req.query.fileNumber}.txt`) {
          chosenFileContent = fs
            .readFileSync(`${storageDir}/${fileName}`)
            .toString();
          res.json(chosenFileContent);
          fileFoundFlag = true;
        }
      });
      if (!fileFoundFlag) res.json(`file not found`);
    } else res.json(`No Files in DB`);
  }
};
