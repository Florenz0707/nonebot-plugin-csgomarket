var goods = Object.keys(item_names);

// 精准匹配
function exact_match(keyword) {
    const lowerCaseKeywords = keyword.toLowerCase().split(' ');
    return goods.filter(item => {
        const lowerCaseItem = item.toLowerCase();
        return lowerCaseKeywords.every(kw => lowerCaseItem.includes(kw));
    });
}

// 模糊匹配
function jaro(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    const s1_len = s1.length;
    const s2_len = s2.length;
    if (s1_len === 0 && s2_len === 0) return 1.0;
    if (s1_len === 0 || s2_len === 0) return 0.0;
    const match_distance = Math.floor(Math.max(s1_len, s2_len) / 2) - 1;
    const s1_matches = new Array(s1_len).fill(false);
    const s2_matches = new Array(s2_len).fill(false);
    let matches = 0;
    let transpositions = 0;
    for (let i = 0; i < s1_len; i++) {
        const start = Math.max(0, i - match_distance);
        const end = Math.min(i + match_distance + 1, s2_len);
        for (let j = start; j < end; j++) {
            if (s2_matches[j]) continue;
            if (s1[i] !== s2[j]) continue;
            s1_matches[i] = true;
            s2_matches[j] = true;
            matches++;
            break;
        }
    }
    if (matches === 0) return 0.0;
    let k = 0;
    for (let i = 0; i < s1_len; i++) {
        if (!s1_matches[i]) continue;
        while (!s2_matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }
    transpositions /= 2;
    return ((matches / s1_len) + (matches / s2_len) + ((matches - transpositions) / matches)) / 3.0;
}
function jaro_match(keyword, threshold = 0) {
    const keywords = keyword.toLowerCase().trim().split(/\s+/); // 将输入的 keyword 拆分成多个子关键字

    return goods
        .map(item => {
            const score = keywords
                .map(kw => jaro(item, kw)) // 对每个子关键字计算与 item 的 Jaro 距离
                .reduce((a, b) => a + b, 0) / keywords.length; // 计算所有子关键字的平均相似度
            return { item, score };
        })
        .filter(result => result.score > threshold) // 过滤出符合相似度阈值的结果
        .sort((a, b) => b.score - a.score) // 按相似度降序排列
        .map(result => result.item); // 返回排序后的 items
}

function insert_result(name, price, float, item_name) {
    var p = document.getElementById("result");

    var add = "";
    var color = "#1D1D1F";
    if (float < 0) {
        color = config.down_color;
    }
    if (float > 0) {
        color = config.up_color;
        add = "+";
    }
    if (float != 0) {
        float = add + float + "%";
    } else {
        float = "";
    }

    // 获取 item_name 对应的 id
    var itemId = item_names[item_name]?.id || "-";

    var newElement = document.createElement("div");
    newElement.className = "item";
    newElement.innerHTML = `
        <div class="infos">
            <h1>${name}</h1>
            <div class="data">
                <p>商品ID:${price}</p>
                <p style="color: ${color}">${float}</p>
            </div>
        </div>
        <div><svg width="20" height="20"><use xlink:href="#go"></use></svg></div>
    `;

    p.appendChild(newElement);

    newElement.addEventListener('click', function() {
        setTimeout(function(){
            Jump.jump("item", item_name);
        }, 220);
    });
}

function insert_title(title) {
    var p = document.getElementById("result");
    var newElement = document.createElement("div");
    newElement.className = "title";
    newElement.innerHTML = `<a>${title}</a>`;
    p.appendChild(newElement);
}

// 防抖函数
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

function match(query) {
    document.getElementById("result").innerHTML = "";
    if (query === "") {
        load_hot();
        return;
    }

    var exact_result = exact_match(query);

    var count = 0;
    if (exact_result.length > 0) {
        insert_title("精确匹配");
        exact_result.forEach(function(result) {
            if (count < 100) {
                var name = result; // 原始的结果文本
                var lowerCaseQuery = query.toLowerCase().trim(); // 去除首尾空格
                var keywords = lowerCaseQuery.split(/\s+/); // 使用正则表达式按空白字符拆分

                // 遍历每个关键词，并为其添加 <abbr> 标记
                keywords.forEach(function(keyword) {
                    if (keyword) { // 确保关键词非空
                        var regex = new RegExp("(" + keyword + ")", "gi"); // 创建正则表达式，忽略大小写
                        name = name.replace(regex, "<abbr>$1</abbr>"); // 替换匹配的关键词为带标注的文本
                    }
                });

                // 获取 item_name 对应的 id
                var itemId = item_names[result]?.id || "-";
                itemId.textContent = "商品ID: " + itemId;
                insert_result(name, itemId, 0, result); // 插入结果
                count++;
            }
        });
    }

    if (count < 6) {
        count = 0;
        var jaro_result = jaro_match(query);
        if (jaro_result.length > 0) {
            insert_title("猜您想搜");
            jaro_result.forEach(function(result) {
                if (count < 6) {
                    // 获取 item_name 对应的 id
                    var itemId = item_names[result]?.id || "-";
                    
                    insert_result(result, itemId, 0, result);
                    count++;
                }
            });
        }
    }

    // load_infos();
}
var goods_name = document.getElementById('dataInput').value;
// 设置静态商品名称
match(goods_name); // 直接调用 match 函数展示商品列表