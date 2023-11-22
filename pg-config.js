const pgClient = require('pg');

const client = new pgClient.Client({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    database: process.env.PG_DB,
    port: process.env.PG_PORT,
})

const connectPg = async () => {
    try {
        await client.connect();
        console.log('\n pg connected...');
    } catch (error) {
        console.error('\n pg connect error...', error);
    }
};

connectPg();

module.exports = client;