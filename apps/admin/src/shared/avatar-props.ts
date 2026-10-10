type Person = { name?: string | null; email?: string | null };

// Display name for a person, falling back from name to email
const formatName = (person: Person) => {
  return (person.name && person.name.trim()) || person.email || 'Unknown';
};

// Uppercase initials for a person, derived from formatName
const getInitials = (person: Person) => {
  const name = formatName(person);
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Avatar props for a person: initials plus the hue seed (name-first, so
// distinct people keep distinct fallback colors). Spread onto Shade's <Avatar>;
// an absent person yields undefined props → icon fallback.
export const avatarProps = (person?: Person | null) => {
  if (!person || (!person.name && !person.email)) {
    return { initials: undefined, colorSeed: undefined };
  }
  return {
    initials: getInitials(person),
    colorSeed: person.name || person.email || undefined,
  };
};
