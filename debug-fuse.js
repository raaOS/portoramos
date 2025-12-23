const Fuse = require('fuse.js');
console.log('Type of Fuse:', typeof Fuse);
console.log('Keys of Fuse:', Object.keys(Fuse));
console.log('Fuse.default:', Fuse.default);
try {
    new Fuse([], {});
    console.log('new Fuse() works directly');
} catch (e) {
    console.log('new Fuse() failed directly:', e.message);
}
