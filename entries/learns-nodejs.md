A Jibboo Starts a Blog
======================

Like many programmers of all kinds, I find myself compelled to write a
programming blog. I plan to use this blog to learn new technologies and
chronicle my experience as I go. When I say "new", I mean new to me.
I graduated with a CS degree about 8 years ago, and since then I've
worked at the same company doing enterprise backend Java development.
Besides that, I've used Haskell for a few side projects and a couple
attempts at Advent of Code.

To start with, I'm going to learn some Javascript. As I write this
initial blog post in `entries/learn-nodejs.md`, I'm taking it on faith
that I'll be able to create a simple static site generator using node.js
to actually publish this content. Here's what we'll call our MVP:

*   Process markdown files in this `entries` directory
*   Add some header/footer template magic
*   Output HTML

After that, we may tackle learning some styling. I also have the crazy
notion that it might be interesting to make the generator generate
versions of the site bundled all together based on git tags. Let's tack
that onto our initial requirements for fun.

First, I'll google (or duckduckgo) node.js to find what I need to use to
actually run some node.js code. I find [nodejs.org][nodejs] which
presents me with a button to download 14.17 LTS or 16.2.0. I realize I
should see if my package manager has a package for me. Sure enough I
actually already have nodejs v15.10.0 installed. Thanks pacman.

[nodejs]: https://nodejs.org/en/

Okay so now I have it. How do I do anything? I hit the "DOCS" tab on
nodejs.org. Hmm this just looks like API reference. I'm hoping for more
of a "getting started" vibe. I hit the "ABOUT" tab. There's that sweet
Hello World goodness I'm looking for. I copy the sample program there to
`src/site-generator.js`. Run `node src/site-generator.js`. I visit
localhost:3000, and it's beautiful and friendly. Guess we're done!

Well not quite. Still need to actually generate my site. I read the rest
of the "ABOUT" page which tells me to expect a single-threaded
asynchronous runtime model with callbacks as the entrance point to the
program. I'll take this in stride for now. I'm not sure how that will
affect my site generation, which seems like a relatively procedural
prospect. Only one way to find out.

Let's start with processing the markdown file. I search online for
"nodejs markdown" and find [node-markdown][node-markdown]. I vaguely
remember that npm is a package manager for node. `pacman -S npm` gets it
for me (I'm using Arch Linux). I run `npm install node-markdown` like
the website tells me to.

[node-markdown]: https://www.npmjs.com/package/node-markdown

I've just become painfully aware that this first-person narration sounds
reminiscent of Zork. Bear with it.

The npm package page for node-markdown has some helpful examples, but I
realize now I need to read a file, as the markdown function operates on
a string. I search "node read a file" which takes me to
[nodejs.dev/learn][reading-files], which looks like a place I'm probably
going to be spending a lot of time soon. I can read a file with
`require('fs').readFile` and, as promised in the "ABOUT" tab, it takes a
callback. I suppose it is within this callback that I will parse the
markdown.

[reading-files]: https://nodejs.dev/learn/reading-files-with-nodejs

    const fs = require('fs');
    const md = require("node-markdown").Markdown;

    fs.readFile('entries/learns-nodejs.md', 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('before');
        console.log(data);
        const html = md(data);
        console.log('after');
        console.log(html);
    });

This, surprisingly, works. I felt a little sad deleting all the Hello
World code, but we can never look back now. I want to learn more about
this callback structure and I'm curious about `const` and `var` because
the node-markdown example used `var` but the other things I've seen use
`const`. I'm guessing `const` is like `final` in Java. I'm also curious
about the string literals. But let's set all that aside for now and
write the resulting HTML to a file. The next page in nodejs.dev/learn is
about writing files, so I add:

    fs.writeFile('gen/entries/learns-nodejs.html', html, err => {
        if (err) {
            console.error(err)
            return
        }
    });

This does not work, because `gen/entries` does not exist. I search
"node.js create directory" and get a bunch of blog articles. Bummer the
documentation SEO had been treating me so well. I prefer to go straight
to the documentation because I know it's up to date, has notes for best
practices, has adjacent areas of the libraries I might be interested in
later, and gives me a one-stop-shop for learning the libraries and
language. But the sixth result goes back to nodejs.dev/learn and I see
that "Working with Folders" was the next page after all. Oops!

Actually while I'm thinking about it, let's switch from nodejs.dev/learn
to [nodejs.dev/docs][nodejs-docs]. This is lucky because the learn page
doesn't mention the `recursive` option but the docs do. Also something
about promises, which I wondered about. Java has `CompletableFuture`
which seems better than the callback approach we've seen so far, but
you'd expect Node to have at least some kind of future/promise since it
is built on callbacks. Sure enough, I see in the docs on the file system
API, there's a promise version of each function. Links to documentation
on [Promise][promise], which tells me it's basically like
`CompletableFuture` except you have to provide `whenComplete` type
callbacks on construction. Let's rewrite what we have:

[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[nodejs-docs]: https://nodejs.org/docs/latest-v15.x/api/fs.html#fs_fs_mkdir_path_options_callback

    const fs = require('fs/promises');
    const md = require("node-markdown").Markdown;

    fs.readFile('entries/learns-nodejs.md', 'utf8')
        .then(data => {
            console.log('before');
            console.log(data);
            const html = md(data);
            console.log('after');
            console.log(html);
            fs.mkdir('gen/entries', { recursive: true })
                .then(ignored => {
                    fs.writeFile('gen/entries/learns-nodejs.html', html);
                });
        });

This works, AND the docs had an example of using async/await which I now
remember seeing before. They tidy up the callback chain here. You can
imagine that every `await foo(); blah(); ...` is shorthand for
`foo().then({blah(); ...})`. Let's do one more iteration then maybe
we'll call it a day. Oops I got an error trying to use `await` at the
top-level. Searched online "node.js await only in top-level function" or
something and found a stack overflow answer with a beautiful soup of
brackets that defines and then calls an anonymous async function, just
to get around this error. Maybe they should find a less under-the-table
feeling way to get at the await/async machinery...

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

Well we have some HTML with a blog post! Let's take a break here for
now. Next time we can work on scanning the directory and trying to do
the git tag time machine magic.
