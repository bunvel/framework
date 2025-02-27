export default class Str {
    // Convert a string to camelCase
    static camelCase(value: string): string {
      return value
        .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
        .replace(/^(.)/, (_, char) => char.toLowerCase());
    }
  
    // Convert a string to kebab-case
    static kebabCase(value: string): string {
      return value
        .replace(/\s+/g, '-')
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
    }
  
    // Convert a string to snake_case
    static snakeCase(value: string): string {
      return value
        .replace(/\s+/g, '_')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase();
    }
  
    // Convert a string to PascalCase
    static pascalCase(value: string): string {
      return value
        .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
        .replace(/^(.)/, (_, char) => char.toUpperCase());
    }
  
    // Limit the number of characters in a string
    static limit(value: string, limit: number = 100, end: string = '...'): string {
      return value.length > limit ? value.substring(0, limit) + end : value;
    }
  
    // Generate a URL-friendly "slug" from a given string
    static slug(value: string, separator: string = '-'): string {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, separator);
    }
  
    // Convert the first character of a string to uppercase
    static ucfirst(value: string): string {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
  
    // Convert the first character of a string to lowercase
    static lcfirst(value: string): string {
      return value.charAt(0).toLowerCase() + value.slice(1);
    }
  
    // Determine if a string starts with a given substring
    static startsWith(value: string, search: string): boolean {
      return value.startsWith(search);
    }
  
    // Determine if a string ends with a given substring
    static endsWith(value: string, search: string): boolean {
      return value.endsWith(search);
    }
  
    // Remove all "extra" white space from a string
    static squish(value: string): string {
      return value.replace(/\s+/g, ' ').trim();
    }
  
    // Replace the first occurrence of a given value in the string
    static replaceFirst(value: string, search: string, replace: string): string {
      const index = value.indexOf(search);
      if (index === -1) return value;
      return (
        value.substring(0, index) +
        replace +
        value.substring(index + search.length)
      );
    }
  
    // Replace the last occurrence of a given value in the string
    static replaceLast(value: string, search: string, replace: string): string {
      const index = value.lastIndexOf(search);
      if (index === -1) return value;
      return (
        value.substring(0, index) +
        replace +
        value.substring(index + search.length)
      );
    }
  
    // Reverse the given string
    static reverse(value: string): string {
      return value.split('').reverse().join('');
    }
  
    // Generate a random alphanumeric string of a given length
    static random(length: number = 16): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  
    // Pluralize a word (basic handling for English)
    static plural(value: string): string {
      if (value.endsWith('y')) {
        return value.slice(0, -1) + 'ies';
      }
      if (value.endsWith('s') || value.endsWith('sh') || value.endsWith('ch')) {
        return value + 'es';
      }
      return value + 's';
    }
  
    // Singularize a word (basic handling for English)
    static singular(value: string): string {
      if (value.endsWith('ies')) {
        return value.slice(0, -3) + 'y';
      }
      if (value.endsWith('es')) {
        return value.slice(0, -2);
      }
      if (value.endsWith('s') && !value.endsWith('ss')) {
        return value.slice(0, -1);
      }
      return value;
    }
  
    // Check if a string contains a given substring
    static contains(value: string, search: string): boolean {
      return value.includes(search);
    }
  
    // Check if a string contains any of the provided substrings
    static containsAny(value: string, searches: string[]): boolean {
      return searches.some((search) => value.includes(search));
    }
  
    // Check if a string contains all of the provided substrings
    static containsAll(value: string, searches: string[]): boolean {
      return searches.every((search) => value.includes(search));
    }
  
    // Pad the left side of the string with a given character
    static padLeft(value: string, length: number, pad: string = ' '): string {
      return value.length >= length
        ? value
        : pad.repeat(length - value.length) + value;
    }
  
    // Pad the right side of the string with a given character
    static padRight(value: string, length: number, pad: string = ' '): string {
      return value.length >= length
        ? value
        : value + pad.repeat(length - value.length);
    }
  
    // Convert a string to title case
    static title(value: string): string {
      return value
        .toLowerCase()
        .split(' ')
        .map((word) => this.ucfirst(word))
        .join(' ');
    }
  }
  