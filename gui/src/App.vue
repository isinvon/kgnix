<script setup>
import HelloWorld from './components/HelloWorld.vue'
defineProps({
  msg: String
})
</script>


<template>
  <div class="center-col h100 w100 scroll">
    <div class="logo-box">
      <img alt="Vue logo" src="./assets/vue.png" />
    </div>
    <HelloWorld class="m30" msg="hello world" />
  </div>
</template>

<style>
.scroll {
  overflow: scroll;
  background-color: #F7F7F7;
  height: 100vh;
}

.logo-box span {
  width: 74px;
}
</style>
