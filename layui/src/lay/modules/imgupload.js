/**
  扩展一个test模块
**/

layui.define(["jquery", "upload", "controlEvent", "layer"], function(exports) {
	var $ = layui.jquery,
		tree = layui.tree,
		layer = layui.layer,
		event = layui.controlEvent,
		// 判断浏览器是否支持图片的base64
		isSupportBase64 = (function() {
			var data = new Image();
			var support = true;
			data.onload = data.onerror = function() {
				if(this.width != 1 || this.height != 1) {
					support = false;
				}
			}
			data.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
			return support;
		})(),
		supportTransition = (function() {
			var s = document.createElement('p').style,
				r = 'transition' in s ||
				'WebkitTransition' in s ||
				'MozTransition' in s ||
				'msTransition' in s ||
				'OTransition' in s;
			s = null;
			return r;
		})(),
		content = "<div class=\"imgupload-container\">" +
		"    <div class=\"imgupload-uploader\">" +
		"        <div class=\"imgupload-queueList\">" +
		"            <div class=\"placeholder\">	<i class=\"layui-icon\" style=\"font-size: 70px;\">&#xe64a;</i>" +
		"                <div id=\"filePicker\"></div>" +
		"                <p>或将照片拖到这里，单次最多可选300张</p>" +
		"            </div>" +
		"        </div>" +
		"        <div class=\"statusBar\" style=\"display:none;\">" +
		"            <div class=\"progress\">	<span class=\"text\">0%</span>" +
		"                <span class=\"percentage\"></span>" +
		"            </div>" +
		"            <div class=\"info\"></div>" +
		"            <div class=\"btns\">" +
		"                <div id=\"filePicker2\"></div>" +
		"                <div class=\"uploadBtn\">开始上传</div>" +
		"            </div>" +
		"        </div>" +
		"    </div>" +
		"</div>";
	var ImgUpload = function(options) {
		this.options = $.extend({

		}, options);
		var that = this;
		this.percentages = {}; // 所有文件的进度信息，key为file id
		var dialog = layer.open({
			title: '上传图片',
			type: 1,
			area: ['500px', '370px'],
			content: content,
			onload: function(e) {
				that.$el = this.layero;
				// 图片容器
				that.$queue = $('<ul class="filelist"></ul>').appendTo(that.$el.find('.imgupload-queueList'));
				// 状态栏，包括进度和控制按钮
				that.$statusBar = that.$el.find('.statusBar');
				// 文件总体选择信息。
				that.$info = that.$statusBar.find('.info');
				// 上传按钮
				that.$upload = that.$el.find('.uploadBtn');
				// 没选择文件之前的内容。
				that.$placeHolder = that.$el.find('.placeholder');
				that.$progress = that.$statusBar.find('.progress').hide();
				// 添加的文件数量
				that.fileCount = 0;

				// 添加的文件总大小
				that.fileSize = 0;

				// 优化retina, 在retina下这个值是2
				that.ratio = window.devicePixelRatio || 1;

				// 缩略图大小
				that.thumbnailWidth = 110 * that.ratio;
				that.thumbnailHeight = 110 * that.ratio;

				// 可能有pedding, ready, uploading, confirm, done.
				that.tate = 'pedding';

				// 所有文件的进度信息，key为file id
				that.percentages = {};
				setTimeout(function() {
					that.initAfterRender();
					that._initEvents();
				}, 300);

			}
		});

	};
	$.extend(ImgUpload.prototype, {
		initAfterRender: function() {
			var that = this;
			// 实例化

			this.uploader = WebUploader.create({
				pick: {
					id: '#filePicker',
					label: '点击选择图片'
				},
				dnd: '.placeholder',
				paste: '.imgupload-uploader',
				chunked: false,
				chunkSize: 512 * 1024,
				server: '../../Account/uploadImage/upload',

				accept: {
					title: 'Images',
					extensions: 'gif,jpg,jpeg,bmp,png',
					mimeTypes: 'image/*'
				},

				// 禁掉全局的拖拽功能。这样不会出现图片拖进页面的时候，把图片打开。
				disableGlobalDnd: true
			});
			// 添加“添加文件”的按钮，
			this.uploader.addButton({
				id: '#filePicker2',
				label: '继续添加'
			});
			// 拖拽时不接受 js, txt 文件。
			this.uploader.on('dndAccept', function(items) {
				var denied = false,
					len = items.length,
					i = 0,
					// 修改js类型
					unAllowed = 'text/plain;application/javascript ';
				for(; i < len; i++) {
					// 如果在列表里面
					if(~unAllowed.indexOf(items[i].type)) {
						denied = true;
						break;
					}
				}
				return !denied;
			});
			this.uploader.onUploadProgress = function(file, percentage) {
				var $li = $('#' + file.id),
					$percent = $li.find('.progress span');

				$percent.css('width', percentage * 100 + '%');
				that.percentages[file.id][1] = percentage;
				that.updateTotalProgress();
			};
			this.uploader.onFileQueued = function(file) {
				debugger;
				that.fileCount++;
				that.fileSize += file.size;
				if(that.fileCount === 1) {
					that.$placeHolder.addClass('element-invisible');
					that.$statusBar.show();
				}
				that.addFile(file);
				that.setState('ready');
				that.updateTotalProgress();
			};
			this.uploader.onFileDequeued = function(file) {
				that.fileCount--;
				that.fileSize -= file.size;
				if(!that.fileCount) {
					that.setState('pedding');
				}
				that.removeFile(file);
				that.updateTotalProgress();
			};
			this.uploader.on('all', function(type) {
				var stats;
				switch(type) {
					case 'uploadFinished':
						that.setState('confirm');
						break;
					case 'startUpload':
						that.setState('uploading');
						break;
					case 'stopUpload':
						that.setState('paused');
						break;
				}
			});
			this.uploader.on("uploadSuccess", function(file, response) {
				if(response.status) {
					file["saveInfo"] = response.data;
					var id = response.data[that.repositoryIdField]
					that.fileList["img-" + id] = file;
					that.value.push(id);
				} else {
					console.error('Eroor: ' + response.msg);
				}
			});
			this.uploader.on("fileDequeued", function(file) {
				if(file["saveInfo"]) {
					var id = file["saveInfo"][that.repositoryIdField];
					var name = "img" + id;
					delete that.fileList[name];
					that.value.remove(id);
				}

			})

			this.uploader.onError = function(code) {
				console.error('Eroor: ' + code);
			};
			this.$upload.on('click', function() {
				if($(this).hasClass('disabled')) {
					return false;
				}
				if(that.state === 'ready') {
					that.uploader.upload();
				} else if(that.state === 'paused') {
					that.uploader.upload();
				} else if(that.state === 'uploading') {
					that.uploader.stop();
				}
			});
			this.$upload.addClass('state-' + that.state);
			this.updateTotalProgress();
		},
		_initEvents: function() {
			var that = this;
			this.$info.on('click', '.retry', function() {
				that.uploader.retry();
			});

			this.$info.on('click', '.ignore', function() {
				that.alert('todo');
			});

		},
		getValue: function() {
			return this.value.join(',');
		},
		// 当有文件添加进来时执行，负责view的创建
		addFile: function(file) {
			var that = this;
			var $li = $('<li id="' + file.id + '">' +
					'<p class="title">' + file.name + '</p>' +
					'<p class="imgWrap"></p>' +
					'<p class="progress"><span></span></p>' +
					'</li>'),
				$btns = $('<div class="file-panel">' +
					'<span class="cancel">删除</span>' +
					'<span class="rotateRight">向右旋转</span>' +
					'<span class="rotateLeft">向左旋转</span></div>').appendTo($li),
				$prgress = $li.find('p.progress span'),
				$wrap = $li.find('p.imgWrap'),
				$info = $('<p class="error"></p>'),
				showError = function(code) {
					switch(code) {
						case 'exceed_size':
							text = '文件大小超出';
							break;

						case 'interrupt':
							text = '上传暂停';
							break;

						default:
							text = '上传失败，请重试';
							break;
					}

					$info.text(text).appendTo($li);
				};

			if(file.getStatus() === 'invalid') {
				showError(file.statusText);
			} else {
				$wrap.text('预览中');
				this.uploader.makeThumb(file, function(error, src) {
					var img;
					if(error) {
						$wrap.text('不能预览');
						return;
					}

					if(isSupportBase64) {
						img = $('<img src="' + src + '">');
						$wrap.empty().append(img);
					} else {
						$wrap.text("预览出错");
					}
				}, this.thumbnailWidth, this.thumbnailHeight);
				this.percentages[file.id] = [file.size, 0];
				file.rotation = 0;
			}
			file.on('statuschange', function(cur, prev) {
				if(prev === 'progress') {
					$prgress.hide().width(0);
				} else if(prev === 'queued') {
					$li.off('mouseenter mouseleave');
					$btns.remove();
				}
				// 成功
				if(cur === 'error' || cur === 'invalid') {
					console.log(file.statusText);
					showError(file.statusText);
					that.percentages[file.id][1] = 1;
				} else if(cur === 'interrupt') {
					showError('interrupt');
				} else if(cur === 'queued') {
					that.percentages[file.id][1] = 0;
				} else if(cur === 'progress') {
					$info.remove();
					$prgress.css('display', 'block');
				} else if(cur === 'complete') {
					$li.append('<span class="success"></span>');
				}
				$li.removeClass('state-' + prev).addClass('state-' + cur);
			});
			$li.on('mouseenter', function() {
				$btns.stop().animate({ height: 30 });
			});
			$li.on('mouseleave', function() {
				$btns.stop().animate({ height: 0 });
			});
			$btns.on('click', 'span', function() {
				var index = $(this).index(),
					deg;
				switch(index) {
					case 0:
						that.uploader.removeFile(file);
						return;
					case 1:
						file.rotation += 90;
						break;
					case 2:
						file.rotation -= 90;
						break;
				}
				if(supportTransition) {
					deg = 'rotate(' + file.rotation + 'deg)';
					$wrap.css({
						'-webkit-transform': deg,
						'-mos-transform': deg,
						'-o-transform': deg,
						'transform': deg
					});
				} else {
					$wrap.css('filter', 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + (~~((file.rotation / 90) % 4 + 4) % 4) + ')');
				}

			});
			$li.appendTo(this.$queue);
		},
		// 负责view的销毁
		removeFile: function(file) {
			var $li = $('#' + file.id);
			delete this.percentages[file.id];
			this.updateTotalProgress();
			$li.off().find('.file-panel').off().end().remove();
		},

		updateTotalProgress: function(file) {
			var loaded = 0,
				total = 0,
				spans = this.$progress.children(),
				percent;
			$.each(this.percentages, function(k, v) {
				total += v[0];
				loaded += v[0] * v[1];
			});
			percent = total ? loaded / total : 0;
			spans.eq(0).text(Math.round(percent * 100) + '%');
			spans.eq(1).css('width', Math.round(percent * 100) + '%');
			this.updateStatus();
		},
		updateStatus: function() {
			var text = '',
				stats;
			if(this.state === 'ready') {
				text = '选中' + this.fileCount + '张图片，共' +
					WebUploader.formatSize(this.fileSize) + '。';
			} else if(this.state === 'confirm') {
				stats = this.uploader.getStats();
				if(stats.uploadFailNum) {
					text = '已成功上传' + stats.successNum + '张照片至XX相册，' +
						stats.uploadFailNum + '张照片上传失败，<a class="retry" href="#">重新上传</a>失败图片或<a class="ignore" href="#">忽略</a>'
				}
			} else {
				stats = this.uploader.getStats();
				text = '共' + this.fileCount + '张（' +
					WebUploader.formatSize(this.fileSize) +
					'），已上传' + stats.successNum + '张';
				if(stats.uploadFailNum) {
					text += '，失败' + stats.uploadFailNum + '张';
				}
			}
			//this.$info.html(text);
		},
		setState: function(val) {
			var file, stats;
			if(val === this.state) {
				return;
			}
			this.$upload.removeClass('state-' + this.state);
			this.$upload.addClass('state-' + val);
			this.state = val;
			switch(this.state) {
				case 'pedding':
					this.$placeHolder.removeClass('element-invisible');
					this.$queue.hide();
					this.$statusBar.addClass('element-invisible');
					this.uploader.refresh();
					break;
				case 'ready':
					this.$placeHolder.addClass('element-invisible');
					$('#filePicker2').removeClass('element-invisible');
					this.$queue.show();
					this.$statusBar.removeClass('element-invisible');
					this.uploader.refresh();
					break;
				case 'uploading':
					$('#filePicker2').addClass('element-invisible');
					this.$progress.show();
					this.$upload.text('暂停上传');
					break;
				case 'paused':
					this.$progress.show();
					this.$upload.text('继续上传');
					break;
				case 'confirm':
					this.$progress.hide();
					$('#filePicker2').removeClass('element-invisible');
					this.$upload.text('开始上传');
					stats = this.uploader.getStats();
					if(stats.successNum && !stats.uploadFailNum) {
						this.setState('finish');
						return;
					}
					break;
				case 'finish':
					stats = this.uploader.getStats();
					if(stats.successNum) {
						alert('上传成功');
					} else {
						this.state = 'done';
						location.reload();
					}
					break;
			}
			this.updateStatus();
		}
	}, event);
	//imgupload
	exports('imgupload', function(options) {
		options = options || {}
		var imgupload = new ImgUpload(options);
		return imgupload;
	});
});