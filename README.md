# Batch Promises with Delay

This module is for batching promises that need delays between batches. It also allows users to retry promises that have failed. One situation this can be useful is when dealing with unreliable api calls that have rate limits.

## Installation

```sh
npm install --save batch-promises-with-delay
```

or

```sh
yarn add batch-promises-with-delay
```

## Simple Usage

```js
// simple-example.js

const batchPromisesWithDelay = require('batch-promises-with-delay')

const promises = [1,2,3,4,5,6,7,8,9,10].map((i) => {
  return {
    func: async (number, constant) => { console.log(number, constant) },
    args: [i, 'a'],
  }
})

const options {
  batchSize: 3,
  delayBetweenBatches: 1000, // in ms
}

batchPromisesWithDelay(promises, { options })
```

```sh
$ node simple-example.js

1 'a'
2 'a'
3 'a'
4 'a'
5 'a'
6 'a'
7 'a'
8 'a'
9 'a'
```
