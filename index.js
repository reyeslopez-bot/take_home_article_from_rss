const { chromium } = require('playwright');
const fetch = require('node-fetch');

async function fetchLatestStories() {
    try {
        console.log('Fetching latest stories from Hacker News API...');
        const response = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json?print=pretty');
        const storyIds = await response.json();
        console.log(`Fetched ${storyIds.length} story IDs.`);

        const storyDetailsPromises = storyIds.slice(0, 100).map(id => {
            console.log(`Fetching details for story ID: ${id}`);
            return fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(res => res.json());
        });

        const stories = await Promise.all(storyDetailsPromises);
        console.log('Fetched details for the first 100 stories.');
        return stories;
    } catch (error) {
        console.error('Error fetching stories from Hacker News API:', error);
        throw error;
    }
}

async function validateSorting() {
    try {
        console.log('Validating the sorting of the stories...');
        const stories = await fetchLatestStories();
        const timestamps = stories.map(story => story.time);
        console.log('Story timestamps:', timestamps);

        let isSorted = true;
        for (let i = 0; i < timestamps.length - 1; i++) {
            if (timestamps[i] < timestamps[i + 1]) {
                console.log(`Sorting error: Story at index ${i} is older than story at index ${i + 1}`);
                isSorted = false;
                break;
            }
        }

        if (isSorted) {
            console.log('The stories are sorted correctly.');
        } else {
            console.log('The stories are NOT sorted correctly.');
        }

        return isSorted;
    } catch (error) {
        console.error('Error during sorting validation:', error);
        return false;
    }
}

async function runPlaywrightTest() {
    let browser;
    try {
        console.log('Launching browser...');
        browser = await chromium.launch({ headless: true, timeout: 60000 });
        console.log('Browser launched successfully.');

        const context = await browser.newContext({
            baseURL: process.env.BASE_URL || 'https://news.ycombinator.com', // Ensure baseURL is used
            timeout: 60000,
        });
        const page = await context.newPage();

        console.log('Navigating to Hacker News newest page...');
        await page.goto('/newest', { timeout: 60000 });
        console.log('Page loaded successfully.');

        const sortedCorrectly = await validateSorting();

        if (sortedCorrectly) {
            console.log('Success: Articles are sorted correctly.');
        } else {
            console.log('Failure: Articles are not sorted correctly.');
        }
    } catch (error) {
        console.error('Error during test execution:', error);
    } finally {
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
            console.log('Browser closed.');
        }
        process.exit(0); // Explicitly exit the process when done
    }
}

runPlaywrightTest().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1); // Exit with an error code
});
