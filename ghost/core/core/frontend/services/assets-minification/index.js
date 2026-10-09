const CardAssets = require('./card-assets');

let cardAssets;

module.exports = {
  get cardAssets() {
    cardAssets = cardAssets || new CardAssets();
    return cardAssets;
  },
};
