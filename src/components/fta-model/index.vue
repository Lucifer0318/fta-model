<template>
	<div ref="modelContainer" class="model-cont">
		<div class="tool-wrap">
			<fta-button icon="refresh" text="重置" @click="autoFit"></fta-button>
			<fta-button :icon="fullscreenIcon" :text="fullscreenText" @click="fullscreen"></fta-button>
		</div>
		<div style="width: 100%; height: calc(100% - 56px)">
			<div ref="paperContainer"></div>
		</div>
	</div>
</template>

<script>
	import screenfull from 'screenfull'
	const { dia, layout } = window.joint
	import {
		normalConfig,
		faultConfig,
		diagnoseConfig,
		TopEvent,
		IntermediateEvent,
		BasicEvent,
		Link,
		shapes,
		gateTypeTitles,
	} from './config.js'

	const eventTypeMap = {
		H: TopEvent,
		I: IntermediateEvent,
		L: BasicEvent,
	}

	import FtaButton from '@/components/fta-button/index.vue'
	export default {
		name: 'FtaModel',
		components: { FtaButton },
		props: {
			// 模型数据（树状）
			data: {
				type: Array,
				default: () => [],
			},
			// 显示用例配置状态（内边框、下划线）
			showCaseState: {
				type: Boolean,
				default: false,
			},
			// 用例配置状态判断方法（不传则使用内置判断逻辑）
			caseStateFunc: {
				type: Function,
				default: null,
			},
		},
		data() {
			return {
				// 模型数据
				modelData: [],
				graph: null,
				paper: null,
				// 当前高亮的节点
				highlightedElements: [],
				// 当前高亮的链接
				highlightedLinks: [],
				// 是否正在拖拽
				isDragging: false,
				// 拖拽起始位置
				dragStartX: undefined,
				dragStartY: undefined,
				isFullscreen: false,
			}
		},
		computed: {
			fullscreenIcon() {
				return this.isFullscreen ? 'exit-fullscreen' : 'fullscreen'
			},
			fullscreenText() {
				return this.isFullscreen ? '退出全屏' : '全屏'
			},
		},
		watch: {
			data: {
				handler(newVal) {
					this.modelData = newVal
					setTimeout(() => this.init(), 100)
				},
				immediate: true,
				deep: true,
			},
		},
		mounted() {
			if (screenfull.isEnabled) {
				screenfull.on('change', this.handleFullscreenChange)
				this.$once('hook:beforeDestroy', () => {
					screenfull.off('change', this.handleFullscreenChange)
				})
			}
		},
		methods: {
			// 初始化
			init() {
				this.graph = new dia.Graph({}, { cellNamespace: shapes })
				this.paper = new dia.Paper({
					el: this.$refs.paperContainer,
					width: '100%',
					height: '100%',
					model: this.graph,
					defaultConnectionPoint: { name: 'boundary', args: { offset: 5 } },
					defaultConnector: {
						name: 'straight',
						// args: { cornerType: "line", cornerRadius: 10 },
					},
					defaultRouter: { name: 'orthogonal' },
					async: true,
					interactive: false,
					frozen: true,
					cellViewNamespace: shapes,
					background: { color: '#fff' },
					viewport: function (view) {
						const { model } = view
						if (!view) return true
						return !model.get('hidden')
					},
				})
				if (!this.modelData.length) return
				// 添加监听事件
				this.addEvents()
				// 绘制
				this.draw(this.modelData)
			},

			// 绘制
			draw(data) {
				let cells = this.generateCells(data)
				let links = this.generateLinks(data, cells)
				this.graph.addCells(cells.concat(links))

				this.runLayout()

				// this.autoFit()

				this.paper.unfreeze()
			},

			// 内容自适应
			autoFit() {
				this.paper.transformToFitContent({
					padding: 15,
					contentArea: this.graph.getBBox(),
					verticalAlign: 'middle',
					horizontalAlign: 'middle',
				})
			},

			// 创建节点
			generateCells(data) {
				// 递归生成节点
				const generate = (tempData, cells) => {
					tempData.map(item => {
						const { nodeId: id, faultName: label, subsetLogic: gateType, nodeType: eventType } = item
						const Event = eventTypeMap[eventType]
						if (!Event) {
							console.warn('eventType is null', item)
							return
						}
						const cell = Event.create({ id, label, raw: { ...item } }).gate(gateType)
						// 未配置完全的用例，用内边框和下划线标识
						if (this.showCaseState && eventType !== 'H') {
							let isCaseNotConfigured = false
							if (typeof this.caseStateFunc === 'function') {
								isCaseNotConfigured = this.caseStateFunc(item)
							} else {
								const { caseCount, terminalCount } = item
								isCaseNotConfigured = caseCount < terminalCount
							}
							cell.attr('innerBorder/display', isCaseNotConfigured ? 'inherit' : 'none')
							cell.attr('label/text-decoration', isCaseNotConfigured ? 'underline' : 'none')
						}
						cells.push(cell)
						if (item.children && item.children.length) {
							generate(item.children, cells)
						}
					})
					return cells
				}
				return generate(data, [])
			},

			// 创建链接
			generateLinks(data, cells) {
				// 递归生成链接
				function generate(tempData, tempCells, links, parentId) {
					tempData.map(item => {
						let valid = true
						const { nodeId: id, nodeType: eventType } = item
						if (!id || !parentId) {
							const isTopEvent = eventType === 'H'
							!isTopEvent && console.warn('id or parentId is null', item)
							valid = false
						}
						const parentCell = tempCells.find(cell => cell.id === parentId)
						const childCell = tempCells.find(cell => cell.id === id)
						if (valid && (!parentCell || !childCell)) {
							valid && console.warn('parentCell or childCell is null', parentCell, childCell)
							valid = false
						}
						if (valid) {
							const newLink = Link.create(parentCell, childCell)
							links.push(newLink)
						}
						if (item.children && item.children.length) {
							generate(item.children, tempCells, links, item.nodeId)
						}
					})
					return links
				}
				return generate(data, cells, [], null)
			},

			// 自上而下布局
			runLayout() {
				const autoLayoutElements = this.graph.getElements()
				// 使用有向图布局算法
				layout.DirectedGraph.layout(this.graph.getSubgraph(autoLayoutElements), {
					rankDir: 'TB',
					setVertices: true,
				})
				// 先自适应再设置根节点位置
				this.autoFit()
				// 设置根节点位于画布中心
				const rootElementId = this.modelData[0].nodeId
				const rootElement = this.graph.getCell(rootElementId)
				const viewport = this.paper.clientToLocalRect(this.paper.svg.getBoundingClientRect())
				const center = viewport.center()
				const rootSize = rootElement.size()
				const rootX = center.x - rootSize.width / 2
				rootElement.position(rootX, rootElement.prop('position/y'))
			},

			// 添加监听事件
			addEvents() {
				this.paper.on({
					// 绘制完毕
					'render:done': () => {
						this.$emit('render-done')
					},
					// 点击门节点，展开或收起子节点
					'element:gate:click': elementView => {
						const element = elementView.model
						const successorElements = this.graph.getSuccessors(element)
						const [successor] = successorElements
						const shouldExpand = !successor.get('hidden')
						const successorCells = this.graph.getSubgraph([element, ...successorElements])
						successorCells.forEach(cell => {
							if (cell === element) {
								cell.set({
									hidden: false,
									collapsed: shouldExpand,
								})
							} else {
								cell.set({ hidden: shouldExpand })
								if (cell.isElement()) {
									cell.set({ collapsed: false })
								}
							}
						})
					},
					// 监听节点的点击事件，高亮相应节点
					'element:pointerclick': (cellView, evt, x, y) => {
						let element = cellView.model
						let elementId = element.id
						let targetSelector = evt.target.getAttribute('joint-selector')
						let { nodeName, textContent } = evt.target
						const isGate = gateTypeTitles.includes(textContent)
						const isNode =
							targetSelector === 'body' || targetSelector === 'innerBorder' || (nodeName === 'tspan' && !isGate)
						if (!isGate) {
							// 移除之前高亮的节点
							this.removeHighlight()
							!isNode &&
								this.$emit('node-click', {
									nodeId: null,
									nodeRaw: {},
								})
						}
						if (isNode) {
							this.setHighlight(elementId)
							let rawData = element.get('raw') || {}
							this.$emit('node-click', {
								nodeId: elementId,
								nodeRaw: _.cloneDeep(rawData),
							})
						}
					},
					// 点击空白处取消高亮
					'blank:pointerclick': (evt, x, y) => {
						this.removeHighlight()
						this.$emit('node-click', {
							nodeId: null,
							nodeRaw: {},
						})
					},
					// 监听鼠标滚轮事件，实现放大缩小功能
					'element:mousewheel': (cellView, evt, x, y) => {
						this.handleScale(evt, x, y)
					},
					// 监听鼠标滚轮事件，实现放大缩小功能
					'blank:mousewheel': (evt, x, y) => {
						this.handleScale(evt, x, y)
					},
					// 监听空白处的鼠标按下事件，实现长按拖拽功能
					'blank:pointerdown': (evt, x, y) => {
						this.isDragging = true
						this.dragStartX = evt.clientX
						this.dragStartY = evt.clientY
						// console.log(evt.clientX, evt.clientY)
						this.paper.el.style.cursor = 'grabbing'
						const onMouseMove = event => {
							// 拖拽前位置
							let { tx, ty } = this.paper.translate()
							// console.log(tx, ty)
							if (!this.isDragging) return
							// 拖拽距离
							const dx = event.clientX - this.dragStartX
							const dy = event.clientY - this.dragStartY
							// console.log(event.clientX, event.clientY)
							// console.log(dx, dy)
							this.paper.translate(tx + dx, ty + dy)
							this.dragStartX = event.clientX
							this.dragStartY = event.clientY
						}
						const onMouseUp = event => {
							this.isDragging = false
							this.paper.el.style.cursor = 'default'
							document.removeEventListener('mousemove', onMouseMove)
							document.removeEventListener('mouseup', onMouseUp)
						}
						// 绑定鼠标移动事件
						document.addEventListener('mousemove', onMouseMove)
						document.addEventListener('mouseup', onMouseUp)
					},
				})
			},

			// 放大缩小
			handleScale(evt, x, y) {
				// 阻止默认的滚轮行为
				evt.preventDefault()
				// 获取滚轮的滚动量
				let delta = evt.originalEvent.deltaY
				// 获取当前画布的缩放比例
				let scale = this.paper.scale()
				// 计算新的缩放比例
				let newScale = scale.sx - delta / 1000
				// 限制缩放比例范围
				newScale = Math.max(0.01, Math.min(newScale, 16))
				// 设置新的缩放比例
				this.paper.scale(newScale, newScale, x, y)
			},

			// 节点居中
			centerElement(elementId) {
				let element = this.graph.getCell(elementId)
				if (!element) {
					console.warn('Element not found', elementId)
					return
				}

				// 如果节点被隐藏，则展开其父节点
				let hidden = element.get('hidden')
				if (hidden) {
					let ancestorIds = new Set()
					this.findAncestors(this.graph, element, ancestorIds)
					let ancestors = this.graph.getPredecessors(element, { deep: true })
					let collapsedAncestor = ancestors.find(ancestor => ancestor.get('collapsed'))
					const successorElements = this.graph.getSuccessors(collapsedAncestor)
					const successorCells = this.graph.getSubgraph([collapsedAncestor, ...successorElements])
					successorCells.forEach(cell => {
						if (cell === collapsedAncestor) {
							cell.set({
								hidden: false,
								collapsed: false,
							})
						} else {
							cell.set({ hidden: false })
							if (cell.isElement()) {
								cell.set({ collapsed: false })
							}
						}
					})
				}

				// 记录用户当前缩放比例
				// let { sx: targetSx, sy: targetSy } = this.paper.scale()

				// 因为translate之后节点的position没变，所以需要先恢复默认布局，再往下计算
				this.autoFit()

				// 默认布局的缩放比例
				let { sx: originSx, sy: originSy } = this.paper.scale()

				// 获取根元素位置，计算画布中心点位置（即根元素中心点）
				const rootElementId = this.modelData[0].nodeId
				const rootElement = this.graph.getCell(rootElementId)
				let { x: rootX, y: rootY } = rootElement.position()
				let { width: rootWidth, height: rootHeight } = rootElement.size()
				let paperCenterX = rootX + rootWidth / 2
				// let paperCenterY = rootY + rootHeight / 2
				let paperCenterY = rootY
				// console.log('paperCenterX, paperCenterY', paperCenterX, paperCenterY)

				// 需要居中的节点的中心位置
				let { x: elementX, y: elementY } = element.position()
				let { width, height } = element.size()
				let elementCenterX = elementX + width / 2
				// let elementCenterY = elementY + height / 2
				let elementCenterY = elementY
				// console.log('elementCenterX, elementCenterY', elementCenterX, elementCenterY)

				// 初始偏移量
				let { tx, ty } = this.paper.translate()
				// console.log('tx, ty', tx, ty)

				// 还原用户的缩放比例
				// this.paper.scale(targetSx, targetSy)

				// 目标缩放比例下需移动距离 = 原缩放比例计算出的距离  *  原缩放比例 / 目标缩放比例
				// 算出的距离是在1倍比例下的，需先乘以缩放比例，再加上原来的偏移量，才是最终需要移动的距离
				// let dx = (paperCenterX - elementCenterX) * targetSx + (tx * originSx) / targetSx
				// let dy = (paperCenterY - elementCenterY) * targetSy + (ty * originSy) / targetSy
				let dx = (paperCenterX - elementCenterX) * originSx + tx
				let dy = (paperCenterY - elementCenterY) * originSy + ty
				// console.log('dx, dy', dx, dy)

				// 移动画布
				this.paper.translate(dx, dy)
			},

			// 递归查找所有祖先元素
			findAncestors(graph, element, ancestors = new Set()) {
				// 找到所有祖先
				graph.getLinks().forEach(link => {
					if (link.get('target').id === element.id) {
						const ancestor = graph.getCell(link.get('source').id)
						if (ancestor) {
							ancestors.add(ancestor.id)
							this.findAncestors(graph, ancestor, ancestors)
						}
					}
				})
			},

			// 递归查找所有子元素
			findDescendants(graph, element, descendants = new Set()) {
				graph.getLinks().forEach(link => {
					if (link.get('source').id === element.id) {
						const descendant = graph.getCell(link.get('target').id)
						if (descendant) {
							descendants.add(descendant.id)
							this.findDescendants(graph, descendant, descendants)
						}
					}
				})
			},

			// 查找直属子节点
			findDirectChildren(element, cells, links) {
				let children = []
				links.map(link => {
					if (link.get('source').id === element.id) {
						let targetId = link.get('target').id
						let targetElement = cells.find(cell => cell.id === targetId)
						if (targetElement) {
							children.push(targetElement)
						}
					}
				})
				return children
			},

			// 找到节点对应的连接线
			findLinksBetweenElements(graph, elementIds) {
				let links = []
				graph.getLinks().map(link => {
					let sourceId = link.get('source').id
					let targetId = link.get('target').id
					if (elementIds.includes(sourceId) && elementIds.includes(targetId)) {
						links.push(link)
					}
				})
				return links
			},

			// 全屏/取消全屏
			fullscreen() {
				if (!screenfull.isEnabled) {
					this.$message({ message: '你的浏览器不支持全屏', type: 'warning' })
					return false
				}
				// 指定全屏元素
				const element = this.$refs.modelContainer
				if (this.isFullscreen) {
					screenfull.exit()
				} else {
					screenfull.request(element)
				}
			},

			// 全屏/取消全屏回调
			handleFullscreenChange() {
				this.isFullscreen = !this.isFullscreen
			},

			// 设置高亮（可供外部调用）
			setHighlight(elementId) {
				const element = this.graph.getCell(elementId)
				// 找到所有祖先和子元素
				// let ancestors = new Set()
				let descendants = new Set()
				// this.findAncestors(this.graph, element, ancestors)
				this.findDescendants(this.graph, element, descendants)
				// let highlightIds = [...ancestors, elementId, ...descendants]
				let highlightIds = [elementId, ...descendants]

				// 为节点添加阴影
				highlightIds.map(id => {
					const hCell = this.graph.getCell(id)
					if (hCell) {
						// 获取节点故障状态
						const isFault = hCell.get('isFault')
						// 获取节点诊断状态
						const isDiagnose = hCell.get('isDiagnose')
						const config = isFault ? faultConfig : isDiagnose ? diagnoseConfig : normalConfig
						const styleKeys = Object.keys(config.activeNode)
						// 修改节点样式
						styleKeys.map(key => hCell.attr(key, config.activeNode[key]))
					}
				})
				// 更新高亮的节点列表
				this.highlightedElements = highlightIds.filter(id => this.graph.getCell(id).isElement())

				// 更新高亮的链接
				let links = this.findLinksBetweenElements(this.graph, highlightIds)
				links.map(link => {
					const { id: sourceId } = link.get('source')
					const { id: targetId } = link.get('target')
					const sourceCell = this.graph.getCell(sourceId)
					const targetCell = this.graph.getCell(targetId)

					const isLinkFault = sourceCell.get('isFault') && targetCell.get('isFault')
					const isLinkDiagnose = sourceCell.get('isDiagnose') && targetCell.get('isDiagnose')

					const config = isLinkFault ? faultConfig : isLinkDiagnose ? diagnoseConfig : normalConfig
					const styleKeys = Object.keys(config.activeLink)
					// 修改链接样式
					styleKeys.map(key => link.attr(key, config.activeLink[key]))
					// 将链接移到前景
					link.toFront()
				})
				this.highlightedLinks = links
			},

			// 取消高亮（可供外部调用）
			removeHighlight() {
				this.highlightedElements.map(hId => {
					const hCell = this.graph.getCell(hId)
					const isFault = hCell.get('isFault')
					const isDiagnose = hCell.get('isDiagnose')
					const config = isFault ? faultConfig : isDiagnose ? diagnoseConfig : normalConfig
					const styleKeys = Object.keys(config.defaultNode)
					// 修改节点样式
					styleKeys.map(key => hCell.attr(key, config.defaultNode[key]))
				})
				this.highlightedElements = []
				this.highlightedLinks.map(link => {
					const { id: sourceId } = link.get('source')
					const { id: targetId } = link.get('target')
					const sourceCell = this.graph.getCell(sourceId)
					const targetCell = this.graph.getCell(targetId)

					const isLinkFault = sourceCell.get('isFault') && targetCell.get('isFault')
					const isLinkDiagnose = sourceCell.get('isDiagnose') && targetCell.get('isDiagnose')

					const config = isLinkFault ? faultConfig : isLinkDiagnose ? diagnoseConfig : normalConfig
					const styleKeys = Object.keys(config.defaultLink)
					// 修改链接样式
					styleKeys.map(key => link.attr(key, config.defaultLink[key]))
					if (!isLinkFault || !isLinkDiagnose) {
						// 将链接移回背景
						link.toBack()
					}
				})
				this.highlightedLinks = []
			},

			// 设置诊断节点样式（可供外部调用）
			setDiagnose(elementIds) {
				if (this.highlightedElements.length) {
					const hasIntersection = elementIds.some(id => this.highlightedElements.includes(id))
					// 当前高亮的节点包含诊断节点时，取消高亮
					hasIntersection && this.removeHighlight()
				}
				// 更新诊断节点
				let diagnoseCells = elementIds.map(id => this.graph.getCell(id)).filter(cell => cell.isElement())
				diagnoseCells.map(cell => {
					cell.set('isDiagnose', true)
					const styleKeys = Object.keys(diagnoseConfig.defaultNode)
					// 修改节点样式
					styleKeys.map(key => cell.attr(key, diagnoseConfig.defaultNode[key]))
				})
				// 更新诊断链接
				let diagnoseLinks = this.findLinksBetweenElements(this.graph, elementIds)
				diagnoseLinks.map(link => {
					const styleKeys = Object.keys(diagnoseConfig.defaultLink)
					// 修改链接样式
					styleKeys.map(key => link.attr(key, diagnoseConfig.defaultLink[key]))
					// 将链接移到前景
					link.toFront()
				})
			},

			// 移除诊断节点，默认移除所有（可供外部调用）
			removeDiagnose(elementIds = []) {
				let diagnoseCellIds = []
				let diagnoseCells = []
				if (!elementIds.length) {
					diagnoseCells = this.graph.getCells().filter(cell => cell.isElement() && cell.get('isDiagnose'))
					diagnoseCellIds = diagnoseCells.map(cell => cell.id)
				} else {
					diagnoseCells = elementIds.map(id => this.graph.getCell(id)).filter(cell => cell.isElement())
					diagnoseCellIds = elementIds
				}
				if (this.highlightedElements.length) {
					const hasIntersection = diagnoseCellIds.some(id => this.highlightedElements.includes(id))
					// 当前高亮的节点包含故障节点时，取消高亮
					hasIntersection && this.removeHighlight()
				}
				// 更新节点
				diagnoseCells.map(cell => {
					cell.set('isDiagnose', false)
					const styleKeys = Object.keys(normalConfig.defaultNode)
					styleKeys.map(key => cell.attr(key, normalConfig.defaultNode[key]))
				})
				// 更新链接
				let diagnoseLinks = this.findLinksBetweenElements(this.graph, diagnoseCellIds)
				diagnoseLinks.map(link => {
					const styleKeys = Object.keys(normalConfig.defaultLink)
					styleKeys.map(key => link.attr(key, normalConfig.defaultLink[key]))
					link.toBack()
				})
			},

			// 设置故障节点样式（可供外部调用）
			setFault(elementIds) {
				if (this.highlightedElements.length) {
					const hasIntersection = elementIds.some(id => this.highlightedElements.includes(id))
					// 当前高亮的节点包含故障节点时，取消高亮
					hasIntersection && this.removeHighlight()
				}
				// 更新故障节点
				let faultCells = elementIds.map(id => this.graph.getCell(id)).filter(cell => cell.isElement())
				faultCells.map(cell => {
					cell.set('isFault', true)
					const styleKeys = Object.keys(faultConfig.defaultNode)
					styleKeys.map(key => cell.attr(key, faultConfig.defaultNode[key]))
				})
				// 更新故障链接
				let faultLinks = this.findLinksBetweenElements(this.graph, elementIds)
				faultLinks.map(link => {
					const styleKeys = Object.keys(faultConfig.defaultLink)
					styleKeys.map(key => link.attr(key, faultConfig.defaultLink[key]))
					link.toFront()
				})
			},

			// 移除故障节点，默认移除所有（可供外部调用）
			removeFault(elementIds = []) {
				let faultCellIds = []
				let faultCells = []
				if (!elementIds || !elementIds.length) {
					faultCells = this.graph.getCells().filter(cell => cell.isElement() && cell.get('isFault'))
					faultCellIds = faultCells.map(cell => cell.id)
				} else {
					faultCells = elementIds.map(id => this.graph.getCell(id)).filter(cell => cell.isElement())
					faultCellIds = elementIds
				}
				if (this.highlightedElements.length) {
					const hasIntersection = faultCellIds.some(id => this.highlightedElements.includes(id))
					// 当前高亮的节点包含故障节点时，取消高亮
					hasIntersection && this.removeHighlight()
				}
				faultCells.map(cell => {
					cell.set('isFault', false)
					const isDiagnose = cell.get('isDiagnose')
					const config = isDiagnose ? diagnoseConfig : normalConfig
					const styleKeys = Object.keys(config.defaultNode)
					styleKeys.map(key => cell.attr(key, config.defaultNode[key]))
				})

				// 更新链接
				let faultLinks = this.findLinksBetweenElements(this.graph, faultCellIds)
				faultLinks.map(link => {
					const { id: sourceId } = link.get('source')
					const { id: targetId } = link.get('target')
					const sourceCell = this.graph.getCell(sourceId)
					const targetCell = this.graph.getCell(targetId)
					const isLinkDiagnose = sourceCell.get('isDiagnose') && targetCell.get('isDiagnose')
					const config = isLinkDiagnose ? diagnoseConfig : normalConfig
					const styleKeys = Object.keys(config.defaultLink)
					styleKeys.map(key => link.attr(key, config.defaultLink[key]))
					!isLinkDiagnose && link.toBack()
				})
			},
		},
	}
</script>

<style>
	.model-cont {
		width: 100%;
		height: 100%;
		background: #fff;
		overflow: hidden;
		border: 1px solid #dfe3ea;
		border-radius: 8px;
		padding: 8px;
		box-sizing: border-box;
	}
	.tool-wrap {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 16px;
		padding-bottom: 8px;
		box-sizing: border-box;
		border-bottom: 1px solid #dfe3ea;
	}
</style>
