const { dia, shapes: defaultShapes, util } = window.joint

const defaultConfig = {
  fontSize: 16,
  linkWidth: 2,
}

const BODY_FILL = 'body/fill'
const BODY_STROKE = 'body/stroke'
const BODY_FILTER = 'body/filter'
const INNER_BORDER_STROKE = 'innerBorder/stroke'
const LABEL_FILL = 'label/fill'
const GATE_FILL = 'gate/fill'
const GATE_LINE_STROKE = 'gateLine/stroke'
const LINE_STROKE = 'line/stroke'

// 普通样式配置（默认）
export const normalConfig = {
  defaultNode: {
    [BODY_FILL]: '#25B079', // 节点填充颜色
    [BODY_STROKE]: 'none', // 节点边框颜色
    [BODY_FILTER]: null, // 节点阴影
    [INNER_BORDER_STROKE]: '#fff', // 节点内边框颜色
    [LABEL_FILL]: '#fff', // 文字颜色
    [GATE_FILL]: '#FDB215', // 与或门填充颜色
    [GATE_LINE_STROKE]: '#BBBFD1', // 与或门连接线颜色
  },
  defaultLink: {
    [LINE_STROKE]: '#BBBFD1', // 链接颜色
  },
  activeNode: {
    [BODY_FILL]: '#DDFFF2',
    [BODY_STROKE]: '#25B079',
    [BODY_FILTER]: {
      name: 'dropShadow',
      args: {
        dx: 0,
        dy: 8,
        blur: 20,
        color: '#84E2BD',
      },
    },
    [INNER_BORDER_STROKE]: '#25B079',
    [LABEL_FILL]: '#333',
    [GATE_FILL]: '#FDB215',
    [GATE_LINE_STROKE]: '#25B079',
  },
  activeLink: {
    [LINE_STROKE]: '#25B079',
  },
}

// 诊断样式配置
export const diagnoseConfig = {
  defaultNode: {
    [BODY_FILL]: '#DDFFF2', // 节点填充颜色
    [BODY_STROKE]: '#25B079', // 节点边框颜色
    [BODY_FILTER]: null, // 节点阴影
    [INNER_BORDER_STROKE]: '#25B079', // 节点内边框颜色
    [LABEL_FILL]: '#333', // 文字颜色
    [GATE_FILL]: '#FDB215', // 与或门填充颜色
    [GATE_LINE_STROKE]: '#25B079', // 与或门连接线颜色
  },
  defaultLink: {
    [LINE_STROKE]: '#25B079', // 链接颜色
  },
  activeNode: {
    [BODY_FILL]: '#BCEBDA',
    [BODY_STROKE]: '#25B079',
    [BODY_FILTER]: {
      name: 'dropShadow',
      args: {
        dx: 0,
        dy: 8,
        blur: 20,
        color: 'rgba(37, 176, 121, 0.37)',
      },
    },
    [INNER_BORDER_STROKE]: '#25B079',
    [LABEL_FILL]: '#333',
    [GATE_FILL]: '#FDB215',
    [GATE_LINE_STROKE]: '#25B079',
  },
  activeLink: {
    [LINE_STROKE]: '#25B079',
  },
}

// 故障样式配置
export const faultConfig = {
  defaultNode: {
    [BODY_FILL]: '#FBFF86', // 节点填充颜色
    [BODY_STROKE]: '#C2C733', // 节点边框颜色
    [BODY_FILTER]: null, // 节点阴影
    [INNER_BORDER_STROKE]: '#C2C733', // 节点内边框颜色
    [LABEL_FILL]: '#333', // 文字颜色
    [GATE_FILL]: '#FF675F', // 与或门填充颜色
    [GATE_LINE_STROKE]: '#FF675F', // 与或门连接线颜色
  },
  defaultLink: {
    [LINE_STROKE]: '#FF675F', // 链接颜色
  },
  activeNode: {
    [BODY_FILL]: '#F8EA81',
    [BODY_STROKE]: '#C2C733',
    [BODY_FILTER]: {
      name: 'dropShadow',
      args: {
        dx: 0,
        dy: 8,
        blur: 20,
        color: '#FFD379',
      },
    },
    [INNER_BORDER_STROKE]: '#C2C733',
    [LABEL_FILL]: '#5B2900',
    [GATE_FILL]: '#FF675F',
    [GATE_LINE_STROKE]: '#FF675F',
  },
  activeLink: {
    [LINE_STROKE]: '#FF675F',
  },
}

// 门类型
export const gateTypes = {
  OR: {
    // path: "M -20 0 C -20 -15 -10 -30 0 -30 C 10 -30 20 -15 20 0 C 10 -6 -10 -6 -20 0",
    path: 'M16.8 -8.7832 L9.6286 -13.3361 L9.628 -13.3366 C3.5869 -17.1668 -3.6161 -17.1668 -9.65718 -13.3366 L-9.65928 -13.3352 -16.8 -8.7871 V-20.2615 V-24.3969 C-16.8 -29.9096 -14.30773 -34.7888 -10.58262 -37.07232 L-10.5804 -37.07364 0 -43.59063 10.5804 -37.07364 10.5826 -37.07232 C14.3077 -34.7888 16.8 -29.9096 16.8 -24.3969 V-20.2615 V-8.7832 Z',
    title: '或',
  },
  AND: {
    // path: "M -20 0 C -20 -25 -10 -30 0 -30 C 10 -30 20 -25 20 0 Z",
    path: 'M -6 -45 H 6 C 11 -45 16 -40 16 -34 V -9 H -17 V -34 C -17 -40 -12 -45 -6 -45 Z',
    title: '与',
  },
}

export const gateTypeTitles = Object.values(gateTypes).map(item => item.title)

// 事件父类
export const Event = dia.Element.define(
  'fta.Event',
  {
    z: 3,
    attrs: {
      root: {
        pointerEvents: 'bounding-box',
      },
      body: {
        stroke: normalConfig.defaultNode[BODY_STROKE],
        strokeWidth: 2,
        fill: normalConfig.defaultNode[BODY_FILL],
        // 'stroke-dasharray': '5,5', // 设置边框为虚线
        // filter: {
        //   name: 'dropShadow',
        //   args: {
        //     dx: 0,
        //     dy: 4,
        //     blur: 10,
        //     color: '#f4d637',
        //   },
        // },
      },
      label: {
        textWrap: {
          height: -20,
          width: -20,
          ellipsis: true,
        },
        x: 'calc(w / 2)',
        y: 'calc(h / 2)',
        fontSize: defaultConfig.fontSize,
        fontFamily: 'sans-serif',
        fill: normalConfig.defaultNode[LABEL_FILL],
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
      idBody: {
        display: 'none',
      },
      idLabel: {
        display: 'none',
      },
    },
  },
  {
    gate: function (type) {
      return this
    },
  },
  {
    create: function ({ id, label, raw }) {
      return new this({
        id,
        attrs: {
          root: {
            title: label,
          },
          label: { text: label },
        },
        raw,
      })
    },
  }
)

// 门事件父类
export const GateEvent = Event.define(
  'fta.GateEvent',
  {
    z: 3,
    attrs: {
      root: {
        pointerEvents: 'bounding-box',
      },
      body: {
        stroke: 'none',
        strokeWidth: 2,
        fill: normalConfig.defaultNode[BODY_FILL],
      },
      label: {
        textWrap: {
          height: -20,
          width: -20,
          ellipsis: true,
        },
        x: 'calc(w / 2)',
        y: 'calc(h / 2)',
        fontSize: defaultConfig.fontSize,
        fontFamily: 'sans-serif',
        fill: normalConfig.defaultNode[LABEL_FILL],
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
      },
      idBody: {
        display: 'none',
      },
      idLabel: {
        display: 'none',
      },
      gate: {
        display: 'none',
        event: 'element:gate:click',
        gateType: '',
        stroke: 'none',
        fill: '#FDB215',
        transform: 'translate(calc(w / 2), calc(h))',
        fillRule: 'nonzero',
        cursor: 'pointer',
      },
      gateLine: {
        display: 'none',
        stroke: normalConfig.defaultNode[GATE_LINE_STROKE],
        strokeWidth: defaultConfig.linkWidth,
        fill: 'none',
        pointerEvents: 'none',
        d: 'M 0 -50 0 -80',
        transform: 'translate(calc(w / 2), calc(h))',
      },
      gateLabel: {
        display: 'none',
        event: 'element:gate:click',
        text: '',
        x: 'calc(w / 2)',
        y: 'calc(h / 2 + 50)',
        fontSize: 14,
        fontFamily: 'sans-serif',
        fill: '#fff',
        textAnchor: 'middle',
        textVerticalAnchor: 'middle',
        cursor: 'pointer',
      },
    },
  },
  {
    gateTypes: gateTypes,
    gate: function (type) {
      if (type === undefined) {
        return this.attr(['gate', 'gateType'])
      }
      // console.log("size==", this.size());
      // console.log("type==", type);
      if (type === '' || type === null) {
        return this
        // return this.size({ width: 140, height: 64 });
      }
      let display = type ? 'inherit' : 'none'
      let labelY = type ? 'calc(h / 2 - 40)' : 'calc(h / 2)'
      let title = type ? gateTypes[type]?.title : ''
      let height = type ? 150 : 64

      this.attr(['gateLabel'], {
        text: title,
        display: display,
      })
      this.attr(['gateLine'], {
        display: display,
      })
      this.attr(['gate'], {
        gateType: type,
        title: title,
        display: display,
      })
      this.attr(['label'], {
        y: labelY,
      })
      return this.size({ width: 140, height: height })
    },
  },
  {
    attributes: {
      'gate-type': {
        set: function (type) {
          const path = this.model.gateTypes[type]?.path
          return { d: path ? path : 'M 0 0 0 0' }
        },
      },
    },
  }
)

// 顶事件
export const TopEvent = GateEvent.define(
  'fta.TopEvent',
  {
    size: {
      width: 140,
      height: 64,
    },
    attrs: {
      root: {
        title: '',
      },
      body: {
        width: 140,
        height: 64,
        rx: 4,
        ry: 4,
      },
      label: {
        y: 'calc(h / 2)',
      },
    },
  },
  {
    markup: util.svg`
			<rect @selector="body" />
			<text @selector="label" />
			<path @selector="gate" />
			<path @selector="gateLine" />
			<text @selector="gateLabel" />
		`,
  },
  {}
)

// 中间事件
export const IntermediateEvent = GateEvent.define(
  'fta.IntermediateEvent',
  {
    size: {
      width: 140,
      height: 64,
    },
    attrs: {
      root: {
        title: '',
      },
      body: {
        width: 140,
        height: 64,
        rx: 4,
        ry: 4,
      },
      label: {
        // x: "calc(w / 2)",
        y: 'calc(h / 2)',
        'text-decoration': 'none',
      },
      // 内边框
      innerBorder: {
        width: 132,
        height: 56,
        rx: 4,
        ry: 4,
        stroke: normalConfig.defaultNode[INNER_BORDER_STROKE],
        strokeWidth: 2,
        fill: 'none',
        'stroke-dasharray': '5,5',
        x: 4,
        y: 4,
        display: 'none',
      },
    },
  },
  {
    markup: util.svg`
      <rect @selector="body" />
      <text @selector="label" />
      <path @selector="gate" />
      <path @selector="gateLine" />
      <text @selector="gateLabel" />
			<rect @selector="innerBorder" />
    `,
  },
  {}
)

// 底事件
export const BasicEvent = Event.define(
  'fta.BasicEvent',
  {
    size: {
      width: 80,
      height: 80,
    },
    z: 3,
    attrs: {
      root: {
        title: '',
      },
      body: {
        cx: 'calc(w / 2)',
        cy: 'calc(h / 2)',
        r: 'calc(w / 2)',
        cursor: 'pointer',
      },
      label: {
        cursor: 'pointer',
        'text-decoration': 'none',
        // 'text-decoration': 'underline', // 设置下划线
      },
      // 内边框
      innerBorder: {
        cx: 'calc(w / 2)',
        cy: 'calc(h / 2)',
        r: 'calc(w / 2 - 4)',
        stroke: normalConfig.defaultNode[INNER_BORDER_STROKE],
        strokeWidth: 2,
        fill: 'none',
        'stroke-dasharray': '5,5',
        x: 4,
        y: 4,
        display: 'none',
      },
    },
  },
  {
    markup: util.svg`
			<circle @selector="body" />
			<text @selector="label" />
			<circle @selector="innerBorder" />
		`,
  }
)

// 链接
export const Link = dia.Link.define(
  'fta.Link',
  {
    attrs: {
      line: {
        connection: true,
        stroke: normalConfig.defaultLink[LINE_STROKE],
        strokeWidth: defaultConfig.linkWidth,
        strokeLinejoin: 'round',
      },
    },
    router: {
      name: 'orthogonal',
      // args: {
      //   endDirections: ['bottom'],
      // },
    },
  },
  {
    markup: util.svg`
			<path @selector="line" fill="none" pointer-events="none" />
		`,
  },
  {
    create: function (event1, event2) {
      const source = {
        id: event1.id,
        selector: 'body',
        // anchor: {
        //   name: 'bottom', // 设置连接点为底部
        //   args: {
        //     dx: 0, // 水平偏移量
        //     dy: 0, // 垂直偏移量
        //   },
        // },
      }
      const sourceEventType = event1.get('type')
      const sourceGateType = event1.attr('gate/gateType')
      const isTopOrImtermediateEvent = eventType => {
        return ['fta.TopEvent', 'fta.IntermediateEvent'].includes(eventType)
      }

      if (isTopOrImtermediateEvent(sourceEventType) && sourceGateType) {
        source.selector = 'gate'
      }
      return new this({
        z: 1,
        source,
        target: {
          id: event2.id,
          selector: 'body',
        },
      })
    },
  }
)

export const shapes = {
  ...defaultShapes,
  fta: {
    Event,
    GateEvent,
    TopEvent,
    IntermediateEvent,
    BasicEvent,
    Link,
  },
}
