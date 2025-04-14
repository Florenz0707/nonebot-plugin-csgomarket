var all_resps = {};

// NOTE: 以下函数需要一个全局可用的 md5 函数。
// 您可能需要引入一个库，例如 blueimp-md5：
// <script src="https://cdn.jsdelivr.net/npm/blueimp-md5@2.19.0/js/md5.min.js"></script>
// 或者确保执行环境提供了该函数。

function generate_timestamp_js_for_param() {
    // 生成用于 URL 参数的 12+1 位时间戳（如果其他地方需要）
    const timestampMs = new Date().getTime();
    const timestampStr12 = String(timestampMs).substring(0, 12);
    let checksum = 0;
    for (let i = 0; i < timestampStr12.length; i++) {
        checksum += parseInt(timestampStr12[i], 10);
    }
    checksum %= 10;
    return timestampStr12 + String(checksum);
}

function generate_auth_headers_js() {
    // 根据 Python 逻辑使用原始时间戳生成头部信息
    const rawTimestampMs = new Date().getTime();
    const rawTimestampStr = String(rawTimestampMs);

    // 此时间戳用于 'Timestamp' 头
    const headerTimestamp = rawTimestampStr;

    // 使用 MD5 生成 'Auth' 令牌
    let authToken = ""; // 默认为空字符串
    if (typeof md5 !== 'function') {
        console.error("MD5 函数不可用。无法生成 auth 令牌。");
        // 返回占位符或空值，以避免立即中断执行
    } else {
        try {
            const firstHash = md5(rawTimestampStr);
            authToken = md5(firstHash + "pc*&bQ2@mkvt");
        } catch (e) {
            console.error("生成 auth 令牌时出错:", e);
        }
    }


    return { headerTimestamp, authToken };
}

function sendHttpRequest(url, method, data = {},key) {
    // 创建 XMLHttpRequest 对象
    var xhr = new XMLHttpRequest();

    // 将数据转换为字符串形式
    var dataString = JSON.stringify(data);

    // 根据 Python pre_send_handler 逻辑处理 URL 或参数中的 timestamp
    const timestampParam = generate_timestamp_js_for_param();
    const methodUpper = method.toUpperCase();

    if (methodUpper === 'GET') {
        // 对于 GET 请求，将 timestamp 添加到 URL 查询参数
        // (注意：这里假设 URL 可能已有查询参数，需要正确处理)
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}timestamp=${timestampParam}`;
        // 如果数据对象 'data' 用于 GET 请求的参数，则也应在此处处理，
        // 但标准的 GET 请求通常不通过 body 发送数据，所以我们假设 'data' 主要用于 POST。
        // 如果 'data' 应该成为 GET 的查询参数，需要额外逻辑将其转换为查询字符串并附加到 URL。

    } else if (methodUpper === 'POST') {
        // 对于 POST 请求，将 timestamp 添加到 URL
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}timestamp=${timestampParam}`;
    }

    // 打开请求 (使用可能已修改的 URL)
    xhr.open(method, url, true);

    // 设置请求头
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");

    // 基于 Python 逻辑生成并设置动态认证头
    const { headerTimestamp, authToken } = generate_auth_headers_js();
    xhr.setRequestHeader("timestamp", headerTimestamp);
    xhr.setRequestHeader("auth", authToken);

    // 发送请求
    xhr.send(dataString);

    // 设置 onreadystatechange 回调函数
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                // 解析响应数据
                all_resps[key]=xhr.responseText;
            } else {
                console.error('Request failed. Status:', xhr.status);
            }
        }
    };

    return xhr;
}

function receive(key,resp){
    all_resps[key] = resp;
}
function wait4value(key) {
    return new Promise((resolve, reject) => {
        const checkValue = () => {
            if (typeof all_resps[key] !== 'undefined') {
                resolve(all_resps[key]);
            } else {
                setTimeout(checkValue, 100);
            }
        };
        checkValue();
    });
}

var item_name = document.getElementById('dataInput').value;
document.getElementById("item_name").innerText = item_name;

(function(){
    const copyText = document.getElementById("item_name");
    let originalText = copyText.innerText;
    let pressTimer;
    copyText.addEventListener("touchstart", function(event) {
        event.stopPropagation();
        pressTimer = setTimeout(() => {
            Clipboard.copyToClipboard(originalText);
            gsap.timeline()
                .to(copyText, { duration: 0.3, opacity: 0 })
                .call(() => {
                    copyText.innerText = "已复制";
                })
                .to(copyText, { opacity: 1, duration: 0.3 })
                .to(copyText, { opacity: 0.5, repeat: 1, yoyo: true, duration: 0.2 })
                .to(copyText, { opacity: 0, duration: 0.3, delay: 0.3 })
                .call(() => {
                    copyText.innerText = originalText;
                })
                .to(copyText, { opacity: 1, duration: 0.3 });
        }, 500);
    });
    copyText.addEventListener("touchend", function(event) {
        event.stopPropagation();
        clearTimeout(pressTimer);
    });
    copyText.addEventListener("touchmove", function(event) {
        event.stopPropagation();
        clearTimeout(pressTimer);
    });
}())

lottie.loadAnimation({
    container: document.getElementById('loading'),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    animationData: anim_loading,
    speed: 2,
});

var index_now = "";
function switch_content(index){
    if (index_now === index){
        return
    }else {
        index_now = index;
    }

    var navs = document.getElementById("nav").children;

    for (let i = 0; i < navs.length; i++){
        var nav = navs[i];
        nav.setAttribute("data-active", "false");
    }

    navs[index].setAttribute("data-active", "true");

    document.getElementById("container").innerHTML = "";

    document.getElementById('loading').style.display = "";

    _ie({
        tag : "script",
        src : "./js/item_" + (index+1) + ".js"
    },document.getElementById("container"));
}

var navs = document.getElementById("nav").children;
for (let i = 0; i < navs.length; i++){
    var nav = navs[i];
    nav.addEventListener('click', function() {
        switch_content(i);
    });
}
switch_content(0);

document.getElementById("back").addEventListener('click', function() {
    Jump.goBack();
});

function is_stared(){
    var results = DataBase.query("SELECT item_name FROM stars where item_name = ?",[item_name]);
    if (results.length != 0){
        return true
    }
    return false
}
function star_update(){
    var div = document.getElementById("star");
    div.innerHTML = "";
    if (is_stared()){
        _ie({
            tag: 'svg',
            attribute : {
                width: '1.3rem',
                viewBox: '64 64 896 896',
            },
            style : {
                fill : "var(--chart-color-3)"
            },
            children: [
                {
                    tag: 'path',
                    attribute : {
                        d: 'M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 00.6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0046.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3z'
                    }
                }
            ]
        },div);
    }else {
        _ie({
            tag: 'svg',
            attribute : {
                width: '1.3rem',
                viewBox: '64 64 896 896',
            },
            children: [
                {
                    tag: 'path',
                    attribute : {
                        d: 'M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 00.6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0046.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z'
                    }
                }
            ]
        },div);
    }
}
star_update();
document.getElementById("star").addEventListener('click', function() {
    if (is_stared()){
        DataBase.executeSQL("DELETE FROM stars WHERE item_name = ?", [item_name]);
    }else{
        DataBase.executeSQL("INSERT OR IGNORE INTO stars (item_name) VALUES (?)",[item_name]);
    }
    star_update()
});


