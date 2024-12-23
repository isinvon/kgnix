### 构建说明

* 在 `.github/workflows/main.yml` 中，我设置了构建 `if` 条件，只有在打上 `tag` 标签时才会触发 `GitHub Actions` 构建安装包。
* 判断的条件如下：
  1. **git add** ：添加修改的文件。
  2. **git commit -m "xxx"** ：提交更改的文件。
  3. **git tag v1.0.0** ：打上版本标签 `v1.0.0`（根据语义化版本规范来管理版本）。
  4. **git push origin v1.0.0** ：将标签推送到 `GitHub` 上。
  5. **git push --tags** ：如果有多个标签需要推送，可以使用此命令来推送所有标签。
* 一旦 `tag` 被推送到 `GitHub` 上，GitHub 会触发构建流程并打包安装包。构建完成后，产物会被上传到 GitHub Releases 页面。在 **一天** 后，构建产物会被清除，务必在此时间内下载需要的安装包。
* 版本规范示例说明：
  * `v1.0.0`：代表初次发布。
  * `v1.1.0`：代表引入了新功能。
  * `v1.0.1`：代表发布了修复 bug 的小版本。
* **GitHub Actions 构建流程** 需要一个有效的 `GitHub Token` 才能触发安装包的发布。需要在 GitHub 仓库的 `Settings > Secrets` 中配置 token。

### 本项目的 `GitHub Actions` 构建文件说明

以下是本项目的 `GitHub Actions` 构建文件的工作流配置文件 `main.yml`，其目的是在推送标签时构建不同平台的安装包，并将构建产物发布到 GitHub Releases 页面：

```yaml
name: build
on:
  push:
    branches: [main]
    tags: # 仅在推送标签时触发工作流
      - "v*"  # 只匹配以 "v" 开头的标签，例如 v1.0.0, v2.1.3

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - name: 拉取项目代码
        uses: actions/checkout@v4

      - name: 安装node环境
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: 安装pnpm
        uses: pnpm/action-setup@v4
        id: pnpm-install
        with:
          version: 9
          run_install: false

      - name: 获取pnpm仓库目录
        id: pnpm-cache
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT

      - name: 设置pnpm缓存
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: 安装Python3环境
        uses: actions/setup-python@v5
        with:
          python-version: "3.9"
          cache: "pip"

      - name: 初始化打包环境
        run: pnpm run init

      - name: 开始打包
        run: pnpm run build

      # 上传到 GitHub Actions 的构建工件（artifact）存储中，并不会自动推送到 GitHub Releases。
      - name: 上传打包完成的程序包
        uses: actions/upload-artifact@v4
        with:
          name: Setup_${{ runner.os }}
          retention-days: 1
          path: build/*-*_*.*  # 这里是上传到 GitHub Actions 中的构建工件

      # 创建 GitHub Release
      - name: 创建 GitHub Release
        uses: actions/create-release@v1
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            这里是版本发布说明，描述此版本的更新内容。
          draft: false
          prerelease: false
          token: ${{ secrets.kgnix_github_token }} # 使用 GitHub 自动提供的 token

      # 上传 Windows .exe 文件(zip压缩后)到 Release
      - name: 上传 Windows .exe 文件(zip压缩后)到 Release
        uses: actions/upload-release-asset@v1
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./build/Setup_Windows.zip  # 假设打包后的 zip 文件路径
          asset_name: kgnix-windows-${{ github.ref }}.zip  # 上传时的文件名称，格式为 kgnix-windows-v1.0.0.zip
          asset_content_type: application/zip  # 这里的 MIME 类型应为 application/zip
          token: ${{ secrets.kgnix_github_token }} # 自动使用 GitHub token

      # 上传 macOS .dmg 文件(zip压缩后)到 Release
      - name: 上传 macOS .dmg 文件(zip压缩后)到 Release
        uses: actions/upload-release-asset@v1
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./build/Setup_macOS.zip  # 假设打包后的 zip 文件路径
          asset_name: kgnix-macos-${{ github.ref }}.zip  # 上传时的文件名称，格式为 kgnix-macos-v1.0.0.zip
          asset_content_type: application/zip  # 这里的 MIME 类型应为 application/zip
          token: ${{ secrets.kgnix_github_token }} # 自动使用 GitHub token

      # 上传 Linux .deb 文件(zip压缩后)到 Release
      - name: 上传 Linux .deb 文件(zip压缩后)到 Release
        uses: actions/upload-release-asset@v1
        if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
        with:
          upload_url: ${{ steps.create_release.outputs.upload_url }}
          asset_path: ./build/Setup_Linux.zip  # 假设打包后的 zip 文件路径
          asset_name: kgnix-linux-${{ github.ref }}.zip  # 上传时的文件名称，格式为 kgnix-linux-v1.0.0.zip
          asset_content_type: application/zip  # 这里的 MIME 类型应为 application/zip
          token: ${{ secrets.kgnix_github_token }} # 自动使用 GitHub token
```

### GitHub Actions 构建过程说明：

1. **触发条件：**

   * 该流程只有在 `git push --tags` 将标签推送到 GitHub 时触发。具体来说，只有标签是以 `v` 开头的（例如：`v1.0.0`、`v1.2.0` 等）才会触发构建。
2. **构建环境：**

   * 构建将在 Windows、macOS 和 Linux 上并行进行，因此可以为不同平台生成相应的安装包。
3. **安装包生成：**

   * 使用 `pnpm` 安装依赖并构建安装包。构建过程中，Windows 会生成 `.exe` 文件，macOS 会生成 `.dmg` 文件，Linux 会生成 `.deb` 文件。所有生成的安装包都会被压缩为 ZIP 文件。
4. **构建产物上传：**

   * 构建产物（例如 `.exe`, `.dmg`, `.deb` 文件）会被上传到 GitHub Actions 构建工件（artifact）存储，并且会自动发布到 GitHub Releases 页面。
5. **版本发布：**

   * 构建完成后，GitHub 会创建一个新的 Release 并将对应平台的压缩包（ZIP 文件）上传到 Release 页面，方便用户下载。
6. **依赖的 GitHub Token：**

   * 为了顺利创建 Release 和上传构建产物，`GitHub Actions` 需要使用一个有效的 `GitHub Token`。你可以在仓库的 `Settings > Secrets` 中配置该 Token，需要你自己去生成一个并通过 `${{ secrets.kgnix_github_token }}` 在工作流中引用。

---


#### 1. 生成 GitHub Personal Access Token (PAT)

1. **登录到 GitHub** ：首先，你需要登录到 GitHub 账号。
2. **进入 Personal Access Tokens 页面** ：

* 点击右上角的个人头像，选择  **Settings** 。
* 在左侧菜单中，选择  **Developer settings** 。
* 在左侧菜单下，选择  **Personal access tokens** 。
* 点击  **Tokens (classic)** ，然后点击  **Generate new token** 。

1. **配置 Token 权限** ：

* 为了能够让 `GitHub Actions` 创建 Release 并上传构建产物，你需要为 `Personal Access Token` 配置合适的权限。具体来说，需要勾选以下权限：
  * **repo** ：这个权限允许访问仓库的代码、问题、拉取请求等。
  * 需要的子权限：`repo`（完全访问仓库的权限）
  * **workflow** ：这个权限允许执行工作流操作，适用于 GitHub Actions 的操作。
  * **write:packages** ：允许上传构建产物。
  * **delete:packages** ：如果需要删除包的话。

   如果你只需要上传构建产物并创建 Release，可以选择最基本的权限配置：

* **repo** （包括所有子权限）
* **workflow**
* **write:packages**

1. **生成 Token** ：

* 配置完权限后，点击  **Generate token** 。
* 请务必复制保存这个 Token，因为你生成后将无法再次查看它。

#### 2. 配置 GitHub Secrets

在生成并复制了 `Personal Access Token` 后，你需要将它配置到 GitHub 仓库的 **Secrets** 中，以便 GitHub Actions 使用。

1. **进入 GitHub 仓库设置** ：

* 打开你的项目仓库，点击右上角的  **Settings** （设置）。
* 在左侧栏中，选择 **Secrets and variables** >  **Actions** 。

1. **添加新 Secret** ：

* 点击 **New repository secret** 按钮。
* 在 **Name** 字段中输入 `kgnix_github_token`（或者你自定义的名称）。
* 在 **Value** 字段中粘贴刚才生成的 `Personal Access Token`。
* 点击  **Add secret** 。

#### 3. 使用 Token 在 GitHub Actions 中

在 GitHub Actions 工作流文件中，你可以通过 `${{ secrets.kgnix_github_token }}` 引用你刚才配置的 token。比如，在工作流中的创建 Release 和上传构建产物时使用：

```yaml
- name: 创建 GitHub Release
  uses: actions/create-release@v1
  if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/')
  with:
    tag_name: ${{ github.ref }}
    release_name: Release ${{ github.ref }}
    body: |
      这里是版本发布说明，描述此版本的更新内容。
    draft: false
    prerelease: false
    token: ${{ secrets.kgnix_github_token }}  # 使用 GitHub 自动提供的 token

- name: 上传构建产物到 Release
  uses: actions/upload-release-asset@v1
  with:
    upload_url: ${{ steps.create_release.outputs.upload_url }}
    asset_path: ./build/Setup_Windows.zip  # 假设打包后的 zip 文件路径
    asset_name: kgnix-windows-${{ github.ref }}.zip  # 上传时的文件名称
    asset_content_type: application/zip  # 这里的 MIME 类型应为 application/zip
    token: ${{ secrets.kgnix_github_token }}  # 自动使用 GitHub token
```

#### 4. 权限说明

* `repo` 权限：`repo` 权限是访问私有仓库的基础权限，允许读取仓库内容和进行写操作。对于需要执行发布操作的工作流，它是必需的。
  * `repo` 包括：`repo:status`, `repo_deployment`, `public_repo`, `repo:invite` 等。
  * 你可以将 `repo` 权限设置为  **最低权限** ，即只允许访问和创建发布。
* `workflow` 权限：`workflow` 权限允许触发 GitHub Actions 工作流，并且可以管理和读取工作流的状态。
* `write:packages` 权限：允许将构建产物上传至 GitHub 包管理系统，适用于上传 `.deb`, `.dmg`, `.exe` 等构建产物。

#### 5. 使用 `kgnix_github_token` 权限的风险

* **最小权限原则** ：尽量为 `Personal Access Token` 授予最小的权限，只为必需的功能授予权限。例如，如果你只需要上传文件到 Release，可以只启用 `repo` 和 `workflow` 权限，而不需要其他额外的权限。
* **安全性** ：Token 是敏感信息，一定不要将其泄露。如果发现泄露，应立即撤销或重置 Token。

---
