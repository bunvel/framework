export function pluralize(word: string): string {
  if (word.endsWith("y") && !/[aeiou]y$/.test(word)) {
    return word.replace(/y$/, "ies");
  } else if (
    word.endsWith("s") ||
    word.endsWith("sh") ||
    word.endsWith("ch") ||
    word.endsWith("x") ||
    word.endsWith("z")
  ) {
    return word + "es";
  } else {
    return word + "s";
  }
}
