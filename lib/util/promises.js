/**
 * @param {number} limit - maximum number of concurrent promises
 * @param {Function[]} tasks - array of functions that return promises
 * @returns {Promise<*>}
 */
export const limitedPromiseAll = async (limit, tasks) => {
  const results = [];
  const runningPromises = new Set();
  let currentIndex = 0;

  return new Promise((resolve, reject) => {
    const runNext = async () => {
      // Check if all tasks have been started and processed
      if (currentIndex >= tasks.length && runningPromises.size === 0) {
        resolve(results);
        return;
      }

      // Add new tasks to the pool until the limit is reached
      while (currentIndex < tasks.length && runningPromises.size < limit) {
        const taskIndex = currentIndex;
        const promise = tasks[taskIndex]();

        currentIndex += 1;

        runningPromises.add(promise);

        promise
          .then((result) => {
            results[taskIndex] = result;
          })
          .catch((error) => {
            // Immediately reject the main promise on the first error
            reject(error);
          })
          .finally(() => {
            runningPromises.delete(promise);
            // Recursively call to run the next task
            runNext();
          });
      }
    };

    // Start the process
    runNext();
  });
};
