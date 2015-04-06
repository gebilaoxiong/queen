define(function() {
	/*
		js 模板引擎 参考百度模板（评语怪死难用）

		@param {object} settings
			@param tmpl {string} 模板字符串
			@param escape {bool} 是否转义
		
		require(['utils/Template'],function(temp){

           var st=[
                "<h1>title:<%=title;%></h1>",
                "<%if(list.length>1) { %>",
                    "<% var len=list.length  %>",
                    "<h2>输出list，共有<%=len%>个元素</h2>",
                    "<ul>",
                        "<!-- 循环语句 for-->",
                        "<%for(var i=0;i<5;i++){%>",
                            "<li style='color:red;'><%=list[i]%></li>",
                        "<%}%>",
                    "</ul>",
                "<%}else{%>",
                    "<h2>没有list数据</h2> ",  
                "<%}%>"
            ].join('');

            var data={
                "title":'Queen框架 Template模板',
                "list":[
                    'test1:',
                    'test2:',
                    'test3:',
                    'test4:list[5]未定义，模板系统会输出空'
                ]
            };
            var t=new temp(st);
            document.body.innerHTML=t.compile(data);
        });
	*/
	var emptyString = '', //空字符串

		contentEscape = {
			'\\': '&#92;',
			'\'': '&#39;'
		},

		Template = function(settings) {
			var type = Q.type(settings);

			if (type == 'string' || type == 'array') {
				settings = {
					tmpl: type == 'array' ? settings.join(emptyString) : settings
				};
			}

			Q.extend(this, settings);

			/*默认为false*/
			this.escape = this.escape === true;

			this.preprocess();
		};

	Template.prototype = {

		commandPrefix: '<%', //命令

		commandPostfix: '%>',

		contentEscape: contentEscape,

		preprocess: function() {
			var html = String(this.tmpl),
				compileFnBody;

			//解码模板
			Q.each(this.generatePath(), function(_, pro) {
				html = html.replace.apply(html, pro);
			});

			this.tempHtml = html;

			/*
			var __outputArray__=[],
				(function($root){
					var __variables__='',__varName__;
					for(__varName__ in $root){
						__variables__ += 'var ' + __varName__ + '= $root[\"' +__varName__+ '\"] ;';
					};
					eval(__variables__);
					__outputArray__.push('" + this.getTempHtml() + "');
					__variables__=null
				}).call(this,data);
			return __outputArray__.join('');
			*/

			compileFnBody = [
				"var __outputArray__=[];",
				"(function($root){",
				"var __variables__='',__varName__='';",
				"if(Object.prototype.toString.call($root) =='[object Object]'){",
				"for(__varName__ in $root){",
				"__variables__ += 'var ' + __varName__ + '= $root[\"' +__varName__+ '\"] ;';",
				"};",
				"eval(__variables__);",
				"}",
				"__outputArray__.push('" + html + "');",
				"__variables__=null",
				"}).call(this,data);",
				"return __outputArray__.join('');"
			].join(emptyString);

			this.compile = new Function("data", compileFnBody);
		},
		/*编译一组数据*/
		eachCompile: function(obj) {
			var ret;

			if (!obj) {
				return ret;
			}
			
			ret= '';

			Q.each(obj, function(_, item) {
				ret += this.compile(item);
			}, this);

			return ret;
		},

		/*设置模板*/
		setHtmlTmpl: function(temp) {
			if (!temp || temp == this.html) {
				return;
			}

			this.html = temp;
			this.preprocess();
		},

		getTempHtml: function() {
			return this.tempHtml;
		},

		//生成解析路径
		generatePath: function() {
			var pre = this.escapeReg(this.commandPrefix),
				post = this.escapeReg(this.commandPostfix),
				path = [];

			//注释
			path.push([new RegExp('(?:' + pre + '(?!' + post + '))*//.*(?=' + post + ')|<!--.*?-->', 'g'), emptyString]);
			//清除格式
			path.push([/[\t]/g, emptyString]);
			//<%(?:(?!%>)[\s\S])*%>|((?:(?!<%)[\s\S])+) 转义非js语句中的'和\
			path.push([new RegExp(pre + '(?:(?!' + post + ')[\\s\\S])*' + post + '|((?:(?!' + pre + ')[\\s\\S])+)', 'g'), this.escapeHtmlContent]);

			//语句处理
			//未加;的变量声明
			//(<%[\s]*?var[\s]*?.*?[\s]*?[^;])[\s]*?%>
			path.push([new RegExp("(" + pre + "[\\s]*?var[\\s]*?.*?[\\s]*?[^;])[\\s]*?" + post, 'g'), '$1;' + this.commandPostfix])
			//输出语句去掉分号
			//(<%=(?:(?!%>)[\s\S])*);%>
			path.push([new RegExp('(' + pre + '=(?:(?!' + post + ')[\\s\\S])*);' + post, 'g'), '$1' + this.commandPostfix])
			//替换语句左边界
			path.push([new RegExp(pre, 'g'), "\t"]);

			//内容处理
			//\t(?!:|:h)\s*?=\s*?((?:(?!%>)[\s\S])*?)\s*?%>
			//默认设置 是否转义
			path.push([
				new RegExp('\\t(?!:|:h)\\s*?=\\s*?((?:(?!' + post + ')[\\s\\S])*?)\\s*?' + post, "g"),
				this.escape === false ?
				"',$1 === undefined?'':$1,'" :
				"',$1 === undefined?'':this.escapeHtml($1),'"
			]);

			//强制转义
			//\t:h=(.*)\s*?%>
			path.push([new RegExp('\\t:h=(.*)\\s*?%>', 'g'), "',$1 === undefined?'':this.escapeHtml($1),'"])
			//强制不转义
			//\t:=(.*)\s*?%>
			path.push([new RegExp('\\t:=(.*)\\s*?%>', 'g'), "',$1 === undefined?'':$1,'"])

			//将原左边界换成');
			path.push([/\t/g, "');"]);

			path.push([new RegExp(post, 'g'), "__outputArray__.push('"]);

			//将标签内的引替换为\'
			path.push([/\r/g, "\\\'"]);

			return path;
		},

		//转义HTML内容中的冒号和斜杠
		escapeHtmlContent: function(matche, $1) {
			if ($1) {
				return $1.replace(/(\\)|(<[^<]*?\'[^<]*?>)|(\')/g, function(_, r1, r2, r3) {
					if (r1 || r3) {
						return contentEscape[r1 || r3];
					}
					//标签内的冒号
					return r2.replace(/\'/g, "\r");
				});
			}
			return matche;
		},

		escapeReg: function(str) {
			return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
		},

		escapeHtml: function(source) {
			return String(source)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/\\/g, '&#92;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;');
		}

	};

	return Template;
});