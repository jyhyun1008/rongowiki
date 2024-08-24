const SECRET2 = 'seVSyqUo2sYFd'

function getQueryStringObject() {
    var a = window.location.search.substr(1).split('&');
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=', 2);
        if (p.length == 1)
            b[p[0]] = "";
        else
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}

let beforeUnloadAlert = true;

var qs = getQueryStringObject()
var docs = qs.d
var page = qs.p
var edit = qs.e
var version = qs.v
var title = ''

if (!docs && !edit) {
    title = '대문'
} else if (docs != undefined) {
    title = docs
} else if (edit != '') {
    title = edit
}
document.querySelector('#logo').innerHTML = WIKI_TITLE
const SECRET3 = 'mvAVMIfmNVI'

document.querySelector('#search-button').href = './'
document.querySelector('#search-input').addEventListener("input", (e) => {
    document.querySelector('#search-button').href= "./?d="+document.querySelector('#search-input').value
})

document.querySelector('#search-input').addEventListener("keyup", (e) => {
    if (e.keyCode == 13) {
        location.href= "./?d="+document.querySelector('#search-input').value
    }
})

async function wikiParse(text) {
    if (!text) {
        return ''
    } else {
        text = text.replace(/\\n\\n/gm, '\n\n')
        text = text.replace(/\\n/gm, '\n')
        var markdown = marked.parse(text)
        markdown = markdown.replace(/href\=\"([^\"\:]+)\"\>([^\<]+)\</gm, 'href="./?d=$1">$2<')
        markdown = markdown.replace(/href\=\"\"\>([^\<]+)\</gm, 'href="./?d=$1">$1<')
        if (markdown.includes('<img src="" alt="')) {
            let includeArray = markdown.split('<img src="" alt="').slice(1)
            // let responseArray;
            for await (including of includeArray) {
                including = including.split('">')[0]
                try {
                    response = await gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: SPREADSHEET_ID,
                    range: including+'!A2:C',
                    });
                    var content = response.result.values[response.result.values.length-1][2]
                    content = content.replace(/\\n\\n/gm, '\n\n')
                    content = content.replace(/\\n/gm, '\n')
                    content = marked.parse(content)
                    content = content.replace(/href\=\"([^\"\:]+)\"\>([^\<]+)\</gm, 'href="./?d=$1">$2<')
                    content = content.replace(/href\=\"\"\>([^\<]+)\</gm, 'href="./?d=$1">$1<')
                    // responseArray.push(content)
                    markdown = markdown.replace('<img src="" alt="'+including+'">', content)
                } catch (err) {
                    console.log(err)
                }
            }
            return markdown
        } else {
            return markdown
        }
    }
}

function simpleParse(text) {
    text = text.replace(/\\n\\n/gm, '\n\n')
    text = text.replace(/\\n/gm, '\n')
    var markdown = marked.parse(text)
    markdown = markdown.replace(/href\=\"([^\"\:]+)\"\>([^\<]+)\</gm, 'href="./?d=$1">$2<')
    markdown = markdown.replace(/href\=\"\"\>([^\<]+)\</gm, 'href="./?d=$1">$1<')
    return markdown
}

function changePostDisabled(e) {
    document.querySelector('#wordcount').innerText = e.value.length
    document.querySelector('#post-preview').innerHTML = simpleParse(e.value)
    if (e.value != '' ) {
        document.querySelector('#post-button').disabled = false
    } else {
        document.querySelector('#post-button').disabled = true
    }
}

    // Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

    // Authorization scopes required by the API; multiple scopes can be
    // included, separated by spaces.
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

    let tokenClient;
    let gapiInited = false;
    let gisInited = false;


function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    // TODO(developer): Set to client ID and API key from the Developer Console
    const API_KEY = SECRET1 + SECRET2 + SECRET3;

    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });

    gapiInited = true;

    //maybeEnableButtons();
    renderContent(title)
}

    /**
     * Callback after Google Identity Services are loaded.
     */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        redirect_uri: 'https://wiki.rongo.moe/',
        scope: SCOPES,
        callback: 'https://wiki.rongo.moe/', // defined later
    });
    
    gisInited = true;
    //maybeEnableButtons();

}

function handleEditClick() {
    location.href="./?e="+title
}

function handleHistoryClick() {
    location.href="./?d="+title+"&v=list"
}
    /**
     * Enables user interaction after all libraries are loaded.
     */
// function maybeEnableButtons() {

//     if (gapiInited && gisInited) {
//         document.getElementById('authorize_button').style.display = 'inline';
//     }
// }

    /**
     *  Sign in the user upon button click.
     */
function handleAuthClick() {

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        // document.getElementById('edit_button').style.display = 'inline';
        // document.getElementById('signout_button').style.display = 'inline';
        // document.getElementById('authorize_button').innerText = '새로고침';

        var token = JSON.stringify(gapi.client.getToken())
        localStorage.setItem('googleToken', token)

        await renderContent(title);
    };

    if ( gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
        var token = JSON.stringify(gapi.client.getToken())
        localStorage.setItem('googleToken', token)
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
    
}

    /**
     *  Sign out the user upon button click.
     */
function handleSignoutClick() {
    var token = localStorage.getItem('googleToken');
    if (!token) {
        var token = JSON.stringify(gapi.client.getToken());
        localStorage.setItem('googleToken', token)
    }
    if (token !== null) {
        localStorage.removeItem('googleToken')
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        // document.getElementById('authorize_button').innerText = '로그인';
        // document.getElementById('edit_button').style.display = 'none';
        // document.getElementById('signout_button').style.display = 'none';
    }
}


function postDocs(title) {
    const body = {
        "requests":{
            "addSheet":{
                "properties":{
                    "title": title
                }
            }
        }
    }

    try {
      gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: body,
      }).then((response) => {
        let values = [
          [
            'uid',
            'created_at',
            'body'
          ]
        ];
        const body = {
          values: values,
        };
        try {
          gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: title,
            valueInputOption: "RAW",
            resource: body,
          }).then((response2) => {
            editDocs(0, title, '')
          });
        } catch (err) {
            document.getElementById('content').innerText += err.message;
            return;
        }
      });
    } catch (err) {
      document.getElementById('content').innerText += err.message;
      return;
    }
}

function editDocs(range, title, input) {
    input = input.replace(/\n/gm, '\\n')
    let values = [
      [
        range,
        new Date(),
        input
      ]
    ];
    const body = {
      values: values,
    };
    try {
      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: title,
        valueInputOption: "RAW",
        resource: body,
      }).then((response) => {
        beforeUnloadAlert = false
        location.href="./?d="+title
      });
    } catch (err) {
      document.getElementById('content').innerText += err.message;
      return;
    }
  }

async function loginForEditing(title, length, output='') {
    if (!localStorage.getItem('googleToken')) {
        location.href = './?d='+edit
    } 

    document.getElementById('doc-title').innerHTML = title+' 편집';
    document.getElementById('content').innerHTML = '<div id="post-label">'+edit+' 편집: <span id="wordcount"></span></div><textarea id="post-input" oninput="changePostDisabled(this)">'+output.replace(/\\n/gm, '&#010;')+`</textarea><button id="post-button" disabled="true" onclick="editDocs(${JSON.stringify(length)},'${edit}',document.querySelector('#post-input').value)">편집 완료!</button><div id="post-preview"></div>`;
    
    window.addEventListener('beforeunload', function (e) {
        if (!beforeUnloadAlert) return;
        // Cancel the event as stated by the standard.
        event.preventDefault();
        // Chrome requires returnValue to be set.
        event.returnValue = '';
    });
}

function tokenDelivery() {
    var token
    if (gapi.client) {
        if (gapi.client.getToken() == null) {
            if (localStorage.getItem('googleToken')) {
                token = localStorage.getItem('googleToken');
                if (token) {
                    gapi.client.setToken(JSON.parse(token))
                    document.querySelector('#isLogin').innerHTML = '<i class="bx bx-user-voice" onclick="handleSignoutClick()" ></i>'
                    // document.getElementById('signout_button').style.display = 'inline';
                    document.getElementById('edit_button').style.display = 'inline';
                    // document.getElementById('authorize_button').innerText = '새로고침';
                }
            } else {
                document.querySelector('#isLogin').innerHTML = '<i class="bx bx-user-x" onclick="handleAuthClick()" ></i>'
                // document.getElementById('authorize_button').innerText = '로그인';
                document.getElementById('edit_button').style.display = 'none';
                // document.getElementById('signout_button').style.display = 'none';
            }
        } else {
            document.querySelector('#isLogin').innerHTML = '<i class="bx bx-user-voice" onclick="handleSignoutClick()" ></i>'
            // document.getElementById('signout_button').style.display = 'inline';
            document.getElementById('edit_button').style.display = 'inline';
            // document.getElementById('authorize_button').innerText = '새로고침';
        }
    } else {
        if (localStorage.getItem('googleToken')) {
            token = localStorage.getItem('googleToken');
            if (token) {
                gapi.client.setToken(JSON.parse(token))
                    document.querySelector('#isLogin').innerHTML = '<i class="bx bx-user-voice" onclick="handleSignoutClick()" ></i>'
                    // document.getElementById('edit_button').style.display = 'inline';
                    document.getElementById('signout_button').style.display = 'inline';
                    // document.getElementById('authorize_button').innerText = '새로고침';
            }
        }
    }
}

async function renderContent(title) {

    let response;
    let response_err
    try {
        response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: title+'!A2:C',
        });
    } catch (err) {
        try {
            response_err = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: '대문!A2:C',
            });
            console.log(response_err)
            if (response_err.result && localStorage.getItem('googleToken')) {
                if (confirm("새 문서를 생성하시겠습니까?") == true) {
                    tokenDelivery()
                    postDocs(title)
                } else {
                    document.getElementById('content').innerText = "문서 생성을 취소하였습니다.";
                }
            } else {
                document.getElementById('content').innerText = '문서 생성 권한이 없습니다.';
            }
        } catch (err2) {
            try {
                if (response_err.result && localStorage.getItem('googleToken')) {
                    if (confirm("대문 문서를 생성하시겠습니까?") == true) {
                        tokenDelivery()
                        postDocs('대문')
                    } else {
                        document.getElementById('content').innerText = "문서 생성을 취소하였습니다.";
                    }
                }
            } catch (err3) {
                document.getElementById('content').innerText = '문서 생성 권한이 없습니다.';
                if (localStorage.getItem('googleToken')) {
                    localStorage.removeItem('googleToken')
                }
                return;
            }
        }
        return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
        document.getElementById('content').innerText = 'No values found.';
        return;
    }

    if (version && edit) {
        const output = range.values[version][2]
        loginForEditing(title, range.values.length, output)
    } else if (edit) {
        const output = range.values[range.values.length - 1][2]
        loginForEditing(title, range.values.length, output)
    } else if (version == 'list') {
        document.getElementById('doc-title').innerHTML = title+': v';
        document.getElementById('content').innerHTML = '<table id="version-list"><thead><tr><td>버전</td><td>변경 날짜</td><td>작업 수행</td></tr></thead><tbody></tbody></table>';
        for (var i=0; i<range.values.length; i++) {
            document.querySelector('#version-list>tbody').innerHTML += '<tr><td>v'+(range.values.length-1-i)+'</td><td>'+range.values[(range.values.length-1-i)][1]+'</td><td><a href="./?d='+title+'&v='+(range.values.length-1-i)+'">읽기</a> · <a href="./?e='+title+'&v='+(range.values.length-1-i)+'">이 버전으로부터 편집</a></td></tr>';
        }
    } else if (version) {
        document.getElementById('history_button').style.display = 'inline';
        const output = range.values[version][2]
        document.getElementById('doc-title').innerHTML = title+': v'+version;
        document.getElementById('content').innerHTML = '<p style="font-size:0.8rem;">수정본: ' + range.values[version][1] + '</p>'
        document.getElementById('content').innerHTML += await wikiParse(output);
    } else {
        document.getElementById('history_button').style.display = 'inline';
        const output = range.values[range.values.length - 1][2]
        document.getElementById('doc-title').innerHTML = title;
        document.getElementById('content').innerHTML = '<p style="font-size:0.8rem;">마지막 수정: ' + range.values[range.values.length - 1][1] + '</p>'
        document.getElementById('content').innerHTML += await wikiParse(output);
    }

    tokenDelivery()
}