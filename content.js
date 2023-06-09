const OPENAI_API_KEY = "YOUR_KEY_GOES_HERE";

// Change these topics to match your taste.
const BAD_TOPICS = [
  "Low effort AI content like 'Here's 10 ways to use ChatGPT'",
  "NFTs",
  "Celebrities like Prince Harry",
];

const MIN_TWEETS_PER_REVIEW = 3; // Min # of tweets needed before we contact OpenAI
const MAX_TWEETS_PER_REVIEW = 30; // Max # of tweets to include in a single API request (avoids token limits)
const REVIEW_INTERVAL_MS = 25;

const seenTweets = {};
let tweetsToReview = [];

start();

function start() {
  if (OPENAI_API_KEY.length === 0) {
    alert("Add your OpenAI key for the boost to work");
    return;
  }

  addMutationObserver();
  setInterval(reviewTweets, REVIEW_INTERVAL_MS);
}

function addMutationObserver() {
  // Grab any tweets from the mutations if we haven't seen them
  // before and queue them up for review. There's likely a better
  // way to do this but I was in a hurry.
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      const tweets = [
        ...mutation.target.querySelectorAll("article[data-testid='tweet']"),
      ]
        .map(extractTweet)
        .filter((tweet) => tweet !== undefined && tweet.text.length !== 0);

      tweets.forEach((tweet) => {
        // We've already seen the tweet so we can skip
        // the review process, but still have to take
        // care of some things.
        if (seenTweets[tweet.id] !== undefined) {
          const seenTweet = seenTweets[tweet.id];

          // Update ref in case Twitter rerendered the tweet.
          seenTweet.ref = tweet.ref;

          // Make sure tweet stays removed even if Twitter rerendered it.
          if (seenTweet.removed) {
            removeTweet(seenTweet.id, seenTweet.topic);
          }
          return;
        }

        seenTweets[tweet.id] = tweet;
        tweetsToReview.push(tweet);
      });
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
}

async function reviewTweets() {
  const numberOfReviews = Math.ceil(
    tweetsToReview.length / MAX_TWEETS_PER_REVIEW
  );

  for (let i = 0; i < numberOfReviews; i++) {
    if (tweetsToReview.length < MIN_TWEETS_PER_REVIEW) {
      break;
    }

    const currentReview = tweetsToReview.splice(0, MAX_TWEETS_PER_REVIEW);

    try {
      const badTweets = await identifyBadTweets(currentReview);
      console.log("\n");
      console.log(
        `Checked ${
          currentReview.length
        } tweets at ${new Date().toLocaleString()}`
      );
      badTweets.forEach(({ id, topic }) => removeTweet(id, topic));
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }
}

async function identifyBadTweets(currentReview) {
  const requestPayload = {
    model: "gpt-3.5-turbo",
    messages: buildPrompt(currentReview),
    temperature: 0,
    max_tokens: 2000,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestPayload),
  });

  const data = await response.json();

  if (data.choices.length === 0) {
    return [];
  }

  return JSON.parse(data.choices[0].message.content);
}

function buildPrompt(currentReview) {
  return [
    {
      role: "user",
      content: `Review the JSON list of tweets below and identify the ones related to the topics below. Return a JSON array with objects containing keys "id" and "topic", where "id" is the id of the tweet and "topic" is the name of the topic it relates to. DON'T include only slightly related or unrelated tweets. If no tweets match, return an empty array.

Topics:
"""
${BAD_TOPICS.map((topic, i) => `${i + 1}. ${topic}`).join("\n")}
"""

Tweets to review:
"""
${JSON.stringify(
  currentReview.map((tweet) => {
    const { ref, topic, removed, ...rest } = tweet;
    return rest;
  })
)}
"""

Now return a JSON array. DON'T add any text before/after the JSON array. Something terrible will happen if you don't follow these precise instructions.`,
    },
  ];
}

function removeTweet(id, topic) {
  const tweet = seenTweets[id];

  if (tweet === undefined) {
    console.log(`Error: couldn't find bad tweet ${id}`);
    return;
  }

  // Check if this is the first time that we're removing it.
  // If yes, we'll log it and mark it as removed.
  if (!tweet.removed) {
    console.log("\n");
    console.log(`Removed tweet ${tweet.id}`);
    console.log(`Text: ${tweet.text}`);
    console.log(`Topic: ${topic}`);

    tweet.topic = topic;
    tweet.removed = true;
  }

  const tweetReplacement = createTweetReplacement();

  const parentNode = tweet.ref.parentNode;
  if (!parentNode) {
    console.log(`Error: couldn't find parent`);
    return;
  }

  parentNode.replaceChild(tweetReplacement, tweet.ref);
}

function createTweetReplacement() {
  const removedBanner = document.createElement("article");
  removedBanner.innerHTML = `
<div style="padding: 12px 16px; display: flex; flex-direction: column">
  <div
    style="
      padding: 12px 16px;
      background-color: rgb(247, 249, 249);
      border-radius: 16px;
      border: 1px solid rgb(239, 243, 244);
    "
  >
    <span
      style="
        font-size: 15px;
        font-family: TwitterChirp, -apple-system, 'system-ui', 'Segoe UI',
          Roboto, Helvetica, Arial, sans-serif;
        line-height: 20px;
        color: rgb(83, 100, 113);
      "
      >This tweet is about a topic you dislike.</span
    >
  </div>
</div>
  `;
  return removedBanner;
}

function extractTweet(elem) {
  const textElem = elem.querySelector("div[data-testid='tweetText']");

  if (!textElem) {
    return undefined;
  }

  const text = textElem.textContent;

  return {
    // Generate a unique id for each tweet ourselves because
    // Twitter's HTML doesn't have good IDs we can use.
    id: hashStringToId(text),
    text: formatTweetText(text),
    // Include a ref to the DOM element for easy manipulation.
    ref: elem,
    topic: undefined,
    removed: false,
  };
}

// Removes white space/truncates tweet text
function formatTweetText(text) {
  const formattedText = text.replace(/\n/g, " ").trim();
  const charLimit = 240;

  if (formattedText.length > charLimit) {
    return `${formattedText.slice(0, charLimit)}…`;
  }

  return formattedText;
}

// Generates a unique ID for a string
function hashStringToId(str) {
  let hash = 5381;
  let i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  return hash >>> 0;
}
