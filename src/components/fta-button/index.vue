<template>
	<button class="fta-button" @click="$emit('click')">
		<i v-if="icon" class="iconfont icon" :class="icon" />
		<span>{{ text }}</span>
	</button>
</template>

<script>
	export default {
		name: 'FtaButton',
		props: {
			icon: {
				type: String,
				default: '',
			},
			text: {
				type: String,
				default: '',
			},
		},
		data() {
			return {}
		},
	}
</script>

<style>
	.fta-button {
		display: inline-block;
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		background: #fff;
		border: 1px solid #dcdfe6;
		color: #606266;
		appearance: none;
		-webkit-appearance: none;
		text-align: center;
		box-sizing: border-box;
		outline: 0;
		margin: 0;
		transition: 0.1s;
		font-weight: 500;
		padding: 7px 15px;
		font-size: 12px;
		border-radius: 20px;
		display: inline-flex;
		align-items: center;
	}

	.fta-button:focus,
	.fta-button:hover {
		color: #409eff;
		border-color: #c6e2ff;
		background-color: #ecf5ff;
	}

	.fta-button:active {
		color: #3a8ee6;
		border-color: #3a8ee6;
		outline: 0;
	}

	.fta-button + .fta-button {
		margin-left: 10px;
	}

	.icon {
		font-size: 12px;
	}

	.fta-button [class*='icon'] + span {
		margin-left: 5px;
	}
</style>
