import express from "express";
import { MongoClient } from 'mongodb';
import path from 'path';

// import bodyParser from "body-parser";

const app = express();
app.use(express.static(path.join(__dirname, '/build')));
// app.use(bodyParser.json());   <---- this seems old style.. as now from express 4.x this middleware is inbuilt
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const withDB = async (operation, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db('my-blog');
        await operation(db);
        client.close();
    }
    catch (err) {
        res.status(500).json({ message: 'Error connecting to DB', err });
    }
};

app.get('/api/articles/:name', async (req, res) => {
    await withDB(async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articlesInfo);
    }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
    await withDB(async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            }
        });

        const updatedArticlesInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(updatedArticlesInfo);
    }, res);
});

app.post('/api/articles/:name/add-comment', async (req, res) => {
    await withDB(async (db) => {
        const articleName = req.params.name;
        const { username, text } = req.body;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        // articlesInfo.comments.push(username, text),

        await db.collection('articles').updateOne({name:articleName},{
            '$set': {
                comments: articlesInfo.comments.concat({username, text}),
            }
        });

        const updatedArticlesInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).send(updatedArticlesInfo);
    }, res);
});

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});
app.listen(8000, () => console.log('Listening on port 8000'));