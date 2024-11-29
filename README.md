<div align="center">
  <a href="https://v2.nonebot.dev/store"><img src="https://github.com/A-kirami/nonebot-plugin-template/blob/resources/nbp_logo.png" width="180" height="180" alt="NoneBotPluginLogo"></a>
  <br>
  <p><img src="https://github.com/A-kirami/nonebot-plugin-template/blob/resources/NoneBotPlugin.svg" width="240" alt="NoneBotPluginText"></p>
</div>

<div align="center">

# nonebot-plugin-csmarket

_✨ CS饰品查询插件 ✨_


<a href="./LICENSE">
    <img src="https://img.shields.io/github/license/Florenz0707/nonebot-plugin-csmarket.svg" alt="license">
</a>
<a href="https://pypi.python.org/pypi/nonebot-plugin-csmarket">
    <img src="https://img.shields.io/pypi/v/nonebot-plugin-csmarket.svg" alt="pypi">
</a>
<img src="https://img.shields.io/badge/python-3.9+-blue.svg" alt="python">

</div>

## 📖 介绍

适用于NoneBot, OneBot v11的插件，可以查询 Counter Strike 2 市场信息，包括大盘数据、饰品信息与各类排行榜。  

## 💿 安装

<details open>
<summary>使用 nb-cli 安装</summary>
在 nonebot2 项目的根目录下打开命令行, 输入以下指令即可安装

    nb plugin install nonebot-plugin-csmarket

</details>

<details>
<summary>使用包管理器安装</summary>
在 nonebot2 项目的插件目录下, 打开命令行, 根据你使用的包管理器, 输入相应的安装命令

<details>
<summary>pip</summary>

    pip install nonebot-plugin-csmarket
</details>
<details>
<summary>pdm</summary>

    pdm add nonebot-plugin-csmarket
</details>
<details>
<summary>poetry</summary>

    poetry add nonebot-plugin-csmarket
</details>
<details>
<summary>conda</summary>

    conda install nonebot-plugin-csmarket
</details>

打开 nonebot2 项目根目录下的 `pyproject.toml` 文件, 在 `[tool.nonebot]` 部分追加写入

    plugins = ["nonebot_plugin_csmarket"]

</details>

## ⚙️ 配置

无

## 🎉 使用
### 指令表
| 指令 | 权限 | 需要@ | 范围 | 说明 |
|:-----:|:----:|:----:|:----:|:----:|
| cs.help | 群员 | 否 | 群聊 | 输出帮助信息 |
| cs.search | 群员 | 否 | 群聊 | 查询指定饰品 |
| cs.rank | 群员 | 否 | 群聊 | 查询饰品排行榜 |
| cs.market | 群员 | 否 | 群聊 | 查询市场大盘 |
### 效果图
无
## 其他  
本项目由 [P-trd](https://github.com/7dul2/P-trd)  移植而来
该插件的主要编写者是 **Zaxpris**, Florenz0707只是小修小补，膜拜大佬。  
数据来源：cs-ob.com  
**Version**: 0.1.0
