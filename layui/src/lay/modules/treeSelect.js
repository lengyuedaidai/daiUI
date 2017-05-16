/**
  扩展一个test模块
**/

layui.define([
	'jquery',
	'tree',
	'controlEvent'
], function(exports) { //提示：模块也可以依赖其它模块，如：layui.define('layer', callback);
	"use strict";
	var $ = layui.jquery,
		tree = layui.tree,
		event = layui.controlEvent,
		TreeSelect = function(options) {
			this.options = $.extend({
				valueField: "name",
				textField: "name"
			}, options);
		};
	TreeSelect.prototype = {};
	$.extend(TreeSelect.prototype, {
		TIPS: '请选择',
		CLASS: 'layui-form-select',
		TITLE: 'layui-select-title',
		NONE: 'layui-select-none',
		initValue: '',
		thatInput: null,
		init: function(elem) {
			var that = this;
			var hasRender = elem.next('.' + this.CLASS),
				disabled = this.disabled,
				readonly, disabled, value;
			var options = this.options;
			//替代元素
			this.reElem = $(['<div class="layui-unselect ' + this.CLASS + (disabled ? ' layui-select-disabled' : '') + '">',
				'<div class="' + this.TITLE + '"><input type="text" placeholder="' + this.TIPS + '" value="' + (value ? value : '') + '" ' + (readonly ? '' : 'readonly') + ' class="layui-input layui-unselect' + (disabled ? (' ' + DISABLED) : '') + '">',
				'<i class="layui-edge"></i></div>',
				'<dl class="layui-anim layui-anim-upbit"><ul></ul></dl>',
				'</div>'
			].join(''));
			hasRender[0] && hasRender.remove(); //如果已经渲染，则Rerender
			elem.after(this.reElem);
			this.title = this.reElem.find('.' + this.TITLE);
			this.input = this.title.find('input');
			var optionsTree = $.extend({}, options, {
				elem: ".layui-anim ul",
				click: function(node) {
					elem.val(node[options.valueField]);
					that.input.val(node[options.textField]);
					that.hideDown();
				}
			});
			this.tree = tree(optionsTree);
			//点击标题区域
			this.title.on('click', function(e) {
				that.reElem.hasClass(that.CLASS + 'ed') ? (
					that.hideDown()
				) : (
					that.hide(e, true),
					that.showDown()
				);
			});

			//点击箭头获取焦点
			this.title.find('.layui-edge').on('click', function() {
				input.focus();
			});

			//键盘事件
			this.input.on('keyup', function(e) {
				var keyCode = e.keyCode;
				//Tab键
				if(keyCode === 9) {
					that.showDown();
				}
			}).on('keydown', function(e) {
				var keyCode = e.keyCode;
				//Tab键
				if(keyCode === 9) {
					that.hideDown();
				} else if(keyCode === 13) { //回车键
					e.preventDefault();
				}
			});

		},
		showDown: function() {
			this.reElem.addClass(this.CLASS + 'ed');
		},
		hideDown: function() {
			this.reElem.removeClass(this.CLASS + 'ed');
			this.input.blur();
		},
		hide: function(e, clear) {
			if(!$(e.target).parent().hasClass(this.TITLE) || clear) {
				$('.' + this.CLASS).removeClass(this.CLASS + 'ed');
				this.thatInput && this.initValue && this.thatInput.val(initValue);
			}
			this.thatInput = null;
		},
		test: function() {
			this.fire("test");
		}
	}, event)
	//输出test接口
	exports('treeSelect', function(options) {
		var treeSelect = new TreeSelect(options = options || {});
		var elem = $(options.elem);
		if(!elem[0]) {
			return hint.error('layui.treeSelect 没有找到' + options.elem + '元素');
		}
		treeSelect.init(elem);
		return treeSelect;
	});
});