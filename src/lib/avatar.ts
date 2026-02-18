export const AVATAR_COLORS = [
    { bg: 'd9fdd3', text: '128c7e' }, // Green
    { bg: 'cfe9ff', text: '005a9e' }, // Blue
    { bg: 'ffe1e1', text: 'a52a2a' }, // Red
    { bg: 'e9e1ff', text: '5a2ca5' }, // Purple
    { bg: 'ffe7d1', text: 'a55a2c' }, // Orange
    { bg: 'd1fff1', text: '2ca57a' }, // Mint
];

export const getAvatarColors = (name: string) => {
    if (!name) return AVATAR_COLORS[0];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[colorIndex];
};

export const getAvatarUrl = (name: string) => {
    if (!name) name = '?';
    const char = name.charAt(0).toUpperCase();
    const colors = getAvatarColors(name);
    return `https://ui-avatars.com/api/?background=${colors.bg}&color=${colors.text}&bold=true&length=1&name=${encodeURIComponent(char)}`;
};
