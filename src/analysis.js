/**
 * [TODO] Step 0: Import the dependencies, fs and papaparse
 */

const fs = require('fs');
const papaparse = require('papaparse');

/**
 * [TODO] Step 1: Parse the Data
 *      Parse the data contained in a given file into a JavaScript objectusing the modules fs and papaparse.
 *      According to Kaggle, there should be 2514 reviews.
 * @param {string} filename - path to the csv file to be parsed
 * @returns {Object} - The parsed csv file of app reviews from papaparse.
 */
function parseData(filename) {
    const data = fs.readFileSync(filename, 'utf8');
    const result = papaparse.parse(data, { header: true });
    return result;
}

/**
 * [TODO] Step 2: Clean the Data
 *      Filter out every data record with null column values, ignore null gender values.
 *
 *      Merge all the user statistics, including user_id, user_age, user_country, and user_gender,
 *          into an object that holds them called "user", while removing the original properties.
 *
 *      Convert review_id, user_id, num_helpful_votes, and user_age to Integer
 *
 *      Convert rating to Float
 *
 *      Convert review_date to Date
 * @param {Object} csv - a parsed csv file of app reviews
 * @returns {Object} - a cleaned csv file with proper data types and removed null values
 */
function cleanData(csv) {
    for (const key in csv.data[0]) {
        if (key === 'user_gender') {
            continue;
        }
        csv.data = csv.data.filter(
            (entry) =>
                entry[key] !== null &&
                entry[key] !== '' &&
                entry[key] !== undefined,
        );
    }
    csv.data = csv.data.map(mergeUser);
    csv.data = csv.data.map(convertTypes);
    return csv.data;
}

function mergeUser(entry) {
    const new_entry = {
        ...entry,
        user: {
            user_id: parseInt(entry.user_id),
            user_age: parseInt(entry.user_age),
            user_country: entry.user_country,
            user_gender: entry.user_gender,
        },
    };
    delete new_entry.user_id;
    delete new_entry.user_age;
    delete new_entry.user_country;
    delete new_entry.user_gender;
    return new_entry;
}

function convertTypes(entry) {
    return {
        ...entry,
        num_helpful_votes: parseInt(entry.num_helpful_votes),
        rating: parseFloat(entry.rating),
        review_date: new Date(entry.review_date),
        review_id: parseInt(entry.review_id),
        verified_purchase: entry.verified_purchase === 'True',
    };
}

/**
 * [TODO] Step 3: Sentiment Analysis
 *      Write a function, labelSentiment, that takes in a rating as an argument
 *      and outputs 'positive' if rating is greater than 4, 'negative' is rating is below 2,
 *      and 'neutral' if it is between 2 and 4.
 * @param {Object} review - Review object
 * @param {number} review.rating - the numerical rating to evaluate
 * @returns {string} - 'positive' if rating is greater than 4, negative is rating is below 2,
 *                      and neutral if it is between 2 and 4.
 */
function labelSentiment({ rating }) {
    if (rating > 4) {
        return 'positive';
    }
    if (rating < 2) {
        return 'negative';
    }
    return 'neutral';
}

/**
 * [TODO] Step 3: Sentiment Analysis by App
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each app into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{app_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for an app
 */
function sentimentAnalysisApp(cleaned) {
    const sentiments = cleaned.map((entry) => ({
        ...entry,
        sentiment: labelSentiment({ rating: entry.rating }),
    }));

    const ans = {};
    sentiments.forEach((entry) => {
        if (!ans[entry.app_name]) {
            ans[entry.app_name] = {
                app_name: entry.app_name,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }
        ans[entry.app_name][entry.sentiment]++;
    });
    return Object.values(ans);
}

/**
 * [TODO] Step 3: Sentiment Analysis by Language
 *      Using the previous labelSentiment, label the sentiments of the cleaned data
 *      in a new property called "sentiment".
 *      Add objects containing the sentiments for each language into an array.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{lang_name: string, positive: number, neutral: number, negative: number}[]} - An array of objects, each summarizing sentiment counts for a language
 */
function sentimentAnalysisLang(cleaned) {
    const sentiments = cleaned.map((entry) => ({
        ...entry,
        sentiment: labelSentiment({ rating: entry.rating }),
    }));

    const ans = {};
    sentiments.forEach((entry) => {
        if (!ans[entry.review_language]) {
            ans[entry.review_language] = {
                lang_name: entry.review_language,
                positive: 0,
                neutral: 0,
                negative: 0,
            };
        }
        ans[entry.review_language][entry.sentiment]++;
    });
    return Object.values(ans);
}

/**
 * [TODO] Step 4: Statistical Analysis
 *      Answer the following questions:
 *
 *      What is the most reviewed app in this dataset, and how many reviews does it have?
 *
 *      For the most reviewed app, what is the most commonly used device?
 *
 *      For the most reviewed app, what the average star rating (out of 5.0)?
 *
 *      Add the answers to a returned object, with the format specified below.
 * @param {Object} cleaned - the cleaned csv data
 * @returns {{mostReviewedApp: string, mostReviews: number, mostUsedDevice: String, mostDevices: number, avgRating: float}} -
 *          the object containing the answers to the desired summary statistics, in this specific format.
 */
function summaryStatistics(cleaned) {
    const agg = {};
    cleaned.forEach((entry) => {
        if (!agg[entry.app_name]) {
            agg[entry.app_name] = {
                app_name: entry.app_name,
                num_reviews: 0,
                devices: {},
                total_rating: 0.0,
            };
        }
        agg[entry.app_name].num_reviews++;
        agg[entry.app_name].total_rating += entry.rating;
        if (!agg[entry.app_name].devices[entry.device_type]) {
            agg[entry.app_name].devices[entry.device_type] = 0;
        }
        agg[entry.app_name].devices[entry.device_type]++;
    });
    let most_reviewed_entry = null;
    let most_reviews = 0;
    for (const app_name in agg) {
        if (agg[app_name].num_reviews > most_reviews) {
            let most_devices = 0;
            let most_used_device = null;
            for (const device_type in agg[app_name].devices) {
                if (agg[app_name].devices[device_type] > most_devices) {
                    most_used_device = device_type;
                    most_devices = agg[app_name].devices[device_type];
                }
            }
            most_reviewed_entry = {
                mostReviewedApp: app_name,
                mostReviews: agg[app_name].num_reviews,
                mostUsedDevice: most_used_device,
                mostDevices: most_devices,
                avgRating:
                    agg[app_name].total_rating / agg[app_name].num_reviews,
            };
            most_reviews = agg[app_name].num_reviews;
        }
    }
    return most_reviewed_entry;
}

/**
 * Do NOT modify this section!
 */
module.exports = {
    parseData,
    cleanData,
    sentimentAnalysisApp,
    sentimentAnalysisLang,
    summaryStatistics,
    labelSentiment,
};
