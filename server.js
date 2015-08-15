var express = require('express'),
    app = express(),
    http = require('http'),
    compression = require('compression'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    https = require('https'),
    port = process.env.PORT || 9000;

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

app.use(allowCrossDomain);
app.use(compression());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/api/payload', function (req, res) {
    res.set('Content-Type', 'application/json');
    res.end(fs.readFileSync('payload.json'));
});

app.get('/api/delete', function (req, res) {
    fs.writeFileSync('registrations.json','[]');
    res.set('Content-Type', 'application/json');
    res.end(fs.readFileSync('registrations.json'));
});

app.get('/api/get', function (req, res) {
    res.set('Content-Type', 'application/json');
    res.end(fs.readFileSync('registrations.json'));
});

app.post('/api/register', function (req, res) {
    if (typeof req.body.id === 'string') {
        var pos = req.body.id.lastIndexOf("/") + 1;
        var id = req.body.id.substring(pos);
        var ids = JSON.parse(fs.readFileSync('registrations.json'));
        if (id && (ids.indexOf(id) === -1)) {
            ids.push(id);
            fs.writeFileSync('registrations.json', JSON.stringify(ids));
        }
    }
    res.set('Content-Type', 'application/json');
    res.end("true");
});


var config = {
    host: 'android.googleapis.com',
    path: '/gcm/send',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=AIzaSyC_UFHyubC0_46XjprGSZLHn1a07niuJyI'
    }
};

app.post('/api/send', function (req, res) {

    var payload = {};
    payload.title = req.body.title || '';
    payload.body = req.body.body || '';
    payload.icon = req.body.icon || '';
    payload.data = {
        url: req.body.url || ''
    };

    fs.writeFileSync('payload.json', JSON.stringify(payload));

    var postData = JSON.stringify({
        "registration_ids": JSON.parse(fs.readFileSync('registrations.json'))
    });
    
    var body = '';
    var api = https.request(config, function (response) {
        response.on('data', function (d) {
             body += d;
        });
        response.on('end', function() {
            res.end(body);
        });
    });
    api.write(postData);
    api.end();
    api.on('error', function (e) {
        res.end(e);
    });

});
app.get('/*', function (req, res) {
    res.end(fs.readFileSync('index.html'));
});

http.createServer(app).listen(port, function (err) {
    console.log('Express server running on port', port);
});