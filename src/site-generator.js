const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs/promises');
const md = require("node-markdown").Markdown;
const path = require('path');

(async () => {
    const {stdout: tagString} = await exec("git tag");
    const revs = tagString.trim().split("\n");
    revs.push("HEAD");
    for (let i = 0; i < revs.length; i++) {
        const rev = revs[i];
        await exec(`git checkout ${rev}`); // Hello shell injection
        const entries = await fs.readdir('entries');
        for (const entry of entries) {
            const data = await fs.readFile(`entries/${entry}`, 'utf8');
            const html = md(data);
            let directory;
            if (rev == "HEAD") {
                directory = 'entries';
            } else {
                directory = `history/${rev}`;
            }
            await fs.mkdir(`gen/${directory}`, { recursive: true });
            const entryName = path.parse(entry).name;
            fs.writeFile(`gen/${directory}/${entryName}.html`, html);
        }
    }
})();
