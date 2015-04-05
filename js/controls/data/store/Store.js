define([
  'util/Observable',
  'data/proxy/Ajax',
  'data/Api',
  'data/reader/Reader',
  'data/StoreManager',
  'data/writer/Json',
  'data/RecordManager',
  'data/Record',
  'data/Group',
  'util/Sorter',
  'util/Filter'
], function(
  Observable, HttpProxy,
  DataApi, DataReader,
  StoreManager, JsonWriter,
  RecordManager, DataRecord,
  Group, Sorter, filter
) {

  var Store = Q.Class.define(Observable, {

      type: 'Store',

      sortRoot: 'data',

      statics: {
        getIdFn: function(record) {
          return record.id;
        },
        grouperIdFn: function(grouper) {
          return String(grouper.id || grouper.property);
        },
        groupIdFn: function(group) {
          return String(group.key);
        }
      },

      writer: undefined,

      /*是否启用服务器排序*/
      remoteSort: false,

      /*
           如果此参数为true，
           当绑定此store的组件被销毁之后此store也会被销毁 
           */
      autoDestroy: false,

      /*
           此值为true将在 store被加载或者一条记录被删除时 
           清除该记录的修改信息(默认为 false)。
           */
      pruneModifiedRecords: false,

      /*
           最后一次提交所用的参数
           */
      lastOptions: null,

      /*
           true时 如果一条记录被修改（dirty:true） 将立即发送到服务器端
           false时为手动提交
           */
      autoSave: true,

      /*
           默认为 true (除非 restful:true )。 
           每个CRUD操作的多次请求 将会被合在一起
           并且作为一次事务发送出去。 

           只有在 autoSave 参数被设置成 false时应用。 
           */
      batch: true,

      restful: false,

      /*
           一个包含多个属性的对象，
           指定了分页和排序参数的名称，
           在加载数据时被传递给 远程服务器。 
           默认情况下，此对象拥有如下格式: 
           {
           start : 'start',  // 指定起始行的参数名
           limit : 'limit',  // 指定返回数据条数的参数名
           sort : 'sort',    // 指定排序字段的参数名
           dir : 'dir'       // 指定排序方向的参数名
           }
           */
      paramNames: undefined,

      defaultParamNames: {
        start: 'start',
        limit: 'limit',
        sorter: 'sorters',
        filter: 'filters'
      },

      /*是否每一次载入完毕后对数据排序*/
      sortOnLoad: true,

      /*是否启用服务器端过滤*/
      remoteFilter: false,

      /*是否每一次载入完毕后对数据过滤*/
      filterOnLoad: true,

      batchKey: '_batch_',

      isDestroyed: false,

      init: function(settings) {
        settings = Q.extend({}, settings);

        var me = this,
          readerMetaChange,
          filters;

        me.data = new Q.MixCollection(Store.getIdFn);

        //删除的数据
        me.removed = [];

        //以内联的方式声明的data
        if (settings.data) {
          me.inlineDate = settings.data;
          delete settings.data;
        }

        Q.extend(me, settings);

        //默认参数
        me.baseParams = Q.isObject(me.baseParams) ?
          me.baseParams : {};

        //参数名称
        me.paramNames = Q.applyIf(this.paramNames || {}, this.defaultParamNames);

        //构建proxy
        if ((me.url || me.api) && !me.proxy) {
          me.proxy = new HttpProxy({
            url: me.url,
            api: me.api
          });
        }

        //restful
        if (me.restful === true && me.proxy) {
          me.batch = false;
          DataApi.restify(me.proxy);
        }

        //reader
        if (me.reader) {
          //通过reader获取record类型{string/function/fields[]}
          if (!me.recordType) {
            me.recordType = me.reader.recordType;
          }

          //当reader的元数据发生变化后 调用store的onMetaChange
          if (me.reader.onMetaChange) {
            readerMetaChange = me.reader.onMetaChange;

            me.reader.onMetaChange = function() {
              //调用原始代码
              var ret = readerMetaChange.apply(this, arguments);
              //调用绑定函数
              me.onMetaChange.apply(this, arguments);
              return ret;
            };
          }

          if (me.writer) {
            if (me.writer.isXType && !me.writer.isXType('DataWriter')) { //<-配置json而非实例
              me.writer = me.buildWriter(me.writer);
            }
            me.writer.meta = me.reader.meta;
            me.pruneModifiedRecords = true; //变化时自动提交
          }
        }

        //record类型
        if (Q.isString(me.recordType)) { //record名称
          me.fields = RecordManager.get(me.recordType).prototype.fields;
        } else if (me.recordType) {
          me.fields = me.recordType.prototype.fields;
        }

        //变更记录
        me.modified = [];

        if (me.proxy) {
          me.relayEvents(me.proxy, ['loadexception', 'exception']);
        }

        //监听添加/删除远程创建/毁坏事件记录
        if (me.writer) {
          me.bind({
            scope: me,
            add: me.createRecords,
            remove: me.destroyRecord,
            update: me.updateRecord,
            clear: me.onClear
          });
        }

        me.initSortable();


        filters = me.decodeFilters(me.filters);
        me.filters = new Q.MixCollection(Store.getIdFn);
        me.filters.add(filters.data);


        //绑定setting中的listeners
        me.callParent(arguments);

        if (me.id) {
          me.storeId = me.id;
          delete me.id;
        }

        if (this.storeId) { //注册
          StoreManager.register(this);
        }


        if (me.inlineDate) {
          me.loadData(me.inlineDate);

          delete me.inlineDate;
        } else if (me.autoLoad) { //自动加载
          me.autoLoad = typeof me.autoLoad == 'object' ?
            me.autoLoad : undefined;
          setTimeout(Q.proxy(me.load, me, me.autoLoad), 10);
        }

        me.batchCounter = 0;
        me.batches = {};
      },

      onBeforeSort: Q.noop,

      buildWriter: function(settings) {
        var type = String(settings.format).toLowerCase(),
          klass = dataWriters[type];

        return new klass(settings);
      },

      /*销毁*/
      destroy: function() {
        if (!this.isDestroyed) {

          if (this.storeId) {
            StoreManager.unregister(this);
          }

          this.clearData();
          this.data = null;
          Q.destroy(this.proxy);
          this.reader = this.writer = null;
          this.unbind();
          this.isDestroyed = true;
        }
      },


      updateGroupsOnAdd: function(records) {
        var me = this,
          groups = me.groups,
          len = records.length,
          i, groupName, group, rec;

        for (i = 0; i < len; ++i) {
          rec = records[i];
          groupName = me.getGroupString(rec);
          group = groups.keys[groupName];
          if (!group) {
            groups.add(new Group({
              key: groupName,
              store: me
            }));
            group = groups.keys[groupName];
          }
          group.add(rec);
        }
      },

      updateGroupsOnRemove: function(records) {
        var me = this,
          groups = me.groups,
          len = records.length,
          i, groupName, group, rec;

        for (i = 0; i < len; ++i) {
          rec = records[i];
          groupName = me.getGroupString(rec);
          group = groups.keys[groupName];

          if (group) {
            group.remove(rec);
            if (group.records.length === 0) {
              groups.remove(group);
            }
          }
        }
      },

      /*
           向Store中添加记录 并触发 add 事件
           @param {record[]} records
           */
      add: function(records) {
        var i, len, record, index;

        records = [].concat(records);
        if (records.length < 1) {
          return;
        }

        for (i = 0, len = records.length; i < len; i++) {
          record = records[i];

          record.join(this);

          if (record.dirty || record.phantom) {
            this.modified.push(record);
          }
        }

        index = this.data.length;
        this.data.add(records);

        if (this.snapshot) {
          this.snapshot.add(records);
        }

        this.fire('add', this, records, index);
      },

      /*
           将新的record变成dirty
           并添加到变更记录中
           */
      createRecords: function(store, records, index) {
        var modified = this.modified,
          record, i = 0;

        while (record = records[i++]) {
          if (record.phantom && record.isValid()) {
            record.markDirty();
          }

          if (Q.inArray(record, modified) == -1) {
            modified.push(record);
          }
        }

        if (this.autoSave) {
          this.save();
        }
      },

      /*
           (只支持本地排序) 
           将传递的Record插入到Store中的位置， 
           它基于当前的排序信息。
           */
      addSorted: function(record) {
        var index = this.findInsertIndex(record); //获取插入的位置
        this.insert(index, record);
      },

      createRecord: function(record) {
        if (!record.isRecord) {
          record = RecordManager.create(record, this.recordType);
        }

        return record;
      },

      insert: function(index, records) {
        var i, len, record;

        records = [].concat(records);
        for (i = 0, len = records.length; i < len; i++) {
          record = records[i];

          this.data.insert(index + i, record);
          record.join(this);

          if (record.dirty || record.phantom) {
            this.modified.push(record);
          }
        }

        if (this.snapshot) {
          this.snapshot.add(records);
        }

        this.fire('add', this, records, index);
      },

      indexOf: function(record) {
        return this.data.indexOf(record);
      },

      indexOfId: function(id) {
        return this.data.indexOfKey(id);
      },

      getById: function(id) {
        //快照优先
        return (this.snapshot || this.data).key(id);
      },

      getAt: function(index) {
        return this.data.get(Number(index));
      },

      getRange: function(start, end) {
        return this.data.getRange(start, end);
      },

      /*
           更新record 并发出事件
           */
      doUpdate: function(record) {
        var id = record.id;

        this.data.get(id).join(null);

        this.data.replace(id, record);

        //过滤中。。
        if (this.snapshot) {
          this.snapshot.replace(id, record);
        }
        record.join(this);
        //store, record, action
        this.fire('update', this, record, DataRecord.COMMIT)
      },

      updateRecord: function(store, record, action) {
        if (action == DataRecord.EDIT &&
          this.autoSave === true &&
          (!record.phantom || (record.phantom && record.isValid()))) {
          this.save();
        }
      },
      /*
           从store中删除record并触发事件
           @param {Record/Record[]} record
           */
      remove: function(record) {
        var index, i;

        if (Q.isArrya(record)) { //数组
          Q.each(record, function(_, item) {
            this.remove(item);
          }, this);
        }

        if (!record) {
          return;
        }

        index = this.data.indexOf(record);

        if (index > -1) {
          record.join(null);
          this.data.removeAt(index);
        }

        //删除该记录的变更记录
        if (this.pruneModifiedRecords) {
          while ((i = Q.inArray(record, this.modified)) > -1) {
            this.modified.splice(i, 1);
          }
        }

        if (this.snapshot) {
          this.snapshot.remove(record);
        }

        if (index > -1) {
          this.fire('remove', this, record, index)
        }
      },

      removeAt: function(index) {
        this.remove(this.getAt(index));
      },

      /*清除数据*/
      clearData: function() {
        this.data.each(function() {
          this.join(null);
        });

        this.data.clear();
      },

      /*
           删除所有数据
           如果存在writer则调用onClear
           */
      removeAll: function(silent) {
        var items = this.data.toArray();

        this.clearData();

        //处于过滤中
        if (this.snapshot) {
          this.snapshot.each(function() {
            this.join(null);
          });
          this.snapshot.clear();
        }

        //删除变更记录
        if (this.pruneModifiedRecords) {
          this.modified = [];
        }

        if (silent !== true) {
          this.fire('clear', this, items);
        }
      },

      /*
           在删除的数据上依次调用destroyRecord
           */
      onClear: function(store, records) {
        Q.each(records, function(index, rec) {
          this.destroyRecord(this, rec, index);
        }, this);
      },

      destroyRecord: function(store, record, index) {
        var i;

        //从变更记录中删除record
        while ((i = Q.inArray(record, this.modified)) > -1) {
          this.modified.splice(i, 1);
        }

        //如果数据是已经存在在数据库中的
        if (!record.phantom) {
          this.removed.push(record);

          //从服务器端尚未完全执行删除请求的时候
          //必须保留这个记录最后存在的位置
          //如果服务器发生错误 以便放回data中
          record.lastIndex = index;

          if (this.autoSave === true) {
            this.save();
          }
        }
      },

      /*缓存最后q请求参数*/
      storeOptions: function(o) {
        o = Q.extend({}, o);
        delete o.callback;
        delete o.scope;
        this.lastOptions = o;
      },

      load: function(options) {
        var me = this;

        options = Q.extend({}, options);
        me.storeOptions(options); //缓存最后q请求参数

        options.params = Q.extend({}, options.params);

        if (me.remoteFilter) { //服务器端过滤
          options.params[me.paramNames.filter] = me.filters.invoke('toJson');
        }

        if (me.remoteSort) { //将排序参数附加到params中
          options.params[me.paramNames.sorter] = me.sorters.invoke('toJson');
        }

        try {
          return me.execute('read', null, options);
        } catch (e) {
          me.handleException(e);
          return false;
        }
      },
      /*
           @param {string} action
           @param {Record|Record[]} rs,
           @param {object} options
           */
      execute: function(action, records, options, /*private*/ batch) {
        var me = this,
          doRequest;

        //判断动作是否存在
        if (!DataApi.isAction(action)) {
          throw new DataApi.Exception('execute', action);
        }

        //默认请求参数
        options = Q.applyIf(options || {}, {
          params: {}
        });

        //防止缓存
        if (batch !== undefined) {
          me.addToBatch(batch);
        }

        doRequest = true;

        //读操作
        if (action === 'read') {
          //如果为read 判断外部是否要求中断发送
          doRequest = me.fire('beforeload', me, options);
          //附加baseParams
          Q.applyIf(options.params, me.baseParams);
        }
        //写操作
        else {
          //如果writer的listful为true,那么单个的record将变成[record]
          if (me.writer.listful === true && me.restful !== true) {
            records = Q.isArray(records) ? records : [records];
          }
          //单个记录
          else if (Q.isArray(records) && records.length == 1) {
            records = records.shift();
          }

          //判断外部是否阻止提交
          if ((doRequest = me.fire('beforewrite', me, action, records, options)) !== false) {
            //填充params
            me.writer.apply(options.params, me.baseParams, action, records);
          }
        }

        if (doRequest !== false) {
          if (me.writer && me.proxy.url && !me.proxy.restful && !DataApi.hasUniqueUrl(me.proxy, action)) {
            options.param.xaction = action;
          }

          me.proxy && me.proxy.request(
            DataApi.actions[action],
            records,
            options.params,
            me.reader,
            me.createCallback(action, records, batch), //创建回调 如果为load则调用loadRecords
            me,
            options);
        }
        return doRequest;
      },

      addToBatch: function(batch) {
        var b = this.batches,
          key = this.batchKey + batch,
          o = b[key];

        if (!o) {
          b[key] = o = {
            id: batch,
            count: 0,
            data: {}
          };
        }

        ++o.count;
      },

      createCallback: function(action, rs, batch) {
        var actions = DataApi.actions;
        return action == 'read' ?
          this.loadRecords :
          function(data, response, success) {
            //onCreateRecords|onUpdateRecords | onDestroyRecords
            this['on' + Q.String.cap(action) + 'Records'](success, rs, [].concat(data));

            if (success === true) {
              //写操作
              this.fire('write', this, action, data, response, rs);
            }
            this.removeFromBatch(batch, action, data);
          }
      },

      //回调callback
      onCreateRecords: function(success, rs, data) {
        if (success === true) {
          try {
            this.reader.realize(rs, data);
          } catch (e) {
            //处理异常
            this.handleException(e);
            if (Q.isArray(rs)) {
              this.onCreateRecords(success, rs, data);
            }
          }
        }
      },
      //回调callback
      onUpdateRecords: function(success, rs, data) {
        if (success === true) {
          try {
            this.reader.update(rs, data);
          } catch (e) {
            this.handleException(e);
            if (Q.isArray(rs)) {
              this.onUpdateRecords(success, rs, data);
            }
          }
        }
      },
      //回调callback
      onDestroyRecords: function(success, rs, data) {
        var i = 0,
          record;

        rs = rs instanceof DataRecord ? [rs] : [].concat(rs);
        //删除
        while (record = rs[i++]) {
          this.removed.splice(Q.inArray(record, this.removed), 1);
        }
        //删除失败
        if (success === false) {
          i = 0;
          while (record = rs[i++]) {
            this.insert(record.lastIndex, record);
          }
        }
      },
      //action为read时的回调
      loadRecords: function(result, options, success) {
        var i, len, records, total, record, toAdd, cnt,
          me = this;
        //已销毁
        if (me.isDestroyed === true) {
          return;
        }

        //没有返回数据 或者请求失败
        if (!result || success === false) {
          if (success !== false) {
            me.fire('load', me, [], options);
          }
          //回调
          if (options.callback) {
            options.callback.call(options.scope || me, [], options, false, result);
          }
          return;
        }

        records = result.records;
        total = result.totalRecords || records.length;
        i = 0;

        if (!options || options.add !== true) {
          if (me.pruneModifiedRecords) {
            me.modified = [];
          }

          while (record = records[i++]) {
            record.join(me);
          }

          //过滤中
          if (me.snapshot) {
            me.data = me.snapshot;
            delete me.snapshot;
          }

          me.clearData();
          me.data.add(records);
          me.totalCount = total;

          //过滤
          if (me.filterOnLoad && !me.remoteFilter) {
            me.filter();
          }

          //排序
          if (me.sortOnLoad && !me.remoteSort) {
            me.sort(undefined, undefined, undefined, true);
          }
          me.fire('datachanged', me);
        } else {
          toAdd = [];
          cnt = 0;

          while (record = records[i++]) {
            //存在 更新
            if (me.indexOfId(record.id) > -1) {
              me.doUpdate(record);
            } else { //不存在 添加
              toAdd.push(record);
              ++cnt;
            }
          }

          me.totalCount = Math.max(total, me.data.length + cnt);
          me.add(toAdd);
        }

        me.fire('load', me, records, options);
        if (options && options.callback) {
          options.callback.call(options.scope || me, records, options, true);
        }

      },
      /*
           载入本地数据

           append为true时将已存在的数据进行更新
           不存在的添加
           */
      loadData: function(o, append) {
        var records = this.reader.readRecords(o);

        this.loadRecords(records, {
          add: append
        }, true);
      },
      /*获取当前数据条数*/
      getCount: function() {
        return this.data.count();
      },
      /*获取服务器端的数据条数*/
      getTotalCount: function() {
        return this.totalCount || 0;
      },
      //异常处理函数
      handleException: function(e) {
        throw e;
      },
      reload: function(options) {
        this.load(Q.applyIf(options || {}, this.lastOptions));
      },

      /*
           初始化排序
           */
      initSortable: function() {
        var me = this,
          sorters = me.sorters;

        me.sorters = new Q.MixCollection(sorters, function(item) {
          return item.id || item.property;
        });

        if (sorters) {
          me.sorters.add(me.decodeSorters(sorters));
        }
      },
      /*将数组转换为Soter实例*/
      decodeSorters: function(sorters) {
        if (!Q.isArray(sorters)) {
          if (sorters == undefined) {
            sorters = [];
          } else {
            sorters = [sorters];
          }
        }

        var fields = this.fields,
          field, settings, i, len;

        for (i = 0, len = sorters.length; i < len; i++) {
          settings = sorters[i];
          //非Sorter实例 配置属性
          if (!(settings instanceof Sorter)) {

            //property
            if (Q.isString(settings)) {
              settings = {
                property: settings
              };
            }

            Q.applyIf(settings, {
              root: this.sortRoot,
              direction: 'ASC'
            });

            if (settings.fn) {
              settings.sorterFn = settings.fn;
            }

            //如果传入的为函数
            if (typeof settings == 'function') {
              settings = {
                sorterFn: settings
              }
            }

            if (fields && !settings.transform) {
              field = fields.get(settings.property);
              settings.transform = field && field.sortType;
            }
            sorters[i] = new Sorter(settings);
          }

          if ((field = fields.get(settings.property)) && field.dateFormat) {
            sorters[i].format = field.dateFormat;
          }
        }
        return sorters;
      },

      /*排序*/
      sort: function(sorters, direction, where, doSort) {
        var me = this,
          sorter,
          newSorters;

        //整理参数
        if (Q.isArray(sorters)) {
          doSort = where;
          where = direction;
          newSorters = sorters;
        } else if (Q.isString(sorters)) {
          //soters为property
          sorter = me.sorters.get(sorters);

          if (!sorter) {

            sorter = {
              property: sorters,
              direction: direction
            };
            newSorters = [sorter];

          } else if (direction === undefined) {
            sorter.toggle();
          } else {
            sorter.setDirection(direction);
          }
        }

        if (newSorters && newSorters.length) {
          //转换为Sorter类型
          newSorters = me.decodeSorters(newSorters);

          //插入到当前sorters中
          if (Q.isString(where)) {
            if (where === 'prepend') {
              me.sorters.splice.apply(me.sorters, [0, 0].concat(newSorters));
            } else {
              me.sorters.add(newSorters);
            }
          } else {
            me.sorters.clear();
            me.sorters.add(newSorters)
          }
        }

        if (doSort !== false) {
          me.fire('beforesort', me, newSorters);
          me.onBeforeSort(newSorters);

          sorters = me.sorters.data;
          if (sorters.length) {
            me.doSort(me.generateComparator());
          }
        }
      },
      /*生成排序对比函数*/
      generateComparator: function() {
        var sorters = [].concat(this.sorters.data);
        return sorters.length ? this.createComparator(sorters) : emptyComparator;
      },

      /*
           创建一个排序函数
           */
      createComparator: function(sorters) {
        return sorters && sorters.length ?
          function(left, right) {
            var sorter = sorters[0],
              ret = sorter.sort(left, right),
              i = 1;

            while (sorter = sorters[i++]) {
              ret = ret || sorter.sort.call(this, left, right);
            }

            return ret;
          } : emptyComparator;
      },

      doSort: function(sorterFn) {
        var me = this;
        if (me.remoteSort) {
          me.load();
        } else {
          me.data.sort(sorterFn);
          me.fire('datachanged', me);
        }
        me.fire('sort', me, [].concat(me.sorters.data));
      },

      getSorters: function() {
        return this.sorters.data;
      },

      each: function(fn, context) {
        this.data.each(fn, context);
      },

      getModefiedRecords: function() {
        return this.modified;
      },

      sum: function(property, start, end) {
        return this.data.inject(0, function(mome, _, item) {
          return mome += item[property] || 0;
        });
      },

      decodeFilters: function(filters) {
        if (!Q.isArray(filters)) {
          if (filters === undefined) {
            filters = [];
          } else {
            filters = [filters];
          }
        }

        var length = filters.length,
          Filter = filter,
          config, i;

        for (i = 0; i < length; i++) {
          config = filters[i];

          if (!(config instanceof Filter)) {
            Q.extend(config, {
              root: 'data'
            });

            //3.x过滤函数
            if (config.fn) {
              config.filterFn = config.fn;
            }

            //配置对象为过滤函数
            if (typeof config == 'function') {
              config = {
                filterFn: config
              }
            }

            filters[i] = new Filter(config);
          }
        }

        return filters;
      },
      filter: function(filters, value) {
        if (Q.isString(filters)) { //字段名称
          filters = {
            property: filters,
            value: value
          }
        }

        var me = this,
          decoded = me.decodeFilters(filters),
          //是否进行本地排序
          doLocalSort = me.sorters.data.length && me.sortOnFilter && !me.remoteSort;

        me.filters.add(decoded);
        filters = me.filters.data;

        if (filters.length) {
          //服务器过滤
          if (me.remoteFilter) {
            //删除总数据
            delete me.totalCount;

            me.load();
          } else {
            me.snapshot = me.snapshot || me.data.clone();

            me.data = me.data.filter(this.generateFiltration());

            if (doLocalSort) {
              me.sort();
            } else {
              me.fire('datachanged', me);
            }
          }
        }
      },
      generateFiltration: function() {
        var me = this,
          filters = me.filters.data;

        return filters.length ? me.createFiltration(filters) : me.emptyFiltration;
      },
      createFiltration: function(filters) {
        return function(_, candidate) {
          var filterItem, i = 0,
            ret = true;

          while (filterItem = filters[i++]) {
            //只要有一个过滤函数返回false 则返回false
            if (filterItem.filter(i, candidate) !== true) {
              ret = false;
              break;
            }
          }

          return ret;
        }
      },
      clearFilter: function(suppressEvent) {
        var me = this;
        me.filters.clear();

        //服务器过滤
        if (me.remoteFilter) {
          me.load();

        } else if (me.isFiltered()) { //判断是否在排序中
          me.data = me.snapshot;
          delete me.snapshot;

          if (suppressEvent !== true) {
            me.fire('datachanged', me);
          }
        }
      },
      /*
           删除过滤项
           @param {String/filter} toRemove
           @param {boolean} 
           */
      removeFilter: function(toRemove, applyFilters) {
        var me = this;

        if (!me.removeFilter && me.isFiltered()) {
          if (toRemove instanceof filter) {
            me.filters.remove(toRemove);
          } else {
            me.filters.removeByKey(toRemove);
          }

          if (applyFilters !== false) {
            if (me.filters.length) {
              me.filter();
            } else {
              me.clearFilter();
            }
          }
        }
      },

      addFilter: function(filters, applyFilters) {
        var me = this,
          decoded,
          i,
          filter;

        i = 0;
        decoded = me.decodeFilters(filters);

        while (filter = decoded[i++]) {
          me.filters.add(filter);
        }

        if (applyFilters !== false && me.filters.length) {
          me.filter();
        }
      },

      /*是否处于过滤中*/
      isFiltered: function() {
        var snapshot = this.snapshot;
        return !!(snapshot && snapshot !== this.data);
      },

      filterBy: function(fn, scope) {
        var me = this;

        me.snapshot = me.snapshot || me.data.clone();
        me.data = me.queryBy(fn, scope || me);
        me.fire('datachanged', me);
      },

      queryBy: function(fn, scope) {
        var me = this;
        return (me.snapshot || me.data).filterBy(fn, scope);
      },

      query: function(property, value, anyMatch, caseSensitive, exactMatch) {
        var me = this,
          queryFn = me.createFilterFn(property, value, anyMatch, caseSensitive, exactMatch),
          ret = this.queryBy(queryFn);

        return ret;
      },

      createFilterFn: function(property, value, anyMatch, caseSensitive, exactMatch) {
        if (Q.isUndefined(value)) {
          return;
        }

        value = filter.prototype.createValueMatcher(value, anyMatch, caseSensitive, exactMatch);

        return function(_, candidate) {
          return value.test(candidate);
        }
      },

      afterEdit: function(record) {
        //如果不存在在修改记录中
        if (Q.inArray(record, this.modified) == -1) {
          this.modified.push(record);
        }
        this.fire('update', this, record, DataRecord.EDIT);
      },

      afterReject: function(record) {
        var index;
        if ((index = Q.inArray(record, this.modified)) != -1) {
          this.modified.splice(index, 1);
        }
        this.fire('update', this, record, DataRecord.REJECT);
      },

      afterCommit: function(record) {
        var index;
        if ((index = Q.inArray(record, this.modified)) != -1) {
          this.modified.splice(index, 1);
        }
        this.fire('update', this, record, DataRecord.COMMIT);
      },

      commitChanges: function() {
        var me = this,
          modified = me.modified.slice(0),
          item, i = 0;

        while (item = modified[i++]) {
          item.commit();
        }

        me.modified = [];
        me.removed = [];
      },

      rejectChanges: function() {
        var me = this,
          modified = me.modified.slice(0),
          removed = me.removed.slice(0).reverse(),
          i, item;

        i = 0;
        while (item = modified[i++]) {
          item.reject();
        }

        i = 0;
        while (item = removed[i++]) {
          me.insert(item.lastIndex || 0, item);
          item.reject();
        }

        this.modified = [];
        this.removed = [];
      },

      onMetaChange: function(meta) {
        this.recordType = this.reader.recordType;
        this.fields = this.recordType.prototype.fields;
        delete this.snapshot;

        if (this.writer) {
          this.writer.meta = this.reader.meta;
        }

        this.modified = [];
        this.fire('metachange', this, this.reader.meta);
      },
      findInsertIndex: function(record) {
        var me = this,
          data,
          index;
        //停止事件被触发
        me.sleep();

        data = this.data.clone();
        this.data.add(record);
        this.sort();
        index = this.data.indexOf(record);
        this.data = data;

        //唤醒事件
        me.wakeup();

        return index;
      },
      setBaseParam: function(name, value) {
        this.baseParams = this.baseParams || {};
        this.baseParams[name] = value;
      }
    }),

    dataWriters = {
      'json': JsonWriter,
      'undefined': JsonWriter
    };

  function emptyComparator() {
    return 0;
  }

  function emptyFiltration() {
    return true;
  }

  return Store;
});