<script setup>
import { computed } from 'vue'

const wprops = defineProps({
  // svg 图标组件名字
  name: {
    type: String
  },
  // svg 大小
  size: {
    type: Number,
    default: () => 14
  },
  // svg 颜色
  color: {
    type: String
  }
})

// 获取 icon 图标名称
const getIconName = computed(() => {
  return props ? props.name : ''
})

// 用于判断 element plus 自带 svg 图标的显示、隐藏
const isShowEle = computed(() => {
  return props && props.name && props.name.startsWith('ele-')
})

// 用于判断在线链接、本地引入等图标显示、隐藏
const isShowIcon = computed(() => {
  return props && props.name && props.name.startsWith('icon-')
})

// 设置图标样式
const setIconSvgStyle = computed(() => {
  return `font-size: ${props.size}px;color: ${props.color};`
})

// 设置图片样式
const setIconImgOutStyle = computed(() => {
  return `width: ${props.size}px;height: ${props.size}px;display: inline-block;overflow: hidden;`
})

// 设置图片样式
const setIconSvgInsStyle = computed(() => {
  const filterStyle = []
  const compatibles = ['-webkit', '-ms', '-o', '-moz']
  compatibles.forEach((j) => filterStyle.push(`${j}-filter: drop-shadow(${props.color} 30px 0);`))
  return `width: ${props.size}px;height: ${props.size}px;position: relative;left: -${props.size}px;${filterStyle.join('')}`
})
</script>

<template>
  <i v-if="isShowEle" class="el-icon" :style="setIconSvgStyle">
    <component :is="getIconName" />
  </i>
  <i v-else-if="isShowIcon" :class="`iconfont ` + getIconName" :style="setIconSvgStyle + 'margin-right: 10px'" />
  <div v-else :style="setIconImgOutStyle">
    <img :src="getIconName" :style="setIconSvgInsStyle" />
  </div>
</template>
