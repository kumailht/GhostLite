// GhostLite has no comments app. The helper stays registered so themes that
// call `{{comments}}` keep rendering, but it outputs nothing.
module.exports = function comments() {};
