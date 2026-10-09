// GhostLite has no members, payments or recommendations. The helper stays
// registered so themes that call `{{total_members}}` keep rendering, but it outputs nothing.
module.exports = function totalMembers() {};
