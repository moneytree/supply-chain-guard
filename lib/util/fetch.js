const isRetryableHttpError = (status) => {
  return status === 429 || (status >= 500 && status <= 599);
};

/**
 * Fetch with retries for retryable HTTP errors (429, 5xx)
 *
 * @param {string} url                          URL to fetch
 * @param {object|null|undefined} fetchOptions  Options to pass to fetch (headers, etc.)
 * @returns {Promise<Response>}                 The fetch(...) response object
 */
export const fetchWithRetry = async (url, fetchOptions = undefined) => {
  const maxRetries = 5;
  let attempt = 0;

  for (;;) {
    const response = await fetch(url, fetchOptions);
    if (response.ok) {
      return response;
    }

    if (!isRetryableHttpError(response.status)) {
      throw new Error(`HTTP error! ${url} status: ${response.status}`);
    }

    attempt += 1;

    if (attempt >= maxRetries) {
      throw new Error(`HTTP error! ${url} status: ${response.status} (${maxRetries} retries exhausted)`);
    }

    // wait 1 second more each time
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  }
};

/**
 * Fetches data from the GitHub API.
 * Information about rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
 * tl;dr: Unauthenticated requests get 60 requests per hour. Authenticated requests get 5000 requests per hour.
 *
 * @param {string} url - The GitHub API URL
 * @param {object} [options] - Additional options
 * @param {object} [options.fetchOptions] - Options to pass to fetch (headers, etc.)
 * @param {boolean|null} [options.tokenRequiredHint=null] - If not null, whether GITHUB_TOKEN is required
 * @returns {Promise<object>} - Object with the response object, and parsed JSON data
 */
export const fetchGitHubAPI = async (url, options = {}) => {
  const { fetchOptions = {}, tokenRequiredHint = null } = options;

  const defaultHeaders = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Add GitHub token if available, for increased rate limits
  if (process.env.GITHUB_TOKEN) {
    defaultHeaders['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  } else if (tokenRequiredHint === true) {
    throw new Error(`GITHUB_TOKEN environment variable is required to access ${url}`);
  }

  const mergedFetchOptions = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
  };

  const response = await fetchWithRetry(url, mergedFetchOptions);
  const data = await response.json();
  return { response, data };
};

/**
 * Fetches all pages from a GitHub API endpoint that supports pagination
 * @param {string} url - The GitHub API URL
 * @param {object} [options] - Additional options
 * @param {object} [options.fetchOptions] - Options to pass to fetch (headers, etc.)
 * @param {boolean|null} [options.tokenRequiredHint=null] - If not null, whether GITHUB_TOKEN is required
 * @param {number} [options.perPage=100] - Number of items per page (max 100 for GitHub API)
 * @returns {Promise<object>} - Object with all response objects, and "data" array containing all items from all pages
 */
export const fetchGitHubAPIPaginated = async (url, options = {}) => {
  const { fetchOptions = {}, tokenRequiredHint = null, perPage = 100 } = options;

  const allResponses = [];
  let allResults = [];
  let currentUrl = `${url}${url.includes('?') ? '&' : '?'}per_page=${perPage}`;

  while (currentUrl) {
    const { response, data } = await fetchGitHubAPI(currentUrl, { tokenRequiredHint, fetchOptions });
    allResponses.push(response);

    // Handle the case where the response is not an array
    if (!Array.isArray(data)) {
      if (data && typeof data === 'object') {
        // Some endpoints return objects with arrays inside
        // Try to find the array property (common patterns)
        const arrayKeys = Object.keys(data).filter((key) => Array.isArray(data[key]));
        if (arrayKeys.length === 1) {
          allResults = allResults.concat(data[arrayKeys[0]]);
        } else {
          throw new Error(
            `Unexpected response format from ${currentUrl}: expected array or object with single array property`,
          );
        }
      } else {
        throw new Error(`Unexpected response format from ${currentUrl}: expected array or object`);
      }
    } else {
      allResults = allResults.concat(data);
    }

    // Parse the Link header to find the next page
    const linkHeader = response.headers.get('link');
    currentUrl = null;

    if (linkHeader) {
      // Parse Link header: <url>; rel="next", <url>; rel="last"
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (nextMatch) {
        currentUrl = nextMatch[1];
      }
    }
  }

  return { responses: allResponses, data: allResults };
};
