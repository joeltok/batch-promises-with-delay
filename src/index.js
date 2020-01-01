async function sleep(milliseconds) {
  await new Promise((resolve, reject) => {
    setInterval(() => {
      resolve()
    }, milliseconds)
  })
}

function initProgressTracker(upperBound) {
  return {
    success: 0,
    failure: 0,
    upperBound: upperBound,
    incrementSuccess: function () {
      this.success++;
    },
    incrementFailure: function() {
      this.failure++;
    },
    summarize: function() {
      console.log(`success: ${this.success}`)
      console.log(`failure: ${this.failure}`)
      console.log(`progress: ${this.success+this.failure} / ${this.upperBound}`)
    },
  }
}

// callbacks:
// onSuccess
// onFailure
// onRetry
// onBatchStart
// onBatchEnd

async function executeSingleItem(callback, retryFilters, progressTracker, { func, id }) {
  try {
    const result = await func()
    await callback(result)
    progressTracker.incrementSuccess()
    return {
      shouldRetry: false,
      value: result,
    }
  } catch (err) {
    var shouldRetry = false;
    for (i = 0; i < retryFilters.length; i++) {

      console.log('lll')
      console.log(func)
      console.log(err)

      if (retryFilters[i](err)) {
        shouldRetry = true;
        break;
      }
    }
    if (shouldRetry) {
      console.log(`retrying one item...`)
      return {
        shouldRetry: true,
        value: { func, id },
      }
    } else {
      progressTracker.incrementFailure()
      console.error('Failure detected.')
      console.error(`message: ${err.message}`)
      console.error(`id: ${id}`)
      console.error(`Not retrying.`)
      return {
        shouldRetry: false,
        value: null,
      }
    }
  }
}

module.exports = async (queuedPromises, callback, options) => {
  // put all promises into a queue,
  // execute N number at a time, every S seconds,
  // put failed ones into the back of the queue
  const {
    batchSize = 1,
    delayBetweenBatches = 1,
    retryFilters = [],
    // strategy = 'naive', // naive / indexed
  } = options || {};
  const progressTracker = initProgressTracker(queuedPromises.length)

  while (queuedPromises.length) {
    const currBatch = queuedPromises.splice(0, batchSize);
    const results = await Promise.all(
      currBatch.map(
        executeSingleItem.bind(null, callback, retryFilters, progressTracker)
      )
    )
    results.forEach(result => {
      if (result['shouldRetry'] == true) {
        queuedPromises.push(result['value'])
      }
    })
    if (queuedPromises.length <= 0) {
      break;
    }

    console.log(`Batch summary`)
    progressTracker.summarize()
    await sleep(delayBetweenBatches)
  }
  return true
}
