# Remove bad tweets using Arc and AI
An Arc Boost that removes bad tweets using AI. See the [original post](https://twitter.com/vincentmvdm/status/1658678049691385857).

I wrote this in an hour so don't get too excited, but some people asked me to share the code. I hope that we can make this boost better together. Or that this will at least teach you how to create your own LLM-based boost! Contributions are very welcome.

<br />
<img width="420" alt="arc-boost" src="https://github.com/vincentmvdm/for-me-page/assets/15680527/ab9355b9-f828-44d8-b4d4-49e4de584998">
<br />

## Set up
1. [Create a new Arc Boost](https://resources.arc.net/en/articles/6808613-boosts-customize-any-website) using the "Replace" template
2. Swap out the template's content.js for this repo's content.js
3. Add your own OpenAPI key

## Limitations and bugs
* GPT turbo isn't always smart enough and frequently misclassifies tweets (e.g. labels any tweet about AI as 'bad')
    * An easy solution is using GPT-4 but that could require modifications to the prompt for the best results
* It doesn't know about a tweet's images, author, etc.
* I haven't done the math on how expensive this would be to run constantly :)
