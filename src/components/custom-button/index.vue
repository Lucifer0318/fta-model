<template>
	<button class="custom-button" @click="$emit('click')">
		<i v-if="icon" class="iconfont icon" :class="icon" />
		<span>{{ text }}</span>
	</button>
</template>

<script>
	export default {
		name: 'CustomButton',
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
	.custom-button {
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

	.custom-button:focus,
	.custom-button:hover {
		color: #409eff;
		border-color: #c6e2ff;
		background-color: #ecf5ff;
	}

	.custom-button:active {
		color: #3a8ee6;
		border-color: #3a8ee6;
		outline: 0;
	}

	.custom-button + .custom-button {
		margin-left: 10px;
	}

	.icon {
		font-size: 12px;
	}

	.custom-button [class*='icon'] + span {
		margin-left: 5px;
	}
</style>
