import '@/assets/iconfont/iconfont.css'
import FtaModel from './components/fta-model/index.vue'

const install = Vue => {
	if (install.installed) return
	install.installed = true
	Vue.component('FtaModel', FtaModel)
}

// 单独导出组件（支持按需引入）
export { FtaModel }

// 兼容全局引入
export default install
