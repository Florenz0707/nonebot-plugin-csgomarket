import sqlite3
from pathlib import Path

DATABASE_DIR = Path(__file__).parent / "templates/database/items.db"

comp_dict = {"战痕累累": 0, "破损不堪": 1, "久经沙场": 2, "略有磨损": 3, "崭新出厂": 4}


def cmp(str1: str, str2: str) -> bool:
    """
    对查询到的商品名称进行排序。
    Key1: "StatTrak"
    Key2: 皮肤名称
    Key3: 磨损（崭新 > 略磨 > 久经 > 破损 > 战痕）
    """
    if ("StatTrak" in str1) ^ ("StatTrak" in str2):
        return "StatTrak" in str2
    split_1, split_2 = str1.split(sep="("), str2.split(sep="(")
    name_1, name_2 = split_1[0], split_2[0]
    if name_1 != name_2:
        return name_1 > name_2
    else:
        worn_1, worn_2 = split_1[1][:-1], split_2[1][:-1]
        return comp_dict[worn_1] > comp_dict[worn_2]


def sort_goods(arr: list) -> None:
    """
    没什么脑子的冒泡排序。
    """
    length = len(arr)
    for i in range(0, length):
        flag = True
        for j in range(1, length - i):
            if cmp(arr[j][0], arr[j - 1][0]):
                arr[j - 1], arr[j] = arr[j], arr[j - 1]
                flag = False
        if flag:
            break


def fetch_by_id(item_id: int) -> tuple:
    """
    根据商品id精确查询信息。
    """
    conn = sqlite3.connect(DATABASE_DIR)
    cursor = conn.cursor()
    cursor.execute('SELECT name, market_hash_name FROM items WHERE id = ?', (item_id,))
    result = cursor.fetchone()
    conn.close()

    if result:
        return result
    else:
        return None, None


def fetch_by_name(name: list) -> list:
    """
    根据商品名称模糊查询信息。
    """
    pattern = "%"
    cnt = 0
    while cnt < len(name):
        pattern += f"{name[cnt]}%"
        cnt += 1
    conn = sqlite3.connect(DATABASE_DIR)
    cursor = conn.cursor()
    cursor.execute(f"SELECT name, id FROM items WHERE name LIKE ?", (pattern,))
    result = cursor.fetchall()
    conn.close()

    # 排序结果
    sort_goods(result)
    return result
