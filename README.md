# For Me for Arc - Remove bad tweets using AI
An Arc Boost that removes (dims) bad tweets using AI. See the [original tweet](https://twitter.com/vincentmvdm/status/1658678049691385857).

I wrote this in an hour so don't get too excited, but some people asked me to share the code. I hope that we can make this boost better together. Or that this will at least teach you how to create your own LLM-based boost! Contributions are very welcome.

<img width="1440" alt="badtweets" src="https://github.com/vincentmvdm/twitter-for-me/assets/15680527/7ce78482-ccd4-4d7e-bbc8-21f1d04bca90">

## Set up
1. [Create a new Arc Boost](https://resources.arc.net/en/articles/6808613-boosts-customize-any-website) using the "Replace" template
2. Swap out the template's content.js for this repo's content.js
3. Add your own OpenAPI key

## Limitations and bugs
* The boost only dims bad tweets temporarily and e.g. the styling gets lost when the user scrolls back up
* GPT turbo isn't always smart enough and frequently misclassifies tweets (e.g. labels any tweet about AI as 'bad')
    * An easy solution is using GPT-4 but that could require modifications to the prompt for the best results
* It doesn't know about a tweet's images, author, etc.
* I haven't done the math on how expensive this would be to run constantly :)
