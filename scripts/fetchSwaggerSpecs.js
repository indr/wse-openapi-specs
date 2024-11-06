#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const args = process.argv.slice(2);
let outputDir = null;
let swaggerUrl = null;

// Parse arguments
args.forEach((arg, index) => {
    if (arg === '--output-dir' && args[index + 1]) {
        outputDir = args[index + 1];
    } else if (arg.endsWith('.json')) {
        swaggerUrl = arg;
    }
});

if (!outputDir || !swaggerUrl) {
    console.error('Usage: ./fetchSwaggerSpecs.js --output-dir <directory> <url_to_swagger.json>');
    process.exit(1);
}

// Helper function to fetch data from a URL
const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch data: ${res.statusCode}`));
                res.resume();
                return;
            }

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
};

const fetchAndSaveApiSpecs = async (swaggerData) => {
    const swaggerJson = JSON.parse(swaggerData);
    const { apis } = swaggerJson;

    if (!apis || !Array.isArray(apis)) {
        console.error('Invalid Swagger JSON format');
        process.exit(1);
    }

    // Ensure output directory exists
    fs.mkdirSync(outputDir, { recursive: true });

    // Save the full swagger.json in the output directory with formatting
    const swaggerPath = path.join(outputDir, 'swagger.json');
    fs.writeFileSync(swaggerPath, JSON.stringify(swaggerJson, null, 2) + '\n');
    console.log(`Saved full Swagger JSON to ${swaggerPath}`);

    // Loop through each API path and fetch its specification
    for (const api of apis) {
        try {
            const apiUrl = new URL(api.path, swaggerUrl).href;
            const apiData = await fetchData(apiUrl);
            const apiJson = JSON.parse(apiData);

            // Remove the basePath property if it exists
            delete apiJson.basePath;

            const formattedApiJson = JSON.stringify(apiJson, null, 2) + '\n'; // Format with 4 spaces and add newline

            const filename = `${api.path.replace(/^\//, '').replace(/\//g, '_').replace(/\{|\}/g, '')}.json`; // Clean filename
            const filePath = path.join(outputDir, filename);

            fs.writeFileSync(filePath, formattedApiJson);
            console.log(`Saved API spec for ${api.path} to ${filePath}`);
        } catch (err) {
            console.error(`Failed to fetch or save API spec for ${api.path}: ${err.message}`);
        }
    }
};

(async () => {
    try {
        const swaggerData = await fetchData(swaggerUrl);
        await fetchAndSaveApiSpecs(swaggerData);
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
})();
