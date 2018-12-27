let Paginator = function(el, options) {
  if (!(this instanceof Paginator)) {
    /*这种情况有
          1.window直接调用
          2.Paginator作为箭头函数
          3.Paginator被call/bind/apply修改this
      */

    // 递归
    return new Paginator(el, options)
  }

  let self = this

  if (typeof el === 'object') self.$container = el
  else if (typeof el === 'string') self.$container = document.querySelector(el)
  else return

  self.init = function() {
    if (
      options.first ||
      options.prev ||
      options.next ||
      options.last ||
      options.page
    ) {
      options = Object.assign(
        {},
        {
          // 这五个是必须的
          first: '',
          prev: '',
          next: '',
          last: '',
          page: ''
        },
        options
      )
    }

    self.options = Object.assign({}, Paginator.defaultOptions, options)

    //   验证opts中的参数
    self.verify()

    self.render()

    self.fireEvent(this.options.currentPage, 'init')
  }

  self.verify = function() {
    const opts = self.options

    if (!self._isNumber(opts.totalPages)) {
      throw new Error('[Paginator] type error: totalPages')
    }

    if (!self._isNumber(opts.totalCounts)) {
      throw new Error('[Paginator] type error: totalCounts')
    }

    if (!self._isNumber(opts.pageSize)) {
      throw new Error('[Paginator] type error: pageSize')
    }

    if (!self._isNumber(opts.currentPage)) {
      throw new Error('[Paginator] type error: currentPage')
    }

    if (!self._isNumber(opts.visiblePages)) {
      throw new Error('[Paginator] type error: visiblePages')
    }

    if (!opts.totalPages && !opts.totalCounts) {
      throw new Error('[Paginator] totalCounts or totalPages is required')
    }

    if (!opts.totalPages && !opts.totalCounts) {
      throw new Error('[Paginator] totalCounts or totalPages is required')
    }

    if (!opts.totalPages && opts.totalCounts && !opts.pageSize) {
      throw new Error('[Paginator] pageSize is required')
    }

    if (opts.totalCounts && opts.pageSize) {
      opts.totalPages = Math.ceil(opts.totalCounts / opts.pageSize)
    }

    if (opts.currentPage < 1 || opts.currentPage > opts.totalPages) {
      throw new Error('[Paginator] currentPage is incorrect')
    }

    if (opts.totalPages < 1) {
      throw new Error('[Paginator] totalPages cannot be less currentPage')
    }
  }

  self.render = function() {
    self._renderHtml()
    self._setStatus()
    self._bindEvents()
  }

  // render html
  self._renderHtml = function() {
    let html = []
    // pages [1,2,3,4,5,6,7]
    const pages = self._getPages()
    pages.forEach(v => {
      html.push(self._buildItem('page', v))
    })

    self._isEnable('prev') &&
      html.unshift(self._buildItem('prev', self.options.currentPage - 1))
    self._isEnable('first') && html.unshift(self._buildItem('first', 1))
    self._isEnable('next') &&
      html.push(self._buildItem('next', self.options.currentPage + 1))
    self._isEnable('last') &&
      html.push(self._buildItem('last', self.options.totalPages))

    if (self.options.wrapper) {
      const wrapper =
        typeof self.options.wrapper === 'string'
          ? document.querySelector(self.options.wrapper)
          : self.options.wrapper
      if (Object.prototype.toString.call(wrapper) != '[object HTMLDivElement]')
        throw new Error('[Paginator] type error: wrapper')
      wrapper.innerHTML = html.join('')
      self.$container.appendChild(wrapper)
    } else {
      self.$container.innerHTML = html.join('')
    }
  }

  // 构建每个按钮的html
  self._buildItem = function(type, pageData) {
    function _parseToDOM(str) {
      let div = document.createElement('div')
      if (typeof str == 'string') div.innerHTML = str
      return div.firstElementChild
    }

    function _domToString(node) {
      let tmpNode = document.createElement('div')
      tmpNode.appendChild(node)
      let str = tmpNode.innerHTML
      tmpNode = node = null // 解除引用，以便于垃圾回收
      return str
    }

    let html = self.options[type].replace(/{page}/g, pageData)
    html = _parseToDOM(html)
    html.dataset.role = type
    html.dataset.text = pageData
    return _domToString(html)
  }

  self._setStatus = function() {
    const options = self.options

    function _setStatus(selector, actions, _class) {
      let dom_arr = Array.from(
        document.querySelectorAll(selector[0], selector[1])
      )
      actions === 'add'
        ? dom_arr.forEach(dom => {
            dom.classList.add(_class)
          })
        : dom_arr.forEach(dom => {
            dom.classList.remove(_class)
          })
    }

    ;(!self._isEnable('first') || options.currentPage === 1) &&
      _setStatus(
        ['[data-role = first]', self.$container],
        'add',
        options.disableClass
      )

    if (!self._isEnable('prev') || options.currentPage === 1) {
      _setStatus(
        ['[data-role = prev]', self.$container],
        'add',
        options.disableClass
      )
    }
    if (!self._isEnable('next') || options.currentPage >= options.totalPages) {
      _setStatus(
        ['[data-role = next]', self.$container],
        'add',
        options.disableClass
      )
    }
    if (!self._isEnable('last') || options.currentPage >= options.totalPages) {
      _setStatus(
        ['[data-role = last]', self.$container],
        'add',
        options.disableClass
      )
    }
    _setStatus(
      ['[data-role = page]', self.$container],
      'remove',
      options.activeClass
    )
    _setStatus(
      [`[data-text = '${options.currentPage}']`, self.$container],
      'add',
      options.activeClass
    )
  }

  self._getPages = function() {
    let pages = [],
      visiblePages = self.options.visiblePages,
      currentPage = self.options.currentPage,
      totalPages = self.options.totalPages

    if (visiblePages > totalPages) {
      visiblePages = totalPages
    }
    // 假如visi...=7 half就是3 current假如为5
    // start = 5 - 3 + 1 - (7%2) = 2
    // end = 5 + 3 = 8
    // 2 3 4 5 6 7
    // 很棒，这个算法的目的就是让current一直在中间
    const half = Math.floor(visiblePages / 2)
    let start = currentPage - half + 1 - (visiblePages % 2)
    let end = currentPage + half
    if (start < 1) {
      start = 1
      end = visiblePages
    }
    if (end > totalPages) {
      end = totalPages
      // 1 + 7 - 7 = 1
      start = 1 + totalPages - visiblePages
    }
    let itPage = start
    while (itPage <= end) {
      pages.push(itPage)
      itPage++
    }
    return pages
  }

  self._isNumber = function(value) {
    const type = typeof value
    return type === 'number' || type === 'undefined'
  }

  self._isEnable = function(type) {
    return self.options[type] && typeof self.options[type] === 'string'
  }

  self._switchPage = function(pageIndex) {
    self.options.currentPage = pageIndex
    //   改变page就要从头render一遍
    self.render()
  }

  self.fireEvent = function(pageIndex, type) {
    return (
      typeof self.options.onPageChange !== 'function' ||
      self.options.onPageChange(pageIndex, type) !== false
    )
  }

  self._bindEvents = function() {
    const opts = self.options

    function _onClick(ev) {
      if (
        Array.from(this.classList).includes(opts.disableClass) ||
        Array.from(this.classList).includes(opts.activeClass)
      ) {
        return
      }
      // string -> number
      const pageIndex = ev.target.parentNode.dataset.text - 0
      if (self.fireEvent(pageIndex, 'change')) {
        self._switchPage(pageIndex)
      }
    }
    self.$container.removeEventListener('click', _onClick)
    self.$container.addEventListener('click', _onClick)
  }
  self.init()
  return self.$container
}

Paginator.defaultOptions = {
  wrapper: '',
  first: '<li class="first"><a href="###">第一页</a></li>',
  prev: '<li class="prev"><a href="###">上一页</a></li>',
  next: '<li class="next"><a href="###">下一页</a></li>',
  last: '<li class="last"><a href="###">最后一页</a></li>',
  page: '<li class="page"><a href="###">{page}</a></li>',
  totalPages: 0,
  totalCounts: 0,
  pageSize: 0,
  currentPage: 1,
  visiblePages: 7,
  disableClass: 'disabled',
  activeClass: 'active',
  onPageChange: null
}

module.exports = Paginator
