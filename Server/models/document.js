const mongoose = require(`mongoose`);

const documentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    description: { type: String, required: false },
    title: { type: String, required: true },
    documentNumber: { type: Number, required: true, index: true },
    isActive: { type: Boolean, required: true }
  },
  { collection: `documents` }
);

module.exports = mongoose.model(`Document`, documentSchema);
