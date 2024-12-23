### 构建说明 :

- 在 `.github\workflows\main.yml` 中我设置了构建 `if` 条件, 只有在打上 `tag` 标签的时候才会触发 `github action` 构建安装包
- 判断的条件如下:
  - git add xxx
  - git commit -m "xxx"
  - git tag v1.0.0  # 打上版本tag
  - git push origin v1.0.0  # 推送标签到 `github`上
  - git push --tags # 如果你有多个 `tag` 需要推送, 可以使用这个
- 一旦 ` tag` 推送到  `github` 上之后, 就会触发构建流程, 请即时下载产物, 在一天之后产物就会被清除
- 版本规范示例说明
  * `v1.0.0` 代表初次发布。
  * `v1.1.0` 代表引入了新功能。
  * `v1.0.1` 代表发布了修复 bug 的小版本。
