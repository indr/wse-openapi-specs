#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
    console.error('Please provide a directory path as an argument.');
    process.exit(1);
}

const dirPath = process.argv[2];

if (!fs.existsSync(dirPath) || !fs.lstatSync(dirPath).isDirectory()) {
    console.error('The provided path is not a valid directory.');
    process.exit(1);
}

function addTagsToPaths(openApiSpec) {
    const allTags = new Set(); // To collect unique tags

    for (const route in openApiSpec.paths) {
        if (openApiSpec.paths.hasOwnProperty(route)) {
            const pathSegments = route.split('/').filter(Boolean);
            const tags = pathSegments
                // .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1));

            // Add to each path operation
            for (const method in openApiSpec.paths[route]) {
                if (openApiSpec.paths[route].hasOwnProperty(method)) {
                    if (!openApiSpec.paths[route][method].tags) {
                        openApiSpec.paths[route][method].tags = tags;
                    }
                }
            }

            // Add tags to the global set for the top-level tags
            tags.forEach(tag => allTags.add(tag));
        }
    }

    // Add unique tags to the top-level tags array
    openApiSpec.tags = Array.from(allTags).map(tag => ({
        name: tag
    }));
}

fs.readdirSync(dirPath).forEach(file => {
    if (file.endsWith('.json')) {
        const filePath = path.join(dirPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const openApiSpec = JSON.parse(content);

        if (openApiSpec.openapi && openApiSpec.openapi.startsWith('3.')) {
            addTagsToPaths(openApiSpec);

            fs.writeFileSync(filePath, JSON.stringify(openApiSpec, null, 2));
            console.log(`Updated tags in ${file}`);
        }
    }
});
