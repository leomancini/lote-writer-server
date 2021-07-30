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

// router.get('/deletePrompt', (request, response) => {
//     mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
//         if (error) {
//             response.send({ success: false, reason: 'error - see console' });
//             console.error(error);
//         } else {
//             const parsedUrl = url.parse(request.originalUrl);
//             const urlParams = querystring.parse(parsedUrl.query);

//             connection.db(databaseConfig.db).collection('prompts').deleteOne({
//                 "_id": new mongodb.ObjectID(urlParams.id)
//             }, function (error) {
//                 if (error) {
//                     response.send({ success: false, reason: 'error - see console' });
//                     console.error(error);
//                 } else {
//                     response.send({ success: true });
//                 }

//                 connection.close();
//             });
//         }
//     });
// });


// router.get('/createGame', (request, response) => {
//     mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
//         if (error) {
//             response.send({ success: false, reason: 'error - see console' });
//             console.error(error);
//         } else {
//             connection.db(databaseConfig.db).collection('prompts').find().toArray(function (error, results) {
//                 if (error) {
//                     response.send({ success: false, reason: 'error - see console' });
//                     console.error(error);
//                 } else {
//                     const resultsWithoutPII = results.map((prompt) => {
//                         return prompt.prompt
//                     });

//                     const numPromptsNeededToFillSheets = (gameConfig.numAnswerSheetsPerGame * gameConfig.numPromptsPerAnswerSheet);

//                     let promptsLibrary = resultsWithoutPII,
//                         prompts;

//                     if (promptsLibrary.length < numPromptsNeededToFillSheets) {
//                         prompts = new Array();

//                         numPromptsLibrariesNeededToFillSheets = numPromptsNeededToFillSheets / promptsLibrary.length;

//                         for (numPromptsLibrariesAdded = 0; numPromptsLibrariesAdded <= gameConfig.numAnswerSheetsPerGame; numPromptsLibrariesAdded++) {
//                             prompts = prompts.concat(shuffle(promptsLibrary));
//                         }
//                     } else {
//                         prompts = promptsLibrary;
//                     }

//                     let answerSheets = {};
//                     let answerSheetsSetIndex;

//                     for (answerSheetsSetIndex = 1; answerSheetsSetIndex <= gameConfig.numAnswerSheetsPerGame; answerSheetsSetIndex++) {
//                         let promptsListStart = (answerSheetsSetIndex - 1) * gameConfig.numPromptsPerAnswerSheet,
//                             promptsListEnd = promptsListStart + gameConfig.numPromptsPerAnswerSheet;

//                         let promptsForThisAnswerSheet = prompts.slice(promptsListStart, promptsListEnd);

//                         answerSheets[`sheet_${answerSheetsSetIndex}`] = {
//                             metadata: {
//                                 played: false
//                             },
//                             prompts: promptsForThisAnswerSheet
//                         };
//                     }

//                     const nanoid = customAlphabet('ABCDEFJHJKMNPQRSTUVWXYZ', 4);
//                     new_nano_id = nanoid();

//                     connection.db(databaseConfig.db).collection('games').insertOne({
//                         nano_id: new_nano_id,
//                         author_ip: request.connection.remoteAddress,
//                         date_created: Date.now(),
//                         answerSheets
//                     }, function (error, inserted) {
//                         if (error) {
//                             response.send({ success: false, reason: 'error - see console' });
//                             console.error(error);
//                         } else {
//                             response.send({
//                                 success: true,
//                                 created: {
//                                     nano_id: new_nano_id,
//                                     _id: inserted.insertedId,
//                                     numTotalAnswerSheets: gameConfig.numAnswerSheetsPerGame
//                                 }
//                             });
//                         }

//                         connection.close();
//                     });
//                 }
//             });
//         }
//     });
// });

// router.get('/deleteGame', (request, response) => {
//     mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
//         if (error) {
//             response.send({ success: false, reason: 'error - see console' });
//             console.error(error);
//         } else {
//             const parsedUrl = url.parse(request.originalUrl);
//             const urlParams = querystring.parse(parsedUrl.query);

//             connection.db(databaseConfig.db).collection('games').deleteOne({
//                 "_id": new mongodb.ObjectID(urlParams.id)
//             }, function (error) {
//                 if (error) {
//                     response.send({ success: false, reason: 'error - see console' });
//                     console.error(error);
//                 } else {
//                     response.send({ success: true });
//                 }

//                 connection.close();
//             });
//         }
//     });
// });

// router.get('/getAllGames', (request, response) => {
//     mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
//         if (error) {
//             response.send({ success: false, reason: 'error - see console' });
//             console.error(error);
//         } else {
//             connection.db(databaseConfig.db).collection('games').find().toArray(function (error, results) {
//                 if (error) {
//                     response.send({ success: false, reason: 'error - see console' });
//                     console.error(error);
//                 } else {
//                     results.sort(function (a, b) {
//                         return b.date_created - a.date_created;
//                     });

//                     const formattedResults = results.map((game) => {
//                         let playedAnswerSheets = [],
//                             unplayedAnswerSheets = [];

//                         for (const answerSheetIndex in game.answerSheets) {
//                             if (game.answerSheets[answerSheetIndex].metadata.played) {
//                                 playedAnswerSheets.push(answerSheetIndex);
//                             } else {
//                                 unplayedAnswerSheets.push(answerSheetIndex);
//                             }
//                         }

//                         let nextUnplayedAnswerSheetIndex = null;

//                         if (unplayedAnswerSheets.length > 0) {
//                             nextUnplayedAnswerSheetIndex = parseInt(unplayedAnswerSheets[0].replace('sheet_', ''))
//                         }

//                         return {
//                             _id: game._id,
//                             date_added: game.date_added,
//                             nano_id: game.nano_id,
//                             metadata: {
//                                 nextUnplayedAnswerSheetIndex,
//                                 numUnplayedAnswerSheets: unplayedAnswerSheets.length,
//                                 numPlayedAnswerSheets: playedAnswerSheets.length,
//                                 numTotalAnswerSheets: Object.keys(game.answerSheets).length
//                             }
//                         };
//                     })

//                     response.send({ success: true, games: formattedResults });
//                 }

//                 connection.close();
//             });
//         }
//     });
// });

// router.get('/getGameByNanoId', (request, response) => {
//     mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
//         if (error) {
//             response.send({ success: false, reason: 'error - see console' });
//             console.error(error);
//         } else {
//             const parsedUrl = url.parse(request.originalUrl);
//             const urlParams = querystring.parse(parsedUrl.query);

//             connection.db(databaseConfig.db).collection('games').findOne({
//                 "nano_id": urlParams.nano_id
//             }, function (error, result) {
//                 if (error) {
//                     response.send({ success: false, reason: 'error - see console' });
//                     console.error(error);
//                 } else if (result === null) {
//                     response.send({ success: false, reason: 'no results' });
//                 } else {
//                     response.send({ success: true, game: result });
//                 }

//                 connection.close();
//             });
//         }
//     });
// });

// router.get('/markAnswerSheetAsPlayed', (request, response) => {
//     mongo.connect(`${databaseConfig.url}/${databaseConfig.db}`, { useUnifiedTopology: true }, function (error, connection) {
//         if (error) {
//             response.send({ success: false, reason: 'error - see console' });
//             console.error(error);
//         } else {
//             const parsedUrl = url.parse(request.originalUrl);
//             const urlParams = querystring.parse(parsedUrl.query);

//             connection.db(databaseConfig.db).collection('games').updateOne(
//                 {
//                     "nano_id": urlParams.game_nano_id
//                 },
//                 {
//                     $set: {
//                         [`answerSheets.sheet_${urlParams.answer_sheet_index}.metadata.played`]: true
//                     }
//                 },
//                 function (error, result) {
//                     if (error) {
//                         response.send({ success: false, reason: 'error - see console' });
//                         console.error(error);
//                     } else {
//                         response.send({ success: true, modified: result.result.nModified });
//                     }

//                     connection.close();
//                 });
//         }
//     });
// });

module.exports = router;
