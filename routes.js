const express = require('express');
const router = express.Router();
const url = require('url');
const fs = require('fs');
const querystring = require('querystring');

const shuffle = require('shuffle-array');

const mongodb = require('mongodb');
const mongo = mongodb.MongoClient;

const databaseConfig = {
    url: 'mongodb://localhost:27017',
    db: 'lote-writer'
}

router.get('/getAllPages', (request, response) => {
    mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
        if (error) {
            response.send({ success: false, reason: 'error - see console' });
            console.error(error);
        } else {
            connection.db(databaseConfig.db).collection('pages').find().toArray(function (error, results) {
                if (error) {
                    response.send({ success: false, reason: 'error - see console' });
                    console.error(error);
                } else {
                    response.send(results);
                }

                connection.close();
            });
        }
    });
});

router.post('/addPage', (request, response) => {
    mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
        if (error) {
            response.send({ success: false, reason: 'error - see console' });
            console.error(error);
        } else {
            connection.db(databaseConfig.db).collection('pages').insertOne({
                author_ip: request.connection.remoteAddress,
                date_added: Date.now(),
                data: request.body.data
            }, function (error, inserted) {
                if (error) {
                    response.send({ success: false, reason: 'error - see console' });
                    console.error(error);
                } else {
                    response.send({ success: true, id: inserted.insertedId });
                }

                connection.close();
            });
        }
    });
});

router.post('/updatePage', (request, response) => {
    mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
        if (error) {
            response.send({ success: false, reason: 'error - see console' });
            console.error(error);
        } else {
            const parsedUrl = url.parse(request.originalUrl);
            const urlParams = querystring.parse(parsedUrl.query);

            connection.db(databaseConfig.db).collection('pages').updateOne(
                {
                    "_id": new mongodb.ObjectID(request.body.id)
                },
                {
                    $set: {
                        data: request.body.data
                    }
                },
                function (error, result) {
                    if (error) {
                        response.send({ success: false, reason: 'error - see console' });
                        console.error(error);
                    } else {
                        response.send({ success: true, modified: result.result.nModified });
                    }

                    connection.close();
                });
        }
    });
});

router.get('/getPage', (request, response) => {
    mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
        if (error) {
            response.send({ success: false, reason: 'error - see console' });
            console.error(error);
        } else {
            const parsedUrl = url.parse(request.originalUrl);
            const urlParams = querystring.parse(parsedUrl.query);

            connection.db(databaseConfig.db).collection('pages').findOne(
                {
                    "_id": new mongodb.ObjectID(urlParams.id)
                },
                function (error, result) {
                if (error) {
                    response.send({ success: false, reason: 'error - see console' });
                    console.error(error);
                } else if (result === null) {
                    response.send({ success: false, reason: 'no results' });
                } else {
                    response.send({ success: true, page: result });
                }

                connection.close();
            });
        }
    });
});

router.post('/translate', (request, response) => {
    const {Translate} = require('@google-cloud/translate').v2;
    const translate = new Translate();

    async function translateText(params) {
        let { text, target } = params;
        let translation = await translate.translate(text, target);
        
        if (translation && translation[1].data.translations) {
            response.send({
                success: true,
                data: translation[1].data.translations
            });
        } else {
            response.send({
                success: false
            });
        }
    }

    if (request.body.data && request.body.data.text) {
        translateText({
            text: request.body.data.text,
            target: 'en'
        });
    } else {
        response.send({
            success: false,
            reason: 'error - no text specified'
        });
    }
});

module.exports = router;
