# rent-a-mac

MacHost 官网：海外独享 Mac mini 托管。纯静态站点，没有构建步骤，部署在 GitHub Pages。

线上地址：https://d-wwei.github.io/rent-a-mac

## 日常更新（只改一个文件）

所有会变的数字都在 [`site-data.js`](site-data.js)：

| 要改什么 | 字段 |
|---|---|
| 已售出台数（成交后改这个） | `slots.claimed` |
| 早鸟总台数 | `slots.total` |
| 年付 / 月付 / 标准价 / 部署费 / 代购费 | `pricing.*` |
| 微信号、二维码图片、邮箱 | `contact.*` |

改完后：

```bash
git commit -am "更新名额" && git push
```

推送后 1–2 分钟线上自动更新。“仅剩 N 台”、名额格子、各处价格、年付总额都会跟着变。

## 文件

- `index.html` 页面结构和文案
- `styles.css` 样式
- `app.js` 交互（方案选择、FAQ、底部购买条、联系弹窗）
- `site-data.js` 数据
- `assets/` Mac mini 图片、自托管字体（Manrope / Noto Sans SC / IBM Plex Mono）

## 本地预览

```bash
python3 -m http.server 4173
```

然后打开 http://localhost:4173
