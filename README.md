## 介绍

首先感谢原项目 [https://github.com/x-dr/short](https://github.com/x-dr/short) 的开源，本项目是在其基础上进行优化和功能增强的版本。

**相比原项目，本项目的改进如下：**

*   **UI 大改造：** 重新设计了用户界面，使其更加美观、现代化，并增强了用户体验。
*   **过期时间选项：** 增加了短链接过期时间选项，更加灵活。

## 演示
[https://dwz.qdqqd.com/](https://dwz.qdqqd.com/)

## 使用 Cloudflare Pages 部署

1. fork本项目
2. 登录到[Cloudflare](https://dash.cloudflare.com/)控制台.
3. 在帐户主页中，选择`pages`> ` Create a project` > `Connect to Git`
4. 选择你创建的项目存储库，在`Set up builds and deployments`部分中，全部默认即可。
5. 点击`Save and Deploy`，稍等片刻，你的网站就部署好了。
6. 创建D1数据库
7. 执行sql命令创建表（在控制台输入框粘贴下面语句执行即可）
8. 选择部署完成short项目，前往后台依次点击`设置`->`函数`->`D1 数据库绑定`->`编辑绑定`->变量名称填写：`DB` 命名空间 `选择你提前创建好的D1` 数据库绑定
9. 重新部署项目，完成。

```sql
DROP TABLE IF EXISTS links;
CREATE TABLE IF NOT EXISTS links (
  `id` integer PRIMARY KEY NOT NULL,
  `url` text,
  `slug` text,
  `ua` text,
  `ip` text,
  `status` int,
  `create_time` DATE,
  `expires_at` timestamp  -- 添加过期时间字段
);
DROP TABLE IF EXISTS logs;
CREATE TABLE IF NOT EXISTS logs (
  `id` integer PRIMARY KEY NOT NULL,
  `url` text ,
  `slug` text,
  `referer` text,
  `ua` text ,
  `ip` text ,
  `create_time` DATE
);
```

## API
短链接生成
```
# POST /create
curl -X POST -H "Content-Type: application/json" -d '{"url":"https://url.wangwangit.com"}' https://url.wangwangit.com/create

# 指定 slug
curl -X POST -H "Content-Type: application/json" -d '{"url":"https://url.wangwangit.com","slug":"example"}' https://url.wangwangit.com/create

# 设置过期时间
curl -X POST -H "Content-Type: application/json" -d '{"url":"https://url.wangwangit.com", "expiry": "5m"}' https://url.wangwangit.com/create

# 响应示例
{
  "slug": "<slug>",
  "link": "http://d.131213.xyz/<slug>"
}
```
