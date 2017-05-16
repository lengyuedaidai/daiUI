/**
  扩展一个事件模块
**/

layui.define(function(exports) {
	var controlEvent = {
	_canFire:true,
	_events:{},
		/**
	触发事件
	type：事件类型
	event：事件参数
	**/
		fire: function(type, event) {
			if(this._canFire == false) return; //禁止触发事件
			type = type.toLowerCase();
			var handlers = this._events[type];
			if(handlers) {
				if(!event)
					event = {};
				if(event && event != this) {
					event.source = this;
					if(!event.type)
						event.type = type
				}
				for(var i = 0, length = handlers.length; i < length; i++) {
					var handler = handlers[i];
					if(handler) //handler: [ fn, context ]
						handler[0].apply(handler[1], [event])
				}
			}
		},
		/**
			注册事件
			type：事件类型
			fn:事件处理方法
			scope:事件作用域，this指代
			**/
		on: function(type, fn, scope) { //scope: context
			if(typeof fn == "string") {
				var _fn = daiUI._getFunctoin(fn);
				if(!_fn) {
					var id = daiUI.newId("__str_");
					window[id] = fn;
					eval("fn = function(e){var s = " +
						id +
						";var fn = daiUI._getFunctoin(s); if(fn) {fn.call(this, e)}else{eval(s);}}")
				} else
					fn = _fn
			}
			if(typeof fn != "function" || !type)
				return false;
			type = type.toLowerCase();
			var event = this._events[type];
			if(!event)
				event = this._events[type] = [];
			scope = scope || this;
			if(!this.findListener(type, fn, scope))
				event.push([fn, scope]);
			return this
		},
		/**
		反注册事件
		type：事件类型
		fn:事件处理方法
		scope:事件作用域，this指代
		**/
		un: function(type, fn, scope) {
			if(typeof fn != "function")
				return false;
			type = type.toLowerCase();
			var event = this._events[type];
			if(event) {
				scope = scope || this;
				var _event = this.findListener(type, fn, scope);
				if(_event)
					event.remove(_event)
			}
			return this
		},
		/**
		查找事件监听
		**/
		findListener: function(type, fn, scope) {
			type = type.toLowerCase();
			scope = scope || this;
			var event = this._events[type];
			if(event)
				for(var i = 0, l = event.length; i < l; i++) {
					var _event = event[i];
					if(_event[0] === fn && _event[1] === scope)
						return _event
				}
		}
	};

	//输出test接口
	exports('controlEvent', controlEvent);
});