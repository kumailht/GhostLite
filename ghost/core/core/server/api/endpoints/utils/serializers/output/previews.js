const mappers = require('./mappers');

module.exports = {
  async all(model, apiConfig, frame) {

    const data = await mappers.posts(model, frame);
    frame.response = {
      previews: [data],
    };
    frame.response.previews[0].type = model.get('type');
  },
};
