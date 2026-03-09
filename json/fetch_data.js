require('dotenv').config();
const fs = require('fs');
const path = require('path');
const contentful = require('contentful');

const client = contentful.createClient({
    space: process.env.CONTENTFUL_SPACE_ID,
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN,
});

// Upewnij się, że folder 'json' istnieje przed zapisem
const jsonDir = path.join(__dirname, 'json');
if (!fs.existsSync(jsonDir)){
    fs.mkdirSync(jsonDir);
}

async function fetchData() {
    try {
        console.log('Fetching data from Contentful...');

        // 1. Fetch Blog Posts
        const blogResponse = await client.getEntries({
            content_type: 'blog',
            order: '-sys.createdAt',
            limit: 100,
        });
        fs.writeFileSync('./json/blog-data.json', JSON.stringify(blogResponse.items));
        console.log('✅ Blog data saved!');

        // 2. Fetch Services (Usługi)
        const uslugiResponse = await client.getEntries({
            content_type: 'service',
            order: 'sys.createdAt',
            limit: 100,
        });
        fs.writeFileSync('./json/uslugi-data.json', JSON.stringify(uslugiResponse.items));
        console.log('✅ Services data saved!');

        // 3. Fetch Main Photo (for script.js)
        const photoResponse = await client.getAssets({
            'fields.title': 'mainPhoto',
            limit: 1,
        });
        fs.writeFileSync('./json/photo-data.json', JSON.stringify(photoResponse.items));
        console.log('✅ Main photo data saved!');

    } catch (error) {
        console.error('❌ Error fetching data:', error);
        process.exit(1);
    }
}

fetchData();