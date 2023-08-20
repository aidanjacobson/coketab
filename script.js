/*
    config: {
        people: [
            {
                name: String
                value: Number
                favorite: Boolean
            }
        ]
    }
*/

function setCokesTotal(total) {
    cokesTotal.innerHTML = `${total} coke${total==1?"":"s"}`;
}

var loaded = true;

var config = {
    people: []
}
var configLoader;
const storageBin = "coketab";

window.onload = async function() {
    await doSecurityCheck();
    await downloadConfig();
    loaded = true;
    displayCokes();
}

var encrypted_access_token = "U2FsdGVkX1+5CuiCHyT68LcxNHlzAeAwaRCYQTK2eeI=";

async function doSecurityCheck() {
    if (!localStorage.coke_dkey || localStorage.coke_dkey == "") {
        localStorage.coke_dkey = await promptForPassword("Enter decryption key:");
    }
    var decrypted = CryptoJS.AES.decrypt(encrypted_access_token, localStorage.coke_dkey).toString(CryptoJS.enc.Utf8);
    if (decrypted == "") decrypted = "aaa";
    configLoader = new ConfigLoader({
        store: storageBin,
        securityKey: decrypted
    });
    var configValid = await configLoader.validate();
    if (!configValid) {
        localStorage.coke_dkey = await promptForPassword("Incorrect decryption key. Try again.");
        await doSecurityCheck();
    }
}

function promptForPassword(question, value="") {
    return prompt(question, value);
}

async function uploadConfig() {
    configLoader.config = config;
    await configLoader.uploadConfig();
}

async function downloadConfig() {
    config = await configLoader.downloadConfig();
    return config;
}

var adDisplayed = false;
function displayCokes() {
    people.innerHTML = "";
    for (var i = 0; i < config.people.length; i++) {
        var cokeElement = buildCokeOutput(config.people[i]);
        people.append(cokeElement);
        if (i % 3 == 2) {
            people.append(buildAdvertisementElement());
            adDisplayed = true;
        }
    }
    if (!adDisplayed) people.append(buildAdvertisementElement());
}

function buildCokeOutput(person) {
    var personElement = document.createElement("div");
    personElement.classList.add("person");

    var pWrap = document.createElement("div");
    pWrap.classList.add("pWrap");
    personElement.append(pWrap);

    var pName = document.createElement("span");
    pName.classList.add("pName");
    pName.innerText = person.name;
    pWrap.append(pName);
    pName.onclick = doPersonNameClick;

    var id = "person_" + config.people.indexOf(person);
    var cb = document.createElement("input");
    cb.id = id;
    cb.type = "checkbox";
    cb.checked = person.favorite;
    pWrap.append(cb);

    cb.classList.add("fav");
    var cbLabel = document.createElement("label");
    cbLabel.setAttribute("for", id);
    cbLabel.onclick = doCheckboxClick;
    pWrap.append(cbLabel);
    pWrap.append(document.createElement("br"));

    var minusBtn = document.createElement("span");
    minusBtn.classList.add("actionBtn", "left");
    minusBtn.innerText = "-";
    minusBtn.onclick = doMinusClick;
    pWrap.append(minusBtn);

    var pAmt = document.createElement("span");
    pAmt.classList.add("pAmt");
    pAmt.innerText = person.value;
    pWrap.append(pAmt);

    var plusBtn = document.createElement("span");
    plusBtn.classList.add("actionBtn", "right");
    plusBtn.innerText = "+";
    plusBtn.onclick = doPlusClick;
    pWrap.append(plusBtn);

    var deleteBtn = document.createElement("span");
    deleteBtn.classList.add("deleteBtn");
    deleteBtn.innerText = "x";
    deleteBtn.onclick = doDeleteClick;
    pWrap.append(deleteBtn);

    personElement.setAttribute("x-person", person.name);

    return personElement;
}

function buildAdvertisementElement() {
    var div = document.createElement("div");
    var img = document.createElement("img");
    img.src = "https://aidanjacobson.duckdns.org:7777/advertisement/random";
    div.append(img);
    div.classList.add("advert");

    return div;
}

function getPersonElementFromElement(element) {
    return element.parentElement.parentElement;
}

function getPersonFromPersonElement(personElement) {
    if (personElement.getAttribute("x-person") == "null") return config.people.filter(person=>person.name==null)[0];
    return config.people.filter(person=>person.name==personElement.getAttribute("x-person"))[0];
}

function getPersonFromEvent(e) {
    return getPersonFromPersonElement(getPersonElementFromElement(e.target));
}

async function doPersonNameClick(e) {
    var person = getPersonFromEvent(e);
    console.log(person);
    var newName = prompt(`Enter a new name for ${person.name}`, person.name);
    if (newName == null) return;
    person.name = newName;
    var personElement = getPersonElementFromElement(e.target);
    personElement.setAttribute("x-person", person.name);
    personElement.children[0].children[0].innerText = person.name;
    await uploadConfig();
}

async function doPlusClick(e) {
    var person = getPersonFromEvent(e);
    person.value ++;
    e.target.parentElement.children[5].innerText = person.value;
    calculateTotalCokes();
    await uploadConfig();
}

async function doMinusClick(e) {
    var person = getPersonFromEvent(e);
    person.value --;
    e.target.parentElement.children[5].innerText = person.value;
    calculateTotalCokes();
    await uploadConfig();
}

async function doCheckboxClick(e) {
    await millis(1);
    var person = getPersonFromEvent(e);
    person.favorite = e.target.parentElement.children[1].checked;
    reorderConfig();
    await uploadConfig();
    displayCokes();
}

async function doDeleteClick(e) {
    var person = getPersonFromEvent(e);
    if (!confirm(`Are you sure you want to delete ${person.name}?`)) return;
    var index = getPersonIndex(person.name);
    console.log(index);
    config.people.splice(index, 1);
    calculateTotalCokes();
    await uploadConfig();
    displayCokes();
}

function getPersonIndex(name) {
    for (var i = 0; i < config.people.length; i++) {
        if (config.people[i].name == name) return i;
    }
    return -1;
}

async function addNewPerson() {
    var name = prompt("Enter new name:");
    if (name == null) return;
    var person = {
        name: name,
        value: 0,
        favorite: false
    }
    config.people.unshift(person);
    reorderConfig();
    await uploadConfig();
    displayCokes();
}

function reorderConfig() {
    var nonFaves = [];
    var faves = [];
    for (var i = 0; i < config.people.length; i++) {
        if (config.people[i].name == null) config.people[i].name = "";
        if (config.people[i].favorite) {
            faves.push(config.people[i]);
        } else {
            nonFaves.push(config.people[i]);
        }
    }

    nonFaves.sort(function(a, b) {
        return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0;
    });

    config.people = faves.concat(nonFaves);
}

async function millis(m) {
    return new Promise(function(res) {
        setTimeout(()=>res(), m);
    })
}

function calculateTotalCokes() {
    var total = 0;
    for (var i = 0; i < config.people.length; i++) {
        total += config.people[i].value;
    }
    setCokesTotal(total);
}