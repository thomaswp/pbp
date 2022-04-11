export function kebab(str) {
    const replace = s => {
        if (!s) return s;
        return s.toLowerCase().replace(/ /g, '-');
    };

    return Array.isArray(str) ? str.map(replace) : replace(str);
}
