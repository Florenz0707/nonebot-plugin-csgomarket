# nonebot 包
from nonebot import on_command
from nonebot import require
from nonebot.adapters import Message, Event
from nonebot.matcher import Matcher
from nonebot.params import CommandArg
from nonebot.plugin import PluginMetadata

require("nonebot_plugin_waiter")
from nonebot_plugin_waiter import waiter

# 导入 nonebot 插件
require("nonebot_plugin_alconna")
from nonebot_plugin_alconna import UniMessage

require("nonebot_plugin_htmlrender")
from nonebot_plugin_htmlrender import (
    get_new_page
)

# 导入子模块
from .database import fetch_by_name

# 其他模块
import uuid
import re
import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

# 模块导入顺序为nonebot包，nonebot插件，子模块，其他模块
# 且需含有PluginMetadata

__plugin_meta__ = PluginMetadata(
    name="csmarket",
    description="可以查询 Counter Strike 2 市场信息，包括大盘数据、饰品信息与各类排行榜。",
    usage="使用 /cs.help 获取更多信息",

    type="application",

    homepage="https://github.com/Florenz0707/nonebot-plugin-csmarket",

    supported_adapters={"~onebot.v11"},
)

# 常量定义
MARKETS = ["BUFF", "悠悠有品", "C5", "IGXE"]
RANK_TYPES = ["周涨幅", "周跌幅", "周热销", "周热租"]
TEMPLATE_DIR = Path(__file__).parent / "templates"


# 常用函数


# 生成随机文件名
def generate_hex_filename() -> str:
    return f"{uuid.uuid4().hex}.html"


# 模糊匹配
def fuzzy_case_match(s1: str, s2: str) -> bool:
    return s1.lower() == s2.lower()


# 生成截图
async def take_screenshot(page, file_path) -> None:
    await page.goto(f"file://{file_path}", wait_until="domcontentloaded")
    await page.wait_for_timeout(2000)
    pic = await page.screenshot(full_page=True)
    await UniMessage.image(raw=pic).send(reply_to=True)
    os.remove(file_path)


help_menu = on_command("cs.help", aliases={"cs.menu"}, priority=5, block=True)


@help_menu.handle()
async def _(event: Event):
    """
    帮助列表，亦可使用元数据。
    """
    message = """1> cs.market [market] 查询市场大盘情况
2> cs.search [key1] [key2] 查询某一饰品价格
3> cs.rank [rank] 查看各种榜单"""
    await UniMessage.at(event.get_user_id()).text(message).finish(reply_to=True)  # 机器人消息格式为回复且在第一行at用户，在第二行接上其他消息


# CS大盘数据命令
cs_market_info = on_command("cs.market", priority=5, block=True)


@cs_market_info.handle()
async def _(event: Event, arg: Message = CommandArg()):
    # 获取指令后参数
    name = arg.extract_plain_text().strip()  # 去除多余空格

    if name == "":
        await UniMessage.at(event.get_user_id()).text(
            "\n请输入要查询的市场名!\n可查询：BUFF|悠悠有品|IGXE|C5\n示例： cs.market BUFF").finish(
            reply_to=True)  # 机器人消息格式为回复且在第一行at用户，在第二行接上其他消息
    # 匹配输入名称
    market_type = next((i for i, market in enumerate(MARKETS) if fuzzy_case_match(name, market)), None)
    if market_type is None:
        await UniMessage.at(event.get_user_id()).text(
            "\n请输入正确的市场名!\n可查询：BUFF|悠悠有品|IGXE|C5\n示例： cs.market BUFF").finish(
            reply_to=True)  # 机器人消息格式为回复且在第一行at用户，在第二行接上其他消息
    # 加载模板
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("markets.html.jinja2")
    rendered_html = template.render(page_now=market_type)  # 传入参数并生成html
    new_html = generate_hex_filename()  # 生成随机文件名
    output_path = TEMPLATE_DIR / new_html  # 生成路径
    with open(output_path, "w", encoding="utf-8") as file:
        file.write(rendered_html)  # 写文件

    async with get_new_page(viewport={"width": 500, "height": 300}) as page:
        await take_screenshot(page, output_path)  # 截图


# 搜索饰品命令
cs_market_search = on_command("cs.search", block=True)


@cs_market_search.handle()
async def _(event: Event, arg: Message = CommandArg()):
    name = arg.extract_plain_text().strip().split(sep=" ")
    if len(name) == 0:
        await UniMessage.at(event.get_user_id()).text(
            "请告诉我想要查询哪件商品吧").send(reply_to=True)
    else:
        # 根据关键词模糊搜索可能的商品信息
        goods_list = fetch_by_name(name)
        if goods_list is None:
            await UniMessage.at(event.get_user_id()).text("啊嘞？没找到哦~").finish(reply_to=True)
        selected_list = ""
        for i in range(len(goods_list)):
            selected_list += f"{i + 1}: {goods_list[i][0]}\n"
        await UniMessage.at(event.get_user_id()).text(
            f"{selected_list}上面已为您展示搜索到的商品，发送对应的序号来选择吧！\n(限时一分钟，发送'0'取消选择)").send(
            reply_to=True)

        # 请求进一步确认
        @waiter(waits=["message"], keep_session=True)
        async def check(_event: Event):
            return _event.get_plaintext()

        resp = await check.wait(timeout=60)
        if resp is None:
            await UniMessage.at(event.get_user_id()).text(
                "什么嘛！根本没在听我讲话！我走了！").finish(reply_to=True)
        if not resp.isdigit() or int(resp) < 0 or int(resp) > len(goods_list):
            await UniMessage.at(event.get_user_id()).text(
                "没听懂哦！可以重新调用命令哦~").finish(reply_to=True)
        if int(resp) == 0:
            await UniMessage.at(event.get_user_id()).text(
                "已取消选择！有什么需求可以找我哦~").finish(reply_to=True)

        await UniMessage.at(event.get_user_id()).text(
            "收到啦~正在查询中......").send()
        # 生成商品信息截图
        env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
        template = env.get_template("item.html.jinja2")
        rendered_html = template.render(data_value=goods_list[int(resp) - 1][0])
        new_html = generate_hex_filename()
        output_path = TEMPLATE_DIR / new_html
        with open(output_path, "w", encoding="utf-8") as file:
            file.write(rendered_html)

        async with get_new_page(viewport={"width": 750, "height": 900}) as page:
            await take_screenshot(page, output_path)


# 饰品排行命令
cs_goods_rank = on_command("cs.rank", block=True)


def parse_input(input_str):
    """
    解析rank命令参数，页码默认为1
    """
    pattern = r'^(周涨幅|周跌幅|周热销|周热租)?\s*(\d+)?$'
    match = re.match(pattern, input_str)
    rank_type, page_num = match.groups() if match else ("", 1)
    page_num = int(page_num) if page_num else 1
    return rank_type, page_num


@cs_goods_rank.handle()
async def _(matcher: Matcher, event: Event, arg: Message = CommandArg()):
    name = arg.extract_plain_text().strip()
    if name == "":
        await UniMessage.at(event.get_user_id()).text(
            "请输入要查询的榜单！ \n可查询排行榜：周涨幅|周跌幅|周热销|周热租\n示例： cs.rank 周涨幅").finish(
            reply_to=True)

    rank_type, page_num = parse_input(name)  # 解析输入参数
    if rank_type not in RANK_TYPES:
        await UniMessage.at(event.get_user_id()).text(
            "请输入要正确的榜单名称！ \n可查询排行榜：周涨幅|周跌幅|周热销|周热租\n示例： cs.rank 周涨幅").finish(
            reply_to=True)

    # 你问我为什么这么写？html里面是用的列表存储排行榜，传入下标来指定要查询的排行榜
    rank_type_num = RANK_TYPES.index(rank_type)
    # 加载模板
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_DIR)))
    template = env.get_template("rank.html.jinja2")
    rendered_html = template.render(rank_type=rank_type_num, page=page_num)
    new_html = generate_hex_filename()
    output_path = TEMPLATE_DIR / new_html
    with open(output_path, "w", encoding="utf-8") as file:  # 需改为异步操作
        file.write(rendered_html)

    async with get_new_page(viewport={"width": 650, "height": 900}) as page:
        await take_screenshot(page, output_path)
