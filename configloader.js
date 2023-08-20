/*
options {
    securityKey: String,
    store: String
}
*/

function ConfigLoader(options) {
    const endpoint = "https://aidanjacobson.duckdns.org:42069";
    const storageEndpoint = endpoint + "/store/" + options.store;
    var validateEndpoint = endpoint + "/validate/" + options.securityKey;
    var _this = this;
    _this.config = {};
    _this.validate = async function() {
        validateEndpoint = endpoint + "/validate/" + options.securityKey;
        var response = await xhrGet(validateEndpoint);
        return response.valid;
    }
    var xhrGet = function(url) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.crossorigin = "";
            xhr.open("GET", url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Security-key", options.securityKey);
            xhr.send();
            xhr.onload = function() {
                resolve(JSON.parse(xhr.responseText));
            }
        });
    }
    var xhrPost = function(url, data) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.crossorigin = "";
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("Security-key", options.securityKey);
            xhr.send(JSON.stringify(data));
            xhr.onload = function() {
                resolve(JSON.parse(xhr.responseText));
            }
        });
    }
    _this.downloadConfig = async function() {
        _this.config = await xhrGet(storageEndpoint);
        return _this.config;
    }
    _this.uploadConfig = async function() {
        await xhrPost(storageEndpoint, _this.config);
    }
}