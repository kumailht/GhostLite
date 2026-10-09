// GhostLite has no members, payments or recommendations. The helper stays
// registered so themes that call `{{cancel_link}}` keep rendering, but it outputs nothing.
module.exports = function cancelLink() {};
