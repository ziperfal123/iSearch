const mongoose = require(`mongoose`);

const locationSchema = new mongoose.Schema({
  documentNumber: { type: Number, ref: `Documents`, required: true }, //document number
  hits: { type: Number, required: true }
});

const termSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, index: true },
    soundexCode: { type: String, required: true },
    locations: [{ type: locationSchema, required: true }]
  },
  { collection: `terms` }
);

module.exports = mongoose.model(`Term`, termSchema);
