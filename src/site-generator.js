const fs = require('fs/promises');
const md = require("node-markdown").Markdown;

(async () => {
    const data = await fs.readFile('entries/learns-nodejs.md', 'utf8');
    console.log('before');
    console.log(data);
    const html = md(data);
    console.log('after');
    console.log(html);
    await fs.mkdir('gen/entries', { recursive: true });
    fs.writeFile('gen/entries/learns-nodejs.html', html);
})();
