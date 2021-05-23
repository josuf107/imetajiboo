A Jibboo Learns About Loops and Git Tags
========================================

We're back! Last time we learned a little node.js, just enough to render
the first blog post into HTML. Now we're going to see if we can extend
our little blogging system to handle this second post, and add a new
feature to navigate to past versions of the blog tagged in git as well.
To start, I created a git tag for the first checkpoint:

    git tag checkpoint1
    git push origin checkpoint1

So there's that. We'll come back to that. Let's see if we can extend our
blogging system to handle multiple posts. This time I need to get the
contents of the `entries` directory. I've still got the node.js docs
open in a tab open to the File System section. I look for `ls`,
`getContents`, `list`, etc. before I finally notice `readdir` which does
what I want. Try it out:

    const fs = require('fs/promises');
    const md = require("node-markdown").Markdown;

    (async () => {
        const entries = await fs.readdir('entries');
        console.log(entries);
        ...

This outputs `[ 'learns-about-git-tags.md', 'learns-nodejs.md' ]`, which
is apparently an array according to the docs. I notice that the docs
mention that, depending on the options, `readdir` may return an array of
`String`, `Buffer`, or `fs.Dirent`. That's strange to me coming from
Java/Haskell. In Java you could do something like that if all three
implemented a common interface or extended a common parent, and Haskell
allows sum types (e. g. one could imagine a function returning a
`DirectoryListing = DirectoryStrings [String] | DirectoryBuffers
[Buffer] | DirectoryEntities [Dirent]`). But to just return any type
freely willy-nilly depending on the input without any extra boilerplate?
Okay Javascript. We'll just accept that for now.

Speaking of which I notice some of the code samples in the docs use
semicolons and some don't. I'm not sure whether or not they're required.
Searching the web for this answer... found some horrifying truth about
it in an [article][semicolons]. Apparently according to "rules" the
Javascript engine infers semicolons in certain places. But perhaps not
everywhere you'd like. The main deal is that if there's a line break or
`{` and the thing after that wouldn't otherwise parse, the parser infers
a semicolon. Based on the article, it seems like it would work in most
cases, but I'm just going to use semicolons because I'm coming from Java
and I don't want to have to think about it. Plus I'm likely to make
syntactic mistakes already and it would just add more ambiguity.

[semicolons]: https://dev.to/adriennemiller/semicolons-in-javascript-to-use-or-not-to-use-2nli

I've digressed. This is why it takes me so long to do anything. Now that
we have our entries let's process each in turn. Time for a loop! I
noticed when the File System docs linked to the `Promise` class that it
linked to https://developer.mozilla.org/, which seems to have pretty
good general Javascript documentation. I searched for "mdn loop" and
found [Loops and iteration][loops-and-iteration]. Looks good. The usual
C-style `for`, `while`, and `do-while` make an appearance. Then there's
a `for-in` and a `for-of`. This sounds like a recipe for me getting
confused in the future. So `for-in` iterates over the properties of an
object, which weirdly, according to these docs, mostly works for an
array because I guess the array elements are properties on the array
object somehow. Except you can also define properties on an array. Okay
we'll just swallow that whole. `for-of` is the useful sounding one that
is like the enhanced for loop in Java. I notice the docs mention you can
use `Map` in a `for-of` which is new and different to me. I'm too
curious to pass it up so I check the docs for `Map` and it says the
iterator function "Returns a new Iterator object that contains an array
of [key, value] for each element in the Map object in insertion order."
That's cool! I would have liked something more line an entry object with
a `key` and a `value`, but being able to iterate over the keys/values of
a Map without fuss sounds nice. Plus I see in the docs you can
destructure the array in the variable assignment (i. e. it looks like
[a, b] = [1, 2] is valid). Since the iteration is in insertion order I
guess the `Map` implementation must keep a supplementary list of keys.
Seems a bit wasteful when not needed but I guess it's Javascript.

[loops-and-iteration]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration

Anyway let's try it!

    const fs = require('fs/promises');
    const md = require("node-markdown").Markdown;

    (async () => {
        const entries = await fs.readdir('entries');
        for (const entry of entries) {
            const data = await fs.readFile('entries/' + entry, 'utf8');
            const html = md(data);
            await fs.mkdir('gen/entries', { recursive: true });
            fs.writeFile('gen/entries/' + entry + '.html', html);
        }
    })();

This works! Kinda. It has two problems. One is that using `+` to
concatenate the strings was a hail-mary that luckily worked, but I think
Javascript might have some kind of interpolation mechanism. The other is
that I need to strip the `.md` extension from the entry before appending
`.html`. Let's see what mdn has to say about string literals.
[String][string] is pretty good. It tells me that `'` and `"` actually
mean the same thing. That's three strikes, Javascript. More importantly,
it tells me I can create template literals using `` ` `` and interpolate
expressions. Interesting stuff with tagged templates performing their
own interpolation, but more apropos is that I can interpolate an
expression using `${}`. Simple enough. I find a [Path API][path] in the
docs which has what I'm looking for regarding file extensions. And away
we go!

[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[path]: https://nodejs.org/docs/latest-v15.x/api/path.html#path_path_parse_path

    const fs = require('fs/promises');
    const path = require('path');
    const md = require("node-markdown").Markdown;

    (async () => {
        const entries = await fs.readdir('entries');
        for (const entry of entries) {
            const data = await fs.readFile(`entries/${entry}`, 'utf8');
            const html = md(data);
            await fs.mkdir('gen/entries', { recursive: true });
            const entryName = path.parse(entry).name;
            fs.writeFile(`gen/entries/${entryName}.html`, html);
        }
    })();

It works! I feel surprised every time. Okay let's see if we can get our
git tag time machine going before we wrap this up. This time I need to
run some shell commands. I notice a "Child process" section in the docs
that has an `exec` method that takes a callback on stdout I could use to
get all the git tags. I should also be able to manage checkout as well.
I was thinking that it's a bit lame that it takes a callback, but the
docs mention you can use `util.promisfy` to transform the callback
version into a callback version. In fact, it turns out `util.promisfy`
will turn *any* function that takes a callback into one that returns a
promise, and the function may optionally specify a promise
implementation because apparently functions, like arrays, can have
properties. This seems a bit wild to me still, but also useful in this
case. It also occurred to me that using `await` might cause one to
accidentally introduce more waiting than necessary. For instance,
suppose I needed to get two numbers in some slow way, and then add them
together. I could do:

    const a = await getSlowNumber1();
    const b = await getSlowNumber2();
    return a + b;

But this unnecessarily forces `getSlowNumber2` to wait to start until
getting `a` has finished. It would be better if there was a way to say
start getting `a` and `b` at the same time, then return when they both
complete. With `CompletableFuture` this is the `thenCombineAsync`
method. With Promises I'm not sure how to do this. One bad way might be
to use global variables for the two Promises, and have each chain call a
function that checks to see if both globals are set before doing the
final computation. Reading the docs in mdn, I see that there is a
`Promise.all()` function that solves this nicely:

    Promise.all([getSlowNumber1(), getSlowNumber2()]).then(([a, b]) => a + b);

This works. I experimented using a function I made up called `slow`,
which returns a promise that waits 1 second before resolving:

    const slow = x => new Promise(resolve => setTimeout(() => resolve(x), 1000));

Then I tested various approaches with `time node test.js`. Well that was
a digression, but we're learning! `await` is great but it isn't always
the right way to compose promises. Onward. Here's the interesting bit:

    const util = require('util');
    const exec = util.promisify(require('child_process').exec); // totally ripped off from the documentation
    ...
    const {stdout} = await exec("git tag");
    console.log(`Herr dose tags: ${stdout}`);

So apparently you can also destructure objects in assignment as long as
you're happing with setting the resulting variable using the same name
as the property? Again, [mdn][destructure] has all the details. You can
rename the properties when destructuring an object. In my case it would
be `const {stdout: tags} = await exec('git tag');` will store the tags
in `tags`. Now we just need to split lines and we'll be good to go! It's
so painful not knowing how to do these simple tasks without consulting
the documentation. I've had the realization that the biggest part of
most languages is the standard libraries that come with them. Anyway
according to [mdn][string] `String` has a `split` and a host of other
handy functions on its "prototype", whatever that means, but I think it
is something analogous to a class in Java. I'm going to set that aside
for now though so we can wrap up this post in a reasonable amount of
time.

[destructure]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment

Okay this took a couple of tries. First off apparently `Array` is not
iterable which seems annoying. I used a classic `for` loop in this case.
Secondly, in Java you can declare a final variable and then assign it
later in e. g. an if statement as long as it always gets assigned. But
Javascript can't do that, I guess because it's interpreted it's not
possible to know that the `const` is only assigned once, so I learned
about `let` from [stack overflow][let]. Besides that, just fair warning
don't try this at home. It's a pretty insane idea to have the code under
source control iterate through the git history. But we're learning so
much! Here's the final result:

[let]: https://stackoverflow.com/questions/40877053/use-if-else-to-declare

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
