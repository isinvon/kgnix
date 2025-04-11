<template>
  <div>
    <div class="relative inline-block" @mouseover="showTooltip = true" @mouseleave="showTooltip = false">
      <button class="text-sm text-blue-500 focus:outline-none" @click="onCheckUpdate(false)">
        <SvgIcon :name="state.btnLoading ? 'ele-Loading' : 'icon-Update'" :size="20" :class="{ 'animate-spin': state.btnLoading }"></SvgIcon>
      </button>
      <div v-if="showTooltip" class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-800 text-white rounded shadow-md whitespace-nowrap">
        检测更新
      </div>
    </div>

    <div v-if="state.checkVisible" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">检测更新</h3>
          <button class="text-gray-500 hover:text-gray-700" @click="state.checkVisible = false">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="mt-4">
          <SvgIcon v-if="state.code == 1" name="ele-SuccessFilled" :size="18" color="#67C23A" style="top:4px"></SvgIcon>
          <SvgIcon v-else-if="state.code == 0" name="ele-WarningFilled" :size="18" color="#E6A23C" style="top:4px"></SvgIcon>
          <SvgIcon v-else-if="state.code == -1" name="ele-CircleCloseFilled" :size="18" color="#F56C6C" style="top:4px"></SvgIcon>
          {{ state.msg }}
        </div>
        <div v-if="state.code == 0 && state.body != ''" class="update-info">
          <div v-for="item in state.body">{{ item }}</div>
        </div>
        <div class="mt-4 flex justify-end">
          <button v-if="state.code == 0" class="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" @click="state.checkVisible = false">取消</button>
          <button class="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" @click="onConfirm">确认</button>
        </div>
      </div>
    </div>

    <div v-if="state.downloadVisible" class="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-96">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">下载更新</h3>
          <button class="text-gray-500 hover:text-gray-700" @click="state.downloadVisible = false">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="mt-4">
          <div class="mb-2 flex items-center">
            <SvgIcon name="ele-Loading" :size="14" class="animate-spin mr-2" style="top:2px" color="#337ecc"></SvgIcon>
            正在下载更新...
          </div>
          <div class="w-full bg-gray-200 rounded-full h-6">
            <div class="bg-blue-500 h-6 rounded-full" :style="{ width: state.downloadPercentage + '%' }">
              <span class="absolute left-1/2 transform -translate-x-1/2 text-white">{{ state.downloadSizeShow }}</span>
            </div>
          </div>
        </div>
        <div v-if="state.htmlUrl != ''" class="mt-4 text-gray-500 text-sm">
          若网速不理想，请尝试
          <span><a v-if="state.htmlUrl != ''" href="#" class="text-blue-500 hover:underline" @click.prevent="onOpenLink">手动更新</a></span>
        </div>
        <div class="mt-4 flex justify-end">
          <button class="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400" @click="onCancel">取消</button>
          <button class="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" @click="onBack">后台更新</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { document } from 'postcss'
import { reactive, onMounted, onUnmounted } from 'vue'

const state = reactive({
  checkVisible: false,
  btnLoading: false,
  code: 0, // 0=>有新版本; -1=>联网失败; 1=>已经是最新版本
  msg: '',
  htmlUrl: '', // 手动更新网址
  body: [], // 版本介绍
  downloadVisible: false,
  downloadSizeShow: '', // 下载过程中大小数值展示
  downloadPercentage: 0, // 下载过程中大小百分比
  backUpdate: false, // 是否后台更新
  timer: '',
})

onMounted(() => {
  setPy2Js() // 来自py的调用

  state.timer = setInterval(() => {
    if (window.pywebview != undefined) {
      onCheckUpdate(true) // 程序第一次打开，自动检测更新
      clearInterval(state.timer)
      state.timer = ''
    }
  }, 100)
})

onUnmounted(() => {
  clearInterval(state.timer)
  state.timer = ''
})

const setPy2Js = () => {
  // 来自py的调用
  window['py2js_updateAppProgress'] = (res) => {
    const resDict = JSON.parse(res)
    // console.log('js', resDict)
    state.downloadSizeShow = resDict['sizeShow']
    state.downloadPercentage = resDict['percentage']
  }
}

// 检测更新
const onCheckUpdate = (init = false) => {
  if (state.backUpdate) {
    // 从后台更新恢复过来
    state.downloadVisible = true
    state.btnLoading = false
  } else {
    // 第一次打开
    state.btnLoading = true
    window.pywebview.api.system_checkNewVersion().then((res) => {
      // console.log(init, res)
      // 程序第一次打开，自动检测更新 或 手动点击检测更新
      if (!init || res.code == 0) {
        state.code = res.code
        state.msg = res.msg
        if (res.htmlUrl != undefined) {
          state.htmlUrl = res.htmlUrl
        }
        if (res.body != undefined) {
          let body = res.body
          body = body.replaceAll('\r', '')
          state.body = body.split('\n')
        }
        state.checkVisible = true
      }
      state.btnLoading = false
    })
  }
}

// 手动更新
const onOpenLink = () => {
  // console.log(state.htmlUrl)
  window.pywebview.api.system_pyOpenFile(state.htmlUrl)
  state.checkVisible = false
}

// 确认更新 - 检查更新
const onConfirm = () => {
  state.checkVisible = false
  if (state.code == 0) {
    state.downloadVisible = true
    window.pywebview.api.system_downloadNewVersion().then((res) => {
      // console.log('res', res)
      state.downloadVisible = false
      if (res.code == 0) {
        alert('下载完成') // 使用原生 alert 替代 ElMessage
        state.btnLoading = false
        window.pywebview.api.system_pyOpenFile(res.downloadPath)
      } else {
        alert(res.msg) // 使用原生 alert 替代 ElMessage
      }
    })
  }
}

// 取消更新 - 下载更新
const onCancel = () => {
  state.backUpdate = false
  state.downloadVisible = false
  state.btnLoading = false
  window.pywebview.api.system_cancelDownloadNewVersion()
}

// 后台更新 - 下载更新
const onBack = () => {
  state.backUpdate = true
  state.downloadVisible = false
  state.btnLoading = true
}
</script>

<style scoped>

.update-info {
  @apply ml-5 mt-2.5 p-2.5 text-gray-500 text-sm overflow-y-scroll bg-gray-100 max-h-14 rounded;
}


.tip {
  @apply mt-2.5 text-gray-400 text-xs;
}


.tip-sd {
  @apply text-xs -mt-0.5;
}
</style>