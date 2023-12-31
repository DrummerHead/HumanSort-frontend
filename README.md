# HumanSort-frontend

![HumanSort-frontend logo.png](./HumanSort-frontend-logo.png)

HumanSort is a single page web application that helps sorting an array of pictures according to human preference.

## Features

Compare mode where you insert an unranked image to the array of ranked images through choosing the image you prefer:

![HumanSort Compare mode](https://i.imgur.com/Gw7x47k.gif)

Gallery mode where you can see all the ranked images and re-order them in case you don't fully agree with past decisions:

![HumanSort Gallery mode](https://i.imgur.com/9ijwhRw.gif)

Three color schemes to choose from:

![HumanSort color schemes](https://i.imgur.com/wotx5FT.gif)

## Background

With algorithms such as [MergeSort](https://en.wikipedia.org/wiki/Merge_sort) and [QuickSort](https://en.wikipedia.org/wiki/Quicksort) the entities being sorted have an inherent nature that facilitates their sorting. If you are sorting an array of numbers, strings or dates, each entity can be compared with each other and a predicate of "is A bigger than B" can easily be answered.

The use case for HumanSort is entities for which there is no inherent nature that facilitates their sorting, and thus the answer for "is A bigger than B" has to be handled by an external judge, in this case human preference.

## Algorithm

To minimize amount of comparisons needed to obtain a sorted array, a strategy of binary insertion is used (similar to [binary search](https://en.wikipedia.org/wiki/Binary_search_algorithm)). We keep an always sorted list of items, and since it is always sorted if an unranked item is said to be better than an item in position 5 it can also be said that it is better than all ranked items lower than 5. With a binary strategy we're able to reduce the amount of comparisons needed to get a sorted array.

Consider two groups, an "Unranked" array of entities whose sort order is irrelevant and a "Ranked" array of entities sorted from best to worst; that is, an item of index 0 is the best item, an item of index 1 is second best, an item of index 2 is third best, and so forth.

```JavaScript
// First state, no ranking yet

const unranked = ['🍇', '🍋', '🍌', '🍍', '🍑', '🍒', '🍓'];
const ranked = [];
```

We select two entities at random and we present them to the human to be compared, obtaining our first comparison.

```JavaScript
// In the frontend: Which one do you like more, 🍍 or 🍓 ?
// Human selects 🍓

// New state:
const unranked = ['🍇', '🍋', '🍌', '🍑', '🍒'];
const ranked = ['🍓', '🍍'];
```

After we have a list of ranked items, we iteratively:

1. Select a random item from unranked list to be compared
2. Find the pivot point of the ranked list, the pivot point being the element in the middle defined by `<T>(array: T[]): number => Math.ceil(array.length / 2) - 1`
3. Compare random unranked with pivot point, it will either be better or worse and based on this answer a new subgroup from ranked is selected
4. A pivot point for this new subgroup is selected and a comparison is performed again, process repeated until the list is of only one item, in which case the new random item from unranked can be inserted in the ranked list since its position can be determined.
5. Newly ranked item no longer belongs to unranked list.

And we keep doing these steps for the remainder of unranked entities until they are all ranked.

```JavaScript
const unranked = ['🍇', '🍋', '🍌', '🍑', '🍒'];
const ranked = ['🍓', '🍍'];

// New random item from unranked is selected: '🍒'
// Pivot of ranked is '🍓'

// In the frontend: Which one do you like more, '🍒' or '🍓'?
// Human selects '🍒'
// There is no ranked subgroup, so we can insert '🍒'

// New state:
const unranked = ['🍇', '🍋', '🍌', '🍑'];
const ranked = ['🍒', '🍓', '🍍'];

// New random item from unranked is selected: '🍋',
// Pivot of ranked is '🍓'

// In the frontend: Which one do you like more, '🍋' or '🍓'?
// Human selects '🍓'
// New subgroup from ranked to compare is ['🍍']
// In the frontend: Which one do you like more, '🍋' or '🍍'?
// Human selects '🍍'
// There is no ranked subgroup, so we can insert '🍋'

// New state:
const unranked = ['🍇', '🍌', '🍑'];
const ranked = ['🍒', '🍓', '🍍', '🍋'];

// New random item from unranked is selected: '🍇',
// Pivot of ranked is '🍓'
// In the frontend: Which one do you like more, '🍇' or '🍓'?
// Human selects '🍓'
// New subgroup from ranked to compare is ['🍍', '🍋']
// Pivot of subgroup is '🍍'
// In the frontend: Which one do you like more, '🍇' or '🍍'?
// Human selects '🍇'
// There is no ranked subgroup, so we can insert '🍇'

// New state:
const unranked = ['🍌', '🍑'];
const ranked = ['🍒', '🍓', '🍇', '🍍', '🍋'];

// New random item from unranked is selected: '🍑',
// Pivot of ranked is '🍇'
// In the frontend: Which one do you like more, '🍑' or '🍇'?
// Human selects '🍇'
// New subgroup from ranked to compare is ['🍍', '🍋']
// Pivot of subgroup is '🍍'
// In the frontend: Which one do you like more, '🍑' or '🍍'?
// Human selects '🍑'
// There is no ranked subgroup, so we can insert '🍑'

// New state:
const unranked = ['🍌'];
const ranked = ['🍒', '🍓', '🍇', '🍑', '🍍', '🍋'];

// New random item from unranked is selected: '🍌',
// Pivot of ranked is '🍇'
// In the frontend: Which one do you like more, '🍌' or '🍇'?
// Human selects '🍌'
// New subgroup from ranked to compare is ['🍒', '🍓']
// Pivot of subgroup is '🍒'
// In the frontend: Which one do you like more, '🍌' or '🍒'?
// Human selects '🍒'
// New subgroup from ranked to compare is ['🍓']
// In the frontend: Which one do you like more, '🍌' or '🍓'?
// Human selects '🍌'
// There is no ranked subgroup, so we can insert '🍌'

// New state:
const unranked = [];
const ranked = ['🍒', '🍌', '🍓', '🍇', '🍑', '🍍', '🍋'];

// No unranked left, ranking finished!
```

## Technology

The fronted consists of:

- [React](https://github.com/facebook/react) for the UI
- [Create React App](https://github.com/facebook/create-react-app) to initialize project
- [axios](https://github.com/axios/axios) to talk with the backend API
- [react-hot-toast](https://github.com/timolins/react-hot-toast) for notifications
- [TypeScript](https://www.typescriptlang.org/)

## Installing both projects

It is assumed you have [node and npm installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

To have a fully functioning webapp, you'll need to install both the backend and frontend. Run this on your terminal to create a folder called `HumanSort`, install backend, populate with sample images and install frontend:

```
mkdir HumanSort
cd HumanSort/
git clone git@github.com:DrummerHead/HumanSort-backend.git
cd HumanSort-backend/
npm install
cp -r pics-sample pics
cd db/
node pollinate.js
cd ../../
git clone git@github.com:DrummerHead/HumanSort-frontend.git
cd HumanSort-frontend/
npm install
```

## Installing only the frontend

It is assumed you have [node and npm installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

Run this at project root:

```
npm install
```

And to run it:

```
npm run start
```

Which should run the server at [http://localhost:3000/](http://localhost:3000/)

## Running both projects

Open a terminal window at the root of `HumanSort-backend` and type:

```
npm run start
```

To run the backend server at [http://localhost:7777/](http://localhost:7777/)

Open anoter terminal window at the root of `HumanSort-frontend` and type:

```
npm run start
```

To run the frontend server at [http://localhost:3000/](http://localhost:3000/)

Interact with the application at [http://localhost:3000/](http://localhost:3000/)

## Companion repository

Find the code for the backend at [HumanSort-backend](https://github.com/DrummerHead/HumanSort-backend/)
